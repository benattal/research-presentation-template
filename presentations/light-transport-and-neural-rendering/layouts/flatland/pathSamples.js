/**
 * Path tracing in the flatland room: random walks on the discrete one-bounce
 * operator A = SG of transport.js, started from the camera's pixels. This
 * is the random-walk estimator of x = (I − A)⁻¹e (section 1), with the
 * walk's steps drawn as rays in the room.
 *
 * A walk at state i = (patch q, outgoing bin) collects e_i, then
 *
 * 1. picks the incoming bin `in` with probability w_in = mean_c S_c[out, in]
 *    and stops with the remaining probability 1 − Σ w_in (Russian roulette:
 *    the albedo); its RGB weight is multiplied by S_c[out, in] / w_in;
 * 2. picks one of the sub-rays G was built from for (q, in) (6 positions
 *    along the patch × 6 angles in the bin), with probability proportional
 *    to its cosine, and moves to the state that ray sees.
 *
 * Step 2 has exactly G's probabilities, so the walk's expected value is
 * the solve of transport.js, not an approximation of it
 * (tests/flatland.test.mjs checks the ray table against G).
 */
import {
  BINS, CAMERA, angleAt, binOf, binRange, cameraRay, castRay, direction, pointOn, stateIndex,
} from './scene.js';

/** Sub-rays per (patch, bin): the positions × angles of transport.js's G. */
export const SUB_POSITIONS = 6;
export const SUB_ANGLES = 6;
const RAYS = SUB_POSITIONS * SUB_ANGLES;

/** The longest walk followed (its weight by then is far below anything visible). */
const MAX_STEPS = 64;

/** A seeded uniform random number generator on [0, 1) (mulberry32). */
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The sub-rays of every (patch, bin), traced once: for ray r of state s,
 * `target[s·36 + r]` is the state it sees (−1 if none), `cumulative` its
 * running cosine weight within s, and `segments` its origin and hit.
 */
export function rayTable(room) {
  const target = new Int32Array(room.size * RAYS).fill(-1);
  const cumulative = new Float64Array(room.size * RAYS);
  const segments = new Float32Array(room.size * RAYS * 4);
  for (const patch of room.patches) {
    for (let bin = 0; bin < BINS; bin += 1) {
      const [lo, hi] = binRange(bin);
      const s = stateIndex(patch.index, bin);
      let total = 0;
      for (let i = 0; i < SUB_POSITIONS; i += 1) {
        const origin = pointOn(patch, (i + 0.5) / SUB_POSITIONS);
        for (let j = 0; j < SUB_ANGLES; j += 1) {
          const theta = lo + ((j + 0.5) / SUB_ANGLES) * (hi - lo);
          const r = s * RAYS + i * SUB_ANGLES + j;
          total += Math.cos(theta);
          cumulative[r] = total;
          const d = direction(patch, theta);
          const hit = castRay(room, origin, d, patch.segment);
          if (!hit) continue;
          const back = [-d[0], -d[1]];
          if (back[0] * hit.patch.normal[0] + back[1] * hit.patch.normal[1] <= 0) continue;
          target[r] = stateIndex(hit.patch.index, binOf(angleAt(hit.patch, back)));
          segments.set([origin[0], origin[1], hit.point[0], hit.point[1]], r * 4);
        }
      }
    }
  }
  return { target, cumulative, segments };
}

const samplingTables = new WeakMap();

/**
 * The walk's choice of incoming bin at every state (q, out), computed once
 * per transport: `weights[state · BINS + in]` = mean_c S_c[out, in], and
 * `totals[state]` their sum (the probability of continuing). Tabulating
 * them keeps a walk's step from re-reading S; the values are the same.
 */
function samplingTable(transport) {
  if (!samplingTables.has(transport)) {
    const { scatter, room } = transport;
    const weights = new Float64Array(room.size * BINS);
    const totals = new Float64Array(room.size);
    for (let state = 0; state < room.size; state += 1) {
      const q = Math.floor(state / BINS);
      const out = state % BINS;
      let total = 0;
      for (let inc = 0; inc < BINS; inc += 1) {
        let mean = 0;
        for (let c = 0; c < 3; c += 1) mean += scatter[((q * 3 + c) * BINS + out) * BINS + inc];
        weights[state * BINS + inc] = mean / 3;
        total += weights[state * BINS + inc];
      }
      totals[state] = total;
    }
    samplingTables.set(transport, { weights, totals });
  }
  return samplingTables.get(transport);
}

/**
 * One walk from `start` (a state index). Returns its collected light
 * (RGB) and, when `keep`, the rays it took ([x0, y0, x1, y1] each) and
 * `found`: for each step at which it collected emitted light, `{ step,
 * value }` (the step is the number of scatterings before it, so that light
 * is a sample of the term A^step e).
 */
export function walk(transport, rays, start, random, keep = false) {
  const { scatter, emission } = transport;
  const { weights, totals } = samplingTable(transport);
  const value = [0, 0, 0];
  const weight = [1, 1, 1];
  const path = keep ? [] : null;
  const found = keep ? [] : null;
  let state = start;
  for (let step = 0; step < MAX_STEPS; step += 1) {
    if (keep && (emission[state * 3] > 0 || emission[state * 3 + 1] > 0 || emission[state * 3 + 2] > 0)) {
      found.push({ step, value: [0, 1, 2].map((c) => weight[c] * emission[state * 3 + c]) });
    }
    for (let c = 0; c < 3; c += 1) value[c] += weight[c] * emission[state * 3 + c];
    const q = Math.floor(state / BINS);
    const out = state % BINS;
    const row = state * BINS;
    let u = random();
    if (u >= totals[state]) break;
    let inc = 0;
    while (inc < BINS - 1 && u >= weights[row + inc]) {
      u -= weights[row + inc];
      inc += 1;
    }
    for (let c = 0; c < 3; c += 1) weight[c] *= scatter[((q * 3 + c) * BINS + out) * BINS + inc] / weights[row + inc];
    const s = q * BINS + inc;
    const base = s * RAYS;
    const pick = random() * rays.cumulative[base + RAYS - 1];
    let r = 0;
    while (r < RAYS - 1 && rays.cumulative[base + r] <= pick) r += 1;
    const next = rays.target[base + r];
    if (next < 0) break;
    if (keep) path.push(Array.from(rays.segments.subarray((base + r) * 4, (base + r) * 4 + 4)));
    state = next;
  }
  return { value, path, found };
}

/**
 * The camera's sub-pixel rays: `samples` evenly spaced rays per pixel, each
 * with the state it sees and its hit point. A pixel's exact value is the
 * mean of x over its rays; a path starts on one of them, chosen uniformly.
 */
export function cameraRays(room, pixels, samples = 16) {
  const result = [];
  for (let j = 0; j < pixels; j += 1) {
    for (let s = 0; s < samples; s += 1) {
      const d = cameraRay(CAMERA, (j + (s + 0.5) / samples) / pixels);
      const hit = castRay(room, CAMERA.position, d);
      if (!hit) throw new Error('A camera ray left the room');
      result.push({ pixel: j, state: stateIndex(hit.patch.index, binOf(angleAt(hit.patch, [-d[0], -d[1]]))), point: hit.point });
    }
  }
  return { pixels, samples, rays: result };
}

/** The exact image (RGB per pixel) of the outgoing state `x`, with the same rays the paths start on. */
export function exactImage(camera, x) {
  const image = new Float64Array(camera.pixels * 3);
  for (const ray of camera.rays) {
    for (let c = 0; c < 3; c += 1) image[ray.pixel * 3 + c] += x[ray.state * 3 + c] / camera.samples;
  }
  return image;
}

/**
 * Path-traced images of the camera: `max` paths per pixel, each pixel with
 * its own seeded stream, so the first n paths are the same for every
 * max ≥ n. Returns the image after each count in `counts` (RGB per pixel,
 * the mean of the first n paths), and the first `keep` paths of every
 * pixel (from the camera, then the walk's rays) with what they carried and
 * where they collected it (`found`, see walk).
 */
export function tracePaths(transport, rays, camera, counts, seed, keep = 4) {
  const max = Math.max(...counts);
  const sums = new Float64Array(camera.pixels * 3);
  const images = new Map();
  const kept = [];
  const randoms = Array.from({ length: camera.pixels }, (_, j) => seededRandom(seed * 7919 + j * 104729 + 1));
  for (let n = 1; n <= max; n += 1) {
    for (let j = 0; j < camera.pixels; j += 1) {
      const random = randoms[j];
      const ray = camera.rays[j * camera.samples + Math.min(camera.samples - 1, Math.floor(random() * camera.samples))];
      const keepThis = n <= keep;
      const { value, path, found } = walk(transport, rays, ray.state, random, keepThis);
      for (let c = 0; c < 3; c += 1) sums[j * 3 + c] += value[c];
      if (keepThis) kept.push({ pixel: j, index: n - 1, value, found, rays: [[...CAMERA.position, ...ray.point], ...path] });
    }
    if (counts.includes(n)) images.set(n, sums.map((sum) => sum / n));
  }
  return { images, kept };
}

/** The root mean square of the luminance error over the pixels, relative to the mean exact luminance. */
export function relativeError(estimate, exact) {
  const lum = (v, j) => 0.2126 * v[j * 3] + 0.7152 * v[j * 3 + 1] + 0.0722 * v[j * 3 + 2];
  const pixels = exact.length / 3;
  let squares = 0;
  let mean = 0;
  for (let j = 0; j < pixels; j += 1) {
    squares += (lum(estimate, j) - lum(exact, j)) ** 2;
    mean += lum(exact, j);
  }
  return Math.sqrt(squares / pixels) / (mean / pixels);
}

/**
 * One random walk over the room's surfaces in continuous position and
 * angle, for drawing a single path (the estimator above walks the discrete
 * states). From `point` on `patch` (room units), each step samples a
 * direction with the flatland cosine density p(θ) = cos θ / 2, so θ =
 * asin(2u − 1), and moves to the first surface on that ray. The walk stops
 * at an emitting patch, when a ray leaves the room, or after `maxSteps`
 * steps. Returns the vertices from `point` on, the patch of each, and
 * whether the last vertex is on an emitter.
 */
export function surfaceWalk(room, point, patch, random, maxSteps = 8) {
  const vertices = [point];
  const patches = [patch];
  let here = point;
  let surface = patch;
  for (let step = 0; step < maxSteps; step += 1) {
    const theta = Math.asin(2 * random() - 1);
    const hit = castRay(room, here, direction(surface, theta), surface.segment);
    if (!hit) break;
    vertices.push(hit.point);
    patches.push(hit.patch);
    if (hit.patch.emission) return { vertices, patches, lit: true };
    here = hit.point;
    surface = hit.patch;
  }
  return { vertices, patches, lit: false };
}
