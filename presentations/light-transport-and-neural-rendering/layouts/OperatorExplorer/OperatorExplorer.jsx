import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import EquationStack from '@core/stage/EquationStack.jsx';
import {
  ease, stillFrames, useAnimation, useStageCanvas, useStepTransition,
} from '@core/stage/canvas.js';
import { FLOOR_FINISHES } from '../flatland/scene.js';
import { MEASURED_PIXEL, flatlandRoom } from '../flatland/rooms.js';
import {
  SURFACE_GAIN, cachedFluence, derived, sceneGain, subtract,
} from '../flatland/pictures.js';
import { ROOM_VIEW, drawRoom } from '../flatland/render.js';
import { fluence, patchRadiosity, propagate } from '../flatland/transport.js';
import {
  DIRECTIONS, addFrame, allowedOperations, applyOperator, bounceTerms, frameTex, scriptedFrames,
  sourceFrame, termClass, termTex,
} from './operatorFrames.js';
import './OperatorExplorer.css';

/** Longer than any ray in the room (room units): light that has travelled this far has landed. */
const FULL = 12;
/** How far light "just leaving" its surfaces is drawn, in room units. */
const LEAVING = 2;
const DURATIONS = { G: 2200, S: 1300, A: 3000, add: 900 };
/** One bounce drawn with every ray at full length is a cross-fade from the light before to the light after, in ms. */
const CROSSFADE = 900;
/** Size of a bounce thumbnail beside the room, in stage pixels: one size for every column. */
const THUMBNAIL = [108, 65];

const KINDS = {
  outgoing: 'outgoing radiance',
  incident: 'incident radiance',
  arriving: 'importance arriving',
  leaving: 'importance leaving',
};

/** Size of the room render, in stage pixels (10 × 6 room units). */
const ROOM_SIZE = ROOM_VIEW;

function mix(...pairs) {
  const present = pairs.filter(([array, weight]) => array && weight !== 0);
  if (present.length === 0) return null;
  const result = new Float64Array(present[0][0].length);
  for (const [array, weight] of present) for (let i = 0; i < result.length; i += 1) result[i] += weight * array[i];
  return result;
}

/**
 * Importance leaving its surfaces (a 'leaving' state such as Sᵀq, indexed
 * at the end of each ray where it leaves), drawn along the rays it travels
 * back by, within `extent` room units of those surfaces.
 */
function leavingFluence(env, state, extent) {
  return derived(state, `leaving-fluence:${extent}`, () => fluence(env.table, state, extent, { from: 'destination', at: 'destination' }));
}

/**
 * The importance an 'arriving' frame travelled from: the leaving state that
 * Gᵀ (or Aᵀ = GᵀSᵀ, through its Sᵀ) propagated; null for a source or a sum.
 */
function leftFrom(frame, env) {
  if (frame.op === 'G') return frame.from.state;
  if (frame.op === 'A') return derived(frame.from.state, 'apply-S', () => applyOperator(env.transport, frame.from, 'S')).state;
  return null;
}

/**
 * What a frame looks like once its animation has finished: the light in
 * the room (fluence) and the glow of each surface. Light that has just
 * travelled (G) is drawn along its rays from the state it left, and so is
 * importance (Gᵀ): each ray shows the value at the surface it left.
 */
function settledPicture(frame, env, fullRays) {
  const { table, transport, sensor } = env;
  const radiosity = (state) => derived(state, 'radiosity', () => patchRadiosity(transport, state));
  if (frame.direction === 'forward') {
    if (frame.kind === 'outgoing') {
      return {
        fluence: cachedFluence(table, frame.state, fullRays ? Infinity : LEAVING, 'source'),
        surfaces: radiosity(frame.state),
      };
    }
    const travelled = frame.from.state;
    return {
      fluence: cachedFluence(table, travelled, Infinity, 'source'),
      surfaces: mix([radiosity(frame.state), 1], [radiosity(travelled), 0.5]),
    };
  }
  if (frame.kind === 'arriving') {
    const travelled = leftFrom(frame, env);
    if (travelled) return { fluence: leavingFluence(env, travelled, Infinity), surfaces: radiosity(frame.state) };
    const direct = frame.terms.includes('');
    const rays = direct ? derived(frame.state, 'without-sensor', () => subtract(frame.state, sensor)) : frame.state;
    return {
      fluence: frame.terms.length === 1 && direct ? null : cachedFluence(table, rays, Infinity, 'source'),
      surfaces: radiosity(frame.state),
    };
  }
  return {
    fluence: leavingFluence(env, frame.state, fullRays ? Infinity : LEAVING),
    surfaces: radiosity(frame.state),
  };
}

/** Light (or importance) of `frame` growing out of its surfaces, `distance` room units so far. */
function growingFluence(frame, env, distance) {
  if (frame.direction === 'forward') return fluence(env.table, frame.state, distance, { from: 'source' });
  return fluence(env.table, frame.state, distance, { from: 'destination', at: 'destination' });
}

/** Scattering: the old light fades while surfaces change color, then the new light leaves them. */
function scatterPicture(before, frame, progress, env, fullRays) {
  const target = settledPicture(frame, env, fullRays);
  const fade = Math.min(1, progress / 0.35);
  const grow = Math.max(0, (progress - 0.35) / 0.65);
  const reach = Math.min(fullRays ? FULL : LEAVING, ease(grow) * FULL);
  return {
    fluence: mix([before.fluence, 1 - fade], [grow > 0 ? growingFluence(frame, env, reach) : null, 1]),
    surfaces: mix([before.surfaces, 1 - fade], [target.surfaces, fade]),
  };
}

/** Propagation: the light of `frame.from` travels as a wavefront and lands on the next surfaces. */
function propagatePicture(frame, progress, env) {
  const { table, transport } = env;
  const reach = progress * FULL;
  const pulse = { width: 1.2, trail: 0.25 + 0.75 * progress ** 3 };
  const before = frame.from;
  const radiosity = (state) => patchRadiosity(transport, state);
  if (frame.direction === 'forward') {
    return {
      fluence: fluence(table, before.state, reach, { from: 'source', pulse }),
      surfaces: mix([radiosity(before.state), 1 - 0.5 * progress], [radiosity(propagate(transport, before.state, reach)), 1]),
    };
  }
  return {
    fluence: fluence(table, before.state, reach, { from: 'destination', at: 'destination', pulse }),
    surfaces: mix([radiosity(before.state), 1 - 0.5 * progress], [radiosity(frame.state), progress]),
  };
}

/** The picture of `frame` at `progress` ∈ [0, 1] of the animation from `frame.from`. */
function pictureAt(frame, progress, env, fullRays) {
  if (progress >= 1 || !frame.from || frame.op === null) return settledPicture(frame, env, fullRays);
  const before = settledPicture(frame.from, env, fullRays);
  if (frame.op === 'add') {
    const added = { ...frame, state: frame.added, terms: frame.terms.slice(-1), from: null };
    const addition = settledPicture(added, env, fullRays);
    return {
      fluence: mix([before.fluence, 1], [addition.fluence, ease(progress)]),
      surfaces: mix([before.surfaces, 1], [addition.surfaces, ease(progress)]),
    };
  }
  const { operators } = DIRECTIONS[frame.direction];
  const op = operators[frame.op];
  if (frame.op === 'A') {
    if (fullRays) {
      const after = settledPicture(frame, env, fullRays);
      const t = ease(progress);
      return {
        fluence: mix([before.fluence, 1 - t], [after.fluence, t]),
        surfaces: mix([before.surfaces, 1 - t], [after.surfaces, t]),
      };
    }
    const firstKey = op.letters[1];
    const middle = derived(frame.from.state, `apply-${firstKey}`, () => applyOperator(env.transport, frame.from, firstKey));
    if (progress < 0.5) return pictureAt(middle, progress * 2, env, fullRays);
    const second = { ...frame, op: op.letters[0], from: middle };
    return pictureAt(second, (progress - 0.5) * 2, env, fullRays);
  }
  const travels = (frame.direction === 'forward' && frame.op === 'G') || (frame.direction === 'adjoint' && frame.op === 'G');
  if (travels) return propagatePicture(frame, progress, env);
  return scatterPicture(before, frame, progress, env, fullRays);
}

function useFrames(mode, direction, env, mergeNamed) {
  return useMemo(() => {
    const source = direction === 'forward' ? env.transport.emission : env.sensor;
    const exact = direction === 'forward' ? env.steady : env.importance;
    return scriptedFrames(mode, direction, { transport: env.transport, source, exact, mergeNamed });
  }, [mode, direction, env, mergeNamed]);
}

/** The room, drawn as light, animating from one frame to the next. */
function RoomCanvas({ frame, frameKey, animate, env, fullRays, size, adjoint }) {
  const [ref, ratio] = useStageCanvas();
  const [width, height] = size;
  const duration = fullRays && frame.op === 'A' ? CROSSFADE : (DURATIONS[frame.op] ?? 1200);
  useAnimation(`${frameKey}|${ratio}|${width}`, animate ? duration : 0, (progress) => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const picture = pictureAt(frame, progress, env, fullRays);
    const gain = sceneGain(env, adjoint);
    drawRoom(ctx, env.room, { x: 0, y: 0, width, height }, {
      table: env.table,
      fluence: picture.fluence,
      fluenceGain: gain,
      surfaces: picture.surfaces,
      surfaceGain: gain * SURFACE_GAIN,
      palette: adjoint ? 'importance' : 'light',
      camera: adjoint,
      pixel: adjoint ? MEASURED_PIXEL : null,
    });
  });
  return (
    <canvas
      ref={ref}
      className="operator-room"
      width={Math.round(width * ratio)}
      height={Math.round(height * ratio)}
      style={{ width, height }}
    />
  );
}

/** One small render of a bounce, for the column beside the room. */
function BounceThumbnail({ state, env, adjoint, unlit, direct, size }) {
  const [ref, ratio] = useStageCanvas();
  const [width, height] = size;
  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const gain = sceneGain(env, adjoint);
    drawRoom(ctx, env.room, { x: 0, y: 0, width, height }, {
      table: env.table,
      fluence: direct || unlit ? null : cachedFluence(env.table, state, Infinity, 'source'),
      fluenceGain: gain,
      surfaces: unlit ? null : derived(state, 'radiosity', () => patchRadiosity(env.transport, state)),
      surfaceGain: gain * SURFACE_GAIN,
      palette: adjoint ? 'importance' : 'light',
      camera: adjoint,
      pixel: adjoint ? MEASURED_PIXEL : null,
    });
  }, [ref, ratio, state, env, adjoint, direct, unlit, width, height]);
  return (
    <canvas
      ref={ref}
      className="operator-thumb"
      width={Math.round(width * ratio)}
      height={Math.round(height * ratio)}
      style={{ width, height }}
    />
  );
}

/**
 * The bounces A^k e (iterate) or the terms of the Neumann series and their
 * sum (sum), one row each beside the room; in sum mode a "+ ⋯" row stands
 * for the terms after the fourth, before the exact row. With `iterate`
 * (`{ update, symbol }`), the column also shows the fixed-point iteration
 * whose iterates are the partial sums: `update` (slide text, such as
 * $x_{k+1} = e + A\,x_k$) over the rows, and beside each row the iterate
 * that row completes, `symbol` with its index (x_0 = e after the first row,
 * the bare symbol beside the exact row). Rows after the current step stay
 * unlit.
 */
function BounceColumn({ mode, direction, env, step, iterate }) {
  const adjoint = direction === 'adjoint';
  const source = adjoint ? env.sensor : env.transport.emission;
  const terms = useMemo(() => bounceTerms(env.transport, direction, source, 5), [env, direction, source]);
  const sum = mode === 'sum';
  const rows = terms.map((state, k) => {
    const letters = DIRECTIONS[direction].operators.A.letters.repeat(k);
    const tex = `\\htmlClass{${termClass(direction, letters)}}{${termTex(direction, letters)}}`;
    return {
      key: k,
      state,
      tex: sum && k > 0 ? `+\\; ${tex}` : tex,
      iterate: iterate ? `${iterate.symbol}_{${k}}` : '',
      shown: k <= step,
      current: sum ? k === step : k === Math.min(step, 4),
      direct: adjoint && k === 0,
    };
  });
  if (sum) {
    rows.push({
      key: 'more',
      state: null,
      tex: '+\\; \\cdots',
      iterate: '',
      shown: step >= 5,
      current: step >= 5,
      direct: false,
    });
    rows.push({
      key: 'exact',
      state: adjoint ? env.importance : env.steady,
      tex: `= ${DIRECTIONS[direction].exactTex}`,
      iterate: iterate ? iterate.symbol : '',
      shown: step >= 5,
      current: step >= 5,
      direct: false,
    });
  }
  // A grid of three columns (thumbnail, term, iterate); each row's cells are its <li>'s children.
  return (
    <ol className={`operator-column operator-column--${mode}`}>
      {iterate && (
        <li className="operator-column-header">
          <span />
          {/* Over the term and iterate columns, ending where the iterates end. */}
          <span className="operator-column-update"><Text>{iterate.update}</Text></span>
        </li>
      )}
      {rows.map((row) => (
        <li key={row.key} className={row.current ? 'operator-column--current' : (row.shown ? '' : 'operator-column--later')}>
          {row.state
            ? <BounceThumbnail state={row.state} env={env} adjoint={adjoint} unlit={!row.shown} direct={row.direct} size={THUMBNAIL} />
            : <span />}
          <span className="operator-term"><Text>{`$${'{'}${row.tex}${'}'}$`}</Text></span>
          <span className="operator-iterate">{row.iterate && <Text>{`$${row.iterate}$`}</Text>}</span>
        </li>
      ))}
    </ol>
  );
}

/** The short label of what the last operation was. */
function operationLabel(frame) {
  if (frame.exactTex && frame.op === 'A') return 'one bounce';
  if (frame.op === null) return frame.direction === 'forward' ? 'emission' : 'sensor';
  if (frame.direction === 'adjoint') {
    return { G: 'propagation, rays reversed', S: 'scattering, directions swapped', A: 'one bounce', add: 'sum' }[frame.op];
  }
  return { G: 'propagation', S: 'scattering', A: 'one bounce', add: 'sum' }[frame.op];
}

/**
 * The flatland room's light transport operators, shown as light.
 *
 * Content fields: `title`, `subtitle`, `mode` ('construct', 'iterate', or
 * 'sum'), `direction` ('forward' for light, 'adjoint' for importance),
 * optional `floor` ('diffuse', 'glossy', 'mirror'), optional `light`
 * ('lamp' in the ceiling, or 'spot', a narrow beam), and `buildSteps`, one
 * entry per frame of the mode (4 for construct, 5 for iterate, 6 for sum).
 * Optional short labels: a step's `label` (under the room, for that
 * step), `caption` (slide text under the room on every step, at its
 * right edge), `iterate` (`{ update, symbol }`: the iteration beside the
 * rows, see BounceColumn), `columnNote` (`{ lines, step }`: short lines
 * under the column's rows, from build step `step`), and, in construct
 * mode, `history: true` (every frame's equation so far stays on the side,
 * the earlier ones dimmed, instead of the current one alone). Optional `header` (slide text, such as the
 * equation the frames build, shown over the side column on every step)
 * and, in construct mode, `mergeNamed: true` (A is named on the step that
 * completes it: 3 frames instead of 4). The explanation is in the notes.
 *
 * The clicker steps through the scripted frames. The buttons over the
 * room apply G, S, A, or add the source to whatever is shown (only when
 * the kinds match); the next build step returns to the script.
 */
export default function OperatorExplorer({ slide, buildStep }) {
  const mode = slide.mode;
  const direction = slide.direction ?? 'forward';
  const adjoint = direction === 'adjoint';
  const [finish, setFinish] = useState(slide.floor ?? 'diffuse');
  const env = useMemo(() => flatlandRoom(finish, slide.light ?? 'lamp'), [finish, slide.light]);
  const frames = useFrames(mode, direction, env, Boolean(slide.mergeNamed));
  const [explored, setExplored] = useState(null);
  const counter = useRef(0);
  const fromStep = useStepTransition(buildStep);

  useEffect(() => setExplored(null), [buildStep, finish]);

  const step = Math.min(buildStep, frames.length - 1);
  const frame = explored?.frame ?? frames[step];
  const frameKey = explored ? `free-${explored.key}` : `step-${step}-${finish}`;
  const movedForward = explored ? true : fromStep !== null;

  const explore = (next) => {
    counter.current += 1;
    setExplored({ frame: next, key: counter.current });
  };
  const allowed = allowedOperations(frame);
  const { operators, source } = DIRECTIONS[direction];
  const sourceState = adjoint ? env.sensor : env.transport.emission;
  const showEquation = mode === 'construct' || explored;
  const showHistory = mode === 'construct' && slide.history && !explored;
  const roomLabels = slide.buildSteps.map((entry) => entry.label ?? '');
  // Beside the history of equations, what the room shows (light leaving, importance arriving, …) is its caption.
  const roomLabel = showHistory ? KINDS[frame.kind] : (explored ? '' : roomLabels[step]);
  const roomCaptioned = showHistory || roomLabels.some(Boolean) || Boolean(slide.caption);

  return (
    <div className="slide--operator-explorer">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="operator-main">
        <div className="operator-render">
          <RoomCanvas
            frame={frame}
            frameKey={frameKey}
            animate={movedForward}
            env={env}
            fullRays={mode !== 'construct'}
            size={ROOM_SIZE}
            adjoint={adjoint}
          />
          {/* Buttons keep focus off themselves, so the clicker's Space or Enter never presses one. */}
          {!stillFrames() && (
          <div className="operator-controls" data-no-swipe onMouseDown={(event) => event.preventDefault()}>
            {['G', 'S', 'A'].map((key) => (
              <button
                key={key}
                type="button"
                disabled={!allowed.operators.includes(key)}
                onClick={() => explore(applyOperator(env.transport, frame, key))}
              >
                <Text>{`$${operators[key].tex}$`}</Text>
              </button>
            ))}
            <button type="button" disabled={!allowed.addSource} onClick={() => explore(addFrame(frame, sourceState, ['']))}>
              <Text>{`$+\\,${source}$`}</Text>
            </button>
            <button type="button" onClick={() => explore(sourceFrame(direction, sourceState))}>reset</button>
            <span className="operator-controls-gap" />
            {FLOOR_FINISHES.map((name) => (
              <button
                key={name}
                type="button"
                className={finish === name ? 'operator-controls--active' : ''}
                onClick={() => setFinish(name)}
              >
                {name}
              </button>
            ))}
          </div>
          )}
        </div>
        <div className="operator-side">
          {slide.header && <div className="operator-header"><Text>{slide.header}</Text></div>}
          {showHistory ? (
            <>
              <EquationStack
                lines={frames.map((f) => ({ tex: `$${'{'}${frameTex(f)}${'}'}$`, label: operationLabel(f) }))}
                step={step}
                className="operator-history"
                lineClassName="operator-equation"
              />
            </>
          ) : showEquation ? (
            <>
              <div className="operator-equation"><Text>{`$${'{'}${frameTex(frame)}${'}'}$`}</Text></div>
              <p className="operator-label">{operationLabel(frame)}</p>
              <p className="operator-kind">{KINDS[frame.kind]}</p>
            </>
          ) : (
            <BounceColumn mode={mode} direction={direction} env={env} step={step} iterate={slide.iterate} />
          )}
          {slide.columnNote && (
            <motion.div
              className="operator-column-note"
              initial={false}
              animate={{ opacity: !explored && step >= (slide.columnNote.step ?? 0) ? 1 : 0 }}
              transition={{ duration: 0.35 }}
            >
              {slide.columnNote.lines.map((line) => <p key={line}><Text>{line}</Text></p>)}
            </motion.div>
          )}
        </div>
        {roomCaptioned && (
          <div className="operator-room-label">
            <span><Text>{roomLabel || ' '}</Text></span>
            {slide.caption && !explored && <span className="operator-room-caption"><Text>{slide.caption}</Text></span>}
          </div>
        )}
      </div>
    </div>
  );
}
