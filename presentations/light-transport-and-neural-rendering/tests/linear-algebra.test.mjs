/**
 * The linear algebra of section 1: the Neumann series telescopes and
 * converges to the direct solve within its error bound, the slides share
 * one example matrix, the iteration on the large sparse chain stays within
 * the bound, and a matrix built from a spectrum has that spectrum.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { applyChain, chainErrors, chainSolution, chainTerms, errorBound } from '../layouts/linearAlgebra/chain.js';
import { matrixPower, matrixProduct, multiply, partialSums, resolvent, seriesSum, solve } from '../layouts/linearAlgebra/linear.js';
import { amplification, combine, components, normalize, spectralMatrix } from '../layouts/linearAlgebra/plane.js';

const close = (a, b, tolerance, what) => assert.ok(Math.abs(a - b) <= tolerance, `${what}: ${a} vs ${b}`);
const BASIS = [[1, 0.25], [-0.5, 1]].map(normalize);

/** A small nonnegative matrix with row sums at most 0.75, and a source at node 0. */
const SMALL_MATRIX = [
  [0, 0.25, 0, 0, 0.25],
  [0.3, 0, 0.25, 0, 0.2],
  [0.2, 0.25, 0, 0.25, 0],
  [0, 0, 0.3, 0, 0.3],
  [0.25, 0.2, 0, 0.3, 0],
];
const SMALL_SOURCE = [1, 0, 0, 0, 0];

describe('Neumann series', () => {
  const A = SMALL_MATRIX;
  const e = SMALL_SOURCE;
  const x = solve(A, e);

  it('the direct solve satisfies x = e + Ax', () => {
    const Ax = multiply(A, x);
    x.forEach((value, i) => close(value, e[i] + Ax[i], 1e-12, `entry ${i}`));
  });

  it('partial sums converge to the direct solve, within the bound ‖A‖^{k+1}‖e‖/(1 − ‖A‖) after every term', () => {
    const normA = Math.max(...A.map((row) => row.reduce((sum, a) => sum + a, 0)));
    assert.ok(normA < 1, `‖A‖ = ${normA}`);
    const sums = partialSums(A, e, 80);
    sums.forEach((sum, k) => {
      const error = Math.max(...x.map((value, i) => Math.abs(value - sum[i])));
      assert.ok(error <= normA ** (k + 1) * Math.max(...e) / (1 - normA) + 1e-12, `k = ${k}: error ${error}`);
    });
    sums[79].forEach((value, i) => close(value, x[i], 1e-10, `entry ${i}`));
  });
});

describe('partial sums of the Neumann series', () => {
  const { A } = spectralMatrix([[2, 1], [-1, 2]].map(normalize), { lambda: [0.8, 0.3] });
  const identity = [[1, 0], [0, 1]];

  it('telescope: (I − A) S_k = I − A^{k+1}', () => {
    const IminusA = A.map((row, i) => row.map((a, j) => identity[i][j] - a));
    for (let k = 0; k <= 8; k += 1) {
      const left = matrixProduct(IminusA, seriesSum(A, k));
      const power = matrixPower(A, k + 1);
      left.forEach((row, i) => row.forEach((value, j) => close(value, identity[i][j] - power[i][j], 1e-12, `k = ${k}, (${i}, ${j})`)));
    }
  });

  it('converge to (I − A)^{-1} when the spectral radius is below 1', () => {
    const limit = resolvent(A);
    seriesSum(A, 200).forEach((row, i) => row.forEach((value, j) => close(value, limit[i][j], 1e-12, `(${i}, ${j})`)));
  });
});

describe('the example matrix of the slides', () => {
  const read = (id) => JSON.parse(readFileSync(new URL(`../slides/${id}/content.json`, import.meta.url), 'utf8'));
  const slides = ['la-fixed-point', 'la-neumann', 'la-spectral'].map((id) => ({ id, slide: read(id) }));

  it('is the same A on every plane slide', () => {
    const [first, ...rest] = slides;
    rest.forEach(({ id, slide }) => assert.deepEqual(slide.eigenvectors, first.slide.eigenvectors, `${id} eigenvectors`));
    assert.deepEqual(first.slide.lambda, [0.8, 0.3]);
    assert.deepEqual(slides[1].slide.lambda, first.slide.lambda, 'la-neumann lambda');
    const spectral = slides[2].slide.buildSteps.filter((step) => step.lambda);
    assert.deepEqual(spectral[0].lambda, first.slide.lambda, 'la-spectral first step');
  });

  it('is A = [[0.7, 0.2], [0.2, 0.4]], symmetric with ‖A‖₂ = ρ(A) = 0.8', () => {
    const { A } = spectralMatrix(slides[0].slide.eigenvectors.map(normalize), { lambda: slides[0].slide.lambda });
    [[0.7, 0.2], [0.2, 0.4]].forEach((row, i) => row.forEach((value, j) => close(A[i][j], value, 1e-12, `(${i}, ${j})`)));
  });
});

describe('iteration on a large sparse matrix', () => {
  const { weight } = JSON.parse(readFileSync(new URL('../slides/la-apply/content.json', import.meta.url), 'utf8'));
  const count = 61;
  const terms = chainTerms(weight, count);
  const errors = chainErrors(terms, weight);

  it('applies the same A as the dense tridiagonal matrix', () => {
    const v = [0.3, -1, 2, 0.5, 0, 1.5];
    const dense = v.map((_, i) => v.map((__, j) => (Math.abs(i - j) === 1 ? weight : 0)));
    Array.from(applyChain(Float64Array.from(v), weight)).forEach((value, i) => close(value, multiply(dense, v)[i], 1e-15, `entry ${i}`));
  });

  it('the closed-form solution satisfies x = b + Ax', () => {
    const offsets = Array.from({ length: 41 }, (_, i) => i - 20);
    const x = chainSolution(weight, offsets);
    const Ax = applyChain(Float64Array.from(x), weight);
    for (let i = 1; i < offsets.length - 1; i += 1) close(x[i], (offsets[i] === 0 ? 1 : 0) + Ax[i], 1e-12, `i = ${offsets[i]}`);
  });

  it('the error after k steps is within ‖A‖^{k+1}‖b‖/(1 − ‖A‖), with ‖A‖_∞ = 0.9', () => {
    errors.forEach((error, k) => assert.ok(error <= errorBound(2 * weight, 1, k), `k = ${k}: ${error} vs ${errorBound(2 * weight, 1, k)}`));
    assert.ok(errors[60] < 1e-3, `k = 60: ${errors[60]}`);
  });

  it('the iterates agree with the dense direct solve on a chain long enough', () => {
    const n = 2 * count + 1;
    const dense = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (Math.abs(i - j) === 1 ? weight : 0)));
    const b = Array.from({ length: n }, (_, i) => (i === count ? 1 : 0));
    const sums = partialSums(dense, b, count);
    sums[count - 1].forEach((value, i) => close(value, terms.reduce((sum, term) => sum + term[i], 0), 1e-12, `entry ${i}`));
    const x = solve(dense, b);
    // The finite chain's solution differs from the closed form only by about r^count at its middle.
    close(x[count], chainSolution(weight, [0])[0], 1e-10, 'middle entry');
  });
});

describe('spectral view', () => {
  it('a matrix built from real eigenpairs has them', () => {
    const { A } = spectralMatrix(BASIS, { lambda: [0.8, 0.3] });
    [0.8, 0.3].forEach((lambda, i) => {
      const Av = multiply(A, BASIS[i]);
      Av.forEach((value, c) => close(value, lambda * BASIS[i][c], 1e-12, `v${i + 1}`));
    });
  });

  it('(I − A)^{-1} scales each eigenvector by 1/(1 − λ)', () => {
    const { A, eigenvalues } = spectralMatrix(BASIS, { lambda: [0.97, -0.5] });
    BASIS.forEach((v, i) => {
      const x = solve(A, v);
      x.forEach((value, c) => close(value, amplification(eigenvalues[i]) * v[c], 1e-9, `v${i + 1}`));
    });
  });

  it('a complex pair has the trace and determinant of r e^{±iθ}', () => {
    const { A } = spectralMatrix(BASIS, { modulus: 0.85, angle: 35 });
    close(A[0][0] + A[1][1], 2 * 0.85 * Math.cos(35 * Math.PI / 180), 1e-12, 'trace');
    close(A[0][0] * A[1][1] - A[0][1] * A[1][0], 0.85 ** 2, 1e-12, 'determinant');
  });

  it('components and combine are inverse', () => {
    const v = [0.3, -1.7];
    combine(BASIS, components(BASIS, v)).forEach((value, c) => close(value, v[c], 1e-12, `coordinate ${c}`));
  });
});
