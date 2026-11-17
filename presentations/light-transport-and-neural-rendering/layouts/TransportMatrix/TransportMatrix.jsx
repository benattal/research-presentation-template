import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Media from '@core/stage/Media.jsx';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useStageCanvas } from '../canvas/canvas.js';
import RoomView from '../flatland/RoomView.jsx';
import {
  MATRIX_PIXELS, lightElementRoom, oneHot, relightingCheck, weightedSum,
} from '../flatland/lightElements.js';
import { drawPixelWedge, drawRoomCamera } from '../flatland/overlays.js';
import { SURFACE_GAIN } from '../flatland/pictures.js';
import { ROOM_VIEW, drawRoom } from '../flatland/render.js';
import {
  Strip, drawElements, elementAt, elementPictures, exposures, patternPicture,
} from './elementViews.jsx';
import './TransportMatrix.css';

const ROOM = ROOM_VIEW;
const THUMB = [74, 44];
/** Longest bar of the pattern p hanging from the ceiling, in stage pixels. */
const BAR = 70;
/** Exposure of a column photo whose element is off, relative to one that is fully on. */
const DIMMED = 0.3;

const luminance = (v, j) => 0.2126 * v[j * 3] + 0.7152 * v[j * 3 + 1] + 0.0722 * v[j * 3 + 2];

/** True when p has a weight other than 0 or 1, so its bars say more than which elements are on. */
const graded = (p) => p.some((value) => value > 0 && value < 1);

/** The pattern p as bars hanging from each element, their length proportional to p_k. */
function drawPatternBars(ctx, transform, elements, p) {
  const largest = Math.max(...p);
  if (!(largest > 0)) return;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 241, 201, 0.7)';
  elements.forEach((patch, k) => {
    if (p[k] <= 0) return;
    const a = transform.toCanvas(patch.a);
    const b = transform.toCanvas(patch.b);
    const left = Math.min(a[0], b[0]);
    const width = Math.abs(b[0] - a[0]);
    ctx.fillRect(left + 0.36 * width, a[1] + 10, 0.28 * width, BAR * p[k] / largest);
  });
  ctx.restore();
}

/** The room and its camera image under pattern p (or a row's view: the pixel and each element's share). */
function paintRoom(ctx, env, gains, view, progress) {
  const rect = { x: 0, y: 0, width: ROOM[0], height: ROOM[1] };
  if (view.row !== undefined) {
    const all = patternPicture(env, new Float64Array(env.elements.length).fill(1));
    const transform = drawRoom(ctx, env.room, rect, {
      table: env.table,
      fluence: all.fluence,
      fluenceGain: gains.uniform.room * 0.4,
      surfaces: all.surfaces,
      surfaceGain: gains.uniform.room * 0.4 * SURFACE_GAIN,
    });
    drawPixelWedge(ctx, env.room, transform, [view.row / MATRIX_PIXELS, (view.row + 1) / MATRIX_PIXELS], [76, 201, 240]);
    drawRoomCamera(ctx, transform);
    const shares = env.images.map((image) => luminance(image, view.row));
    drawElements(ctx, transform, env.elements, shares, (w) => `rgba(76, 201, 240, ${(0.15 + 0.85 * w ** 1.5 * progress).toFixed(3)})`);
    return;
  }
  const picture = patternPicture(env, view.p.map((value) => value * progress));
  const transform = drawRoom(ctx, env.room, rect, {
    table: env.table,
    fluence: picture.fluence,
    fluenceGain: gains.room,
    surfaces: picture.surfaces,
    surfaceGain: gains.room * SURFACE_GAIN,
  });
  drawRoomCamera(ctx, transform);
  drawElements(ctx, transform, env.elements, view.p, null);
  if (view.bars) drawPatternBars(ctx, transform, env.elements, view.p.map((value) => value * progress));
}

/**
 * One column of T, drawn small: the room lit by element k alone. The
 * column is the same photo whatever the pattern; its exposure follows the
 * weight p_k (relative to the largest), and it stays visible, dimmed, when
 * the element is off.
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
      className="matrix-thumb"
      width={Math.round(THUMB[0] * ratio)}
      height={Math.round(THUMB[1] * ratio)}
      style={{ width: THUMB[0], height: THUMB[1] }}
      onPointerDown={onToggle}
    />
  );
}

/**
 * c = T p as blocks drawn to scale (pixels by elements), with the column
 * (or row) the step shows marked in T and the entries it involves in p and c.
 */
function BlockDiagram({ pixels, elements, column, row }) {
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
            <rect x={tx + column * unit} y={top} width={unit} height={height} className="matrix-block-mark" />
            <rect x={px} y={top + column * unit} width={bar} height={unit} className="matrix-block-mark" />
            <rect x={cx} y={top} width={bar} height={height} className="matrix-block-mark matrix-block-mark--soft" />
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
      <span className="matrix-block-size" style={{ left: cx - 4, top: top + height / 2 - 12 }}>{pixels}</span>
      <span className="matrix-block-size matrix-block-size--right" style={{ left: px + bar + 4, top: top + elements * unit / 2 - 12 }}>{elements}</span>
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

function formatSmall(value) {
  if (value === 0) return '0';
  const exponent = Math.floor(Math.log10(value));
  const mantissa = value / 10 ** exponent;
  return `${mantissa.toFixed(1)} \\times 10^{${exponent}}`;
}

/**
 * The light transport matrix of the room: 19 light elements on the
 * ceiling, a camera of 64 pixels, c = Tp.
 *
 * - `mode: 'matrix'`: build steps `{ elements: [k] }` show column k (the
 *   room and the camera's image lit by element k alone), and `{ row: j }`
 *   shows row j (each element's share of pixel j, on the ceiling). Beside
 *   the room, c = Tp is drawn as blocks to scale, with that column or row
 *   marked.
 * - `mode: 'relight'`: build steps `{ elements: [...] }` or `{ pattern:
 *   [19 weights] }` light the room with p; the columns of T sit beside
 *   the room (each a photo, dimmed when its element is off), a graded
 *   pattern hangs from the ceiling as bars, and the photo as the sum of
 *   the weighted columns is checked against the photo rendered directly.
 *   Clicking a column or dragging across the ceiling switches elements on
 *   and off.
 *
 * Content fields: `title`, `subtitle`, `mode`, `buildSteps`, `equations`
 * (display lines beside the room, at every step), optional `labels` (short
 * lines under them), optional `figure` (relight: a media item with
 * `caption` and `step`; from that step it takes the check's place), and
 * optional `exposureStep` (the
 * build step whose lighting sets the exposure; 0).
 */
export default function TransportMatrix({ slide, buildStep }) {
  const env = lightElementRoom();
  const relight = slide.mode === 'relight';
  if (!relight && slide.mode !== 'matrix') throw new Error(`transportMatrix: unknown mode "${slide.mode}"`);
  if (!Array.isArray(slide.equations)) throw new Error('transportMatrix: `equations` is required');
  const entry = slide.buildSteps[Math.min(buildStep, slide.buildSteps.length - 1)];
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

  const view = entry.row === undefined ? { p, bars: relight && graded(p) } : { row: entry.row };
  const image = weightedSum(env.images, p ?? uniform);
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
      if (event.buttons && paintValue.current !== null) setElement(elementAt(env, point, ROOM), paintValue.current);
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
            paint={(ctx, progress) => paintRoom(ctx, env, gains, view, progress)}
            animationKey={`${buildStep}`}
            duration={700}
            redrawKey={p ? Array.from(p).join(',') : `row${entry.row}`}
            className={relight ? 'matrix-room matrix-room--paint' : 'matrix-room'}
            {...roomEvents}
          />
          <Strip image={image} gain={p ? gains.strip : gains.uniform.strip} width={ROOM[0]} highlight={entry.row} />
        </div>
        <div className="matrix-side">
          {slide.equations.map((line) => (
            <div key={line} className="matrix-equation"><Text>{line}</Text></div>
          ))}
          {(slide.labels ?? []).map((line) => (
            <p key={line} className="matrix-label matrix-label--muted"><Text>{line}</Text></p>
          ))}
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
                  <span className="matrix-check-difference"><Text>{`$\\text{difference} \\; ${formatSmall(check.relative)}$`}</Text></span>
                </div>
              )}
              {showFigure && (
                <motion.figure
                  className="matrix-figure"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <Media item={figure} />
                  {figure.caption && <figcaption><Text>{figure.caption}</Text></figcaption>}
                </motion.figure>
              )}
            </>
          ) : (
            <>
              <BlockDiagram pixels={MATRIX_PIXELS} elements={env.elements.length} column={k} row={entry.row} />
              <p className="matrix-label">
                <Text>{entry.row === undefined ? `column $k = ${k + 1}$: $p = \\delta_k$` : `row $j = ${entry.row + 1}$: pixel $j$`}</Text>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
