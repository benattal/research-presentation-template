/**
 * 2 × 2 matrices built from their spectrum, for the plane figures of the
 * linear algebra slides. Vectors are [x, y]; matrices are arrays of rows.
 *
 * A real spectrum gives A = V Λ V^{-1} with eigenvectors v1, v2 (the
 * columns of V) and eigenvalues λ1, λ2. A complex pair r e^{±iθ} gives
 * A = V (r R_θ) V^{-1}, R_θ the rotation by θ: in the basis (v1, v2), A
 * rotates by θ and scales by r, so its powers spiral.
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

/** V M V^{-1} for the basis (v1, v2) and a 2 × 2 matrix M in that basis. */
function inBasis([v1, v2], M) {
  const det = v1[0] * v2[1] - v2[0] * v1[1];
  if (Math.abs(det) < 1e-12) throw new Error('the basis vectors are parallel');
  const V = [[v1[0], v2[0]], [v1[1], v2[1]]];
  const inverse = [[v2[1] / det, -v2[0] / det], [-v1[1] / det, v1[0] / det]];
  const product = (P, Q) => P.map((row) => [0, 1].map((j) => row[0] * Q[0][j] + row[1] * Q[1][j]));
  return product(product(V, M), inverse);
}

/**
 * The matrix of a spectrum `spec` in the basis `basis`: `{ lambda: [λ1, λ2] }`
 * for real eigenvalues (eigenvectors `basis`), or `{ modulus, angle }` (angle
 * in degrees) for the complex pair modulus · e^{±i angle}. Returns `{ A,
 * eigenvalues }`, eigenvalues as [re, im] pairs.
 */
export function spectralMatrix(basis, spec) {
  if (spec.lambda) {
    const [l1, l2] = spec.lambda;
    return { A: inBasis(basis, [[l1, 0], [0, l2]]), eigenvalues: [[l1, 0], [l2, 0]] };
  }
  const theta = spec.angle * Math.PI / 180;
  const c = spec.modulus * Math.cos(theta);
  const s = spec.modulus * Math.sin(theta);
  return { A: inBasis(basis, [[c, -s], [s, c]]), eigenvalues: [[c, s], [c, -s]] };
}

/** |1 / (1 − λ)| for an eigenvalue λ = [re, im]: how much (I − A)^{-1} scales its eigenvector. */
export function amplification([re, im]) {
  return 1 / Math.hypot(1 - re, im);
}
