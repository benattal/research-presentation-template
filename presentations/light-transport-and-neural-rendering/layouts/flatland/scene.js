/**
 * The flatland room: a 2D cross-section of a Cornell box, the scene every
 * interactive visual of this lecture shares.
 *
 * Flatland obeys the same light transport equations as 3D, with radiance
 * per unit length per radian and 1/r falloff (Jarosz et al. 2012), so what
 * the audience sees here is the real equation, not a cartoon of it.
 *
 * Coordinates: the room spans x ∈ [0, 10], y ∈ [0, 6], y up. A surface is a
 * segment from `a` to `b`; its normal is the left normal of a → b and points
 * into the room. Directions at a surface are angles θ ∈ (−π/2, π/2) from the
 * normal, positive toward the tangent (b − a). The discrete state of the
 * light field is one radiance value (RGB) per patch per direction bin.
 */

/** Direction bins per patch, uniform in angle over the half-circle. */
export const BINS = 16;
export const BIN_WIDTH = Math.PI / BINS;

/** Target patch length, in room units. */
const PATCH_LENGTH = 0.5;

export const ROOM_WIDTH = 10;
export const ROOM_HEIGHT = 6;

/** Albedos (RGB reflectance) and emission of the room's materials. */
export const MATERIALS = {
  white: { albedo: [0.78, 0.77, 0.74], color: '#c9c6bd' },
  red: { albedo: [0.8, 0.2, 0.13], color: '#c8452f' },
  green: { albedo: [0.14, 0.56, 0.42], color: '#2a9d7a' },
  light: { albedo: [0.5, 0.5, 0.5], color: '#fff1c9', emission: [9, 7.4, 5.2] },
  spot: { albedo: [0.5, 0.5, 0.5], color: '#fff1c9', emission: [60, 52, 40] },
};

/**
 * Light sources: a broad lamp in the ceiling, or a spotlight on the left
 * wall sending a narrow beam down to the floor (one direction bin, 50.6°
 * below the horizontal), which shows what a BRDF does to a single beam.
 */
export const LIGHTS = ['lamp', 'spot'];
const SPOT_BIN = 12;

/** How the floor reflects: the one material the audience can change. */
export const FLOOR_FINISHES = ['diffuse', 'glossy', 'mirror'];

/** Surface groups, in the order the operator matrices list them. */
export const GROUPS = ['ceiling', 'left wall', 'floor', 'right wall', 'box'];

function surfaces(floorFinish, light, boxOffset) {
  const [left, right] = [5.6 + boxOffset, 7.6 + boxOffset];
  const floor = { material: 'white', finish: floorFinish };
  const lamp = light === 'lamp';
  return [
    { group: 'ceiling', a: [10, 6], b: [5.8, 6], material: 'white' },
    { group: 'ceiling', a: [5.8, 6], b: [4.2, 6], material: lamp ? 'light' : 'white' },
    { group: 'ceiling', a: [4.2, 6], b: [0, 6], material: 'white' },
    ...(lamp
      ? [{ group: 'left wall', a: [0, 6], b: [0, 0], material: 'red' }]
      : [
        { group: 'left wall', a: [0, 6], b: [0, 4.8], material: 'red' },
        { group: 'left wall', a: [0, 4.8], b: [0, 4.2], material: 'spot', emissionBins: [SPOT_BIN] },
        { group: 'left wall', a: [0, 4.2], b: [0, 0], material: 'red' },
      ]),
    { group: 'floor', a: [0, 0], b: [left, 0], ...floor },
    { group: 'floor', a: [right, 0], b: [10, 0], ...floor },
    { group: 'right wall', a: [10, 0], b: [10, 6], material: 'green' },
    { group: 'box', a: [left, 0], b: [left, 2.2], material: 'white' },
    { group: 'box', a: [left, 2.2], b: [right, 2.2], material: 'white' },
    { group: 'box', a: [right, 2.2], b: [right, 0], material: 'white' },
  ];
}

const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const scale = (p, s) => [p[0] * s, p[1] * s];
const dot = (p, q) => p[0] * q[0] + p[1] * q[1];
const cross = (p, q) => p[0] * q[1] - p[1] * q[0];

/** Angle range [lo, hi] of direction bin `b`, in radians from the normal. */
export function binRange(b) {
  const lo = -Math.PI / 2 + b * BIN_WIDTH;
  return [lo, lo + BIN_WIDTH];
}

export function binCenter(b) {
  return -Math.PI / 2 + (b + 0.5) * BIN_WIDTH;
}

/** The bin containing angle `theta` (radians from the normal). */
export function binOf(theta) {
  return Math.min(BINS - 1, Math.max(0, Math.floor((theta + Math.PI / 2) / BIN_WIDTH)));
}

/**
 * ∫ cos θ dθ over bin `b`: the bin's projected angle. Summed over all bins
 * it is 2, the flatland analog of π for the 3D hemisphere.
 */
export function binCosine(b) {
  const [lo, hi] = binRange(b);
  return Math.sin(hi) - Math.sin(lo);
}

/** The world direction at angle `theta` from a patch's normal. */
export function direction(patch, theta) {
  return add(scale(patch.normal, Math.cos(theta)), scale(patch.tangent, Math.sin(theta)));
}

/** The angle of world direction `d` from a patch's normal. */
export function angleAt(patch, d) {
  return Math.atan2(dot(d, patch.tangent), dot(d, patch.normal));
}

/** The point at parameter u ∈ [0, 1] along a patch. */
export function pointOn(patch, u) {
  return add(patch.a, scale(sub(patch.b, patch.a), u));
}

/**
 * Build the room with the given floor finish and light. Patches are listed
 * group by group (GROUPS order), each surface's patches in order from a to b.
 */
export function createRoom({ floorFinish = 'diffuse', light = 'lamp', boxOffset = 0 } = {}) {
  if (!FLOOR_FINISHES.includes(floorFinish)) throw new Error(`Unknown floor finish "${floorFinish}"`);
  if (!LIGHTS.includes(light)) throw new Error(`Unknown light "${light}"`);
  const segments = [];
  const patches = [];
  for (const surface of surfaces(floorFinish, light, boxOffset)) {
    const edge = sub(surface.b, surface.a);
    const length = Math.hypot(edge[0], edge[1]);
    const tangent = scale(edge, 1 / length);
    const normal = [-tangent[1], tangent[0]];
    const count = Math.max(1, Math.round(length / PATCH_LENGTH));
    const material = MATERIALS[surface.material];
    const segment = { ...surface, length, tangent, normal, firstPatch: patches.length, patchCount: count };
    segments.push(segment);
    for (let i = 0; i < count; i += 1) {
      const a = add(surface.a, scale(edge, i / count));
      const b = add(surface.a, scale(edge, (i + 1) / count));
      patches.push({
        index: patches.length,
        segment: segments.length - 1,
        group: surface.group,
        a,
        b,
        center: scale(add(a, b), 0.5),
        length: length / count,
        tangent,
        normal,
        material: surface.material,
        finish: surface.finish ?? 'diffuse',
        albedo: material.albedo,
        color: material.color,
        emission: material.emission ?? null,
        emissionBins: surface.emissionBins ?? null,
      });
    }
  }
  return { floorFinish, light, boxOffset, segments, patches, size: patches.length * BINS };
}

/**
 * The first surface a ray from `origin` along unit direction `d` hits, or
 * null if it leaves the room. Returns the patch, the hit point, and the
 * distance. `skipSegment` excludes the surface the ray starts on.
 */
export function castRay(room, origin, d, skipSegment = -1) {
  let best = null;
  room.segments.forEach((segment, index) => {
    if (index === skipSegment) return;
    const edge = sub(segment.b, segment.a);
    const denominator = cross(d, edge);
    if (Math.abs(denominator) < 1e-12) return;
    const offset = sub(segment.a, origin);
    const distance = cross(offset, edge) / denominator;
    const u = cross(offset, d) / denominator;
    if (distance <= 1e-9 || u < 0 || u > 1) return;
    if (!best || distance < best.distance) best = { segment: index, u, distance };
  });
  if (!best) return null;
  const segment = room.segments[best.segment];
  const patchIndex = segment.firstPatch + Math.min(segment.patchCount - 1, Math.floor(best.u * segment.patchCount));
  return {
    patch: room.patches[patchIndex],
    point: add(origin, scale(d, best.distance)),
    distance: best.distance,
  };
}

/** Index of (patch, bin) in a state vector (before the ×3 for RGB). */
export function stateIndex(patchIndex, bin) {
  return patchIndex * BINS + bin;
}

/**
 * The camera of the 1D images: a pinhole in the upper right of the room,
 * looking down and left, with `pixels` pixels across `fov` radians.
 */
export const CAMERA = { position: [9.35, 4.7], lookAt: [2.4, 1.2], fov: 1.45, pixels: 160 };

/** The direction of the ray through pixel coordinate s ∈ [0, 1] (left to right). */
export function cameraRay(camera, s) {
  const forward = sub(camera.lookAt, camera.position);
  const center = Math.atan2(forward[1], forward[0]);
  const angle = center + (0.5 - s) * camera.fov;
  return [Math.cos(angle), Math.sin(angle)];
}
