/**
 * A large sparse example for the iteration slide, whose data give N and
 * the weight: the N × N matrix with `weight` beside the diagonal and zeros
 * elsewhere, applied as the function (Av)_i = weight · (v_{i−1} + v_{i+1})
 * and never stored. The source b is a single 1 in the middle of the chain
 * (index 0 below; indices run from −N/2).
 *
 * A^j b is zero beyond |i| = j, so the terms and iterates for j ≤ k are
 * computed exactly on a window of half-width k + 1 for any N > 2k + 2. The
 * solution x = (I − A)^{-1} b is c r^{|i|} (`chainSolution`), exact for the
 * infinite chain; for N = 10^6 it differs from the finite chain's solution
 * by about r^{N/2}, far below double precision.
 */

/** (Av)_i = weight · (v_{i−1} + v_{i+1}) with zeros beyond the ends of `v`. */
export function applyChain(v, weight) {
  const n = v.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) out[i] = weight * ((i > 0 ? v[i - 1] : 0) + (i < n - 1 ? v[i + 1] : 0));
  return out;
}

/**
 * The terms A^j b for j = 0 … count − 1 on the window of indices
 * −count … count (Float64Arrays of 2 count + 1, index `count` is i = 0).
 */
export function chainTerms(weight, count) {
  if (!Number.isInteger(count) || count < 1) throw new Error('chainTerms: count must be a positive integer');
  const b = new Float64Array(2 * count + 1);
  b[count] = 1;
  const terms = [b];
  while (terms.length < count) terms.push(applyChain(terms[terms.length - 1], weight));
  return terms;
}

/**
 * The solution x_i = c r^{|i|} of x = b + Ax on the infinite chain, for
 * the indices `offsets`: r = (1 − √(1 − 4w²)) / (2w) solves w r² − r + w = 0
 * (the rows away from i = 0), and c = 1 / (1 − 2wr) satisfies row 0.
 * Needs 0 < w < 1/2.
 */
export function chainSolution(weight, offsets) {
  if (!(weight > 0 && weight < 0.5)) throw new Error('chainSolution: weight must lie in (0, 1/2)');
  const r = (1 - Math.sqrt(1 - 4 * weight * weight)) / (2 * weight);
  const c = 1 / (1 - 2 * weight * r);
  return offsets.map((i) => c * r ** Math.abs(i));
}

/**
 * The error ‖x − x_k‖_∞ of each iterate of x_{k+1} = b + A x_k from
 * x_0 = 0, x_k = b + Ab + … + A^{k−1} b, for k = 0 … terms.length (x_0 = 0
 * has error ‖x‖_∞). Beyond the window x_k is zero and x falls with |i|, so
 * the largest error lies inside the window.
 */
export function chainErrors(terms, weight) {
  const half = (terms[0].length - 1) / 2;
  const offsets = Array.from(terms[0], (_, index) => index - half);
  const x = chainSolution(weight, offsets);
  const sum = new Float64Array(terms[0].length);
  const largest = () => sum.reduce((error, value, i) => Math.max(error, Math.abs(x[i] - value)), 0);
  return [largest(), ...terms.map((term) => {
    term.forEach((value, i) => { sum[i] += value; });
    return largest();
  })];
}

/**
 * The bound ‖x − x_k‖ ≤ ‖A‖^k ‖b‖ / (1 − ‖A‖) on the iterate x_k of
 * x_{k+1} = b + A x_k from x_0 = 0, for ‖A‖ < 1: x − x_k is the series'
 * tail A^k b + A^{k+1} b + ….
 */
export function errorBound(normA, normB, k) {
  if (!(normA < 1)) throw new Error('errorBound: needs ‖A‖ < 1');
  return normA ** k * normB / (1 - normA);
}
