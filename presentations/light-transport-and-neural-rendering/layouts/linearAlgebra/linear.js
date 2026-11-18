/**
 * Linear algebra of x = b + Ax for small dense matrices (arrays of rows):
 * the product A v, the direct solve, the terms of the Neumann series
 * applied to b, and the fixed-point iterates.
 */

/** A v. */
export function multiply(A, v) {
  return A.map((row) => row.reduce((sum, a, j) => sum + a * v[j], 0));
}

/**
 * Solve (I − A) x = b by Gaussian elimination with partial pivoting.
 * Throws if I − A is singular.
 */
export function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row.map((a, j) => (i === j ? 1 : 0) - a), b[i]]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    }
    if (Math.abs(M[pivot][col]) < 1e-14) throw new Error('I − A is singular');
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let row = col + 1; row < n; row += 1) {
      const factor = M[row][col] / M[col][col];
      for (let j = col; j <= n; j += 1) M[row][j] -= factor * M[col][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row -= 1) {
    let sum = M[row][n];
    for (let j = row + 1; j < n; j += 1) sum -= M[row][j] * x[j];
    x[row] = sum / M[row][row];
  }
  return x;
}

/** The terms b, Ab, …, A^{count−1} b of the Neumann series applied to b. */
export function seriesTerms(A, b, count) {
  const terms = [b];
  while (terms.length < count) terms.push(multiply(A, terms[terms.length - 1]));
  return terms;
}

/**
 * The fixed-point iterates x_0 = `start`, x_{k+1} = b + A x_k, for
 * k = 0 … count. From x_0 = 0, x_{k+1} is the partial sum b + Ab + … + A^k b.
 */
export function fixedPointIterates(A, b, start, count) {
  const iterates = [start];
  while (iterates.length <= count) {
    const Ax = multiply(A, iterates[iterates.length - 1]);
    iterates.push(b.map((value, i) => value + Ax[i]));
  }
  return iterates;
}
