/**
 * A projector that shares the camera's pixels (coaxial, as through a beam
 * splitter), lighting the all-diffuse room, and the light transport matrix
 * T between them: camera pixel j reads Σ_k T[j][k] p[k] under projector
 * pattern p.
 *
 * Projector pixel k is a point source at the camera, of radiant intensity
 * `p[k]` (power per radian, 2D) over the pixel's wedge of directions. Its
 * light reaches the surfaces the camera pixel k sees; reflected once, it is
 * the direct light, and transported further (diffuse.js), the indirect
 * light. T splits the same way:
 *
 * - direct, computed at the points the pixel sees: diffuse radiance
 *   (ρ/2) · cos θ / r toward the camera, which only camera pixel k sees
 *   (the projector and camera share rays), so the direct part is diagonal;
 * - indirect, per patch: the projector's light leaving the lit patches
 *   once, E_k, transported by (I − ρF)⁻¹ − I and read by the camera.
 *
 * Values are RGB; a pattern is gray (one intensity per projector pixel).
 */
import { CAMERA } from './scene.js';
import { cameraMatrix, readPixels, solvePatches } from './diffuse.js';

const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/**
 * The coaxial projector–camera system of `pixels` pixels on the diffuse
 * room `diffuse` (diffuse.js): per projector pixel k, the light leaving
 * the patches it lights directly (`emission[k]`, n·3), the direct image
 * (`direct[k]`, RGB of camera pixel k), and the indirect image
 * (`indirect[k]`, RGB per camera pixel). Also the camera matrix.
 */
export function coaxialSystem(diffuse, pixels, samples = 16) {
  const { room } = diffuse.transport;
  const { n } = diffuse;
  const camera = cameraMatrix(room, pixels, samples);
  const subAngle = CAMERA.fov / pixels / samples;
  const emission = Array.from({ length: pixels }, () => new Float64Array(n * 3));
  const direct = Array.from({ length: pixels }, () => new Float64Array(3));
  for (const { pixel, direction, hit } of camera.rays) {
    const { patch, distance } = hit;
    const cos = -(direction[0] * patch.normal[0] + direction[1] * patch.normal[1]);
    for (let c = 0; c < 3; c += 1) {
      emission[pixel][patch.index * 3 + c] += (patch.albedo[c] / 2) * subAngle / patch.length;
      direct[pixel][c] += (patch.albedo[c] / 2) * (cos / distance) / samples;
    }
  }
  const indirect = emission.map((E) => {
    const B = solvePatches(diffuse, E);
    for (let i = 0; i < B.length; i += 1) B[i] -= E[i];
    return readPixels(camera, B, n);
  });
  return { diffuse, pixels, camera, emission, direct, indirect };
}

/** Light leaving the patches, per patch RGB, under pattern `p`: the direct part E and the steady state B. */
export function roomUnderPattern(system, p) {
  const { diffuse, emission } = system;
  const E = new Float64Array(diffuse.n * 3);
  p.forEach((weight, k) => {
    if (weight === 0) return;
    for (let i = 0; i < E.length; i += 1) E[i] += weight * emission[k][i];
  });
  return { E, B: solvePatches(diffuse, E) };
}

/**
 * The photo c = Tp under pattern `p`, RGB per pixel, keeping only the
 * entries of T where `mask(j, k)` is true: with a mask this is the probed
 * photo (T ⊙ Π) p.
 */
export function photo(system, p, mask = null) {
  const { pixels, direct, indirect } = system;
  const image = new Float64Array(pixels * 3);
  for (let k = 0; k < pixels; k += 1) {
    if (p[k] === 0) continue;
    for (let j = 0; j < pixels; j += 1) {
      if (mask && !mask(j, k)) continue;
      for (let c = 0; c < 3; c += 1) image[j * 3 + c] += p[k] * (indirect[k][j * 3 + c] + (j === k ? direct[k][c] : 0));
    }
  }
  return image;
}

/** T as a gray matrix (luminance of each RGB entry), row-major pixels × pixels. */
export function grayMatrix(system) {
  const { pixels, direct, indirect } = system;
  const T = new Float64Array(pixels * pixels);
  for (let j = 0; j < pixels; j += 1) {
    for (let k = 0; k < pixels; k += 1) {
      const i = j * 3;
      T[j * pixels + k] = luminance(indirect[k][i], indirect[k][i + 1], indirect[k][i + 2])
        + (j === k ? luminance(...direct[k]) : 0);
    }
  }
  return T;
}

/** Gray image of an RGB image (luminance per pixel). */
export function grayImage(image) {
  const gray = new Float64Array(image.length / 3);
  for (let j = 0; j < gray.length; j += 1) gray[j] = luminance(image[j * 3], image[j * 3 + 1], image[j * 3 + 2]);
  return gray;
}
