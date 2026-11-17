/**
 * Light transport operators of the flatland room, as explicit sparse
 * matrices over the discrete light field (patch × direction bin × RGB).
 *
 * Two kinds of state vector, each of length `room.size * 3`, RGB
 * interleaved, indexed by `stateIndex(patch, bin) * 3 + channel`:
 *
 * - outgoing radiance: light leaving patch p in direction bin b;
 * - incident radiance: light arriving at patch q from direction bin b
 *   (the bin names the direction the light comes from).
 *
 * Propagation G takes outgoing radiance to incident radiance (radiance is
 * constant along a ray; G only re-labels it at the surface it lands on).
 * Scattering S takes incident radiance to outgoing radiance at each patch,
 * through the BRDF and the cosine. One bounce is A = SG, emission e is
 * outgoing radiance, and the steady state is x = e + Ax.
 *
 * The adjoint (importance) runs the same machine transposed:
 * Aᵀ = GᵀSᵀ, with q the sensor's response to outgoing radiance.
 */
import {
  BINS, BIN_WIDTH, CAMERA, ROOM_HEIGHT, ROOM_WIDTH, angleAt, binCenter, binCosine, binOf, binRange,
  cameraRay, castRay, direction, pointOn, stateIndex,
} from './scene.js';

/** Sub-rays per (patch, bin) when building G: positions × angles. */
const SUB_POSITIONS = 6;
const SUB_ANGLES = 6;

/** Width (radians) of the glossy floor's lobe around the mirror direction. */
const GLOSSY_LOBE = 0.22;

function negate(d) {
  return [-d[0], -d[1]];
}

function buildPropagation(room) {
  const rowStart = new Int32Array(room.size + 1);
  const columns = [];
  const values = [];
  const distances = [];
  for (const patch of room.patches) {
    for (let bin = 0; bin < BINS; bin += 1) {
      const [lo, hi] = binRange(bin);
      const gathered = new Map();
      let total = 0;
      for (let i = 0; i < SUB_POSITIONS; i += 1) {
        const origin = pointOn(patch, (i + 0.5) / SUB_POSITIONS);
        for (let j = 0; j < SUB_ANGLES; j += 1) {
          const theta = lo + ((j + 0.5) / SUB_ANGLES) * (hi - lo);
          const weight = Math.cos(theta);
          total += weight;
          const d = direction(patch, theta);
          const hit = castRay(room, origin, d, patch.segment);
          if (!hit) continue;
          const back = negate(d);
          if (back[0] * hit.patch.normal[0] + back[1] * hit.patch.normal[1] <= 0) continue;
          const column = stateIndex(hit.patch.index, binOf(angleAt(hit.patch, back)));
          const entry = gathered.get(column) ?? { weight: 0, distance: 0 };
          entry.weight += weight;
          entry.distance += weight * hit.distance;
          gathered.set(column, entry);
        }
      }
      for (const [column, entry] of gathered) {
        columns.push(column);
        values.push(entry.weight / total);
        distances.push(entry.distance / entry.weight);
      }
      rowStart[stateIndex(patch.index, bin) + 1] = columns.length;
    }
  }
  return {
    rowStart,
    columns: Int32Array.from(columns),
    values: Float64Array.from(values),
    distances: Float64Array.from(distances),
  };
}

/**
 * One patch's scattering block for one channel: block[out * BINS + in] is
 * the outgoing radiance in bin `out` per unit incident radiance in bin `in`.
 * Each is energy conserving: reflected flux = albedo × incident flux.
 */
function scatterBlock(patch, channel) {
  const albedo = patch.albedo[channel];
  const block = new Float64Array(BINS * BINS);
  for (let incoming = 0; incoming < BINS; incoming += 1) {
    const projected = binCosine(incoming);
    const mirror = BINS - 1 - incoming;
    if (patch.finish === 'diffuse') {
      for (let out = 0; out < BINS; out += 1) block[out * BINS + incoming] = (albedo / 2) * projected;
    } else if (patch.finish === 'mirror') {
      block[mirror * BINS + incoming] = albedo;
    } else {
      const lobe = Array.from({ length: BINS }, (_, out) => Math.exp(-((binCenter(out) - binCenter(mirror)) ** 2) / (2 * GLOSSY_LOBE ** 2)));
      const norm = lobe.reduce((sum, w, out) => sum + w * binCosine(out), 0);
      for (let out = 0; out < BINS; out += 1) block[out * BINS + incoming] = (albedo * projected * lobe[out]) / norm;
    }
  }
  return block;
}

/** Build every operator of `room`. Takes tens of milliseconds; memoize it. */
export function buildTransport(room) {
  const scatter = new Float64Array(room.patches.length * 3 * BINS * BINS);
  room.patches.forEach((patch, p) => {
    for (let c = 0; c < 3; c += 1) scatter.set(scatterBlock(patch, c), (p * 3 + c) * BINS * BINS);
  });
  const emission = new Float64Array(room.size * 3);
  for (const patch of room.patches) {
    if (!patch.emission) continue;
    for (let bin = 0; bin < BINS; bin += 1) {
      if (patch.emissionBins && !patch.emissionBins.includes(bin)) continue;
      for (let c = 0; c < 3; c += 1) emission[stateIndex(patch.index, bin) * 3 + c] = patch.emission[c];
    }
  }
  return { room, propagation: buildPropagation(room), scatter, emission };
}

/**
 * Propagation G: incident = G · outgoing. With `maxDistance`, only light
 * that has travelled at most that far has arrived (light in flight).
 */
export function propagate(transport, outgoing, maxDistance = Infinity) {
  const { rowStart, columns, values, distances } = transport.propagation;
  const incident = new Float64Array(outgoing.length);
  for (let row = 0; row < rowStart.length - 1; row += 1) {
    let r = 0;
    let g = 0;
    let b = 0;
    for (let k = rowStart[row]; k < rowStart[row + 1]; k += 1) {
      if (distances[k] > maxDistance) continue;
      const w = values[k];
      const c = columns[k] * 3;
      r += w * outgoing[c];
      g += w * outgoing[c + 1];
      b += w * outgoing[c + 2];
    }
    incident[row * 3] = r;
    incident[row * 3 + 1] = g;
    incident[row * 3 + 2] = b;
  }
  return incident;
}

/** Gᵀ: the adjoint of propagation, from incident-side importance to outgoing-side importance. */
export function propagateAdjoint(transport, incidentImportance) {
  const { rowStart, columns, values } = transport.propagation;
  const out = new Float64Array(incidentImportance.length);
  for (let row = 0; row < rowStart.length - 1; row += 1) {
    for (let k = rowStart[row]; k < rowStart[row + 1]; k += 1) {
      const w = values[k];
      const c = columns[k] * 3;
      for (let ch = 0; ch < 3; ch += 1) out[c + ch] += w * incidentImportance[row * 3 + ch];
    }
  }
  return out;
}

function applyScatter(transport, input, transpose) {
  const { room, scatter } = transport;
  const output = new Float64Array(input.length);
  for (let p = 0; p < room.patches.length; p += 1) {
    for (let c = 0; c < 3; c += 1) {
      const offset = (p * 3 + c) * BINS * BINS;
      for (let out = 0; out < BINS; out += 1) {
        let sum = 0;
        for (let inc = 0; inc < BINS; inc += 1) {
          const entry = transpose ? scatter[offset + inc * BINS + out] : scatter[offset + out * BINS + inc];
          sum += entry * input[(p * BINS + inc) * 3 + c];
        }
        output[(p * BINS + out) * 3 + c] = sum;
      }
    }
  }
  return output;
}

/** Scattering S: outgoing = S · incident, patch by patch. */
export function scatter(transport, incident) {
  return applyScatter(transport, incident, false);
}

/** Sᵀ: the adjoint of scattering. */
export function scatterAdjoint(transport, importance) {
  return applyScatter(transport, importance, true);
}

/** One bounce, A = SG. */
export function bounce(transport, outgoing) {
  return scatter(transport, propagate(transport, outgoing));
}

/** One adjoint bounce, Aᵀ = GᵀSᵀ. */
export function bounceAdjoint(transport, importance) {
  return propagateAdjoint(transport, scatterAdjoint(transport, importance));
}

export function addVectors(a, b) {
  return a.map((value, i) => value + b[i]);
}

/** The terms v, Av, A²v, …, A^(count−1)v of the Neumann series, with `step` as A. */
export function seriesTerms(v, count, step) {
  const terms = [v];
  while (terms.length < count) terms.push(step(terms.at(-1)));
  return terms;
}

/**
 * The steady state x = (I − A)⁻¹v, by iterating x ← v + Ax until the
 * update is below `tolerance` relative to x. Converges because every
 * albedo is below one.
 */
export function solve(v, step, tolerance = 1e-10) {
  let x = v;
  for (let iteration = 1; iteration <= 10000; iteration += 1) {
    const next = addVectors(v, step(x));
    let change = 0;
    let size = 0;
    for (let i = 0; i < next.length; i += 1) {
      change = Math.max(change, Math.abs(next[i] - x[i]));
      size = Math.max(size, Math.abs(next[i]));
    }
    x = next;
    if (change <= tolerance * size) return x;
  }
  throw new Error('Light transport did not converge');
}

/** Total flux of an outgoing radiance vector (luminance), for energy per bounce. */
export function outgoingFlux(transport, outgoing) {
  let flux = 0;
  for (const patch of transport.room.patches) {
    for (let bin = 0; bin < BINS; bin += 1) {
      const i = stateIndex(patch.index, bin) * 3;
      const luminance = 0.2126 * outgoing[i] + 0.7152 * outgoing[i + 1] + 0.0722 * outgoing[i + 2];
      flux += luminance * binCosine(bin) * patch.length;
    }
  }
  return flux;
}

/**
 * Radiosity per patch, RGB: ½ ∫ L cos θ dθ over the half-circle. For an
 * outgoing state it is what leaves the patch; for an incident state, half
 * the irradiance (what a white diffuse patch would send back).
 */
export function patchRadiosity(transport, state) {
  const { patches } = transport.room;
  const result = new Float64Array(patches.length * 3);
  for (const patch of patches) {
    for (let bin = 0; bin < BINS; bin += 1) {
      const i = stateIndex(patch.index, bin) * 3;
      const w = binCosine(bin) / 2;
      for (let c = 0; c < 3; c += 1) result[patch.index * 3 + c] += w * state[i + c];
    }
  }
  return result;
}

/**
 * The sensor q of a camera pixel spanning image coordinates [s0, s1]:
 * its response to outgoing radiance, so that the pixel reads qᵀx.
 */
export function pixelResponse(transport, s0, s1, samples = 64) {
  const q = new Float64Array(transport.room.size * 3);
  for (let i = 0; i < samples; i += 1) {
    const s = s0 + ((i + 0.5) / samples) * (s1 - s0);
    const d = cameraRay(CAMERA, s);
    const hit = castRay(transport.room, CAMERA.position, d);
    if (!hit) continue;
    const index = stateIndex(hit.patch.index, binOf(angleAt(hit.patch, negate(d)))) * 3;
    for (let c = 0; c < 3; c += 1) q[index + c] += 1 / samples;
  }
  return q;
}

/** What the camera's pixels read, RGB per pixel, from an outgoing state. */
export function cameraImage(transport, outgoing, pixels = CAMERA.pixels, samples = 3) {
  const image = new Float64Array(pixels * 3);
  for (let px = 0; px < pixels; px += 1) {
    for (let k = 0; k < samples; k += 1) {
      const d = cameraRay(CAMERA, (px + (k + 0.5) / samples) / pixels);
      const hit = castRay(transport.room, CAMERA.position, d);
      if (!hit) continue;
      const index = stateIndex(hit.patch.index, binOf(angleAt(hit.patch, negate(d)))) * 3;
      for (let c = 0; c < 3; c += 1) image[px * 3 + c] += outgoing[index + c] / samples;
    }
  }
  return image;
}

/** A small deterministic hash in [0, 1), for per-cell jitter. */
function hash(i, j) {
  const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

/**
 * The fluence table: for a grid of points in the room, the ray state seen
 * in each of `directions` directions, and how far away it is. With it, the
 * light in the room for any state vector is a weighted gather (`fluence`).
 * Points inside the box are marked solid.
 */
export function buildFluenceTable(room, { width = 160, height = 96, directions = 192 } = {}) {
  const count = width * height * directions;
  const states = new Uint16Array(count).fill(0xffff);
  const distances = new Float32Array(count);
  const solid = new Uint8Array(width * height);
  const segments = room.segments.map((s) => ({ ax: s.a[0], ay: s.a[1], ex: s.b[0] - s.a[0], ey: s.b[1] - s.a[1], s }));
  for (let j = 0; j < height; j += 1) {
    for (let i = 0; i < width; i += 1) {
      const ox = ((i + 0.5) / width) * ROOM_WIDTH;
      const oy = ROOM_HEIGHT - ((j + 0.5) / height) * ROOM_HEIGHT;
      const rotation = (hash(i, j) * 2 * Math.PI) / directions;
      let backfaces = 0;
      for (let k = 0; k < directions; k += 1) {
        const angle = rotation + (k * 2 * Math.PI) / directions;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        let best = Infinity;
        let bestSegment = null;
        let bestU = 0;
        for (const seg of segments) {
          const denominator = dx * seg.ey - dy * seg.ex;
          if (Math.abs(denominator) < 1e-12) continue;
          const px = seg.ax - ox;
          const py = seg.ay - oy;
          const t = (px * seg.ey - py * seg.ex) / denominator;
          const u = (px * dy - py * dx) / denominator;
          if (t > 1e-9 && u >= 0 && u <= 1 && t < best) {
            best = t;
            bestSegment = seg.s;
            bestU = u;
          }
        }
        if (!bestSegment) continue;
        const facing = -dx * bestSegment.normal[0] - dy * bestSegment.normal[1];
        if (facing <= 0) {
          backfaces += 1;
          continue;
        }
        const patch = room.patches[bestSegment.firstPatch + Math.min(bestSegment.patchCount - 1, Math.floor(bestU * bestSegment.patchCount))];
        const sample = (j * width + i) * directions + k;
        states[sample] = stateIndex(patch.index, binOf(angleAt(patch, [-dx, -dy])));
        distances[sample] = best;
      }
      if (backfaces > directions / 2) solid[j * width + i] = 1;
    }
  }
  return { width, height, directions, states, distances, solid };
}

/**
 * Fluence (∫ L dω, RGB) at every grid point for a state vector of rays
 * (indexed by the outgoing state at each ray's source end).
 *
 * With a finite `maxDistance`, only the part of each ray within that
 * distance of one end counts, feathered over `feather` room units: light
 * in flight. `from: 'source'` measures from the surface the light leaves
 * (light travelling forward); `from: 'destination'` from the surface it
 * reaches (importance travelling backward). With `pulse: { width, trail }`,
 * light more than `width` behind the front is scaled by `trail`, so a
 * bright pulse travels ahead of the light filling in behind it.
 */
export function fluence(table, state, maxDistance = Infinity, { feather = 0.35, from = 'source', pulse = null } = {}) {
  const { width, height, directions, states, distances } = table;
  const result = new Float32Array(width * height * 3);
  const dw = (2 * Math.PI) / directions;
  const half = directions / 2;
  for (let cell = 0; cell < width * height; cell += 1) {
    let r = 0;
    let g = 0;
    let b = 0;
    const base = cell * directions;
    for (let k = 0; k < directions; k += 1) {
      const s = states[base + k];
      if (s === 0xffff) continue;
      let w = dw;
      if (maxDistance !== Infinity) {
        const d = from === 'source' ? distances[base + k] : distances[base + ((k + half) % directions)];
        if (d > maxDistance) continue;
        if (d > maxDistance - feather) w *= (maxDistance - d) / feather;
        else if (pulse && d < maxDistance - pulse.width) w *= pulse.trail;
      }
      r += w * state[s * 3];
      g += w * state[s * 3 + 1];
      b += w * state[s * 3 + 2];
    }
    result[cell * 3] = r;
    result[cell * 3 + 1] = g;
    result[cell * 3 + 2] = b;
  }
  return result;
}

export { BIN_WIDTH };
