import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Media from '@core/stage/Media.jsx';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useStageCanvas, useStepTransition } from '../canvas/canvas.js';
import EquationStack from '../equations/EquationStack.jsx';
import RoomView from '../flatland/RoomView.jsx';
import {
  MATRIX_PIXELS, lightElementRoom, oneHot, relightingCheck, weightedSum,
} from '../flatland/lightElements.js';
import { drawPixelWedge, drawRoomCamera } from '../flatland/overlays.js';
import { SURFACE_GAIN } from '../flatland/pictures.js';
import { ROOM_VIEW, drawRoom } from '../flatland/render.js';
import { themeColors } from '../volume/draw.js';
import {
  drawElementShares, drawPixelRays, drawRowPaths, pixelRays, rowPaths, rowShares,
} from './columnsAndRows.js';
import {
  BAR_COLORS, Strip, drawElementBars, drawElements, elementAt, elementPictures, exposures, patternPicture,
} from './elementViews.jsx';
import './TransportMatrix.css';

const ROOM = ROOM_VIEW;
const THUMB = [74, 44];
/** Exposure of a column photo whose element is off, relative to one that is fully on. */
const DIMMED = 0.3;
/** Theme colors of a row's paths, by bounce count: emission, then bounce 1, 2, 3 (the terms I, A, A², ⋯). */
const PATH_COLORS = ['light-0', 'light-1', 'light-2', 'light-3'];
/** The cyan pixel marker of the row view, as the strip outlines the same pixel. */
const PIXEL_MARK = [76, 201, 240];
/** Paths drawn for a row, spread over its paths in proportion to the light each carries. */
const ROW_PATHS = 260;

/** True when p has a weight other than 0 or 1, so its bars say more than which elements are on. */
const graded = (p) => p.some((value) => value > 0 && value < 1);

/**
 * Row j in the dark room, up to `view.bounces` bounces (all for null):
 * the light paths from the elements to pixel j, each element glowing with
 * its share of the row (the terms shown so far, relative to the largest
 * whole entry T_jk), and pixel j's wedge to the camera. Moving forward
 * from `view.before` (the previous row step, or null), the paths it did
 * not show are drawn `progress` of the way from their elements and the
 * glows rise from its shares.
 */
function paintRow(ctx, env, view, colors, progress) {
  const { row: j, bounces, before } = view;
  const transform = drawRoom(ctx, env.room, { x: 0, y: 0, width: ROOM[0], height: ROOM[1] }, {});
  const drawnBefore = before ? (before.bounces ?? Infinity) : -1;
  const paths = rowPaths(env, j, ROW_PATHS).filter((path) => bounces === null || path.bounces <= bounces);
  drawRowPaths(ctx, transform, paths, PATH_COLORS.map((name) => colors[name]), (path) => (path.bounces > drawnBefore ? progress : 1));
  const shares = rowShares(env, j, bounces);
  const from = before ? rowShares(env, j, before.bounces) : shares.map(() => 0);
  const glow = shares.map((value, k) => from[k] + (value - from[k]) * progress);
  drawElementShares(ctx, transform, env.elements, glow, colors['light-0'], Math.max(...rowShares(env, j, null)));
  drawPixelWedge(ctx, env.room, transform, [j / MATRIX_PIXELS, (j + 1) / MATRIX_PIXELS], PIXEL_MARK);
  drawRoomCamera(ctx, transform);
  drawElements(ctx, transform, env.elements);
}

/**
 * The room under pattern `view.p`, moving from `view.before` (the previous
 * step's pattern; dark for none) with `progress`; with `view.rays`, each
 * camera pixel's ray in the color of its value in `image` (the column
 * view), drawn `progress` of the way to the camera, and with `view.bars`,
 * the pattern's weights as bars.
 */
function paintPattern(ctx, env, gains, view, image, progress) {
  const p = view.p.map((value, k) => (view.before ? view.before[k] : 0) + (value - (view.before ? view.before[k] : 0)) * progress);
  const picture = patternPicture(env, p);
  const transform = drawRoom(ctx, env.room, { x: 0, y: 0, width: ROOM[0], height: ROOM[1] }, {
    table: env.table,
    fluence: picture.fluence,
    fluenceGain: gains.room,
    surfaces: picture.surfaces,
    surfaceGain: gains.room * SURFACE_GAIN,
  });
  if (view.rays) drawPixelRays(ctx, transform, pixelRays(env), image, gains.strip, progress);
  drawRoomCamera(ctx, transform);
  drawElements(ctx, transform, env.elements);
  if (view.bars) drawElementBars(ctx, transform, env.elements, p, BAR_COLORS.light, Math.max(...view.p));
}

/**
 * One column of T, drawn small: the room lit by element k alone. The
 * column is the same photo whatever the pattern; its exposure follows the
 * weight p_k (relative to the largest), and when the element is off it
 * stays visible, faded (`matrix-thumb--off`).
 */
function ColumnThumb({ env, k, weight, gain, onToggle }) {
  const [ref, ratio] = useStageCanvas();
  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const picture = elementPictures(env)[k];
    const level = gain * (DIMMED + (1 - DIMMED) * weight);
    drawRoom(ctx, env.room, { x: 0, y: 0, width: THUMB[0], height: THUMB[1] }, {
      table: env.table,
      fluence: picture.fluence,
      fluenceGain: level,
      surfaces: picture.surfaces,
      surfaceGain: level * SURFACE_GAIN,
    });
  }, [ref, ratio, env, k, weight, gain]);
  return (
    <canvas
      ref={ref}
      className={weight > 0 ? 'matrix-thumb' : 'matrix-thumb matrix-thumb--off'}
      width={Math.round(THUMB[0] * ratio)}
      height={Math.round(THUMB[1] * ratio)}
      style={{ width: THUMB[0], height: THUMB[1] }}
      onPointerDown={onToggle}
    />
  );
}

/**
 * c = T p as blocks drawn to scale (pixels by elements), with the column
 * (or row) the step shows marked in T and the entries it involves in p and
 * c; with `measured` false, only the lit element's entry of p is marked.
 */
function BlockDiagram({ pixels, elements, column, row, measured = true }) {
  const unit = 3.5;
  const bar = 24;
  const gap = 18;
  const height = pixels * unit;
  const top = 6;
  const cx = 30;
  const tx = cx + bar + gap + 22;
  const tw = elements * unit;
  const px = tx + tw + gap;
  const width = px + bar + 6;
  const labelY = top + height + 28;
  const block = { className: 'matrix-block' };
  return (
    <div className="matrix-blocks" style={{ width, height: labelY + 8 }}>
      <svg width={width} height={labelY + 8}>
        <rect x={cx} y={top} width={bar} height={height} {...block} />
        <text x={cx + bar + (gap + 22) / 2} y={top + height / 2 + 7} className="matrix-block-sign">=</text>
        <rect x={tx} y={top} width={tw} height={height} {...block} />
        <rect x={px} y={top} width={bar} height={elements * unit} {...block} />
        {column !== undefined && (
          <>
            {measured && <rect x={tx + column * unit} y={top} width={unit} height={height} className="matrix-block-mark" />}
            <rect x={px} y={top + column * unit} width={bar} height={unit} className="matrix-block-mark" />
            {measured && <rect x={cx} y={top} width={bar} height={height} className="matrix-block-mark matrix-block-mark--soft" />}
          </>
        )}
        {row !== undefined && (
          <>
            <rect x={tx} y={top + row * unit} width={tw} height={unit} className="matrix-block-mark matrix-block-mark--row" />
            <rect x={cx} y={top + row * unit} width={bar} height={unit} className="matrix-block-mark matrix-block-mark--row" />
          </>
        )}
      </svg>
      <span className="matrix-block-label" style={{ left: cx + bar / 2, top: labelY - 18 }}><Text>{'$c$'}</Text></span>
      <span className="matrix-block-label" style={{ left: tx + tw / 2, top: labelY - 18 }}><Text>{'$\\mathbf{T}$'}</Text></span>
      <span className="matrix-block-label" style={{ left: px + bar / 2, top: top + elements * unit + 10 }}><Text>{'$p$'}</Text></span>
    </div>
  );
}

function stepPattern(env, entry) {
  if (entry.pattern) {
    if (entry.pattern.length !== env.elements.length) throw new Error(`transportMatrix: a pattern needs ${env.elements.length} weights`);
    return Float64Array.from(entry.pattern);
  }
  const p = new Float64Array(env.elements.length);
  for (const k of entry.elements ?? []) p[k] = 1;
  return p;
}

/**
 * The light transport matrix of the room: light elements on the ceiling
 * (the pattern p), a camera of MATRIX_PIXELS pixels (the image c), c = Tp.
 *
 * - `mode: 'matrix'`: build steps `{ elements: [k] }` show column k (the
 *   room lit by element k alone, every camera pixel's ray in the color of
 *   its value, and the camera's image); with `image: false`, the room lit
 *   by element k without the rays, the image, or the column's mark in T
 *   (a step to ask what that image is). `{ row: j }` shows row j (the
 *   light paths from every element that end at pixel j, colored by their
 *   number of bounces, and each element glowing with its share T_jk);
 *   with `bounces: n`, only the terms up to Aⁿ (the paths of at most n
 *   bounces, and each element's share of those terms), so consecutive
 *   steps can add the terms one at a time. Beside the room, c = Tp is
 *   drawn as blocks to scale, with that column or row marked, over a
 *   short label (a step's `label`, or one naming the column or row).
 * - `mode: 'relight'`: build steps `{ elements: [...] }` or `{ pattern:
 *   [one weight per element] }` light the room with p; the columns of T
 *   sit beside the room (each a photo, dimmed when its element is off), a
 *   graded pattern hangs from the ceiling as bars, and the photo as the
 *   sum of the weighted columns is shown beside the photo rendered
 *   directly. Clicking a column or dragging across the ceiling switches
 *   elements on and off.
 *
 * Moving forward one step, the room changes from the previous step's
 * lighting to the new one, and what the step adds (rays, paths, glows)
 * is drawn in; arriving or moving back shows the step settled.
 *
 * Content fields: `title`, `subtitle`, `mode`, `buildSteps`, `equations`
 * (EquationStack lines beside the room: `{ tex, step?, parts? }`, each
 * from its step on, its place kept from the first step), optional
 * `figure` (relight: a media item with `caption` and `step`; from that
 * step it is shown at full size in the room's place, and the check is
 * hidden), and optional `exposureStep` (the build step whose lighting
 * sets the exposure; 0).
 */
export default function TransportMatrix({ slide, buildStep }) {
  const env = lightElementRoom();
  const relight = slide.mode === 'relight';
  if (!relight && slide.mode !== 'matrix') throw new Error(`transportMatrix: unknown mode "${slide.mode}"`);
  if (!Array.isArray(slide.equations) || slide.equations.some((line) => typeof line.tex !== 'string')) {
    throw new Error('transportMatrix: `equations` must be lines `{ tex, step? }`');
  }
  const colorsRef = useRef(null);
  const step = Math.min(buildStep, slide.buildSteps.length - 1);
  const fromStep = useStepTransition(step);
  const entry = slide.buildSteps[step];
  const previous = fromStep === null ? null : slide.buildSteps[fromStep];
  const scripted = useMemo(() => (entry.row === undefined ? stepPattern(env, entry) : null), [env, entry]);
  const [painted, setPainted] = useState(null);
  const paintValue = useRef(null);
  useEffect(() => setPainted(null), [buildStep]);
  const p = painted ?? scripted;
  const uniform = useMemo(() => new Float64Array(env.elements.length).fill(1), [env]);

  const fixed = useMemo(() => {
    const reference = stepPattern(env, slide.buildSteps[slide.exposureStep ?? 0]);
    const column = oneHot(env.elements.length, Math.floor(env.elements.length / 2));
    return {
      ...exposures(env, reference),
      uniform: exposures(env, new Float64Array(env.elements.length).fill(1)),
      column: exposures(env, column),
    };
  }, [env, slide.buildSteps, slide.exposureStep]);
  // A painted pattern keeps the slide's exposure unless it is brighter than the room allows:
  // then the exposure drops to the pattern's own, like a camera stopping down.
  const gains = useMemo(() => {
    if (!painted || !painted.some((value) => value > 0)) return fixed;
    const own = exposures(env, painted);
    return { ...fixed, room: Math.min(fixed.room, own.room), strip: Math.min(fixed.strip, own.strip) };
  }, [env, fixed, painted]);

  const measured = relight || entry.image !== false;
  const view = entry.row === undefined
    ? {
      p,
      before: previous && previous.row === undefined && !painted ? stepPattern(env, previous) : null,
      bars: relight && graded(p),
      rays: !relight && measured,
    }
    : {
      row: entry.row,
      bounces: entry.bounces ?? null,
      before: previous && previous.row === entry.row ? { bounces: previous.bounces ?? null } : null,
    };
  const image = weightedSum(env.images, p ?? uniform);
  const paint = (ctx, progress) => {
    if (view.row === undefined) {
      paintPattern(ctx, env, gains, view, image, progress);
      return;
    }
    colorsRef.current ??= themeColors(ctx.canvas, PATH_COLORS);
    paintRow(ctx, env, view, colorsRef.current, progress);
  };
  const check = useMemo(() => (relight && p ? relightingCheck(env, p) : null), [env, relight, p]);
  const largest = p ? Math.max(...p) : 0;

  /** Set element k to `value` (0 or 1), on top of whatever is shown. */
  const setElement = (k, value) => {
    if (k < 0) return;
    setPainted((current) => {
      const base = current ?? scripted;
      if (base[k] === value) return current;
      const next = Float64Array.from(base);
      next[k] = value;
      return next;
    });
  };
  // A drag across the ceiling sets every element it crosses to the opposite of the first one's state.
  const roomEvents = relight ? {
    onPointerDown: (event, point) => {
      const k = elementAt(env, point, ROOM);
      if (k < 0) return;
      paintValue.current = p[k] > 0 ? 0 : 1;
      setElement(k, paintValue.current);
    },
    onPointerMove: (event, point) => {
      const k = elementAt(env, point, ROOM);
      // Only the ceiling's elements respond to a click, so only they show the pointer.
      event.currentTarget.style.cursor = k >= 0 ? 'pointer' : 'default';
      if (event.buttons && paintValue.current !== null) setElement(k, paintValue.current);
    },
    onPointerUp: () => {
      paintValue.current = null;
    },
  } : {};

  const k = entry.elements?.[0];
  const figure = relight ? slide.figure : null;
  const showFigure = Boolean(figure) && buildStep >= (figure.step ?? 0);
  return (
    <div className="slide--transport-matrix">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="matrix-body">
        <div className="matrix-left" data-no-swipe={relight ? '' : undefined}>
          <RoomView
            width={ROOM[0]}
            height={ROOM[1]}
            paint={paint}
            animationKey={`${step}`}
            duration={fromStep === step - 1 ? 700 : 0}
            redrawKey={p ? Array.from(p).join(',') : `row${entry.row}`}
            className="matrix-room"
            {...roomEvents}
          />
          <motion.div initial={false} animate={{ opacity: measured ? 1 : 0 }} transition={{ duration: 0.35 }}>
            <Strip image={image} gain={p ? gains.strip : gains.uniform.strip} width={ROOM[0]} highlight={entry.row} />
          </motion.div>
          {figure && (
            <motion.figure
              className="matrix-figure"
              initial={false}
              animate={{ opacity: showFigure ? 1 : 0 }}
              transition={{ duration: 0.35 }}
              style={{ pointerEvents: showFigure ? 'auto' : 'none' }}
              aria-hidden={!showFigure}
            >
              <Media item={figure} />
              {figure.caption && <figcaption><Text>{figure.caption}</Text></figcaption>}
            </motion.figure>
          )}
        </div>
        <div className="matrix-side">
          <EquationStack lines={slide.equations} step={buildStep} dimEarlier={false} lineClassName="matrix-equation" />
          {relight ? (
            <>
              <div className="matrix-thumbs" data-no-swipe onMouseDown={(event) => event.preventDefault()}>
                {env.elements.map((patch, index) => (
                  <ColumnThumb
                    key={patch.index}
                    env={env}
                    k={index}
                    weight={largest > 0 ? p[index] / largest : 0}
                    gain={gains.column.room}
                    onToggle={() => setElement(index, p[index] > 0 ? 0 : 1)}
                  />
                ))}
              </div>
              {check && !showFigure && (
                <div className="matrix-check">
                  <span className="matrix-check-label">sum of columns</span>
                  <Strip image={check.summed} gain={gains.strip} width={300} />
                  <span className="matrix-check-label">rendered directly</span>
                  <Strip image={check.direct} gain={gains.strip} width={300} />
                </div>
              )}
            </>
          ) : (
            <>
              <BlockDiagram pixels={MATRIX_PIXELS} elements={env.elements.length} column={k} row={entry.row} measured={measured} />
              <p className="matrix-label">
                <Text>{entry.label ?? (entry.row === undefined ? 'column $k$: $p = \\delta_k$' : 'row $j$: pixel $j$')}</Text>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
