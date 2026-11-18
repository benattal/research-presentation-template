/**
 * The linear algebra of the Neumann series section: the series telescopes
 * and converges to the direct solve within its error bound, the fixed-point
 * iterates from 0 are its partial sums, the slides share one example matrix
 * and source, the iteration on the large sparse chain stays within the
 * bound, and a matrix built from a spectrum has that spectrum.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { applyChain, chainErrors, chainSolution, chainTerms, errorBound } from '../layouts/linearAlgebra/chain.js';
import { fixedPointIterates, multiply, seriesTerms, solve } from '../layouts/linearAlgebra/linear.js';
import { combine, components, eigenParts, normalize, spectralMatrix } from '../layouts/linearAlgebra/plane.js';

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

/** The partial sums b, b + Ab, …, b + Ab + … + A^{count−1} b: the fixed-point iterates x_1 … x_count from x_0 = 0. */
const partialSums = (A, b, count) => fixedPointIterates(A, b, b.map(() => 0), count).slice(1);

/** Matrices for checking the identities of the Neumann series slide: I, A B, A^k, S_k = I + … + A^k, and (I − A)^{-1}. */
const identity = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? 1 : 0)));
const matrixProduct = (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((sum, a, m) => sum + a * B[m][j], 0)));
const matrixPower = (A, k) => Array.from({ length: k }).reduce((power) => matrixProduct(A, power), identity(A.length));
const seriesSum = (A, k) => Array.from({ length: k + 1 }, (_, j) => matrixPower(A, j))
  .reduce((sum, power) => sum.map((row, i) => row.map((value, j) => value + power[i][j])));
const resolvent = (A) => {
  const columns = identity(A.length).map((unit) => solve(A, unit));
  return columns[0].map((_, i) => columns.map((column) => column[i]));
};

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
  const A = spectralMatrix([[2, 1], [-1, 2]].map(normalize), [0.8, 0.3]);
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

  it('are the fixed-point iterates from 0: x_{k+1} = b + Ab + … + A^k b', () => {
    const b = [0, 1];
    const terms = seriesTerms(A, b, 12);
    fixedPointIterates(A, b, [0, 0], 12).forEach((x, k) => {
      const sum = terms.slice(0, k).reduce((tip, term) => tip.map((value, i) => value + term[i]), [0, 0]);
      x.forEach((value, i) => close(value, sum[i], 1e-12, `x_${k}, entry ${i}`));
    });
  });

  it('leave the next term as the residual: b − (I − A) S_k b = A^{k+1} b', () => {
    const b = [0, 1];
    const terms = seriesTerms(A, b, 10);
    partialSums(A, b, 9).forEach((sum, k) => {
      const Asum = multiply(A, sum);
      const residual = b.map((value, i) => value - sum[i] + Asum[i]);
      residual.forEach((value, i) => close(value, terms[k + 1][i], 1e-12, `k = ${k}, entry ${i}`));
    });
  });
});

describe('the example matrix of the slides', () => {
  const read = (id) => JSON.parse(readFileSync(new URL(`../slides/${id}/content.json`, import.meta.url), 'utf8'));
  const slides = ['la-fixed-point', 'la-neumann', 'la-spectral', 'la-iteration'].map((id) => ({ id, slide: read(id) }));

  it('is the same A and b on every plane slide, the divider, the outline, and the summary', () => {
    const [first, ...rest] = slides;
    assert.deepEqual(first.slide.lambda, [0.8, 0.3]);
    assert.deepEqual(first.slide.b, [0, 1]);
    const divider = read('la-divider').iterates;
    assert.ok(divider, 'the divider draws the Neumann series iterates');
    const pictures = ['roadmap', 'summary'].map((id) => {
      const row = read(id).sections.find((section) => section.iterates);
      assert.ok(row, `${id} draws the Neumann series iterates`);
      return { id, slide: row.iterates };
    });
    [...rest, { id: 'la-divider', slide: divider }, ...pictures].forEach(({ id, slide }) => {
      assert.deepEqual(slide.eigenvectors, first.slide.eigenvectors, `${id} eigenvectors`);
      assert.deepEqual(slide.lambda, first.slide.lambda, `${id} lambda`);
      assert.deepEqual(slide.b, first.slide.b, `${id} b`);
    });
  });

  it('is A = [[0.7, 0.2], [0.2, 0.4]], symmetric with ‖A‖₂ = ρ(A) = 0.8', () => {
    const A = spectralMatrix(slides[0].slide.eigenvectors.map(normalize), slides[0].slide.lambda);
    [[0.7, 0.2], [0.2, 0.4]].forEach((row, i) => row.forEach((value, j) => close(A[i][j], value, 1e-12, `(${i}, ${j})`)));
  });

  it('the trial x of the fixed-point slide lies off both eigenvectors, so Ax is not drawn parallel to x', () => {
    const { slide } = slides[0];
    const A = spectralMatrix(slide.eigenvectors.map(normalize), slide.lambda);
    const x = slide.trial;
    const Ax = multiply(A, x);
    const degrees = Math.abs(Math.atan2(Ax[1], Ax[0]) - Math.atan2(x[1], x[0])) * 180 / Math.PI;
    assert.ok(degrees > 10, `x and Ax are ${degrees.toFixed(1)}° apart`);
  });

  it('the iterates of the fixed-point slide end close to the solution', () => {
    const { slide } = slides[0];
    const A = spectralMatrix(slide.eigenvectors.map(normalize), slide.lambda);
    const { updates } = slide.buildSteps.find((step) => step.show === 'iterate');
    const last = fixedPointIterates(A, slide.b, slide.trial, updates)[updates];
    const x = solve(A, slide.b);
    assert.ok(Math.hypot(last[0] - x[0], last[1] - x[1]) < 0.06, `x_${updates} = ${last} vs ${x}`);
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

  it('the error of x_k from x_0 = 0 is within ‖A‖^k‖b‖/(1 − ‖A‖), with ‖A‖_∞ = 0.9', () => {
    assert.equal(errors.length, count + 1);
    close(errors[0], chainSolution(weight, [0])[0], 1e-12, 'x_0 = 0: the error is ‖x‖');
    errors.forEach((error, k) => assert.ok(error <= errorBound(2 * weight, 1, k), `k = ${k}: ${error} vs ${errorBound(2 * weight, 1, k)}`));
    assert.ok(errors[count] < 1e-3, `k = ${count}: ${errors[count]}`);
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
    const A = spectralMatrix(BASIS, [0.8, 0.3]);
    [0.8, 0.3].forEach((lambda, i) => {
      const Av = multiply(A, BASIS[i]);
      Av.forEach((value, c) => close(value, lambda * BASIS[i][c], 1e-12, `v${i + 1}`));
    });
  });

  it('(I − A)^{-1} scales each eigenvector by 1/(1 − λ)', () => {
    const lambda = [0.97, -0.5];
    const A = spectralMatrix(BASIS, lambda);
    BASIS.forEach((v, i) => {
      const x = solve(A, v);
      x.forEach((value, c) => close(value, v[c] / (1 - lambda[i]), 1e-9, `v${i + 1}`));
    });
  });

  it('b is the sum of its eigencomponents, and their limits sum to (I − A)^{-1} b', () => {
    const lambda = [0.8, 0.3];
    const b = [0, 1];
    const { parts, limits } = eigenParts(BASIS, lambda, b);
    const sum = (u, v) => [u[0] + v[0], u[1] + v[1]];
    sum(...parts).forEach((value, c) => close(value, b[c], 1e-12, `b, coordinate ${c}`));
    const x = solve(spectralMatrix(BASIS, lambda), b);
    sum(...limits).forEach((value, c) => close(value, x[c], 1e-12, `x, coordinate ${c}`));
  });

  it('components and combine are inverse', () => {
    const v = [0.3, -1.7];
    combine(BASIS, components(BASIS, v)).forEach((value, c) => close(value, v[c], 1e-12, `coordinate ${c}`));
  });
});
