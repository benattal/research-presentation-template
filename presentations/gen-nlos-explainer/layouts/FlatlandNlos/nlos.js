/**
 * Flatland NLOS for the reconstruction slide: a 2D cross-section of a scene
 * scanned two ways (a planar relay wall on a uniform grid, and the visible
 * surfaces where the pixels of a lidar land), confocal measurements of a
 * hidden vase, the sparse forward operator of a grid over the hidden
 * region, and CGLS. Pure (no React or DOM), so `node` can run it.
 *
 * Units: the room is 1 unit wide. Time is the round-trip path length from a
 * scan point, d = c t, so the points a confocal measurement at time d
 * integrates over lie on a circle of radius d / 2 around the scan point. In
 * 2D, light from a point falls off as 1 / r, so a round trip falls off as
 * 1 / r².
 *
 * The measurements are simulated from the hidden object's surface: every
 * point of its outline that a scan point sees (past the room, the occluder,
 * and the object itself) returns light at the time of its round trip. The
 * reconstruction uses the usual volumetric model: the hidden region is a
 * grid of isotropic scatterers, each seen by a scan point when nothing
 * known (the room, the occluder) lies between them. It therefore recovers
 * the surfaces of the hidden object that face the relays.
 */

/** A segment from `a` to `b`; its normal is on the right of a → b (the open side). */
function segment(a, b, role) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  return { a, b, role, length, normal: [dy / length, -dx / length] };
}

/** The edges of a polygon listed counterclockwise, so normals point out. */
function polygon(points, role) {
  return points.map((a, i) => segment(a, points[(i + 1) % points.length], role));
}

/** A smooth curve through `points` (Catmull-Rom), `steps` points per span, both ends included. */
function smoothCurve(points, steps) {
  const at = (i) => points[Math.min(points.length - 1, Math.max(0, i))];
  const curve = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let k = 0; k < steps; k += 1) {
      const t = k / steps;
      curve.push([0, 1].map((c) => 0.5 * (
        2 * p1[c] + (p2[c] - p0[c]) * t
        + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t * t
        + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t * t * t
      )));
    }
  }
  curve.push(points[points.length - 1]);
  return curve;
}

/** The scene's frame, for drawing: the floor is at y = 0, the back wall at x = 1. */
export const FRAME = { x: [-0.02, 1.02], y: [-0.02, 1.02] };

/**
 * The lidar, above the occluder's height at the left: its position, and
 * the scan of its mirrors, `pixels` directions in equal steps of angle
 * from `top` to `bottom` (radians from +x).
 */
export const LIDAR = { position: [0.05, 0.82], top: 0.44, bottom: -1.375, pixels: 64 };

/** The occluder: a visible object on the floor, between the lidar and the hidden object. */
const OCCLUDER = polygon([[0.27, 0], [0.37, 0], [0.37, 0.5], [0.27, 0.5]], 'occluder');

/**
 * The hidden object: a vase behind the occluder, below the lidar's line of
 * sight over it. `profile` is the right half of its outline from the base
 * to the rim, as [half-width, height].
 */
const VASE = {
  center: 0.525,
  profile: [[0.044, 0], [0.074, 0.05], [0.085, 0.105], [0.074, 0.16], [0.048, 0.2], [0.03, 0.224], [0.03, 0.246], [0.045, 0.27]],
};
const VASE_SIDE = smoothCurve(VASE.profile, 6);
const HIDDEN = polygon([
  ...VASE_SIDE.map(([halfWidth, y]) => [VASE.center + halfWidth, y]),
  ...VASE_SIDE.map(([halfWidth, y]) => [VASE.center - halfWidth, y]).reverse(),
], 'hidden');

/** The floor, walked right to left so its normal points up. */
const FLOOR = segment([1, 0], [0, 0], 'floor');

/**
 * The two settings' surfaces, walked so their normals face the room: a
 * planar relay wall, and a back wall with a slanted wall above it.
 */
export const SETUPS = {
  planar: {
    surfaces: [FLOOR, segment([1, 1], [1, 0], 'wall')],
  },
  nonplanar: {
    surfaces: [FLOOR, segment([1, 0.5], [1, 0], 'wall'), segment([0.4, 1], [1, 0.5], 'wall')],
  },
};
for (const setup of Object.values(SETUPS)) {
  /** What the reconstruction knows: everything but the hidden object. */
  setup.known = [...setup.surfaces, ...OCCLUDER];
  setup.all = [...setup.known, ...HIDDEN];
}

export const OCCLUDER_OUTLINE = OCCLUDER.map((edge) => edge.a);
export const HIDDEN_OUTLINE = HIDDEN.map((edge) => edge.a);

/**
 * The grid over the hidden region: `n` × `n` square cells covering
 * [x0, x0 + size] × [y0, y0 + size]; cell (i, j) is column i from the left
 * and row j from the floor, stored at j * n + i.
 */
export const GRID = { x0: 0.38, y0: 0, size: 0.29, n: 96 };
const CELL = GRID.size / GRID.n;

/** A time bin: one cell of radius, so two cells of round-trip path. */
export const BIN = 2 * CELL;

/** The planar setting's scan points: a uniform grid on the wall, listed from the top. */
const PLANAR_GRID = { x: 1, top: 0.92, bottom: 0.08, count: 13 };

/** CGLS iterations computed for the slide. */
export const ITERATIONS = 24;

const EPSILON = 1e-7;

/** Distance along the ray o + t d (d a unit vector) to the segment, or Infinity. */
function rayHit(o, d, seg) {
  const ex = seg.b[0] - seg.a[0];
  const ey = seg.b[1] - seg.a[1];
  const denom = d[0] * ey - d[1] * ex;
  if (Math.abs(denom) < 1e-12) return Infinity;
  const ax = seg.a[0] - o[0];
  const ay = seg.a[1] - o[1];
  const t = (ax * ey - ay * ex) / denom;
  const u = (ax * d[1] - ay * d[0]) / denom;
  return t > EPSILON && u >= 0 && u <= 1 ? t : Infinity;
}

/** The nearest of `segments` along a ray, and the distance to it. */
function castRay(o, d, segments) {
  let best = { distance: Infinity, segment: null };
  for (const seg of segments) {
    const t = rayHit(o, d, seg);
    if (t < best.distance) best = { distance: t, segment: seg };
  }
  return best;
}

/** True when none of `segments` lies strictly between p and q. */
export function visible(p, q, segments) {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const length = Math.hypot(dx, dy);
  const d = [dx / length, dy / length];
  for (const seg of segments) {
    if (rayHit(p, d, seg) < length * (1 - 1e-6)) return false;
  }
  return true;
}

/**
 * Where a setting is scanned: `{ point, normal }` for each scan
 * point. The planar setting's points are a uniform grid on its wall. The
 * nonplanar setting's points are where the lidar's pixels land, in pixel
 * order from the top, so their spacing follows each surface's distance and
 * slant.
 */
export function scanPoints(name) {
  if (name === 'planar') {
    const { x, top, bottom, count } = PLANAR_GRID;
    return Array.from({ length: count }, (_, i) => ({
      point: [x, top + ((bottom - top) * i) / (count - 1)],
      normal: [-1, 0],
    }));
  }
  const points = [];
  for (let k = 0; k < LIDAR.pixels; k += 1) {
    const angle = LIDAR.top + ((LIDAR.bottom - LIDAR.top) * k) / (LIDAR.pixels - 1);
    const d = [Math.cos(angle), Math.sin(angle)];
    const hit = castRay(LIDAR.position, d, SETUPS[name].all);
    if (!hit.segment) throw new Error('flatland NLOS: a lidar pixel lands on no surface');
    if (hit.segment.role === 'hidden') throw new Error('flatland NLOS: a lidar pixel sees the hidden object');
    points.push({
      point: [LIDAR.position[0] + d[0] * hit.distance, LIDAR.position[1] + d[1] * hit.distance],
      normal: hit.segment.normal,
    });
  }
  return points;
}

/**
 * The confocal round trip from `scan` to `q`: the distance r, and the
 * weight cos² θ / r² (the relay's Lambertian cosine both ways, the 2D
 * falloff both ways), 0 behind the relay.
 */
export function roundTrip(scan, q) {
  const dx = q[0] - scan.point[0];
  const dy = q[1] - scan.point[1];
  const r = Math.hypot(dx, dy);
  const cosine = (scan.normal[0] * dx + scan.normal[1] * dy) / r;
  return { r, weight: cosine > 0 ? (cosine * cosine) / (r * r) : 0 };
}

function cellCenter(v) {
  return [GRID.x0 + ((v % GRID.n) + 0.5) * CELL, GRID.y0 + (Math.floor(v / GRID.n) + 0.5) * CELL];
}

/**
 * The sparse forward operator A of a setting, from the grid to the
 * measurements: each cell adds to one time bin per scan point,
 * round(2 r / BIN), with the round trip's weight, when the scan point sees
 * the cell's center past the known geometry. Stored per scan point as the
 * cells it sees (`cells[s]`) with their bins and weights.
 */
export function forwardOperator(name, scans) {
  const known = SETUPS[name].known;
  const count = GRID.n * GRID.n;
  const cells = [];
  const bins = [];
  const weights = [];
  let lastBin = 0;
  for (const scan of scans) {
    const seen = [];
    const binOf = [];
    const weightOf = [];
    for (let v = 0; v < count; v += 1) {
      const center = cellCenter(v);
      const { r, weight } = roundTrip(scan, center);
      if (weight === 0 || !visible(scan.point, center, known)) continue;
      const bin = Math.round((2 * r) / BIN);
      seen.push(v);
      binOf.push(bin);
      weightOf.push(weight);
      lastBin = Math.max(lastBin, bin);
    }
    cells.push(Int32Array.from(seen));
    bins.push(Int32Array.from(binOf));
    weights.push(Float64Array.from(weightOf));
  }
  return { cells, bins, weights, scans: scans.length, count, timeBins: lastBin + 1 };
}

/** y = A x: one row of `op.timeBins` bins per scan point. */
export function applyForward(op, x) {
  const y = new Float64Array(op.scans * op.timeBins);
  for (let s = 0; s < op.scans; s += 1) {
    const cells = op.cells[s];
    const bins = op.bins[s];
    const weights = op.weights[s];
    const row = s * op.timeBins;
    for (let i = 0; i < cells.length; i += 1) y[row + bins[i]] += weights[i] * x[cells[i]];
  }
  return y;
}

/** x = Aᵀ y, or with `onlyScan` the backprojection of that scan point's row alone. */
export function applyAdjoint(op, y, onlyScan = null) {
  const x = new Float64Array(op.count);
  for (let s = 0; s < op.scans; s += 1) {
    if (onlyScan !== null && s !== onlyScan) continue;
    const cells = op.cells[s];
    const bins = op.bins[s];
    const weights = op.weights[s];
    const row = s * op.timeBins;
    for (let i = 0; i < cells.length; i += 1) x[cells[i]] += weights[i] * y[row + bins[i]];
  }
  return x;
}

/** Points along the hidden object's outline, about `spacing` apart, each with the length of outline it stands for. */
export function hiddenSurface(spacing) {
  const samples = [];
  for (const edge of HIDDEN) {
    // The base rests on the floor and reflects nothing.
    if (edge.a[1] === 0 && edge.b[1] === 0) continue;
    const count = Math.max(1, Math.round(edge.length / spacing));
    for (let k = 0; k < count; k += 1) {
      const t = (k + 0.5) / count;
      samples.push({
        point: [edge.a[0] + (edge.b[0] - edge.a[0]) * t, edge.a[1] + (edge.b[1] - edge.a[1]) * t],
        length: edge.length / count,
      });
    }
  }
  return samples;
}

/**
 * The confocal measurements b of a setting's scan points: one row of
 * `timeBins` bins per scan point. Each point of the hidden outline that a
 * scan point sees, past everything in the scene, adds its length of
 * outline (in cells) times the round trip's weight to the bin of its round
 * trip; returns later than the last bin are dropped.
 */
export function measure(name, scans, timeBins) {
  const all = SETUPS[name].all;
  const surface = hiddenSurface(CELL / 4);
  const b = new Float64Array(scans.length * timeBins);
  scans.forEach((scan, s) => {
    for (const { point, length } of surface) {
      const { r, weight } = roundTrip(scan, point);
      if (weight === 0) continue;
      const bin = Math.round((2 * r) / BIN);
      if (bin >= timeBins || !visible(scan.point, point, all)) continue;
      b[s * timeBins + bin] += (weight * length) / CELL;
    }
  });
  return b;
}

const dot = (u, v) => {
  let sum = 0;
  for (let i = 0; i < u.length; i += 1) sum += u[i] * v[i];
  return sum;
};

/**
 * The weight of each time bin in the least-squares problem: d², which
 * undoes the round trip's 1 / r² falloff, so far scan points and near ones
 * count alike (the usual compensation in confocal NLOS).
 */
export function binWeights(op) {
  return Float64Array.from({ length: op.timeBins }, (_, k) => (k * BIN) ** 2);
}

/** y ⊙ D, with D the bin weights repeated for every scan point's row. */
function weighRows(op, weights, y) {
  const out = new Float64Array(y.length);
  for (let m = 0; m < y.length; m += 1) out[m] = y[m] * weights[m % op.timeBins];
  return out;
}

/**
 * CGLS on min ‖D (A x − b)‖² from x = 0, D the bin weights: the iterates
 * x_1 … x_iterations as Float32Arrays. x_1 is Aᵀ D² b, scaled.
 */
export function cgls(op, b, weights, iterations) {
  const x = new Float64Array(op.count);
  const r = weighRows(op, weights, b);
  let s = applyAdjoint(op, weighRows(op, weights, r));
  const p = Float64Array.from(s);
  let gamma = dot(s, s);
  const iterates = [];
  for (let k = 0; k < iterations; k += 1) {
    const q = weighRows(op, weights, applyForward(op, p));
    const alpha = gamma / dot(q, q);
    for (let v = 0; v < x.length; v += 1) x[v] += alpha * p[v];
    for (let m = 0; m < r.length; m += 1) r[m] -= alpha * q[m];
    s = applyAdjoint(op, weighRows(op, weights, r));
    const next = dot(s, s);
    const beta = next / gamma;
    gamma = next;
    for (let v = 0; v < p.length; v += 1) p[v] = s[v] + beta * p[v];
    iterates.push(Float32Array.from(x));
  }
  return iterates;
}

/**
 * Everything the slide draws, computed on first use and kept for the
 * page's lifetime (deterministic): both settings' scan points, the
 * nonplanar setting's operator and measurements b, the bin weights D, each
 * scan point's weighted backprojection (they sum to Aᵀ D² b), and the CGLS
 * iterates.
 */
let solved = null;
export function flatlandNlos() {
  if (solved) return solved;
  const planar = scanPoints('planar');
  const scans = scanPoints('nonplanar');
  const op = forwardOperator('nonplanar', scans);
  const b = measure('nonplanar', scans, op.timeBins);
  const weights = binWeights(op);
  const weighted = weighRows(op, weights, weighRows(op, weights, b));
  const backprojections = scans.map((_, s) => Float32Array.from(applyAdjoint(op, weighted, s)));
  const iterates = cgls(op, b, weights, ITERATIONS);
  solved = { planar, scans, op, b, weights, backprojections, iterates };
  return solved;
}
