/**
 * The scene of the continuous-wave time-of-flight slide, as a 2D
 * cross-section of a 3D scene: a camera with a light source beside it at
 * the origin, one pixel looking along +x at a wall, and a horizontal mirror
 * below the ray that sends part of the source's light to the same wall point
 * by a longer path.
 *
 * Distances in meters, frequencies in hertz, amplitudes in units of the
 * source's intensity. Pure functions; the layout draws the result.
 */
import { pathPhase, roundTripPhase } from '../activeSensing/measurement.js';

export const PHASOR_SCENE = {
  wall: { depth: 2, albedo: 0.8, bottom: -1.6, top: 1.05 },
  mirror: { center: [1, -1], halfLength: 0.55, reflectance: 0.9 },
  /** Where the mirror may be dragged: below the ray, in front of the wall. */
  mirrorRange: { x0: 0.35, x1: 1.65, y0: -1.12, y1: -0.25 },
};

/** The return straight from the wall point: amplitude ρ/d² (ρ the wall's albedo), phase 4πfd/c. */
export function directReturn(scene, frequency) {
  const { depth, albedo } = scene.wall;
  return { amplitude: albedo / depth ** 2, phase: roundTripPhase(depth, frequency), length: 2 * depth };
}

/**
 * The return by way of the mirror centered at `mirrorCenter`: light leaves
 * the source, reflects off the mirror at point Q, lights the wall point, and
 * returns to the camera along the pixel's ray. The mirror acts as a second
 * source at the camera's reflection C′ with intensity ρ, so the wall point
 * receives ρ·cosθ/|C′P|² and the path is |C′P| + d long.
 *
 * Returns `{ amplitude, phase, length, point }`, or null when the specular
 * point falls off the mirror.
 */
export function mirrorReturn(scene, mirrorCenter, frequency) {
  const { depth, albedo } = scene.wall;
  const { halfLength, reflectance } = scene.mirror;
  const [mx, my] = mirrorCenter;
  if (my >= 0) throw new Error('The mirror must lie below the camera ray');
  // The camera's image in the mirror line y = my is (0, 2my); the segment from
  // it to the wall point (d, 0) crosses the mirror line halfway, at x = d/2.
  const point = [depth / 2, my];
  if (Math.abs(point[0] - mx) > halfLength) return null;
  const toWall = Math.hypot(depth, 2 * my);
  const cosine = depth / toWall;
  return {
    amplitude: (reflectance * albedo * cosine) / toWall ** 2,
    phase: pathPhase(toWall + depth, frequency),
    length: toWall + depth,
    point,
  };
}

/** Keep a dragged mirror center inside `scene.mirrorRange`. */
export function clampMirror(scene, [x, y]) {
  const { x0, x1, y0, y1 } = scene.mirrorRange;
  return [Math.min(x1, Math.max(x0, x)), Math.min(y1, Math.max(y0, y))];
}
