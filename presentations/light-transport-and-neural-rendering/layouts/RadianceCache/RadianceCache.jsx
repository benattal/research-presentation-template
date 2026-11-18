import { useEffect, useMemo } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useStageCanvas } from '../canvas/canvas.js';
import RoomView from '../flatland/RoomView.jsx';
import {
  CACHE_VIEWS, cacheState, observedPatches, oneBounceFromCache,
} from '../flatland/cache.js';
import { drawDevice } from '../flatland/overlays.js';
import { SURFACE_GAIN, cachedFluence, derived, sceneGain, subtract } from '../flatland/pictures.js';
import { ROOM_VIEW, drawRoom } from '../flatland/render.js';
import { flatlandRoom } from '../flatland/rooms.js';
import { patchRadiosity } from '../flatland/transport.js';
import './RadianceCache.css';

const ROOM = ROOM_VIEW;
/** Thumbnail size, the same as the operator explorer's bounce thumbnails. */
const THUMB = [108, 65];
/** Exposure relative to the operator explorer's, and how much brighter the missing light is drawn. */
const EXPOSURE = 0.45;
const BIAS_EXPOSURE = 4;

/** The cache and the estimate from it, computed once for the lamp room. */
function cacheRoom(env) {
  return derived(env.steady, 'radiance-cache', () => {
    const observed = observedPatches(env.room);
    const cache = cacheState(env.room, env.steady, observed);
    const estimate = oneBounceFromCache(env.transport, cache);
    const missing = subtract(env.steady, estimate);
    return { observed, states: { cache, estimate, exact: env.steady, missing } };
  });
}

const STEPS = [
  { key: 'cache', tex: '\\htmlClass{term-learned}{\\hat{x}}', label: 'NeRF as cache' },
  { key: 'estimate', tex: 'e + A\\htmlClass{term-learned}{\\hat{x}}', label: 'one bounce' },
  { key: 'exact', tex: 'x', label: 'solve' },
  { key: 'missing', tex: 'A(\\htmlClass{term-learned}{\\hat{x}} - x)', label: 'bias' },
];

/** The room under one of the four states, with the views and the unobserved surfaces on the cache. */
function paintState(ctx, env, result, key, rect, { views = false, label = false } = {}) {
  const state = result.states[key];
  const gain = EXPOSURE * sceneGain(env, false) * (key === 'missing' ? BIAS_EXPOSURE : 1);
  const transform = drawRoom(ctx, env.room, rect, {
    table: env.table,
    fluence: cachedFluence(env.table, state, Infinity, 'source'),
    fluenceGain: gain,
    surfaces: derived(state, 'radiosity', () => patchRadiosity(env.transport, state)),
    surfaceGain: gain * SURFACE_GAIN,
  });
  if (key === 'cache') drawUnobserved(ctx, env, result.observed, transform, label);
  if (views) for (const view of CACHE_VIEWS) drawDevice(ctx, transform, view.position, view.lookAt, { size: 0.8 });
  if (key === 'missing' && label) drawCorner(ctx, rect, `exposure ×${BIAS_EXPOSURE}`);
}

/** The surfaces no view observed: a dashed line in the learned color, and a short label. */
function drawUnobserved(ctx, env, observed, transform, label) {
  ctx.save();
  ctx.strokeStyle = 'rgba(110, 231, 183, 0.95)';
  ctx.lineWidth = Math.max(1.5, 0.05 * transform.scale);
  ctx.setLineDash([6, 5]);
  const hidden = env.room.patches.filter((patch) => !observed[patch.index]);
  for (const patch of hidden) {
    const offset = 0.09;
    const a = transform.toCanvas([patch.a[0] + patch.normal[0] * offset, patch.a[1] + patch.normal[1] * offset]);
    const b = transform.toCanvas([patch.b[0] + patch.normal[0] * offset, patch.b[1] + patch.normal[1] * offset]);
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.stroke();
  }
  if (label && hidden.length) {
    const top = hidden.reduce((best, patch) => (patch.center[1] > best.center[1] ? patch : best), hidden[0]);
    const [x, y] = transform.toCanvas([top.center[0] - 0.25, top.center[1] + 0.55]);
    ctx.font = "18px 'Inter Variable', Inter, sans-serif";
    ctx.fillStyle = 'rgba(110, 231, 183, 0.95)';
    ctx.textAlign = 'right';
    ctx.fillText('not observed', x, y);
  }
  ctx.restore();
}

function drawCorner(ctx, rect, text) {
  ctx.save();
  ctx.font = "18px 'Inter Variable', Inter, sans-serif";
  ctx.fillStyle = 'rgba(215, 219, 228, 0.85)';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, rect.x + 14, rect.y + rect.height - 12);
  ctx.restore();
}

function Thumb({ env, result, stepKey }) {
  const [ref, ratio] = useStageCanvas();
  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    paintState(ctx, env, result, stepKey, { x: 0, y: 0, width: THUMB[0], height: THUMB[1] });
  }, [ref, ratio, env, result, stepKey]);
  return (
    <canvas
      ref={ref}
      className="cache-thumb"
      width={Math.round(THUMB[0] * ratio)}
      height={Math.round(THUMB[1] * ratio)}
      style={{ width: THUMB[0], height: THUMB[1] }}
    />
  );
}

/**
 * Radiance caching, as an illustration of the idea: a NeRF as the cache x̂
 * of the light leaving surfaces, exact where a few views observed them and
 * zero behind the box, where none did (flatland/cache.js), then one
 * physically based bounce over the cached light, e + Ax̂. Build steps show
 * the cache (with the views and the unobserved surfaces), the one-bounce
 * estimate, the full solve x, and the bias (e + Ax̂) − x = A(x̂ − x), drawn
 * as the light it removes. A column beside the room keeps every step.
 *
 * Content fields: `title`, `subtitle`, and four `buildSteps`.
 */
export default function RadianceCache({ slide, buildStep }) {
  const env = flatlandRoom('diffuse', 'lamp');
  const result = useMemo(() => cacheRoom(env), [env]);
  const step = Math.min(buildStep, STEPS.length - 1);
  const current = STEPS[step];

  return (
    <div className="slide--radiance-cache">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="cache-body">
        <RoomView
          width={ROOM[0]}
          height={ROOM[1]}
          animationKey={current.key}
          paint={(ctx) => paintState(ctx, env, result, current.key, { x: 0, y: 0, width: ROOM[0], height: ROOM[1] }, { views: step === 0, label: true })}
          className="cache-room"
        />
        <div className="cache-side">
          <div className="cache-equation"><Text>{'$x \\approx e + A\\htmlClass{term-learned}{\\hat{x}}$'}</Text></div>
          <ol className="cache-steps">
            {STEPS.map((entry, i) => (
              <li key={entry.key} className={i === step ? 'cache-current' : (i < step ? '' : 'cache-later')}>
                <Thumb env={env} result={result} stepKey={entry.key} />
                <span className="cache-step-text">
                  <Text>{`$${entry.tex}$`}</Text>
                  <span className="cache-step-label">{entry.label}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
