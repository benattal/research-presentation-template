/**
 * Light transport in the all-diffuse flatland room, per patch.
 *
 * When every surface is diffuse and the emission is the same in every
 * direction bin, the outgoing radiance of a patch is the same in every bin,
 * so the state vector of transport.js collapses to one RGB value per patch
 * (its radiosity B, here in radiance units). One bounce becomes
 * B ← ρ ⊙ F B, with F the form factors read off the propagation operator:
 *
 *   F[q][p] = ½ Σ_in binCosine(in) Σ_b G[(q, in), (p, b)],
 *
 * and the steady state is B = (I − diag(ρ) F)⁻¹ E, a 71 × 71 inverse per
 * channel, computed once. The result equals the solve of transport.js
 * (tests/flatland.test.mjs checks it); it only makes the hundreds of
 * solves of the light transport matrix slides cheap.
 */
import { BINS, CAMERA, binCosine, castRay, cameraRay } from './scene.js';

/** Form factors F (n × n, row-major): F[q·n + p] is the share of q's incident light that left p. */
export function formFactors(transport) {
  const { room, propagation } = transport;
  const { rowStart, columns, values } = propagation;
  const n = room.patches.length;
  const F = new Float64Array(n * n);
  for (let q = 0; q < n; q += 1) {
    for (let bin = 0; bin < BINS; bin += 1) {
      const row = q * BINS + bin;
      const w = binCosine(bin) / 2;
      for (let k = rowStart[row]; k < rowStart[row + 1]; k += 1) {
        F[q * n + Math.floor(columns[k] / BINS)] += w * values[k];
      }
    }
  }
  return F;
}

/** The inverse of the n × n matrix `M` (row-major), by Gauss–Jordan elimination with partial pivoting. */
export function invert(M, n) {
  const a = Float64Array.from(M);
  const inverse = new Float64Array(n * n);
  for (let i = 0; i < n; i += 1) inverse[i * n + i] = 1;
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < n; r += 1) if (Math.abs(a[r * n + col]) > Math.abs(a[pivot * n + col])) pivot = r;
    if (Math.abs(a[pivot * n + col]) < 1e-14) throw new Error('Matrix is singular');
    if (pivot !== col) {
      for (let c = 0; c < n; c += 1) {
        [a[col * n + c], a[pivot * n + c]] = [a[pivot * n + c], a[col * n + c]];
        [inverse[col * n + c], inverse[pivot * n + c]] = [inverse[pivot * n + c], inverse[col * n + c]];
      }
    }
    const scale = 1 / a[col * n + col];
    for (let c = 0; c < n; c += 1) {
      a[col * n + c] *= scale;
      inverse[col * n + c] *= scale;
    }
    for (let r = 0; r < n; r += 1) {
      const factor = a[r * n + col];
      if (r === col || factor === 0) continue;
      for (let c = 0; c < n; c += 1) {
        a[r * n + c] -= factor * a[col * n + c];
        inverse[r * n + c] -= factor * inverse[col * n + c];
      }
    }
  }
  return inverse;
}

/**
 * The diffuse room's per-patch transport: `F`, the albedos, and the
 * steady-state operator per channel, M_c = (I − ρ_c F)⁻¹. Throws when a
 * surface is not diffuse (the reduction would be wrong).
 */
export function diffuseTransport(transport) {
  const { patches } = transport.room;
  if (patches.some((patch) => patch.finish !== 'diffuse')) throw new Error('The per-patch solve needs an all-diffuse room');
  const n = patches.length;
  const F = formFactors(transport);
  const inverses = [0, 1, 2].map((c) => {
    const M = new Float64Array(n * n);
    for (let q = 0; q < n; q += 1) {
      const rho = patches[q].albedo[c];
      for (let p = 0; p < n; p += 1) M[q * n + p] = (q === p ? 1 : 0) - rho * F[q * n + p];
    }
    return invert(M, n);
  });
  return { transport, n, F, inverses };
}

/** One bounce per patch, ρ ⊙ F B, for RGB per patch (length n·3). */
export function bouncePatches(diffuse, B) {
  const { n, F, transport } = diffuse;
  const out = new Float64Array(n * 3);
  for (let q = 0; q < n; q += 1) {
    const { albedo } = transport.room.patches[q];
    for (let c = 0; c < 3; c += 1) {
      let sum = 0;
      for (let p = 0; p < n; p += 1) sum += F[q * n + p] * B[p * 3 + c];
      out[q * 3 + c] = albedo[c] * sum;
    }
  }
  return out;
}

/** The steady state B = (I − ρF)⁻¹ E per patch, RGB per patch. */
export function solvePatches(diffuse, E) {
  const { n, inverses } = diffuse;
  const B = new Float64Array(n * 3);
  for (let c = 0; c < 3; c += 1) {
    const inverse = inverses[c];
    for (let q = 0; q < n; q += 1) {
      let sum = 0;
      for (let p = 0; p < n; p += 1) sum += inverse[q * n + p] * E[p * 3 + c];
      B[q * 3 + c] = sum;
    }
  }
  return B;
}

/** The full state vector (patch × bin × RGB) of per-patch outgoing radiance, the same in every bin. */
export function patchesToState(room, B) {
  const state = new Float64Array(room.size * 3);
  for (let p = 0; p < room.patches.length; p += 1) {
    for (let bin = 0; bin < BINS; bin += 1) {
      for (let c = 0; c < 3; c += 1) state[(p * BINS + bin) * 3 + c] = B[p * 3 + c];
    }
  }
  return state;
}

/**
 * The camera as a matrix over patches: Q[j·n + p] is the share of pixel
 * j's rays that see patch p (`samples` rays per pixel, evenly spaced), so
 * pixel j reads Σ_p Q[j][p] B[p] of a diffuse light field. Also returns
 * each ray's hit, for drawing and for time of flight.
 */
export function cameraMatrix(room, pixels, samples = 16, camera = CAMERA) {
  const n = room.patches.length;
  const Q = new Float64Array(pixels * n);
  const rays = [];
  for (let j = 0; j < pixels; j += 1) {
    for (let s = 0; s < samples; s += 1) {
      const d = cameraRay(camera, (j + (s + 0.5) / samples) / pixels);
      const hit = castRay(room, camera.position, d);
      if (!hit) continue;
      Q[j * n + hit.patch.index] += 1 / samples;
      rays.push({ pixel: j, direction: d, hit });
    }
  }
  return { pixels, samples, Q, rays };
}

/** What each pixel reads, RGB per pixel, from per-patch radiance B. */
export function readPixels(camera, B, n) {
  const { pixels, Q } = camera;
  const image = new Float64Array(pixels * 3);
  for (let j = 0; j < pixels; j += 1) {
    for (let p = 0; p < n; p += 1) {
      const w = Q[j * n + p];
      if (w === 0) continue;
      for (let c = 0; c < 3; c += 1) image[j * 3 + c] += w * B[p * 3 + c];
    }
  }
  return image;
}
