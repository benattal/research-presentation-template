/**
 * Measurements of active sensors as volume rendering quadratures: a
 * continuous-wave time-of-flight pixel (a phasor), a pulsed lidar pixel (a
 * transient histogram), and the intensity pixel both reduce to.
 *
 * Units: meters, seconds, hertz; phases in radians. A phasor is `[re, im]`.
 * A ray sample is `{ t, delta, sigma, albedo }`: its distance from the
 * camera, the length of its interval, its density (1/m), and the fraction
 * of the source's light it scatters back toward the camera.
 */

/** The speed of light in vacuum, m/s. */
export const SPEED_OF_LIGHT = 299792458;

/** Phase delay of a return from depth `depth` (round trip 2d): 4πfd/c, unwrapped. */
export function roundTripPhase(depth, frequency) {
  return (4 * Math.PI * frequency * depth) / SPEED_OF_LIGHT;
}

/** Phase delay of light that travels a path of total length `length`: 2πfL/c, unwrapped. */
export function pathPhase(length, frequency) {
  return (2 * Math.PI * frequency * length) / SPEED_OF_LIGHT;
}

/** The depth c/2f beyond which the phase wraps and depth becomes ambiguous. */
export function ambiguityDistance(frequency) {
  return SPEED_OF_LIGHT / (2 * frequency);
}

/** A phase reduced to [0, 2π), as a sensor measures it. */
export function wrapPhase(phase) {
  const turn = 2 * Math.PI;
  const wrapped = phase % turn;
  return wrapped < 0 ? wrapped + turn : wrapped;
}

/** The depth a sensor reports for a measured phase: c·φ/4πf, with φ wrapped. */
export function depthFromPhase(phase, frequency) {
  return (SPEED_OF_LIGHT * wrapPhase(phase)) / (4 * Math.PI * frequency);
}

export function phasor(amplitude, phase) {
  return [amplitude * Math.cos(phase), amplitude * Math.sin(phase)];
}

export function sumPhasors(phasors) {
  return phasors.reduce(([re, im], [a, b]) => [re + a, im + b], [0, 0]);
}

export function amplitudeOf([re, im]) {
  return Math.hypot(re, im);
}

/** The phase of a phasor in [0, 2π). */
export function phaseOf([re, im]) {
  return wrapPhase(Math.atan2(im, re));
}

/**
 * NeRF's quadrature terms for samples along a camera ray: opacity
 * αᵢ = 1 − exp(−σᵢδᵢ), transmittance Tᵢ = ∏_{j<i} (1 − αⱼ), and the
 * compositing weight Tᵢαᵢ. Returns one `{ alpha, transmittance, weight }`
 * per sample, in order.
 */
export function compositingWeights(samples) {
  let transmittance = 1;
  return samples.map(({ sigma, delta }) => {
    const alpha = 1 - Math.exp(-sigma * delta);
    const terms = { alpha, transmittance, weight: transmittance * alpha };
    transmittance *= 1 - alpha;
    return terms;
  });
}

/**
 * The weight of each sample's return when the light source sits at the
 * camera: Tᵢ² αᵢ ρᵢ / tᵢ². Light reaching the sample is attenuated by Tᵢ on
 * the way out, falls off with the inverse square of distance, and is
 * attenuated by Tᵢ again on the way back.
 */
export function collocatedWeights(samples) {
  return compositingWeights(samples).map(({ alpha, transmittance }, i) => {
    const { t, albedo } = samples[i];
    return (transmittance * transmittance * alpha * albedo) / (t * t);
  });
}

/**
 * The continuous-wave time-of-flight quadrature: each sample's return
 * Tᵢ²αᵢρᵢ/tᵢ² delayed by the phase 4πf tᵢ/c of its round trip; the pixel
 * measures their sum. Returns the per-sample phasors and the measurement.
 */
export function tofQuadrature(samples, frequency) {
  const weights = collocatedWeights(samples);
  const returns = samples.map(({ t }, i) => phasor(weights[i], roundTripPhase(t, frequency)));
  return { weights, returns, measurement: sumPhasors(returns) };
}

/** The intensity pixel of the same model: the sum of the returns' weights (f = 0). */
export function intensityQuadrature(samples) {
  return collocatedWeights(samples).reduce((sum, weight) => sum + weight, 0);
}

/** The time light takes to reach depth `t` and come back, in seconds. */
export function roundTripTime(t) {
  return (2 * t) / SPEED_OF_LIGHT;
}

/** Full width at half maximum of a Gaussian, in standard deviations. */
const FWHM_PER_SIGMA = 2 * Math.sqrt(2 * Math.LN2);

/** The standard normal CDF, through erf (Abramowitz and Stegun 7.1.26, error below 1.5e-7). */
function normalCdf(x) {
  const z = Math.abs(x) / Math.SQRT2;
  const k = 1 / (1 + 0.3275911 * z);
  const poly = k * (0.254829592 + k * (-0.284496736 + k * (1.421413741 + k * (-1.453152027 + k * 1.061405429))));
  const erf = 1 - poly * Math.exp(-z * z);
  return x >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

/**
 * A pulsed lidar's transient histogram for one pixel: each sample's weight
 * Tᵢ²αᵢρᵢ/tᵢ² arrives at its round-trip time 2tᵢ/c, spread by the laser
 * pulse (a Gaussian of full width at half maximum `pulseWidth`; 0 is an
 * impulse). Bin k covers [k·binWidth, (k+1)·binWidth) seconds.
 *
 * Returns the weight in each bin (not a density), so the bins sum to the
 * intensity pixel when every return lands inside the histogram.
 */
export function transientHistogram(samples, { binWidth, binCount, pulseWidth }) {
  const weights = collocatedWeights(samples);
  const bins = new Float64Array(binCount);
  const spread = pulseWidth / FWHM_PER_SIGMA;
  samples.forEach(({ t }, i) => {
    const arrival = roundTripTime(t);
    if (spread === 0) {
      const bin = Math.floor(arrival / binWidth);
      if (bin >= 0 && bin < binCount) bins[bin] += weights[i];
      return;
    }
    let below = normalCdf((0 - arrival) / spread);
    for (let k = 0; k < binCount; k += 1) {
      const above = normalCdf(((k + 1) * binWidth - arrival) / spread);
      bins[k] += weights[i] * (above - below);
      below = above;
    }
  });
  return bins;
}
