/**
 * 2 × 2 matrices built from their spectrum, for the plane figures of the
 * linear algebra slides. Vectors are [x, y]; matrices are arrays of rows.
 * A = V Λ V^{-1} has eigenvectors v1, v2 (the columns of V) and real
 * eigenvalues λ1, λ2.
 */

/** v scaled to length 1. */
export function normalize([x, y]) {
  const length = Math.hypot(x, y);
  if (length === 0) throw new Error('cannot normalize the zero vector');
  return [x / length, y / length];
}

/** The coefficients c with c[0] v1 + c[1] v2 = v. */
export function components([v1, v2], [x, y]) {
  const det = v1[0] * v2[1] - v2[0] * v1[1];
  if (Math.abs(det) < 1e-12) throw new Error('the basis vectors are parallel');
  return [(x * v2[1] - y * v2[0]) / det, (v1[0] * y - v1[1] * x) / det];
}

/** c[0] v1 + c[1] v2. */
export function combine([v1, v2], [c1, c2]) {
  return [c1 * v1[0] + c2 * v2[0], c1 * v1[1] + c2 * v2[1]];
}

/** The matrix V diag(λ1, λ2) V^{-1} with eigenvectors `basis` [v1, v2] and eigenvalues `lambda` [λ1, λ2]. */
export function spectralMatrix([v1, v2], [l1, l2]) {
  const det = v1[0] * v2[1] - v2[0] * v1[1];
  if (Math.abs(det) < 1e-12) throw new Error('the basis vectors are parallel');
  const V = [[v1[0], v2[0]], [v1[1], v2[1]]];
  const inverse = [[v2[1] / det, -v2[0] / det], [-v1[1] / det, v1[0] / det]];
  const product = (P, Q) => P.map((row) => [0, 1].map((j) => row[0] * Q[0][j] + row[1] * Q[1][j]));
  return product(product(V, [[l1, 0], [0, l2]]), inverse);
}

/**
 * b split along the eigenvectors `basis` of the matrix with eigenvalues
 * `lambda` (each |λ_i| < 1): `parts` are the components c_i v_i of b, and
 * `limits` the components c_i / (1 − λ_i) v_i of (I − A)^{-1} b, the sums
 * of the geometric series c_i (1 + λ_i + λ_i² + …) v_i.
 */
export function eigenParts(basis, lambda, b) {
  lambda.forEach((l) => {
    if (!(Math.abs(l) < 1)) throw new Error(`eigenParts: |λ| = ${Math.abs(l)} is not below 1`);
  });
  const c = components(basis, b);
  const along = (i, scale) => combine(basis, i === 0 ? [c[0] * scale, 0] : [0, c[1] * scale]);
  return {
    parts: [0, 1].map((i) => along(i, 1)),
    limits: [0, 1].map((i) => along(i, 1 / (1 - lambda[i]))),
  };
}
