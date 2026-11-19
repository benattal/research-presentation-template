/**
 * A grid of labeled media panels under the title: inputs, the results of
 * each method, and reference photos, side by side for comparison.
 *
 * The geometry is explicit, in stage pixels, so that a video stitched from
 * several clips lines up with the cells it spans:
 *
 *   grid        { columns, rows, panelWidth, panelHeight, columnGap, rowGap }:
 *               every cell's size and the gaps between cells. Labels and
 *               notes of inner rows sit in `rowGap`; the first row's labels
 *               take a band above the grid and the last row's notes a band
 *               below it. The grid is centered in the space under the title.
 *   rowLabels   optional: one short label per row, left of the grid.
 *   videos      optional: stitched videos, each { src, row, column, rows,
 *               columns }. One file covers that block of cells, gaps
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
 *                 step           the 0-based build step it appears at
 *                                (default 0); before it, its part of a
 *                                stitched video is masked;
 *                 id             its name in `spotlights`;
 *                 boxes          hidden-region rectangles, each { x, y,
 *                                width, height } as fractions of the panel,
 *                                with optional { from, to }: the seconds of
 *                                the panel's video (its own or the stitched
 *                                one) during which the box shows, for a box
 *                                that marks one view of a moving camera.
 *   spotlights  optional: [{ step, panels: [id, ...] }]: at that step, the
 *               panels not listed are dimmed.
 *
 * A video starts over when it is revealed, so a clip that appears on a
 * later step plays from its beginning; a stitched video starts over only
 * when its first panel appears. Timed boxes read the video's own clock, on
 * every animation frame and on every seek (how the record view moves a
 * video), so they stay on the frames they mark however the video is driven.
 */
import { createRef, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
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
/** Seconds a timed box takes to fade in after `from` and out before `to`. */
const BOX_FADE_S = 0.15;

const fade = (opacity) => ({ initial: false, animate: { opacity }, transition: { duration: 0.4 } });

/** Where each block of cells sits, from the slide's `grid` and whether labels and notes need bands. */
function gridGeometry(grid, panels) {
  for (const key of ['columns', 'rows', 'panelWidth', 'panelHeight', 'columnGap', 'rowGap']) {
    if (typeof grid?.[key] !== 'number') throw new Error(`panels layout: grid.${key} must be a number`);
  }
  const lastRow = grid.rows - 1;
  const top = panels.some((panel) => panel.row === 0 && panel.label) ? LABEL_BAND : 0;
  const bottom = panels.some((panel) => panel.row + (panel.rows ?? 1) - 1 === lastRow && panel.note) ? NOTE_BAND : 0;
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
 * Sets each timed box's opacity from the current time of the video inside
 * `videoHolder`, on every animation frame and on every seek.
 */
function useBoxWindows(videoHolder, boxes, boxElements) {
  useEffect(() => {
    if (!boxes.some((box) => box.from !== undefined)) return undefined;
    const video = videoHolder.current?.querySelector('video');
    if (!video) throw new Error('panels layout: a box with "from" and "to" needs a video under its panel');
    const show = () => boxes.forEach((box, i) => {
      boxElements.current[i].style.opacity = String(windowOpacity(video.currentTime, box));
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
  }, [videoHolder, boxes, boxElements]);
}

/** Sends the video inside `videoHolder`, if any, back to its start when `visible` turns on. */
function useRestartOnReveal(videoHolder, visible) {
  const wasVisible = useRef(visible);
  useEffect(() => {
    const video = videoHolder.current?.querySelector('video');
    if (video && visible && !wasVisible.current) video.currentTime = 0;
    wasVisible.current = visible;
  }, [videoHolder, visible]);
}

function Boxes({ boxes, videoHolder }) {
  const boxElements = useRef([]);
  useBoxWindows(videoHolder, boxes, boxElements);
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
      }}
    />
  ));
}

/** One stitched video over the block of cells it covers; `visible` while any of its panels shows. */
function StitchedVideo({ video, geometry, holder, visible }) {
  useRestartOnReveal(holder, visible);
  return (
    <div ref={holder} className="panels-stitched" style={geometry.box(video)}>
      <Media item={{ type: 'video', src: video.src }} className="panels-media panels-media--stitched" />
    </div>
  );
}

/**
 * One panel: its own media, or a mask over its part of a stitched video;
 * its label, note, and boxes. `state` is 'hidden', 'dimmed', or 'shown'.
 */
function Panel({ panel, geometry, state, stitchedHolder }) {
  const ownHolder = useRef(null);
  useRestartOnReveal(ownHolder, state !== 'hidden');
  const opacity = { hidden: 0, dimmed: DIMMED, shown: 1 }[state];
  const box = geometry.box(panel);
  return (
    <>
      {!panel.media && <motion.div className="panels-mask" style={box} {...fade(1 - opacity)} />}
      <motion.div className="panels-panel" style={box} {...fade(opacity)}>
        {panel.media && (
          <div ref={ownHolder} className="panels-own-media">
            <Media item={panel.media} className="panels-media" />
          </div>
        )}
        {panel.boxes && <Boxes boxes={panel.boxes} videoHolder={panel.media ? ownHolder : stitchedHolder} />}
        {panel.label && (
          <div className={`panels-label${panel.ours ? ' panels-label--ours' : ''}`}><Text>{panel.label}</Text></div>
        )}
        {panel.note && <div className="panels-note"><Text>{panel.note}</Text></div>}
      </motion.div>
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
                visible={states.some((state, i) => videoOf[i] === v && state !== 'hidden')}
              />
            ))}
            {panels.map((panel, i) => (
              <Panel
                key={`${panel.row},${panel.column}`}
                panel={panel}
                geometry={geometry}
                state={states[i]}
                stitchedHolder={videoOf[i] === -1 ? null : holders[videoOf[i]]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
