/**
 * The room lit by light elements: the ceiling split into its patches (19
 * elements, left to right), each a small lamp that can be switched on with
 * any weight, and the room's camera split into 64 pixels. Column k of the
 * light transport matrix T is the room (and the camera's image) lit by
 * element k alone; lighting p gives c = Tp = Σ_k p_k T[:, k].
 *
 * The room is the lamp room with the lamp turned into ordinary white
 * ceiling, so every element is the same. All surfaces are diffuse, so the
 * per-patch solve of diffuse.js applies.
 */
import { BINS, MATERIALS, createRoom } from './scene.js';
import { bounce, buildTransport, solve } from './transport.js';
import { cameraMatrix, diffuseTransport, patchesToState, readPixels, solvePatches } from './diffuse.js';
import { flatlandRoom } from './rooms.js';

/** Pixels of the camera's image on the light transport matrix slides. */
export const MATRIX_PIXELS = 64;

/** Emitted radiance of an element switched fully on, RGB (the lamp's color). */
export const ELEMENT_EMISSION = MATERIALS.light.emission;

let cached = null;

/**
 * The light element room, built once: `room`, `transport`, `diffuse`,
 * the fluence `table` (shared with the lamp room: same geometry),
 * `elements` (the ceiling patches, left to right), `camera` (64 pixels),
 * and per element its light `B[k]` (per patch) and image `images[k]`.
 */
export function lightElementRoom() {
  if (cached) return cached;
  const room = createRoom({ floorFinish: 'diffuse', light: 'lamp' });
  for (const patch of room.patches) {
    if (!patch.emission) continue;
    Object.assign(patch, { material: 'white', albedo: MATERIALS.white.albedo, color: MATERIALS.white.color, emission: null });
  }
  const transport = buildTransport(room);
  const diffuse = diffuseTransport(transport);
  const elements = room.patches.filter((patch) => patch.group === 'ceiling').sort((a, b) => a.center[0] - b.center[0]);
  const camera = cameraMatrix(room, MATRIX_PIXELS);
  const B = elements.map((_, k) => solvePatches(diffuse, elementEmission(diffuse, elements, oneHot(elements.length, k))));
  const images = B.map((light) => readPixels(camera, light, diffuse.n));
  cached = { room, transport, diffuse, table: flatlandRoom('diffuse', 'lamp').table, elements, camera, B, images };
  return cached;
}

/** The pattern with element k on (weight 1) and the rest off. */
export function oneHot(count, k) {
  const p = new Float64Array(count);
  p[k] = 1;
  return p;
}

/** Emission per patch (RGB) of the elements lit with weights `p`. */
export function elementEmission(diffuse, elements, p) {
  const E = new Float64Array(diffuse.n * 3);
  elements.forEach((patch, k) => {
    for (let c = 0; c < 3; c += 1) E[patch.index * 3 + c] = p[k] * ELEMENT_EMISSION[c];
  });
  return E;
}

/** Σ_k p_k v_k for per-element arrays `vectors` (the weighted sum of columns). */
export function weightedSum(vectors, p) {
  const sum = new Float64Array(vectors[0].length);
  vectors.forEach((v, k) => {
    if (p[k] === 0) return;
    for (let i = 0; i < sum.length; i += 1) sum[i] += p[k] * v[i];
  });
  return sum;
}

/**
 * The relighting check: the photo as a weighted sum of the columns of T,
 * against the photo of the room lit by p and solved directly, by the
 * iterative solve of transport.js over the full light field (a different
 * solver from the columns'). Returns both images and their largest
 * difference relative to the brightest pixel.
 */
export function relightingCheck(env, p) {
  const summed = weightedSum(env.images, p);
  const emission = patchesToState(env.room, elementEmission(env.diffuse, env.elements, p));
  const x = solve(emission, (v) => bounce(env.transport, v));
  const perPatch = new Float64Array(env.diffuse.n * 3);
  for (let q = 0; q < env.diffuse.n; q += 1) {
    for (let c = 0; c < 3; c += 1) perPatch[q * 3 + c] = x[q * BINS * 3 + c];
  }
  const direct = readPixels(env.camera, perPatch, env.diffuse.n);
  let difference = 0;
  let largest = 0;
  for (let i = 0; i < summed.length; i += 1) {
    difference = Math.max(difference, Math.abs(summed[i] - direct[i]));
    largest = Math.max(largest, Math.abs(direct[i]));
  }
  return { summed, direct, relative: largest > 0 ? difference / largest : 0 };
}

/** The room's state vector (patch × bin × RGB) under lighting p, for drawing. */
export function roomState(env, p) {
  return patchesToState(env.room, weightedSum(env.B, p));
}
