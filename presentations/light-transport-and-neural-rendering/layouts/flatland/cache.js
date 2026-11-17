/**
 * A radiance cache in the diffuse flatland room, as an illustration of the
 * idea: a cache x̂ of the light leaving surfaces, fit to what a few views
 * observed, then one bounce from it, x ≈ e + A x̂.
 *
 * The cache here is exact where some view saw the surface and zero where
 * none did (a real cache predicts something arbitrary there). Its error
 * reaches the estimate only through one bounce: (e + A x̂) − x = A (x̂ − x).
 */
import { CAMERA, angleAt, castRay } from './scene.js';
import { bounce, addVectors } from './transport.js';

/**
 * The views that observed the room: positions, the points they look at,
 * and fields of view (radians). Together they see every surface except the
 * box's left face and the floor beside it: behind the box.
 */
export const CACHE_VIEWS = [
  CAMERA,
  { position: [9.5, 0.5], lookAt: [2.6, 6], fov: 1.1 },
  { position: [8.8, 0.4], lookAt: [9.6, 6], fov: 1.2 },
  { position: [6.8, 5.9], lookAt: [2.5, 0], fov: 0.9 },
  { position: [7.2, 5.6], lookAt: [9.6, 0.4], fov: 1.0 },
];

/** Rays per view when finding what it observed. */
const VIEW_RAYS = 600;

/** The ray of `view` at s ∈ [0, 1] across its field of view. */
export function viewRay(view, s) {
  const center = Math.atan2(view.lookAt[1] - view.position[1], view.lookAt[0] - view.position[0]);
  const angle = center + (0.5 - s) * view.fov;
  return [Math.cos(angle), Math.sin(angle)];
}

/** Which patches some view sees (a Uint8Array of 0/1 per patch). */
export function observedPatches(room, views = CACHE_VIEWS) {
  const seen = new Uint8Array(room.patches.length);
  for (const view of views) {
    for (let i = 0; i < VIEW_RAYS; i += 1) {
      const d = viewRay(view, (i + 0.5) / VIEW_RAYS);
      const hit = castRay(room, view.position, d);
      if (hit && Math.abs(angleAt(hit.patch, [-d[0], -d[1]])) < Math.PI / 2) seen[hit.patch.index] = 1;
    }
  }
  return seen;
}

/** The cache: the outgoing state x on observed patches, zero elsewhere. */
export function cacheState(room, x, observed) {
  const cache = new Float64Array(x.length);
  const per = x.length / room.patches.length;
  room.patches.forEach((patch, p) => {
    if (!observed[p]) return;
    for (let i = p * per; i < (p + 1) * per; i += 1) cache[i] = x[i];
  });
  return cache;
}

/** One bounce from the cache, e + A x̂. */
export function oneBounceFromCache(transport, cache) {
  return addVectors(transport.emission, bounce(transport, cache));
}
