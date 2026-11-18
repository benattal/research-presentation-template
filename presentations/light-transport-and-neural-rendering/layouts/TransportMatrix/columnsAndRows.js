/**
 * A column and a row of the light transport matrix T = C (I − A)⁻¹ E of
 * the light element room (flatland/lightElements.js), as light in the room.
 *
 * - Column k (one element lit): every camera pixel's ray, from the surface
 *   it sees to the camera, in the color the pixel measures.
 * - Row j (one pixel): the light paths from every element that end at
 *   pixel j. T_jk = Σ_n (C Aⁿ E)_jk sums paths by their number of bounces
 *   n, and a path of n bounces through patches q_0 (the element), q_1, …,
 *   q_n (a patch pixel j sees) contributes
 *
 *     Q[j][q_n] · ρ_{q_n} F[q_n][q_{n−1}] ⋯ ρ_{q_1} F[q_1][q_0] · E_{q_0},
 *
 *   with F, ρ, and the camera matrix Q of the per-patch diffuse solve
 *   (flatland/diffuse.js). The paths up to ROW_BOUNCES bounces are listed
 *   with these weights and drawn as a sample whose density follows them;
 *   summed by element up to n bounces, they are the terms of the row up
 *   to Aⁿ (rowShares), so a row can be shown one term at a time.
 *
 * Positions are room units; drawing is canvas code in stage pixels with the
 * transform drawRoom returns.
 */
import { CAMERA, cameraRay, castRay, pointOn } from '../flatland/scene.js';
import { ELEMENT_EMISSION } from '../flatland/lightElements.js';
import { lightColor } from '../flatland/overlays.js';
import { seededRandom } from '../flatland/pathSamples.js';
import { derived } from '../flatland/pictures.js';
import { rgba } from '../volume/draw.js';

/** Bounces of the longest path a row draws; longer paths count in T_jk but are not drawn. */
export const ROW_BOUNCES = 3;

const luminance = (v, i = 0) => 0.2126 * v[i] + 0.7152 * v[i + 1] + 0.0722 * v[i + 2];

/** Per camera pixel, the point its central ray sees (room units), computed once. */
export function pixelRays(env) {
  return derived(env.B[0], 'pixel-rays', () => Array.from({ length: env.camera.pixels }, (_, j) => {
    const hit = castRay(env.room, CAMERA.position, cameraRay(CAMERA, (j + 0.5) / env.camera.pixels));
    if (!hit) throw new Error(`Camera pixel ${j} sees nothing`);
    return hit.point;
  }));
}

/**
 * Every light path of 0 to ROW_BOUNCES bounces from a light element to
 * pixel j: `{ element, bounces, patches, weight }`, with `patches` the
 * indices q_0 … q_n and `weight` its luminance in pixel j. Summed over the
 * paths of n bounces from element k, the weights are (C Aⁿ E)_jk.
 */
export function rowPathWeights(env, j) {
  return derived(env.B[0], `row-path-weights:${j}`, () => listRowPaths(env, j));
}

function listRowPaths(env, j) {
  const { diffuse, elements, camera, room } = env;
  const { n, F } = diffuse;
  const seen = [];
  for (let p = 0; p < n; p += 1) if (camera.Q[j * n + p] > 0) seen.push(p);
  const paths = [];
  const visit = (element, patches, radiance) => {
    const last = patches.at(-1);
    const share = camera.Q[j * n + last];
    if (share > 0) {
      paths.push({ element, bounces: patches.length - 1, patches, weight: share * luminance(radiance) });
    }
    if (patches.length > ROW_BOUNCES) return;
    // The last bounce only needs the patches pixel j sees; earlier ones may be anywhere.
    const next = patches.length === ROW_BOUNCES ? seen : room.patches.map((patch) => patch.index);
    for (const q of next) {
      const form = F[q * n + last];
      if (form === 0) continue;
      const { albedo } = room.patches[q];
      visit(element, [...patches, q], radiance.map((value, c) => albedo[c] * form * value));
    }
  };
  elements.forEach((patch, k) => visit(k, [patch.index], ELEMENT_EMISSION.slice()));
  return paths;
}

/**
 * Row j of T as luminance, one value per element: with `bounces` n (at
 * most ROW_BOUNCES), the terms up to Aⁿ, (C (I + A + ⋯ + Aⁿ) E)_jk, from
 * the listed paths; with `bounces` null, the whole entry T_jk.
 */
export function rowShares(env, j, bounces) {
  return derived(env.B[0], `row-shares:${j}:${bounces}`, () => {
    if (bounces === null) return env.images.map((image) => luminance(image, j * 3));
    if (!(Number.isInteger(bounces) && bounces >= 0 && bounces <= ROW_BOUNCES)) {
      throw new Error(`A row's bounces must be a whole number up to ${ROW_BOUNCES}, not ${bounces}`);
    }
    const shares = new Array(env.elements.length).fill(0);
    for (const path of rowPathWeights(env, j)) if (path.bounces <= bounces) shares[path.element] += path.weight;
    return shares;
  });
}

/** True when the straight segment a → b (points on segments `from` and `to`) is unblocked and leaves and arrives on the lit sides. */
function connects(room, a, b, from, to) {
  const d = [b[0] - a[0], b[1] - a[1]];
  const length = Math.hypot(d[0], d[1]);
  if (length < 1e-9) return false;
  const u = [d[0] / length, d[1] / length];
  const leaves = u[0] * from.normal[0] + u[1] * from.normal[1];
  const arrives = -(u[0] * to.normal[0] + u[1] * to.normal[1]);
  if (leaves <= 0 || arrives <= 0) return false;
  const hit = castRay(room, a, u, from.segment);
  return Boolean(hit) && Math.abs(hit.distance - length) < 1e-6;
}

/**
 * The paths a row draws: `count` copies spread over the paths of
 * rowPathWeights in proportion to their weights (systematic resampling,
 * seeded, so every render draws the same picture), each copy with its own
 * points along its patches. A copy is `{ element, bounces, points }`, from
 * a point on the element to the point pixel j sees; one whose jittered
 * points are blocked is redrawn, and dropped after a few tries.
 */
export function rowPaths(env, j, count = 420, seed = 7) {
  return derived(env.B[0], `row-paths:${j}:${count}:${seed}`, () => {
    const { room, camera } = env;
    const weighted = rowPathWeights(env, j);
    const total = weighted.reduce((sum, path) => sum + path.weight, 0);
    const random = seededRandom(seed);
    // The points pixel j's sub-pixel rays see, by patch: where its paths can end.
    const ends = new Map();
    for (const ray of camera.rays) {
      if (ray.pixel !== j) continue;
      if (!ends.has(ray.hit.patch.index)) ends.set(ray.hit.patch.index, []);
      ends.get(ray.hit.patch.index).push(ray.hit.point);
    }
    const copies = [];
    let threshold = random() * (total / count);
    let running = 0;
    for (const path of weighted) {
      running += path.weight;
      while (threshold < running) {
        threshold += total / count;
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const candidates = ends.get(path.patches.at(-1));
          const end = candidates[Math.floor(random() * candidates.length)];
          const points = [...path.patches.slice(0, -1).map((q) => pointOn(room.patches[q], 0.04 + 0.92 * random())), end];
          const blocked = points.slice(1).some((point, i) => !connects(
            room, points[i], point, room.patches[path.patches[i]], room.patches[path.patches[i + 1]],
          ));
          if (blocked) continue;
          copies.push({ element: path.element, bounces: path.bounces, points });
          break;
        }
      }
    }
    return copies;
  });
}

/**
 * Column view: each pixel's central ray from the point it sees toward the
 * camera, `progress` of the way (0 to 1), in the color of the pixel's value
 * in `image` (RGB per pixel) at exposure `gain`, as the strip shows it.
 */
export function drawPixelRays(ctx, transform, points, image, gain, progress) {
  if (progress <= 0) return;
  ctx.save();
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  const camera = CAMERA.position;
  points.forEach((point, j) => {
    const end = [point[0] + (camera[0] - point[0]) * progress, point[1] + (camera[1] - point[1]) * progress];
    ctx.strokeStyle = lightColor([image[j * 3], image[j * 3 + 1], image[j * 3 + 2]], gain);
    ctx.beginPath();
    ctx.moveTo(...transform.toCanvas(point));
    ctx.lineTo(...transform.toCanvas(end));
    ctx.stroke();
  });
  ctx.restore();
}

/** The polyline `points` cut at `fraction` of its length. */
function cut(points, fraction) {
  const lengths = points.slice(1).map((point, i) => Math.hypot(point[0] - points[i][0], point[1] - points[i][1]));
  let remaining = fraction * lengths.reduce((sum, value) => sum + value, 0);
  const out = [points[0]];
  for (let i = 0; i < lengths.length; i += 1) {
    if (remaining >= lengths[i]) {
      out.push(points[i + 1]);
      remaining -= lengths[i];
      continue;
    }
    const t = remaining / lengths[i];
    out.push([points[i][0] + t * (points[i + 1][0] - points[i][0]), points[i][1] + t * (points[i + 1][1] - points[i][1])]);
    break;
  }
  return out;
}

/**
 * Row view: the sampled paths (rowPaths), each `reach(path)` of the way
 * from its element (0 to 1), added as light in the color of its bounce
 * count (`colors[bounces]`, byte RGB: emission, then bounce 1, 2, 3).
 */
export function drawRowPaths(ctx, transform, paths, colors, reach) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  for (const path of paths) {
    const fraction = reach(path);
    if (fraction <= 0) continue;
    const drawn = cut(path.points, fraction);
    ctx.strokeStyle = rgba(colors[path.bounces], 0.22);
    ctx.beginPath();
    ctx.moveTo(...transform.toCanvas(drawn[0]));
    for (const point of drawn.slice(1)) ctx.lineTo(...transform.toCanvas(point));
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Row view: a soft glow under each element, in `color` (byte RGB, the
 * emission color), its opacity in proportion to the element's value in
 * `shares` (T_jk along the ceiling, or the terms of it shown so far)
 * relative to `largest` (by default the largest of `shares`).
 */
export function drawElementShares(ctx, transform, elements, shares, color, largest = Math.max(...shares)) {
  if (!(largest > 0)) return;
  const radius = 0.32 * transform.scale;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  elements.forEach((patch, k) => {
    const level = shares[k] / largest;
    const [x, y] = transform.toCanvas([patch.center[0] + 0.06 * patch.normal[0], patch.center[1] + 0.06 * patch.normal[1]]);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, rgba(color, 0.95 * level));
    glow.addColorStop(0.35, rgba(color, 0.5 * level));
    glow.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
  });
  ctx.restore();
}
