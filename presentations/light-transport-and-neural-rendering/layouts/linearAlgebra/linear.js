/**
 * Linear algebra of x = b + Ax for small dense matrices (arrays of rows):
 * products, the direct solve, the partial sums of the Neumann series, and
 * the paths an entry of A^k sums over.
 */

/** A v. */
export function multiply(A, v) {
  return A.map((row) => row.reduce((sum, a, j) => sum + a * v[j], 0));
}

/** A B. */
export function matrixProduct(A, B) {
  return A.map((row) => B[0].map((_, j) => row.reduce((sum, a, m) => sum + a * B[m][j], 0)));
}

function identity(n) {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? 1 : 0)));
}

/** A^k, with A^0 = I. */
export function matrixPower(A, k) {
  let power = identity(A.length);
  for (let step = 0; step < k; step += 1) power = matrixProduct(A, power);
  return power;
}

/** The partial sum S_k = I + A + … + A^k of the Neumann series (S_0 = I). */
export function seriesSum(A, k) {
  let sum = identity(A.length);
  let power = sum;
  for (let step = 1; step <= k; step += 1) {
    power = matrixProduct(A, power);
    sum = sum.map((row, i) => row.map((value, j) => value + power[i][j]));
  }
  return sum;
}

/** (I − A)^{-1}, column by column with `solve`. Throws if I − A is singular. */
export function resolvent(A) {
  const columns = identity(A.length).map((unit) => solve(A, unit));
  return columns[0].map((_, i) => columns.map((column) => column[i]));
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

/** Partial sums x_k = b + Ab + … + A^k b for k = 0 … count − 1. */
export function partialSums(A, b, count) {
  const sums = [b];
  let term = b;
  while (sums.length < count) {
    term = multiply(A, term);
    const previous = sums[sums.length - 1];
    sums.push(previous.map((value, i) => value + term[i]));
  }
  return sums;
}
