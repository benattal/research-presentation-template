/**
 * The structured-light scene, as a 2D cross-section of a 3D scene: a
 * projector and a camera above a floor, an opaque box, and a translucent
 * blob. Light from the projector falls off as 1/r².
 *
 * The camera ray is rendered with the volume rendering quadrature; each
 * sample is lit by the projector pixel it projects to, P(xᵢ), through the
 * transmittance Tᵖᵢ of the secondary ray from the sample to the projector.
 *
 * Distances in meters, densities in 1/m. Pure functions; the layout draws.
 */

export const PROJECTOR_SCENE = {
  projector: { position: [0.45, 2.35], target: [2.05, 0], halfAngle: (31 * Math.PI) / 180 },
  camera: { position: [3.95, 2.35] },
  box: { x0: 1.32, x1: 1.92, y0: 0, y1: 0.62, density: 40, albedo: 0.75 },
  blob: { center: [2.76, 0.78], radius: 0.42, density: 2.4, albedo: 0.6 },
  floor: { x0: -0.2, x1: 4.7, density: 40, albedo: 0.75 },
  /** Pattern intensity in the dark stripes: projectors leak a little light. */
  darkLevel: 0.05,
};

const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const scale = (p, s) => [p[0] * s, p[1] * s];
const length = (p) => Math.hypot(p[0], p[1]);

export function blobDensity(blob, [x, y]) {
  const r2 = ((x - blob.center[0]) ** 2 + (y - blob.center[1]) ** 2) / blob.radius ** 2;
  return r2 >= 1 ? 0 : blob.density * (1 - r2) ** 2;
}

function insideBox(box, [x, y]) {
  return x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;
}

/** The scene's density and the albedo of what is there, at point `p`. */
export function densityAt(scene, p) {
  if (insideBox(scene.box, p)) return { sigma: scene.box.density, albedo: scene.box.albedo };
  if (p[1] < 0) return { sigma: scene.floor.density, albedo: scene.floor.albedo };
  return { sigma: blobDensity(scene.blob, p), albedo: scene.blob.albedo };
}

/** Length of the segment a → b inside the axis-aligned box (Liang–Barsky clipping). */
function lengthInBox(box, a, b) {
  const d = sub(b, a);
  let enter = 0;
  let leave = 1;
  for (const [p, q] of [[-d[0], a[0] - box.x0], [d[0], box.x1 - a[0]], [-d[1], a[1] - box.y0], [d[1], box.y1 - a[1]]]) {
    if (p === 0) {
      if (q < 0) return 0;
    } else {
      const r = q / p;
      if (p < 0) enter = Math.max(enter, r);
      else leave = Math.min(leave, r);
    }
  }
  return leave > enter ? (leave - enter) * length(d) : 0;
}

/** ∫σ of the blob along a → b, by the midpoint rule; zero when the segment misses it. */
function blobDepth(blob, a, b) {
  const d = sub(b, a);
  const span = length(d);
  const toCenter = sub(blob.center, a);
  const along = Math.max(0, Math.min(span, (toCenter[0] * d[0] + toCenter[1] * d[1]) / span));
  if (length(sub(blob.center, add(a, scale(d, along / span)))) >= blob.radius) return 0;
  const steps = 48;
  let depth = 0;
  for (let k = 0; k < steps; k += 1) depth += blobDensity(blob, add(a, scale(d, (k + 0.5) / steps)));
  return (depth * span) / steps;
}

/**
 * Transmittance from point `p` to the projector: exp(−∫σ) along the
 * secondary ray. The ray starts `offset` meters toward the projector, so a
 * sample inside a surface does not shadow itself; the floor is left out,
 * since nothing above it can be hidden by it.
 */
export function transmittanceToProjector(scene, p, offset = 0) {
  const toProjector = sub(scene.projector.position, p);
  const distance = length(toProjector);
  const start = add(p, scale(toProjector, Math.min(1, offset / distance)));
  const end = scene.projector.position;
  return Math.exp(-(scene.box.density * lengthInBox(scene.box, start, end) + blobDepth(scene.blob, start, end)));
}

/**
 * Where point `p` falls in the projector's image plane, as u = tan(angle
 * off the axis) / tan(half angle): −1 and 1 at the edges of the field of
 * view, beyond them outside it. Null behind the projector.
 */
function imageCoordinate(scene, p) {
  const { position, target, halfAngle } = scene.projector;
  const axis = sub(target, position);
  const ray = sub(p, position);
  const angle = Math.atan2(axis[0] * ray[1] - axis[1] * ray[0], axis[0] * ray[0] + axis[1] * ray[1]);
  if (Math.abs(angle) >= Math.PI / 2) return null;
  return Math.tan(angle) / Math.tan(halfAngle);
}

/**
 * The projector pixel that lights point `p`, as u ∈ [−1, 1] across the
 * projector's image (−1 and 1 at the edges of its field of view), or null
 * outside it.
 */
export function projectorCoordinate(scene, p) {
  const u = imageCoordinate(scene, p);
  return u === null || Math.abs(u) >= 1 ? null : u;
}

/** The stripe pattern: `stripes` bright bands across the projector's image, dark level between. */
export function stripePattern(scene, u, stripes) {
  if (u === null) return 0;
  const phase = (((u + 1) / 2) * stripes) % 1;
  return phase < 0.5 ? 1 : scene.darkLevel;
}

/**
 * The stripe pattern averaged over the image interval [u − width/2,
 * u + width/2] (a box filter), zero outside the image: the antialiased
 * value for a pixel whose footprint spans `width` in u. With width 0 it is
 * `stripePattern` inside the image.
 */
export function filteredStripePattern(scene, u, stripes, width) {
  if (u === null) return 0;
  if (!(width > 0)) return Math.abs(u) < 1 ? stripePattern(scene, u, stripes) : 0;
  const toPhase = (v) => ((v + 1) / 2) * stripes;
  const low = toPhase(u - width / 2);
  const high = toPhase(u + width / 2);
  const a = Math.max(0, low);
  const b = Math.min(stripes, high);
  if (b <= a) return 0;
  // Bright length of the pattern on [0, φ]: half of each whole stripe period, plus the bright start of the last.
  const bright = (phase) => Math.floor(phase) * 0.5 + Math.min(phase - Math.floor(phase), 0.5);
  const lit = bright(b) - bright(a);
  return (lit + scene.darkLevel * (b - a - lit)) / (high - low);
}

/** Light from the projector arriving at `p`, before the surface or medium scatters it: P·Tᵖ/r². */
export function projectorIrradiance(scene, p, stripes, offset = 0) {
  const pattern = stripePattern(scene, projectorCoordinate(scene, p), stripes);
  if (pattern === 0) return 0;
  const r = length(sub(scene.projector.position, p));
  return (pattern * transmittanceToProjector(scene, p, offset)) / (r * r);
}

/**
 * The camera ray toward floor point `[floorX, 0]`, sampled uniformly with
 * `count` samples from 0.4 m to just past the floor. Each sample is
 * `{ point, t, delta, sigma, albedo }`.
 */
export function cameraSamples(scene, floorX, count) {
  const origin = scene.camera.position;
  const toFloor = sub([floorX, 0], origin);
  const far = length(toFloor) + 0.2;
  const direction = scale(toFloor, 1 / length(toFloor));
  const near = 0.4;
  const delta = (far - near) / count;
  return Array.from({ length: count }, (_, i) => {
    const t = near + (i + 0.5) * delta;
    const point = add(origin, scale(direction, t));
    return { point, t, delta, ...densityAt(scene, point) };
  });
}

/**
 * The structured-light quadrature for one camera ray: each sample's
 * Tᵢ αᵢ aᵢ P(xᵢ) Tᵖᵢ / |xᵢ − xₚ|², with Tᵢ and αᵢ as in NeRF. Returns per
 * sample `{ weight: Tᵢαᵢ, pattern, toProjector: Tᵖᵢ, contribution,
 * unshadowed }` (unshadowed sets Tᵖᵢ = 1), and the pixel both ways.
 */
export function structuredLightQuadrature(scene, samples, stripes) {
  let transmittance = 1;
  const terms = samples.map(({ point, sigma, delta, albedo }) => {
    const alpha = 1 - Math.exp(-sigma * delta);
    const weight = transmittance * alpha;
    transmittance *= 1 - alpha;
    const pattern = stripePattern(scene, projectorCoordinate(scene, point), stripes);
    const toProjector = transmittanceToProjector(scene, point, delta);
    const r2 = (point[0] - scene.projector.position[0]) ** 2 + (point[1] - scene.projector.position[1]) ** 2;
    const unshadowed = (weight * albedo * pattern) / r2;
    return { weight, pattern, toProjector, unshadowed, contribution: unshadowed * toProjector };
  });
  return {
    terms,
    pixel: terms.reduce((sum, term) => sum + term.contribution, 0),
    pixelUnshadowed: terms.reduce((sum, term) => sum + term.unshadowed, 0),
  };
}

/**
 * What the projector's light looks like across the panel: for each cell of
 * a `columns` × `rows` grid over `bounds` (meters, y up; row 0 at the top),
 * the light scattered toward the viewer, E·(air + σ_blob·a_blob) with
 * E = P·Tᵖ/r². Opaque cells (box, floor) are 0; surfaces are drawn apart.
 * The pattern is box-filtered over each cell's footprint in the
 * projector's image, so stripe edges are antialiased at any cell size.
 * `air` is a faint scattering coefficient that makes the beams visible.
 */
export function projectorLightImage(scene, stripes, bounds, columns, rows, air = 0.22) {
  const values = new Float32Array(columns * rows);
  const cellWidth = (bounds.x1 - bounds.x0) / columns;
  const cellHeight = (bounds.y1 - bounds.y0) / rows;
  for (let row = 0; row < rows; row += 1) {
    const y = bounds.y1 - ((row + 0.5) / rows) * (bounds.y1 - bounds.y0);
    for (let column = 0; column < columns; column += 1) {
      const x = bounds.x0 + ((column + 0.5) / columns) * (bounds.x1 - bounds.x0);
      const p = [x, y];
      if (y < 0 || insideBox(scene.box, p)) continue;
      const u = imageCoordinate(scene, p);
      const across = imageCoordinate(scene, [x + cellWidth, y]);
      const down = imageCoordinate(scene, [x, y - cellHeight]);
      const footprint = u === null || across === null || down === null ? 0 : Math.abs(across - u) + Math.abs(down - u);
      const pattern = filteredStripePattern(scene, u, stripes, footprint);
      if (pattern === 0) continue;
      const scatter = air + blobDensity(scene.blob, p) * scene.blob.albedo;
      const r = Math.max(0.3, length(sub(scene.projector.position, p)));
      values[row * columns + column] = (scatter * pattern * transmittanceToProjector(scene, p)) / (r * r);
    }
  }
  return values;
}
