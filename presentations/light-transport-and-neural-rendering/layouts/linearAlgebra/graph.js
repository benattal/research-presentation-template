/**
 * A small example matrix for the slides on paths and random walks, and
 * where its graph is drawn. A[i][j] > 0 is an edge from node j to node i
 * of weight A[i][j]: x = e + Ax carries e_j along it, scaled by A[i][j].
 * Every row sums to at most 0.75, so the spectral radius is below 1 and
 * a random walk may hop with probabilities A[i][·] (walks.js).
 */

/** The example matrix, rows indexed by the node light arrives at. */
export const GRAPH_MATRIX = [
  [0, 0.25, 0, 0, 0.25],
  [0.3, 0, 0.25, 0, 0.2],
  [0.2, 0.25, 0, 0.25, 0],
  [0, 0, 0.3, 0, 0.3],
  [0.25, 0.2, 0, 0.3, 0],
];

/** The source: only node 1 has e ≠ 0. */
export const GRAPH_SOURCE = [1, 0, 0, 0, 0];

/**
 * Node positions in [0, 1] × [0, 1] (y down): a pentagon with node 1 at
 * the top, the others clockwise.
 */
export function nodePositions(count = GRAPH_MATRIX.length) {
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    return [0.5 + 0.42 * Math.cos(angle), 0.53 + 0.44 * Math.sin(angle)];
  });
}
