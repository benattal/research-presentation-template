/**
 * A grid of labeled media panels under the title: inputs, the results of
 * each method, and reference photos, side by side for comparison.
 *
 * The geometry is explicit, in stage pixels, so that a video stitched from
 * several clips lines up with the cells it spans:
 *
 *   grid        { columns, rows, panelWidth, panelHeight, columnGap, rowGap,
 *               noteBand? }: every cell's size and the gaps between cells. Labels and
 *               notes of inner rows sit in `rowGap`; the first row's labels
 *               take a band above the grid and the last row's notes a band
 *               below it. The grid is centered in the space under the title;
 *               `noteBand: true` keeps the band below it on a slide without
 *               notes, so its grid sits where the next slide's does.
 *   rowLabels   optional: one short label per row, left of the grid.
 *   videos      optional: stitched videos, each { src, poster?, row, column,
 *               rows, columns }. One file covers that block of cells, gaps
 *               included (black), at a uniform scale of the stage geometry,
 *               so clips that must play in step stay in step. A panel
 *               without `media` shows the part of the stitched video under
 *               it.
 *   panels      each { row, column, rows?, columns?, media?, label?, ours?,
 *               note?, step?, id?, boxes? }:
 *                 rows, columns  its span in cells (default 1);
 *                 media          a media item filling the panel (cropped to
 *                                fill, never stretched);
 *                 label          a short label centered above the panel;
 *                 ours           true for our method: the label in the
 *                                accent color;
 *                 note           a short line centered under the panel;
 *                 noteKind       'hidden' draws the note in the color of the
 *                                hidden-region boxes, for a note that says
 *                                what the box marks;
 *                 step           the 0-based build step it appears at
 *                                (default 0); before it, its part of a
 *                                stitched video is masked;
 *                 id             its name in `spotlights`;
 *                 boxes          hidden-region rectangles, each { x, y,
 *                                width, height } as fractions of the panel,
 *                                with optional `step` (the build step it
 *                                appears at; the panel's video starts over
 *                                then) and { from, to }: the seconds of
 *                                the panel's video (its own or the stitched
 *                                one) during which the box shows, for a box
 *                                that marks one view of a moving camera.
 *   spotlights  optional: [{ step, panels: [id, ...] }]: at that step, the
 *               panels not listed are dimmed.
 *   callouts    optional: red text with red arrows, for what the boxes
 *               mark: each { text, at, align?, arrows, step?, from?, to? }.
 *               Points are { row, column, x, y }: fractions of that cell,
 *               which may run past 0 and 1 into the gaps. `at` is where
 *               the text sits (`align` 'left', 'center', or 'right' of
 *               it, vertically centered); each arrow is { tail, head }.
 *               `step`, `from`, and `to` are as for boxes, `from` and `to`
 *               on the clock of the slide's stitched video.
 *
 * A slide plays one video: separate video elements drift apart, so clips
 * that are on screen together are stitched into one file. A second video
 * (stitched or a panel's own) is an error.
 *
 * A build step shows its panels at once (the recording cross-fades
 * between steps). A video starts over when it is revealed, so a clip that
 * appears on a later step plays from its beginning; a stitched video starts
 * over each time another of its panels appears, with the panels already
 * showing. Timed boxes read the video's own clock, on
 * every animation frame and on every seek (how the record view moves a
 * video), so they stay on the frames they mark however the video is driven.
 */
import { createRef, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import Media from '@core/stage/Media.jsx';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import './Panels.css';

/** Height, in stage pixels, of the band a row of labels takes above its panels. */
const LABEL_BAND = 36;
/** Height, in stage pixels, of the band a row of notes takes under its panels. */
const NOTE_BAND = 32;
/** Opacity of a panel outside the step's spotlight. */
const DIMMED = 0.25;
/**
 * Stage pixels a cover reaches past its cell, into the gaps: the stage is
 * scaled, so a stitched video's edge can fall a fraction of a pixel outside
 * the cell it is drawn in.
 */
const MASK_BLEED = 2;
/** Seconds a timed box or callout takes to fade in after `from` and out before `to`. */
const BOX_FADE_S = 0.15;
/** Length of a callout's arrowhead along its arrow, in stage pixels. */
const ARROW_HEAD = 10;

/** Where each block of cells sits, from the slide's `grid` and whether labels and notes need bands. */
function gridGeometry(grid, panels) {
  for (const key of ['columns', 'rows', 'panelWidth', 'panelHeight', 'columnGap', 'rowGap']) {
    if (typeof grid?.[key] !== 'number') throw new Error(`panels layout: grid.${key} must be a number`);
  }
  const lastRow = grid.rows - 1;
  const top = panels.some((panel) => panel.row === 0 && panel.label) ? LABEL_BAND : 0;
  const hasNotes = panels.some((panel) => panel.row + (panel.rows ?? 1) - 1 === lastRow && panel.note);
  const bottom = grid.noteBand ?? hasNotes ? NOTE_BAND : 0;
  const spanWidth = (columns) => columns * grid.panelWidth + (columns - 1) * grid.columnGap;
  const spanHeight = (rows) => rows * grid.panelHeight + (rows - 1) * grid.rowGap;
  return {
    top,
    width: spanWidth(grid.columns),
    height: top + spanHeight(grid.rows) + bottom,
    box: ({ row, column, rows = 1, columns = 1 }) => ({
      left: column * (grid.panelWidth + grid.columnGap),
      top: top + row * (grid.panelHeight + grid.rowGap),
      width: spanWidth(columns),
      height: spanHeight(rows),
    }),
  };
}

/** The index of the stitched video whose block holds a panel's top-left cell, or -1. */
function stitchedVideoUnder(videos, panel) {
  return videos.findIndex((video) => panel.row >= video.row && panel.row < video.row + video.rows
    && panel.column >= video.column && panel.column < video.column + video.columns);
}

/** A box's opacity at `seconds` of its video: 1 inside [from, to] after fading in, 0 outside. */
function windowOpacity(seconds, { from, to }) {
  if (from === undefined) return 1;
  return Math.max(0, Math.min(1, (seconds - from) / BOX_FADE_S, (to - seconds) / BOX_FADE_S));
}

/**
 * Sets the opacity of each timed item (a box or a callout, with `from` and
 * `to`) from the current time of the video inside `videoHolder`, on every
 * animation frame and on every seek. A layout effect: its cleanup runs in
 * the commit that detaches the items' refs, so no frame runs after them.
 */
function useTimedWindows(videoHolder, items, elements) {
  useLayoutEffect(() => {
    if (!items.some((item) => item.from !== undefined)) return undefined;
    const video = videoHolder?.current?.querySelector('video');
    if (!video) throw new Error('panels layout: a box or callout with "from" and "to" needs a video under it');
    const show = () => items.forEach((item, i) => {
      elements.current[i].style.opacity = String(windowOpacity(video.currentTime, item));
    });
    let frame = requestAnimationFrame(function tick() {
      show();
      frame = requestAnimationFrame(tick);
    });
    video.addEventListener('seeked', show);
    return () => {
      cancelAnimationFrame(frame);
      video.removeEventListener('seeked', show);
    };
  }, [videoHolder, items, elements]);
}

/**
 * Sends the video inside `videoHolder`, if any, back to its start when more of it is revealed: `shown` is how
 * many of its panels show (or whether its one panel does).
 */
function useRestartOnReveal(videoHolder, shown) {
  const wasShown = useRef(Number(shown));
  useEffect(() => {
    const video = videoHolder.current?.querySelector('video');
    if (video && Number(shown) > wasShown.current) video.currentTime = 0;
    wasShown.current = Number(shown);
  }, [videoHolder, shown]);
}

/**
 * Hidden-region rectangles over a picture (the element they are placed in),
 * each shown from its build step on and during its window of the video
 * inside `videoHolder`. The holder's ref must be attached before this
 * mounts: an earlier sibling in the tree, not an ancestor. The relatedWork
 * layout uses it too, without build steps.
 */
export function Boxes({ boxes, videoHolder, buildStep = Infinity }) {
  const boxElements = useRef([]);
  useTimedWindows(videoHolder, boxes, boxElements);
  return boxes.map((box, i) => (
    <div
      key={i}
      ref={(element) => { boxElements.current[i] = element; }}
      className="panels-box"
      style={{
        left: `${100 * box.x}%`,
        top: `${100 * box.y}%`,
        width: `${100 * box.width}%`,
        height: `${100 * box.height}%`,
        opacity: box.from === undefined ? 1 : 0,
        visibility: buildStep >= (box.step ?? 0) ? 'visible' : 'hidden',
      }}
    />
  ));
}

/** A point { row, column, x, y } of a callout, in the grid's stage pixels. */
function gridPoint(geometry, { row, column, x, y }) {
  const cell = geometry.box({ row, column });
  return { x: cell.left + x * cell.width, y: cell.top + y * cell.height };
}

/** Where an arrow's line ends for its head, which extends ARROW_HEAD past the line's end, to touch `head`. */
function shaftEnd(tail, head) {
  const length = Math.hypot(head.x - tail.x, head.y - tail.y);
  return { x: head.x - ((head.x - tail.x) / length) * ARROW_HEAD, y: head.y - ((head.y - tail.y) / length) * ARROW_HEAD };
}

const ALIGN_SHIFT = { left: '0', center: '-50%', right: '-100%' };

/**
 * Red text with arrows to what it names, over the grid, each shown from its
 * build step on and during its window of the stitched video in
 * `videoHolder`. Placed after the stitched video, whose holder's ref is
 * attached by then.
 */
function Callouts({ callouts, geometry, videoHolder, buildStep }) {
  const elements = useRef([]);
  useTimedWindows(videoHolder, callouts, elements);
  return callouts.map((callout, i) => {
    const at = gridPoint(geometry, callout.at);
    return (
      <div
        key={callout.text}
        ref={(element) => { elements.current[i] = element; }}
        className="panels-callout"
        style={{
          opacity: callout.from === undefined ? 1 : 0,
          visibility: buildStep >= (callout.step ?? 0) ? 'visible' : 'hidden',
        }}
      >
        <svg className="panels-callout-arrows" width={geometry.width} height={geometry.height}>
          <defs>
            <marker
              id={`panels-callout-head-${i}`}
              viewBox="0 0 10 10"
              refX="0"
              refY="5"
              markerWidth={ARROW_HEAD}
              markerHeight={ARROW_HEAD}
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--hidden)" />
            </marker>
          </defs>
          {callout.arrows.map((arrow, a) => {
            const tail = gridPoint(geometry, arrow.tail);
            const end = shaftEnd(tail, gridPoint(geometry, arrow.head));
            return (
              <path key={a} className="panels-callout-shaft" d={`M ${tail.x} ${tail.y} L ${end.x} ${end.y}`} markerEnd={`url(#panels-callout-head-${i})`} />
            );
          })}
        </svg>
        <div
          className="panels-callout-text"
          style={{ left: at.x, top: at.y, transform: `translate(${ALIGN_SHIFT[callout.align ?? 'center']}, -50%)` }}
        >
          <Text>{callout.text}</Text>
        </div>
      </div>
    );
  });
}

/** One stitched video over the block of cells it covers; `shown` is how many of its panels show. */
function StitchedVideo({ video, geometry, holder, shown }) {
  useRestartOnReveal(holder, shown);
  return (
    <div ref={holder} className="panels-stitched" style={geometry.box(video)}>
      <Media item={{ type: 'video', src: video.src, poster: video.poster }} className="panels-media panels-media--stitched" />
    </div>
  );
}

/**
 * One panel: its own media, a cover over the media (its own or its part of
 * a stitched video), and its label, note, and boxes. `state` is 'hidden',
 * 'dimmed', or 'shown'. The media always stays at full opacity, and the
 * cover hides or dims it: changing the opacity of an element that holds a
 * playing video makes some browsers rebuild the video's layer, which shows
 * as a flash.
 */
function Panel({ panel, geometry, state, stitchedHolder, buildStep }) {
  const ownHolder = useRef(null);
  // The panel's video starts over when the panel appears and when one of its boxes does.
  const boxesShown = (panel.boxes ?? []).filter((box) => box.step !== undefined && buildStep >= box.step).length;
  useRestartOnReveal(ownHolder, state === 'hidden' ? 0 : 1 + boxesShown);
  const opacity = { hidden: 0, dimmed: DIMMED, shown: 1 }[state];
  const box = geometry.box(panel);
  return (
    <>
      {panel.media && (
        <div ref={ownHolder} className="panels-own-media" style={box}>
          <Media item={panel.media} className="panels-media" />
        </div>
      )}
      <div
        className="panels-mask"
        style={{
          left: box.left - MASK_BLEED,
          top: box.top - MASK_BLEED,
          width: box.width + 2 * MASK_BLEED,
          height: box.height + 2 * MASK_BLEED,
          opacity: 1 - opacity,
        }}
      />
      <div className="panels-panel" style={{ ...box, opacity }}>
        {panel.boxes && <Boxes boxes={panel.boxes} videoHolder={panel.media ? ownHolder : stitchedHolder} buildStep={buildStep} />}
        {panel.label && (
          <div className={`panels-label${panel.ours ? ' panels-label--ours' : ''}`}><Text>{panel.label}</Text></div>
        )}
        {panel.note && (
          <div className={`panels-note${panel.noteKind === 'hidden' ? ' panels-note--hidden' : ''}`}><Text>{panel.note}</Text></div>
        )}
      </div>
    </>
  );
}

function panelState(panel, buildStep, spotlight) {
  if (buildStep < (panel.step ?? 0)) return 'hidden';
  if (spotlight && !spotlight.panels.includes(panel.id)) return 'dimmed';
  return 'shown';
}

export default function Panels({ slide, buildStep }) {
  const { panels, grid } = slide;
  if (!Array.isArray(panels) || panels.length === 0) {
    throw new Error(`Slide "${slide.id}": the panels layout needs a non-empty "panels" list`);
  }
  const videos = useMemo(() => slide.videos ?? [], [slide.videos]);
  const videoCount = videos.length + panels.filter((panel) => panel.media?.type === 'video').length;
  if (videoCount > 1) {
    throw new Error(`Slide "${slide.id}": ${videoCount} videos on one slide drift apart; stitch them into one file`);
  }
  const holders = useMemo(() => videos.map(() => createRef()), [videos]);
  const geometry = gridGeometry(grid, panels);
  const spotlight = (slide.spotlights ?? []).find((each) => each.step === buildStep);
  const states = panels.map((panel) => panelState(panel, buildStep, spotlight));
  const videoOf = panels.map((panel) => (panel.media ? -1 : stitchedVideoUnder(videos, panel)));
  panels.forEach((panel, i) => {
    if (!panel.media && videoOf[i] === -1) {
      throw new Error(`Slide "${slide.id}": the panel at row ${panel.row}, column ${panel.column} has no media and no stitched video`);
    }
  });
  const callouts = slide.callouts ?? [];

  return (
    <div className="slide--panels">
      <SlideTitle title={slide.title} />
      <div className="panels-stage">
        <div className="panels-figure">
          {slide.rowLabels && (
            <div
              className="panels-row-labels"
              style={{
                paddingTop: geometry.top,
                gridTemplateRows: `repeat(${grid.rows}, ${grid.panelHeight}px)`,
                rowGap: grid.rowGap,
                height: geometry.height,
              }}
            >
              {slide.rowLabels.map((label) => <div key={label} className="panels-row-label"><Text>{label}</Text></div>)}
            </div>
          )}
          <div className="panels-grid" style={{ width: geometry.width, height: geometry.height }}>
            {videos.map((video, v) => (
              <StitchedVideo
                key={video.src}
                video={video}
                geometry={geometry}
                holder={holders[v]}
                shown={states.filter((state, i) => videoOf[i] === v && state !== 'hidden').length}
              />
            ))}
            {panels.map((panel, i) => (
              <Panel
                key={`${panel.row},${panel.column}`}
                panel={panel}
                geometry={geometry}
                state={states[i]}
                buildStep={buildStep}
                stitchedHolder={videoOf[i] === -1 ? null : holders[videoOf[i]]}
              />
            ))}
            <Callouts callouts={callouts} geometry={geometry} videoHolder={holders[0] ?? null} buildStep={buildStep} />
          </div>
        </div>
      </div>
    </div>
  );
}
