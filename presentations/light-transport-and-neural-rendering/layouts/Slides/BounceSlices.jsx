import { useEffect } from 'react';
import Text from '@core/stage/Text.jsx';
import { stillFrames, useStageCanvas } from '../canvas/canvas.js';
import { SURFACE_GAIN, cachedFluence, derived, sceneGain } from '../flatland/pictures.js';
import { drawRoom } from '../flatland/render.js';
import { flatlandRoom } from '../flatland/rooms.js';
import { addVectors, bounce, patchRadiosity } from '../flatland/transport.js';

/** Width of the bars between slices, in stage pixels (the slide shows through them). */
const BAR = 4;
/** Exposure of the spotlight room, relative to the one its direct light sets (as its still render). */
const EXPOSURE = 1.4;
/** The most bounces a slice can show, other than every bounce. */
const SLICE_BOUNCES = 3;

/** The room of the operator light transport section's opening: a spotlight on the left wall, a glossy floor. */
function spotRoom() {
  return flatlandRoom('glossy', 'spot');
}

/**
 * The light that has bounced at most `bounces` times, e + Ae + ⋯ + Aⁿe,
 * or every bounce (the steady state) for null; cached per room.
 */
function upToBounces(env, bounces) {
  if (bounces === null) return env.steady;
  return derived(env.transport.emission, `up-to-bounces:${bounces}`, () => {
    let term = env.transport.emission;
    let sum = term;
    for (let k = 1; k <= bounces; k += 1) {
      term = bounce(env.transport, term);
      sum = addVectors(sum, term);
    }
    return sum;
  });
}

/** What one slice draws, the light in the room and on its surfaces, cached per room and number of bounces. */
function sliceLight(env, bounces) {
  const state = upToBounces(env, bounces);
  return {
    fluence: cachedFluence(env.table, state, Infinity, 'source'),
    surfaces: derived(state, 'radiosity', () => patchRadiosity(env.transport, state)),
  };
}

/*
 * The spotlight room, its exposure, and the light of every slice it can
 * show take about 0.5 s to build (mostly fluence tables). Building them
 * when the browser is idle after the deck loads, one piece per idle
 * period, keeps that wait off arriving at the divider. Still frames
 * (capture, reduced motion) skip it: each frame builds only what it shows.
 */
function warmUp(pieces) {
  if (pieces.length === 0) return;
  window.requestIdleCallback(() => {
    if (stillFrames()) return;
    pieces[0]();
    warmUp(pieces.slice(1));
  });
}
if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
  warmUp([
    () => sceneGain(spotRoom(), false),
    ...Array.from({ length: SLICE_BOUNCES + 1 }, (_, bounces) => () => sliceLight(spotRoom(), bounces)),
    () => sliceLight(spotRoom(), null),
  ]);
}

/**
 * The spotlight room cut into vertical slices, side by side and separated
 * by thin bars, each slice the room lit by the light of at most so many
 * bounces, at one exposure: `slices` are `{ bounces, label }` from left to
 * right, `bounces` a whole number up to SLICE_BOUNCES or absent for every
 * bounce, `label` a short label centered under the slice. `width` × `height` stage pixels;
 * the labels hang below that box without changing its size, so the
 * render sits where the other dividers' pictures do.
 */
export default function BounceSlices({ slices, width, height }) {
  if (!Array.isArray(slices) || slices.length < 2
    || slices.some((slice) => typeof slice.label !== 'string'
      || !(slice.bounces === undefined || (Number.isInteger(slice.bounces) && slice.bounces >= 0 && slice.bounces <= SLICE_BOUNCES)))) {
    throw new Error(`BounceSlices: \`slices\` needs two or more { bounces?, label }, bounces a whole number from 0 to ${SLICE_BOUNCES} or absent for every bounce`);
  }
  const [ref, ratio] = useStageCanvas();
  const sliceWidth = (width - BAR * (slices.length - 1)) / slices.length;
  const key = slices.map((slice) => slice.bounces ?? 'all').join(',');
  useEffect(() => {
    const env = spotRoom();
    const gain = sceneGain(env, false) * EXPOSURE;
    const ctx = ref.current.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    slices.forEach((slice, i) => {
      const light = sliceLight(env, slice.bounces ?? null);
      ctx.save();
      ctx.beginPath();
      ctx.rect(i * (sliceWidth + BAR), 0, sliceWidth, height);
      ctx.clip();
      // The whole room, clipped to the slice, so the slices line up into one picture.
      drawRoom(ctx, env.room, { x: 0, y: 0, width, height }, {
        table: env.table,
        fluence: light.fluence,
        fluenceGain: gain,
        surfaces: light.surfaces,
        surfaceGain: gain * SURFACE_GAIN,
        palette: 'light',
      });
      ctx.restore();
    });
    // `slices` is content: its bounces are in `key`.
  }, [ref, ratio, key, width, height, sliceWidth]);
  return (
    <div className="bounce-slices" style={{ width, height }}>
      <canvas
        ref={ref}
        width={Math.round(width * ratio)}
        height={Math.round(height * ratio)}
        style={{ width, height, display: 'block', borderRadius: 6 }}
      />
      {slices.map((slice, i) => (
        <span key={slice.label} className="bounce-slices-label" style={{ left: i * (sliceWidth + BAR) + sliceWidth / 2 }}>
          <Text>{slice.label}</Text>
        </span>
      ))}
    </div>
  );
}
