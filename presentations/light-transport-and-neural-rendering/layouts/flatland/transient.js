/**
 * Transient light transport in the all-diffuse flatland room: the light
 * leaving each patch as a function of time after the lamp flashes a short
 * pulse, by bounce order, and what one camera pixel records over time.
 *
 * Time is path length (c = 1), in room units, binned in `step`s. Each
 * propagation entry of transport.js carries the mean length of its rays;
 * here it delays the light by that length (rounded to whole bins, at least
 * one). Per patch, the light of bounce order k at time t is
 *
 *   B_k(t)[q] = ρ_q Σ_p F_qp(τ) B_{k−1}(t − τ)[p],
 *
 * so the sum over time of every order is the steady state of diffuse.js
 * (the pulse carries the lamp's emission for one unit of time).
 */
import { BINS, binCosine } from './scene.js';

/** Bounce orders kept apart: emission, then bounces 1 … ORDERS − 2, then all later ones together. */
export const ORDERS = 5;

/**
 * The delayed form factors: for each receiving patch q, a list of
 * (source patch, delay in bins, weight), with weights summing to F_qp.
 */
export function delayedFormFactors(transport, step) {
  const { room, propagation } = transport;
  const { rowStart, columns, values, distances } = propagation;
  const n = room.patches.length;
  const byKey = new Map();
  for (let q = 0; q < n; q += 1) {
    for (let bin = 0; bin < BINS; bin += 1) {
      const row = q * BINS + bin;
      const w = binCosine(bin) / 2;
      for (let k = rowStart[row]; k < rowStart[row + 1]; k += 1) {
        const p = Math.floor(columns[k] / BINS);
        const delay = Math.max(1, Math.round(distances[k] / step));
        const key = (q * n + p) * 4096 + delay;
        byKey.set(key, (byKey.get(key) ?? 0) + w * values[k]);
      }
    }
  }
  const entries = [...byKey.entries()].sort((a, b) => a[0] - b[0]);
  return {
    n,
    receiver: Int32Array.from(entries, ([key]) => Math.floor(Math.floor(key / 4096) / n)),
    source: Int32Array.from(entries, ([key]) => Math.floor(key / 4096) % n),
    delay: Int32Array.from(entries, ([key]) => key % 4096),
    weight: Float64Array.from(entries, ([, w]) => w),
  };
}

/**
 * Solve for the light leaving every patch over time, `bins` time bins of
 * `step` room units, after a pulse of the emission E (per patch RGB,
 * emitted over the first `pulseBins` bins with total weight 1). Returns
 * `orders[k]` (Float64Array of bins × n × 3, the light of bounce order k,
 * the last holding every later order) and `total`, their sum.
 */
export function solveTransient(transport, E, { step, bins, pulseBins = 1 }) {
  const { patches } = transport.room;
  const delayed = delayedFormFactors(transport, step);
  const { n, receiver, source, delay, weight } = delayed;
  const stride = n * 3;
  const orders = Array.from({ length: ORDERS }, () => new Float64Array(bins * stride));
  for (let t = 0; t < pulseBins; t += 1) {
    for (let i = 0; i < stride; i += 1) orders[0][t * stride + i] = E[i] / pulseBins;
  }
  const albedo = Float64Array.from(patches.flatMap((patch) => patch.albedo));
  for (let t = 1; t < bins; t += 1) {
    for (let k = 1; k < ORDERS; k += 1) {
      const into = orders[k];
      const from = orders[k - 1];
      const last = k === ORDERS - 1;
      for (let e = 0; e < weight.length; e += 1) {
        const ts = t - delay[e];
        if (ts < 0) continue;
        const w = weight[e];
        const q = receiver[e] * 3;
        const p = ts * stride + source[e] * 3;
        const o = t * stride + q;
        for (let c = 0; c < 3; c += 1) {
          into[o + c] += albedo[q + c] * w * (from[p + c] + (last ? into[p + c] : 0));
        }
      }
    }
  }
  const total = new Float64Array(bins * stride);
  for (const order of orders) for (let i = 0; i < total.length; i += 1) total[i] += order[i];
  return { step, bins, n, orders, total };
}

/**
 * What one camera pixel records over time: for each bounce order, the
 * light arriving at the camera per time bin (RGB), from the pixel's rays
 * (`rays`: { patch index, distance to the camera }, equally weighted).
 */
export function pixelTransient(transient, rays) {
  const { step, bins, n, orders } = transient;
  const stride = n * 3;
  return orders.map((order) => {
    const histogram = new Float64Array(bins * 3);
    for (const ray of rays) {
      const delay = Math.round(ray.distance / step);
      for (let t = delay; t < bins; t += 1) {
        for (let c = 0; c < 3; c += 1) histogram[t * 3 + c] += order[(t - delay) * stride + ray.patch * 3 + c] / rays.length;
      }
    }
    return histogram;
  });
}

/**
 * The light in flight at time `time` (room units): fluence at every grid
 * point of the fluence table, each ray carrying what its source patch
 * emitted when the light now at the grid point left it.
 */
export function fluenceInFlight(table, transient, time) {
  const { width, height, directions, states, distances } = table;
  const { step, bins, n, total } = transient;
  const stride = n * 3;
  const result = new Float32Array(width * height * 3);
  const dw = (2 * Math.PI) / directions;
  for (let cell = 0; cell < width * height; cell += 1) {
    let r = 0;
    let g = 0;
    let b = 0;
    const base = cell * directions;
    for (let k = 0; k < directions; k += 1) {
      const s = states[base + k];
      if (s === 0xffff) continue;
      const t = Math.floor((time - distances[base + k]) / step);
      if (t < 0 || t >= bins) continue;
      const i = t * stride + Math.floor(s / BINS) * 3;
      r += total[i];
      g += total[i + 1];
      b += total[i + 2];
    }
    result[cell * 3] = (r * dw) / step;
    result[cell * 3 + 1] = (g * dw) / step;
    result[cell * 3 + 2] = (b * dw) / step;
  }
  return result;
}

/** The light leaving each patch (RGB per patch) in the time bin containing `time`. */
export function patchesAt(transient, time) {
  const { step, bins, n, total } = transient;
  const t = Math.floor(time / step);
  if (t < 0 || t >= bins) return new Float64Array(n * 3);
  return total.slice(t * n * 3, (t + 1) * n * 3).map((value) => value / step);
}
