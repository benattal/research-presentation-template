/**
 * The active-sensing math of section 4: continuous-wave time of flight,
 * transient histograms, and structured light.
 * Run: node --test presentations/light-transport-and-neural-rendering/tests/
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SPEED_OF_LIGHT, ambiguityDistance, amplitudeOf, collocatedWeights, depthFromPhase, intensityQuadrature, phaseOf,
  roundTripPhase, roundTripTime, tofQuadrature, transientHistogram,
} from '../layouts/activeSensing/measurement.js';
import { RAY_SCENE, raySamples } from '../layouts/activeSensing/rayScene.js';
import { PHASOR_SCENE, directReturn, mirrorReturn } from '../layouts/PhasorToF/multipath.js';
import {
  PROJECTOR_SCENE, cameraSamples, filteredStripePattern, stripePattern, structuredLightQuadrature, transmittanceToProjector,
} from '../layouts/ProjectorQuadrature/projection.js';

const close = (actual, expected, tolerance, message) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} vs ${expected}`);
};

describe('continuous-wave time of flight', () => {
  it('recovers the depth of a single return from its phase below the wrapping distance', () => {
    for (const frequency of [10e6, 30e6, 100e6]) {
      const range = ambiguityDistance(frequency);
      for (const share of [0.05, 0.3, 0.6, 0.95]) {
        const depth = share * range;
        close(depthFromPhase(roundTripPhase(depth, frequency), frequency), depth, 1e-9, `depth at ${frequency / 1e6} MHz`);
      }
    }
  });

  it('wraps depths beyond c/2f to depths below it', () => {
    const frequency = 120e6;
    const depth = 2;
    const range = ambiguityDistance(frequency);
    close(range, SPEED_OF_LIGHT / (2 * frequency), 1e-12, 'wrapping distance');
    close(depthFromPhase(roundTripPhase(depth, frequency), frequency), depth - range, 1e-9, 'wrapped depth');
  });

  it('models the wall return as ρ/d² with phase 4πfd/c', () => {
    const { amplitude, phase } = directReturn(PHASOR_SCENE, 30e6);
    const { depth, albedo } = PHASOR_SCENE.wall;
    close(amplitude, albedo / depth ** 2, 1e-12, 'amplitude');
    close(phase, (4 * Math.PI * 30e6 * depth) / SPEED_OF_LIGHT, 1e-12, 'phase');
  });

  it('sends the mirror path through the specular point, and drops it when the point is off the mirror', () => {
    const { depth } = PHASOR_SCENE.wall;
    const bounce = mirrorReturn(PHASOR_SCENE, [1, -1], 30e6);
    assert.deepEqual(bounce.point, [depth / 2, -1]);
    const toMirror = Math.hypot(depth / 2, 1);
    close(bounce.length, 2 * toMirror + depth, 1e-12, 'path length: source to mirror to wall, then back');
    assert.equal(mirrorReturn(PHASOR_SCENE, [depth / 2 + PHASOR_SCENE.mirror.halfLength + 0.01, -1], 30e6), null);
  });

  it('gives a single opaque surface the amplitude ρ/d² and the phase 4πfd/c in the quadrature', () => {
    const frequency = 30e6;
    const samples = raySamples(RAY_SCENE, { fog: false });
    const { measurement } = tofQuadrature(samples, frequency);
    const { depth, albedo } = RAY_SCENE.wall;
    close(amplitudeOf(measurement), albedo / depth ** 2, 1e-9, 'amplitude');
    close(phaseOf(measurement), roundTripPhase(depth, frequency), 1e-9, 'phase');
  });

  it('weights each sample by Tᵢ²αᵢρᵢ/tᵢ²', () => {
    const samples = [
      { t: 1, delta: 0.5, sigma: 1, albedo: 0.5 },
      { t: 2, delta: 0.5, sigma: 2, albedo: 0.8 },
    ];
    const [first, second] = collocatedWeights(samples);
    const alpha1 = 1 - Math.exp(-0.5);
    const alpha2 = 1 - Math.exp(-1);
    close(first, (alpha1 * 0.5) / 1, 1e-12, 'first sample');
    close(second, ((1 - alpha1) ** 2 * alpha2 * 0.8) / 4, 1e-12, 'second sample');
  });
});

describe('transient histogram', () => {
  for (const pulseWidth of [0, 0.2e-9, 1e-9, 3e-9]) {
    it(`integrates to the intensity m = Σ wᵢ for a ${pulseWidth * 1e9} ns pulse`, () => {
      const samples = raySamples(RAY_SCENE);
      const binWidth = 0.2e-9;
      const binCount = Math.ceil((2 * 4.5) / SPEED_OF_LIGHT / binWidth);
      const histogram = transientHistogram(samples, { binWidth, binCount, pulseWidth });
      const integral = histogram.reduce((sum, bin) => sum + bin, 0);
      close(integral, intensityQuadrature(samples), 1e-6 * intensityQuadrature(samples), 'integral');
    });
  }

  it('puts an opaque surface in the bin of its round-trip time', () => {
    const samples = raySamples(RAY_SCENE, { fog: false });
    const binWidth = 0.2e-9;
    const histogram = transientHistogram(samples, { binWidth, binCount: 120, pulseWidth: 0 });
    const peak = histogram.indexOf(Math.max(...histogram));
    assert.equal(peak, Math.floor((2 * RAY_SCENE.wall.depth) / SPEED_OF_LIGHT / binWidth));
  });

  it('has the phasor quadrature as its Fourier coefficient at the modulation frequency', () => {
    // m_f = ∫h(τ) e^{j2πfτ} dτ for an impulse, on 1 ps bins: the binning error in phase is below 2πf·(1 ps).
    const samples = raySamples(RAY_SCENE);
    const frequency = 30e6;
    const binWidth = 1e-12;
    const histogram = transientHistogram(samples, { binWidth, binCount: Math.ceil(roundTripTime(RAY_SCENE.far) / binWidth), pulseWidth: 0 });
    let [re, im] = [0, 0];
    histogram.forEach((weight, bin) => {
      const angle = 2 * Math.PI * frequency * (bin + 0.5) * binWidth;
      re += weight * Math.cos(angle);
      im += weight * Math.sin(angle);
    });
    const { measurement } = tofQuadrature(samples, frequency);
    const size = amplitudeOf(measurement);
    close(re, measurement[0], 1e-3 * size, 'real part');
    close(im, measurement[1], 1e-3 * size, 'imaginary part');
  });
});

describe('structured light', () => {
  it('passes the projector light unattenuated through empty space', () => {
    close(transmittanceToProjector(PROJECTOR_SCENE, [0.9, 1.6]), 1, 1e-12, 'transmittance');
  });

  it('blocks the projector light behind the opaque box', () => {
    assert.ok(transmittanceToProjector(PROJECTOR_SCENE, [2.2, 0.01]) < 1e-4);
  });

  it('antialiases the stripes: a narrow filter keeps the pattern, a wide one averages it', () => {
    for (const u of [-0.93, -0.41, 0.02, 0.37, 0.88]) {
      close(filteredStripePattern(PROJECTOR_SCENE, u, 10, 1e-9), stripePattern(PROJECTOR_SCENE, u, 10), 1e-12, `u = ${u}`);
    }
    // Two whole stripe periods (0.4 in u for 10 stripes) average to the mean of bright and dark.
    close(filteredStripePattern(PROJECTOR_SCENE, 0.1, 10, 0.4), (1 + PROJECTOR_SCENE.darkLevel) / 2, 1e-12, 'average');
    assert.equal(filteredStripePattern(PROJECTOR_SCENE, 1.5, 10, 0.1), 0);
    // A filter straddling the edge of the image counts only the part inside it.
    assert.ok(filteredStripePattern(PROJECTOR_SCENE, 1, 10, 0.04) < stripePattern(PROJECTOR_SCENE, 0.99, 10));
  });

  it('gives the floor behind the box, in its shadow, no projector light', () => {
    // The camera ray to floor point x = 2.2 m: the box (x up to 1.92 m, 0.62 m tall) shadows the floor up to x ≈ 2.45 m.
    const samples = cameraSamples(PROJECTOR_SCENE, 2.2, 40);
    const { terms } = structuredLightQuadrature(PROJECTOR_SCENE, samples, 10);
    const floor = terms.filter((_, i) => samples[i].point[1] < 0);
    assert.ok(floor.some((term) => term.unshadowed > 0), 'the floor sample is lit when shadows are ignored');
    for (const term of floor) assert.ok(term.contribution < 1e-6 * term.unshadowed, `floor term ${term.contribution}`);
  });

  it('never makes a pixel brighter by accounting for shadows', () => {
    for (const floorX of [1, 1.6, 2.2, 2.8, 3.4]) {
      const samples = cameraSamples(PROJECTOR_SCENE, floorX, 40);
      const { pixel, pixelUnshadowed } = structuredLightQuadrature(PROJECTOR_SCENE, samples, 10);
      assert.ok(pixel <= pixelUnshadowed + 1e-15, `pixel at ${floorX}`);
    }
  });
});
