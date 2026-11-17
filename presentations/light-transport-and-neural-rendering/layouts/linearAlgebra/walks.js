/**
 * Random walks for x = (I − A)^{-1} e that read entries of A one at a time
 * and never store it: the von Neumann–Ulam estimator (Forsythe and
 * Leibler, 1950) with Russian roulette. Path tracing is this estimator for
 * the rendering equation.
 *
 * A walk from node i hops to node j with probability A[i][j] and stops
 * with the remaining probability 1 − Σ_j A[i][j] (Russian roulette). It
 * collects e at every node it visits. The walk is at node j after k hops
 * with probability (A^k)[i][j], so the expected sum it collects is
 * Σ_k (A^k e)[i] = x[i]: the estimate is unbiased, and its error falls as
 * 1/√n with n walks. Every weight is 1 because the hop probabilities are
 * the entries of A; this needs every row of A to be nonnegative and to sum
 * to at most 1.
 */

/** A seeded uniform random number generator on [0, 1) (mulberry32). */
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function checkSubstochastic(A) {
  A.forEach((row, i) => {
    const sum = row.reduce((s, a) => s + a, 0);
    if (row.some((a) => a < 0) || sum > 1 + 1e-12) {
      throw new Error(`row ${i} of A must be nonnegative and sum to at most 1 (sums to ${sum})`);
    }
  });
}

/**
 * One walk from `start`. Returns the nodes it visits (`visits`, the start
 * first) and what it collected: `contributions` lists { hops, amount } for
 * every visit to a node with e ≠ 0, `hops` being the number of hops from
 * the start, which is the bounce order of that light at the start.
 */
export function randomWalk(A, e, start, random) {
  const visits = [start];
  const contributions = [];
  let current = start;
  for (;;) {
    const hops = visits.length - 1;
    if (e[current] !== 0) contributions.push({ hops, amount: e[current] });
    let r = random();
    let next = -1;
    for (let j = 0; j < A[current].length; j += 1) {
      r -= A[current][j];
      if (r < 0) {
        next = j;
        break;
      }
    }
    if (next < 0) break;
    visits.push(next);
    current = next;
  }
  return { visits, contributions };
}

/**
 * Run `count` walks from every node with independent seeded streams
 * (stream i depends only on `seed` and i, so the first n walks are the
 * same for every count ≥ n). Returns, per node:
 *
 * - `samples[i]`: each walk's collected light (Float64Array of `count`);
 * - `byOrder[i][k]`: each walk's collected light of bounce order k
 *   (orders ≥ `orders` − 1 in the last), Float64Arrays of `count`;
 * - `kept[i]`: the first `keep` walks, for drawing.
 */
export function runWalks(A, e, count, seed, { keep = 0, orders = 5 } = {}) {
  checkSubstochastic(A);
  const n = e.length;
  const samples = [];
  const byOrder = [];
  const kept = [];
  for (let i = 0; i < n; i += 1) {
    const random = seededRandom(seed * 7919 + i * 104729 + 1);
    const values = new Float64Array(count);
    const orderValues = Array.from({ length: orders }, () => new Float64Array(count));
    const walks = [];
    for (let w = 0; w < count; w += 1) {
      const walk = randomWalk(A, e, i, random);
      for (const { hops, amount } of walk.contributions) {
        values[w] += amount;
        orderValues[Math.min(hops, orders - 1)][w] += amount;
      }
      if (w < keep) walks.push(walk);
    }
    samples.push(values);
    byOrder.push(orderValues);
    kept.push(walks);
  }
  return { samples, byOrder, kept };
}

/**
 * The estimate from the first `n` samples of each node: the mean and its
 * standard error (sample standard deviation / √n; NaN for n < 2).
 */
export function estimate(samples, n) {
  return samples.map((values) => {
    let sum = 0;
    let squares = 0;
    for (let w = 0; w < n; w += 1) {
      sum += values[w];
      squares += values[w] * values[w];
    }
    const mean = sum / n;
    const variance = n > 1 ? Math.max(0, (squares - n * mean * mean) / (n - 1)) : NaN;
    return { mean, standardError: Math.sqrt(variance / n) };
  });
}

/**
 * The variance of one walk's collected light, per start node, given the
 * exact solution x: the second moment m satisfies
 * m = e² + 2 e ⊙ (A x) + A m, so the variance is m − x².
 * `solve` is the direct solver of (I − A) y = b.
 */
export function walkVariance(A, e, x, solve) {
  const Ax = A.map((row) => row.reduce((sum, a, j) => sum + a * x[j], 0));
  const source = e.map((ei, i) => ei * ei + 2 * ei * Ax[i]);
  const second = solve(A, source);
  return second.map((m, i) => Math.max(0, m - x[i] * x[i]));
}
