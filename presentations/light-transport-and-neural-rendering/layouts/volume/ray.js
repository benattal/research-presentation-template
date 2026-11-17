/**
 * Volume rendering along one ray, as numbers: transmittance, the exact
 * emission–absorption integral, its piecewise-constant quadrature (alpha
 * compositing), the samplers that place the quadrature's samples, and the
 * transfer equation along a ray.
 *
 * A ray field is `{ near, far, density(t), color(t) }`: t is the distance
 * from the camera in world units, the density σ is per world unit, and the
 * color c is linear RGB radiance `[r, g, b]`. The camera receives
 * C = ∫ T(t) σ(t) c(t) dt with T(t) = exp(−∫₀ᵗ σ), against a black
 * background.
 */

/**
 * The quadrature's intervals for sorted or unsorted sample positions: each
 * sample owns the stretch between the midpoints to its neighbours, and the
 * first and last reach `near` and `far`. Uniform midpoint samples get equal
 * intervals. Returns `[{ t, start, end }]` sorted by t.
 */
export function cellsAround(samples, near, far) {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted.map((t, i) => ({
    t,
    start: i === 0 ? near : (sorted[i - 1] + t) / 2,
    end: i === sorted.length - 1 ? far : (t + sorted[i + 1]) / 2,
  }));
}

/** One sample at the middle of each of `count` equal intervals of [near, far]. */
export function uniformSamples(count, near, far) {
  const step = (far - near) / count;
  return Array.from({ length: count }, (_, i) => near + (i + 0.5) * step);
}

/** `count` independent, uniformly random samples on [near, far], sorted: the unstratified baseline. */
export function randomSamples(count, near, far, random) {
  return Array.from({ length: count }, () => near + random() * (far - near)).sort((x, y) => x - y);
}

/** One uniformly random sample in each of `count` equal intervals of [near, far]. */
export function stratifiedSamples(count, near, far, random) {
  const step = (far - near) / count;
  return Array.from({ length: count }, (_, i) => near + (i + random()) * step);
}

/**
 * Piecewise-constant quadrature of the emission–absorption integral: σ and
 * c are taken constant on each cell at their value at the cell's sample, so
 * Ĉ = Σᵢ Tᵢ αᵢ cᵢ with αᵢ = 1 − exp(−σᵢδᵢ) and Tᵢ = exp(−Σⱼ<ᵢ σⱼδⱼ). Exact
 * when the field is constant on every cell. Cells must be sorted and
 * contiguous (`cellsAround` makes them).
 *
 * Returns the color, the transmittance past the last cell, and per cell its
 * density, color, length δ, transmittance Tᵢ, opacity αᵢ, and weight Tᵢαᵢ.
 */
export function composite(field, cells) {
  let depth = 0;
  const color = [0, 0, 0];
  const terms = cells.map((cell) => {
    const density = field.density(cell.t);
    const cellColor = field.color(cell.t);
    const delta = cell.end - cell.start;
    const transmittance = Math.exp(-depth);
    const alpha = 1 - Math.exp(-density * delta);
    const weight = transmittance * alpha;
    for (let k = 0; k < 3; k += 1) color[k] += weight * cellColor[k];
    depth += density * delta;
    return { ...cell, density, color: cellColor, delta, transmittance, alpha, weight };
  });
  return { color, terms, transmittance: Math.exp(-depth) };
}

/** The quadrature for a set of sample positions: `composite` over `cellsAround` them. */
export function estimate(field, samples) {
  return composite(field, cellsAround(samples, field.near, field.far));
}

/**
 * The integral C = ∫ T σ c dt computed finely and independently of the
 * quadrature: the trapezoid rule on `steps` intervals, for the optical
 * depth and for the integrand alike. Also returns the opacity ∫ T σ dt,
 * which equals 1 − T(far), and T(far). Second-order accurate for smooth
 * fields; used as the reference the quadrature is checked against.
 */
export function referenceIntegral(field, steps = 20000) {
  const h = (field.far - field.near) / steps;
  const color = [0, 0, 0];
  let depth = 0;
  let opacity = 0;
  let previousDensity = field.density(field.near);
  let previousColor = field.color(field.near);
  let previousWeight = previousDensity;
  for (let k = 1; k <= steps; k += 1) {
    const t = field.near + k * h;
    const density = field.density(t);
    const cellColor = field.color(t);
    depth += 0.5 * h * (previousDensity + density);
    const weight = Math.exp(-depth) * density;
    opacity += 0.5 * h * (previousWeight + weight);
    for (let c = 0; c < 3; c += 1) color[c] += 0.5 * h * (previousWeight * previousColor[c] + weight * cellColor[c]);
    previousDensity = density;
    previousColor = cellColor;
    previousWeight = weight;
  }
  return { color, opacity, transmittance: Math.exp(-depth) };
}

/**
 * The field along the ray at `count` evenly spaced points from near to far,
 * for plotting: t, σ(t), T(t) (trapezoid optical depth), the weight density
 * T(t)σ(t), and c(t).
 */
export function rayProfile(field, count) {
  const h = (field.far - field.near) / (count - 1);
  const profile = { t: [], density: [], transmittance: [], weight: [], color: [] };
  let depth = 0;
  for (let k = 0; k < count; k += 1) {
    const t = field.near + k * h;
    const density = field.density(t);
    if (k > 0) depth += 0.5 * h * (profile.density[k - 1] + density);
    const transmittance = Math.exp(-depth);
    profile.t.push(t);
    profile.density.push(density);
    profile.transmittance.push(transmittance);
    profile.weight.push(transmittance * density);
    profile.color.push(field.color(t));
  }
  return profile;
}

/**
 * Where the coarse samples say the light comes from: the gaps between
 * consecutive samples (and from `near` to the first, from the last to
 * `far`) with the weight ∫ T σ dt each holds, T(start) − T(end), taking σ
 * linear between samples and constant beyond the first and last. Unlike
 * the cell weights of `composite`, a surface between an empty sample and a
 * dense one puts its weight in the gap that contains it. Returns
 * `[{ start, end, weight }]`.
 */
export function gapWeights(field, samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const knots = [field.near, ...sorted, field.far];
  const densities = sorted.map((t) => field.density(t));
  const knotDensities = [densities[0], ...densities, densities.at(-1)];
  const gaps = [];
  let depth = 0;
  for (let i = 1; i < knots.length; i += 1) {
    const before = Math.exp(-depth);
    depth += 0.5 * (knotDensities[i - 1] + knotDensities[i]) * (knots[i] - knots[i - 1]);
    gaps.push({ start: knots[i - 1], end: knots[i], weight: before - Math.exp(-depth) });
  }
  return gaps;
}

/**
 * `count` samples drawn from the piecewise-constant density whose mass on
 * each interval `{ start, end, weight }` is its weight, mixed with a
 * uniform density (`floor` of the mass) so no stretch of the ray has
 * probability zero. The uniforms are stratified, (j + u)/count, as in
 * NeRF's hierarchical sampling. Returns sorted positions.
 */
export function importanceSamples(intervals, count, random, floor = 0.05) {
  const near = intervals[0].start;
  const length = intervals.at(-1).end - near;
  const total = intervals.reduce((sum, interval) => sum + interval.weight, 0);
  const masses = intervals.map((interval) => (total > 0 ? (1 - floor) * (interval.weight / total) : 0)
    + floor * ((interval.end - interval.start) / length));
  const sum = masses.reduce((s, m) => s + m, 0);
  const samples = [];
  let index = 0;
  let below = 0;
  for (let j = 0; j < count; j += 1) {
    const u = ((j + random()) / count) * sum;
    while (index < intervals.length - 1 && below + masses[index] <= u) {
      below += masses[index];
      index += 1;
    }
    const within = masses[index] > 0 ? Math.min(1, Math.max(0, (u - below) / masses[index])) : 0.5;
    samples.push(intervals[index].start + within * (intervals[index].end - intervals[index].start));
  }
  return samples;
}

/**
 * Hierarchical sampling as in NeRF: `coarseCount` stratified samples
 * locate the light (`gapWeights`), `fineCount` more are drawn from those
 * weights, and the estimate uses both sets. Returns the coarse and fine
 * positions, the coarse gaps with their weights, and all samples sorted.
 */
export function hierarchicalSamples(field, coarseCount, fineCount, random) {
  const coarse = stratifiedSamples(coarseCount, field.near, field.far, random);
  const gaps = gapWeights(field, coarse);
  const fine = importanceSamples(gaps, fineCount, random);
  return { coarse, fine, gaps, samples: [...coarse, ...fine].sort((a, b) => a - b) };
}

/** ‖estimate − reference‖ / ‖reference‖ for RGB triples. */
export function relativeError(estimated, reference) {
  const difference = Math.hypot(...estimated.map((value, k) => value - reference[k]));
  return difference / Math.hypot(...reference);
}

/**
 * The transfer equation along a camera ray, solved by stepping it: light
 * travels toward the camera, so −dL/dt = −σ(t) L + S(t), from L(far) =
 * `background` back to the camera, with classical Runge–Kutta on `steps`
 * steps. `ray` is `{ near, far, density(t), source(t), background }` with
 * scalar radiance. Returns `{ t, radiance }` from near to far; radiance[0]
 * is what the camera receives.
 */
export function solveTransfer(ray, steps = 2000) {
  const h = (ray.far - ray.near) / steps;
  const slope = (t, radiance) => ray.density(t) * radiance - ray.source(t);
  const t = new Float64Array(steps + 1);
  const radiance = new Float64Array(steps + 1);
  radiance[steps] = ray.background;
  for (let k = steps; k > 0; k -= 1) {
    const at = ray.near + k * h;
    const value = radiance[k];
    const k1 = slope(at, value);
    const k2 = slope(at - h / 2, value - (h / 2) * k1);
    const k3 = slope(at - h / 2, value - (h / 2) * k2);
    const k4 = slope(at - h, value - h * k3);
    radiance[k - 1] = value - (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    t[k] = at;
  }
  t[0] = ray.near;
  return { t, radiance };
}

/**
 * The integrating factor's solution of the same equation, L(near) =
 * ∫ T(t) S(t) dt + T(far) L(far), by the trapezoid rule on `steps`
 * intervals. Returns the radiance at the camera and T(far).
 */
export function transferIntegral(ray, steps = 20000) {
  const h = (ray.far - ray.near) / steps;
  let depth = 0;
  let previousDensity = ray.density(ray.near);
  let previousTerm = ray.source(ray.near);
  let integral = 0;
  for (let k = 1; k <= steps; k += 1) {
    const t = ray.near + k * h;
    const density = ray.density(t);
    depth += 0.5 * h * (previousDensity + density);
    const term = Math.exp(-depth) * ray.source(t);
    integral += 0.5 * h * (previousTerm + term);
    previousDensity = density;
    previousTerm = term;
  }
  const transmittance = Math.exp(-depth);
  return { radiance: integral + transmittance * ray.background, transmittance };
}

/**
 * The transfer operator D = ω·∇ + σₜ applied to radiance sampled along a
 * camera ray, where ω·∇ = −d/dt: Q̂(t) = −dL/dt + σₜ(t) L(t), with central
 * differences inside and one-sided ones at the ends. `t` must be evenly
 * spaced; `radiance` and `density` are sampled at `t`. Applying D needs
 * only each sample's neighbours: it is local, unlike its inverse.
 */
export function applyTransport({ t, radiance, density }) {
  const n = t.length;
  const h = t[1] - t[0];
  return Array.from({ length: n }, (_, k) => {
    const derivative = k === 0 ? (radiance[1] - radiance[0]) / h
      : k === n - 1 ? (radiance[n - 1] - radiance[n - 2]) / h
        : (radiance[k + 1] - radiance[k - 1]) / (2 * h);
    return -derivative + density[k] * radiance[k];
  });
}
