/**
 * Volume rendering along a ray: the piecewise-constant quadrature (alpha
 * compositing) is exact for piecewise-constant fields and converges to the
 * fine reference integral otherwise; the samplers place samples where they
 * should; the integrating factor solves the transfer equation; and the
 * photon simulation transmits e^{−σₜd} of the beam unscattered.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { simulateSlab } from '../layouts/BeamThroughMedium/photons.js';
import { cloudBlobs, cloudRay, createCloud, renderCloud } from '../layouts/volume/cloud.js';
import { createRandom, gaussian } from '../layouts/volume/random.js';
import { densityGradients } from '../layouts/volume/gradient.js';
import {
  applyTransport, cellsAround, composite, estimate, gapWeights, hierarchicalSamples, importanceSamples, referenceIntegral,
  randomSamples, relativeError, solveTransfer, stratifiedSamples, transferIntegral, uniformSamples,
} from '../layouts/volume/ray.js';

const COLORS = [[1, 0.88, 0.58], [1, 0.63, 0.19], [1, 0.35, 0.06], [1, 0.15, 0.05], [0.8, 0.06, 0.1]];

function lectureCloud(edge) {
  return createCloud(cloudBlobs({ edge, coreDensity: 30 }).map((blob) => ({ ...blob, color: COLORS[blob.role] })));
}

/** A field constant on each piece `{ start, end, density, color }`. */
function piecewiseField(pieces) {
  const piece = (t) => pieces.find((p) => t >= p.start && t < p.end) ?? pieces.at(-1);
  return {
    near: pieces[0].start,
    far: pieces.at(-1).end,
    density: (t) => piece(t).density,
    color: (t) => piece(t).color,
  };
}

const PIECES = [
  { start: 0, end: 0.3, density: 0, color: [0, 0, 0] },
  { start: 0.3, end: 0.5, density: 4, color: [1, 0.2, 0.1] },
  { start: 0.5, end: 1.1, density: 0.7, color: [0.2, 0.9, 0.3] },
  { start: 1.1, end: 1.4, density: 12, color: [0.3, 0.4, 1] },
  { start: 1.4, end: 2, density: 2, color: [1, 1, 1] },
];

describe('piecewise-constant quadrature', () => {
  const field = piecewiseField(PIECES);
  // C = Σₖ cₖ (T(aₖ) − T(bₖ)): the light first absorbed on each piece, times its color.
  const exact = [0, 0, 0];
  let depth = 0;
  for (const p of PIECES) {
    const lost = Math.exp(-depth) - Math.exp(-(depth + p.density * (p.end - p.start)));
    for (let k = 0; k < 3; k += 1) exact[k] += p.color[k] * lost;
    depth += p.density * (p.end - p.start);
  }

  it('is exact when σ and c are constant on every cell, wherever the samples sit', () => {
    const random = createRandom(3);
    const cells = PIECES.map((p) => ({ t: p.start + random() * (p.end - p.start), start: p.start, end: p.end }));
    const { color } = composite(field, cells);
    for (let k = 0; k < 3; k += 1) assert.ok(Math.abs(color[k] - exact[k]) < 1e-12, `channel ${k}: ${color[k]} vs ${exact[k]}`);
  });

  it('gives the same answer on any refinement of the pieces', () => {
    const random = createRandom(4);
    const cells = PIECES.flatMap((p) => {
      const cuts = [p.start, ...Array.from({ length: 6 }, () => p.start + random() * (p.end - p.start)).sort((a, b) => a - b), p.end];
      return cuts.slice(1).map((end, i) => ({ t: (cuts[i] + end) / 2, start: cuts[i], end }));
    });
    const { color } = composite(field, cells);
    for (let k = 0; k < 3; k += 1) assert.ok(Math.abs(color[k] - exact[k]) < 1e-12);
  });

  it('agrees with the independent fine reference integral', () => {
    const reference = referenceIntegral(field, 200000);
    assert.ok(relativeError(reference.color, exact) < 1e-4, `reference error ${relativeError(reference.color, exact)}`);
  });

  it('is not exact for a smooth field, which is why sample count matters', () => {
    const ray = cloudRay(lectureCloud(0.1), 0.46);
    const reference = referenceIntegral(ray).color;
    assert.ok(relativeError(estimate(ray, uniformSamples(8, ray.near, ray.far)).color, reference) > 1e-3);
  });
});

describe('the reference integral', () => {
  const ray = cloudRay(lectureCloud(0.015), 0.46);

  it('has converged far below the errors the slides show (0.1%)', () => {
    const a = referenceIntegral(ray, 20000).color;
    const b = referenceIntegral(ray, 40000).color;
    assert.ok(relativeError(a, b) < 1e-5, `${relativeError(a, b)}`);
  });

  it('has weights that sum to the opacity: ∫Tσ dt = 1 − T(far)', () => {
    const { opacity, transmittance } = referenceIntegral(cloudRay(lectureCloud(0.1), 0.85), 20000);
    assert.ok(Math.abs(opacity - (1 - transmittance)) < 1e-6);
  });
});

describe('the quadrature converges to the reference as N grows', () => {
  for (const edge of [0.1, 0.015]) {
    it(`for a surface ${edge} wide`, () => {
      const ray = cloudRay(lectureCloud(edge), 0.46);
      const reference = referenceIntegral(ray, 40000).color;
      const errors = [4, 16, 64, 256, 1024].map((n) => relativeError(estimate(ray, uniformSamples(n, ray.near, ray.far)).color, reference));
      assert.ok(errors[4] < 1e-3, `N = 1024 error ${errors[4]}`);
      assert.ok(errors[4] < errors[2] && errors[2] < errors[0], `errors ${errors.join(', ')}`);
    });
  }
});

describe('samplers', () => {
  it('stratify one sample per interval, reproducibly', () => {
    const a = stratifiedSamples(10, 0, 4, createRandom(9));
    assert.deepEqual(a, stratifiedSamples(10, 0, 4, createRandom(9)));
    a.forEach((t, i) => assert.ok(t >= i * 0.4 && t < (i + 1) * 0.4));
  });

  it('give midpoint cells that tile the ray', () => {
    const cells = cellsAround([3, 0.5, 1.2], 0, 4);
    assert.deepEqual(cells.map((c) => [c.start, c.end]), [[0, 0.85], [0.85, 2.1], [2.1, 4]]);
  });

  it('draw importance samples where the weight is', () => {
    const gaps = [{ start: 0, end: 1, weight: 0.02 }, { start: 1, end: 1.5, weight: 0.9 }, { start: 1.5, end: 4, weight: 0.03 }];
    const samples = importanceSamples(gaps, 100, createRandom(2));
    assert.ok(samples.every((t, i) => t >= 0 && t <= 4 && (i === 0 || t >= samples[i - 1])));
    assert.ok(samples.filter((t) => t >= 1 && t <= 1.5).length > 85);
  });

  it('put a surface between two coarse samples into the gap that holds it', () => {
    const field = piecewiseField([{ start: 0, end: 1.3, density: 0, color: [0, 0, 0] }, { start: 1.3, end: 4, density: 50, color: [1, 1, 1] }]);
    const gaps = gapWeights(field, [0.5, 1.0, 1.5, 2.0]);
    const heaviest = gaps.reduce((best, gap) => (gap.weight > best.weight ? gap : best));
    assert.deepEqual([heaviest.start, heaviest.end], [1.0, 1.5]);
  });

  it('rank as expected for a sharp surface at the same budget: hierarchical, then uniform, then stratified', () => {
    const cloud = lectureCloud(0.015);
    const random = createRandom(11);
    const squared = { uniform: 0, stratified: 0, hierarchical: 0 };
    for (let i = 0; i < 40; i += 1) {
      const ray = cloudRay(cloud, 0.2 + 0.55 * (i + 0.5) / 40);
      const reference = referenceIntegral(ray, 8000).color;
      const error = (samples) => relativeError(estimate(ray, samples).color, reference) ** 2;
      squared.uniform += error(uniformSamples(32, ray.near, ray.far));
      squared.stratified += error(stratifiedSamples(32, ray.near, ray.far, random));
      squared.hierarchical += error(hierarchicalSamples(ray, 16, 16, random).samples);
    }
    assert.ok(squared.hierarchical < squared.uniform / 2, JSON.stringify(squared));
    assert.ok(squared.uniform < squared.stratified, JSON.stringify(squared));
  });

  it('draw independent uniform samples on the ray, sorted and reproducible', () => {
    const a = randomSamples(50, 1, 3, createRandom(5));
    assert.deepEqual(a, randomSamples(50, 1, 3, createRandom(5)));
    assert.ok(a.every((t, i) => t >= 1 && t <= 3 && (i === 0 || t >= a[i - 1])));
  });

  it('rank as the sampling slide shows them, all random at the same budget: hierarchical, then stratified, then random', () => {
    const cloud = lectureCloud(0.015);
    const random = createRandom(13);
    const squared = { random: 0, stratified: 0, hierarchical: 0 };
    for (let i = 0; i < 40; i += 1) {
      const ray = cloudRay(cloud, 0.2 + 0.55 * (i + 0.5) / 40);
      const reference = referenceIntegral(ray, 8000).color;
      const error = (samples) => relativeError(estimate(ray, samples).color, reference) ** 2;
      squared.random += error(randomSamples(32, ray.near, ray.far, random));
      squared.stratified += error(stratifiedSamples(32, ray.near, ray.far, random));
      squared.hierarchical += error(hierarchicalSamples(ray, 16, 16, random).samples);
    }
    assert.ok(squared.stratified < squared.random / 2, JSON.stringify(squared));
    assert.ok(squared.hierarchical < squared.stratified / 4, JSON.stringify(squared));
  });
});

describe('the cloud as the camera sees it', () => {
  it('composites each row into the same pixel as the quadrature', () => {
    const cloud = lectureCloud(0.1);
    const image = renderCloud(cloud, 400, 10);
    const row = 4;
    const y = 1 - (row + 0.5) / 10;
    const pixel = estimate(cloudRay(cloud, y), uniformSamples(400, 0, 4)).color;
    // Σ over the row of Tσc δ, with T at cell centers, is the midpoint rule for the same integral.
    const summed = [0, 1, 2].map((k) => {
      let total = 0;
      for (let column = 0; column < 400; column += 1) total += image.seen[(row * 400 + column) * 3 + k] * 0.01;
      return total;
    });
    assert.ok(relativeError(summed, pixel) < 2e-3, `${relativeError(summed, pixel)}`);
  });
});

describe('the transfer equation along a ray', () => {
  it('the integrating factor solution matches stepping the ODE', () => {
    const ray = {
      near: 0,
      far: 1,
      density: (t) => 0.3 + 6 * Math.exp(-(((t - 0.55) / 0.08) ** 2) / 2),
      source: (t) => 0.4 * (0.3 + 6 * Math.exp(-(((t - 0.55) / 0.08) ** 2) / 2)),
      background: 1,
    };
    const stepped = solveTransfer(ray, 4000).radiance[0];
    const formula = transferIntegral(ray, 40000).radiance;
    assert.ok(Math.abs(stepped - formula) < 1e-6, `${stepped} vs ${formula}`);
  });
});

describe('photons crossing a slab', () => {
  const allTerms = { absorption: true, outScattering: true, emission: true, inScattering: true };
  for (const [absorption, scattering] of [[0.8, 0], [0.8, 0.8], [0.3, 1.9]]) {
    it(`transmit e^{−σₜd} of the beam unscattered (σa = ${absorption}, σs = ${scattering})`, () => {
      const { check } = simulateSlab({ absorption, scattering, terms: allTerms, seed: 5, beamCount: 20000, lampCount: 0, emissionRate: 0 });
      assert.ok(Math.abs(check.fraction - check.expected) < 4 * check.standardError,
        `${check.fraction} ± ${check.standardError} vs ${check.expected}`);
    });
  }

  it('transmit the whole beam when every term is off', () => {
    const terms = { absorption: false, outScattering: false, emission: false, inScattering: false };
    const { check, photons } = simulateSlab({ absorption: 1, scattering: 1, terms, seed: 1, beamCount: 200 });
    assert.equal(check.fraction, 1);
    assert.ok(photons.every((photon) => photon.kind === 'beam' && photon.fate === 'escaped'));
  });
});

describe('the differential form', () => {
  const density = (t) => 0.8 + 2 * Math.exp(-(((t - 0.6) / 0.12) ** 2) / 2);
  const source = (t) => 5 * Math.exp(-(((t - 0.3) / 0.03) ** 2) / 2) + 3 * Math.exp(-(((t - 0.75) / 0.03) ** 2) / 2);
  const solved = solveTransfer({ near: 0, far: 1, density, source, background: 0 }, 999);
  const t = Array.from(solved.t);
  const sources = t.map(source);
  const recover = (radiance) => {
    const recovered = applyTransport({ t, radiance, density: t.map(density) });
    // Interior samples: the one-sided ends are first-order.
    const inside = (values) => values.slice(1, -1);
    const difference = inside(recovered).map((q, k) => q - inside(sources)[k]);
    return Math.hypot(...difference) / Math.hypot(...inside(sources));
  };

  it('applying D to L = D⁻¹Q recovers Q from neighbouring samples alone', () => {
    assert.ok(recover(Array.from(solved.radiance)) < 1e-2, `${recover(Array.from(solved.radiance))}`);
  });

  it('amplifies noise in L by the derivative', () => {
    const random = createRandom(8);
    const scale = 0.001 * Math.max(...solved.radiance);
    const noisy = Array.from(solved.radiance, (value) => value + scale * gaussian(random));
    assert.ok(recover(noisy) > 10 * recover(Array.from(solved.radiance)));
  });
});

describe('the volume rendering gradient', () => {
  const cloud = lectureCloud(0.03);
  const ray = cloudRay(cloud, 1 - 8.5 / 16);
  const samples = uniformSamples(32, ray.near, ray.far);
  const cells = cellsAround(samples, ray.near, ray.far);
  const result = composite(ray, cells);
  const gradients = densityGradients(result);
  // The same quadrature with σ at sample i moved by h, every other value as before.
  const perturbed = (i, h) => {
    const densities = new Map(result.terms.map((term, k) => [term.t, term.density + (k === i ? h : 0)]));
    return composite({ ...ray, density: (t) => densities.get(t) }, cells).color;
  };

  it('δᵢ(Tᵢ₊₁cᵢ − (Ĉ − Ĉ≤ᵢ)) is the derivative of Ĉ with respect to σᵢ', () => {
    let largest = 0;
    let worst = 0;
    result.terms.forEach((term, i) => {
      const h = 1e-5 * Math.max(1, term.density);
      const plus = perturbed(i, h);
      const minus = perturbed(i, -h);
      for (let k = 0; k < 3; k += 1) {
        const difference = (plus[k] - minus[k]) / (2 * h);
        largest = Math.max(largest, Math.abs(difference));
        worst = Math.max(worst, Math.abs(difference - gradients[i].gradient[k]));
      }
    });
    assert.ok(worst < 1e-6 * largest, `largest ${largest}, worst error ${worst}`);
  });

  it('the color behind each sample is the running sum of the terms from the back', () => {
    result.terms.forEach((_, i) => {
      const behind = result.terms.slice(i + 1).reduce((sum, term) => sum.map((v, k) => v + term.weight * term.color[k]), [0, 0, 0]);
      behind.forEach((v, k) => assert.ok(Math.abs(v - gradients[i].behind[k]) < 1e-12));
    });
  });

  it('is δᵢTᵢ₊₁(cᵢ − Lᵢ₊₁), with Lᵢ₊₁ the light from behind: the quadrature restarted after sample i', () => {
    result.terms.forEach((term, i) => {
      const next = term.transmittance * (1 - term.alpha);
      if (next < 1e-9) return;
      const fromBehind = result.terms.slice(i + 1)
        .reduce((sum, back) => sum.map((v, k) => v + (back.transmittance / next) * back.alpha * back.color[k]), [0, 0, 0]);
      fromBehind.forEach((light, k) => {
        const adjoint = term.delta * next * (term.color[k] - light);
        assert.ok(Math.abs(adjoint - gradients[i].gradient[k]) < 1e-12, `sample ${i}, channel ${k}`);
      });
    });
  });

  it('changes from one sample to the next by Tᵢ₊₁(cᵢ₊₁ − cᵢ), per unit δ: equal where the color is constant', () => {
    for (let i = 0; i + 1 < result.terms.length; i += 1) {
      const [term, back] = [result.terms[i], result.terms[i + 1]];
      const next = term.transmittance * (1 - term.alpha);
      for (let k = 0; k < 3; k += 1) {
        const change = gradients[i + 1].gradient[k] / back.delta - gradients[i].gradient[k] / term.delta;
        assert.ok(Math.abs(change - next * (back.color[k] - term.color[k])) < 1e-12, `samples ${i} and ${i + 1}`);
      }
    }
  });
});
