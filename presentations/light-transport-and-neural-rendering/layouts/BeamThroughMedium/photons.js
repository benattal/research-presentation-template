/**
 * Photons crossing a slab of participating medium in 2D: a beam entering
 * from the left, light emitted inside the slab, and a lamp shining into it
 * from above. Each term of the radiative transfer equation switches on one
 * physical process, and the simulation is plain Monte Carlo transport:
 * exponential free flights with σₜ = σₐ + σₛ, absorption with probability
 * σₐ/σₜ, isotropic scattering otherwise.
 *
 * World units: the panel spans x ∈ [0, PANEL.width], y ∈ [0, PANEL.height];
 * σ is per world unit; time is in seconds of animation.
 */
import { createRandom } from '../volume/random.js';

export const PANEL = { width: 4, height: 1.8 };
/** The slab of medium: thickness d = end − start along the beam, from bottom to top across it. */
export const SLAB = { start: 1.5, end: 2.5, bottom: 0.4, top: 1.4 };
export const BEAM = { y: 0.9, halfWidth: 0.05 };
/** The lamp above the slab: its position and the half-angle of its cone around straight down. */
export const LAMP = { x: 2.05, y: PANEL.height - 0.08, halfAngle: 0.3 };
/** Photon speed in world units per second. */
export const SPEED = 1.5;
/**
 * A scattering counts as in-scattering into the beam when it happens within
 * this distance of the beam's axis and sends the photon within this angle
 * (radians) of the beam's direction.
 */
export const IN_SCATTER = { band: 0.2, angle: 0.35 };

const MAX_EVENTS = 64;

/**
 * Where the ray from (x, y) along (dx, dy) is inside the slab: the
 * distances [enter, exit] along it, empty when enter > exit.
 */
function slabInterval(x, y, dx, dy) {
  let enter = -Infinity;
  let exit = Infinity;
  for (const [p, d, low, high] of [[x, dx, SLAB.start, SLAB.end], [y, dy, SLAB.bottom, SLAB.top]]) {
    if (d === 0) {
      if (p < low || p > high) return [Infinity, -Infinity];
      continue;
    }
    const a = (low - p) / d;
    const b = (high - p) / d;
    enter = Math.max(enter, Math.min(a, b));
    exit = Math.min(exit, Math.max(a, b));
  }
  return [enter, exit];
}

function distanceToPanelEdge(x, y, dx, dy) {
  const tx = dx > 0 ? (PANEL.width - x) / dx : dx < 0 ? -x / dx : Infinity;
  const ty = dy > 0 ? (PANEL.height - y) / dy : dy < 0 ? -y / dy : Infinity;
  return Math.min(tx, ty);
}

/**
 * Follow one photon from `origin` in `direction` until it is absorbed or
 * leaves the panel. Returns its polyline, the number of scatterings before
 * each segment, how it ended, and the index of the segment that starts with
 * an in-scattering into the beam (−1 if none).
 */
function trace(origin, direction, medium, random) {
  let [x, y] = origin;
  let [dx, dy] = direction;
  let inSlab = x > SLAB.start && x < SLAB.end && y > SLAB.bottom && y < SLAB.top;
  let bounces = 0;
  const points = [[x, y]];
  const segmentBounces = [];
  let inScattered = -1;
  const move = (distance) => {
    x += dx * distance;
    y += dy * distance;
    points.push([x, y]);
    segmentBounces.push(bounces);
  };
  for (let event = 0; event < MAX_EVENTS; event += 1) {
    const edge = distanceToPanelEdge(x, y, dx, dy);
    const [enter, exit] = slabInterval(x, y, dx, dy);
    if (!inSlab) {
      // A ray that only grazes the slab (or sits on the face it is leaving) does not enter it.
      const entry = enter >= 0 && exit - enter > 1e-9 ? enter : Infinity;
      if (edge <= entry) {
        move(edge);
        return { points, segmentBounces, fate: 'escaped', inScattered };
      }
      move(entry);
      inSlab = true;
      continue;
    }
    const boundary = Math.max(0, exit);
    const free = medium.extinction > 0 ? -Math.log(1 - random()) / medium.extinction : Infinity;
    if (free < Math.min(boundary, edge)) {
      move(free);
      if (random() < medium.absorption / medium.extinction) {
        return { points, segmentBounces, fate: 'absorbed', inScattered };
      }
      const angle = 2 * Math.PI * random() - Math.PI;
      dx = Math.cos(angle);
      dy = Math.sin(angle);
      bounces += 1;
      if (inScattered < 0 && Math.abs(y - BEAM.y) < IN_SCATTER.band && Math.abs(angle) < IN_SCATTER.angle) {
        inScattered = segmentBounces.length;
      }
      continue;
    }
    if (edge <= boundary) {
      move(edge);
      return { points, segmentBounces, fate: 'escaped', inScattered };
    }
    move(boundary);
    inSlab = false;
  }
  return { points, segmentBounces, fate: 'absorbed', inScattered };
}

/** Cumulative path length at each point of a polyline, in world units. */
function arcLengths(points) {
  const lengths = [0];
  for (let i = 1; i < points.length; i += 1) {
    lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  return lengths;
}

/**
 * Simulate the slab with the transfer equation's terms switched on by
 * `terms` (`{ absorption, outScattering, emission, inScattering }`, each a
 * boolean): absorption uses σₐ = `absorption`, out-scattering σₛ =
 * `scattering` (a switched-off term contributes zero), emission makes
 * photons inside the slab at a rate proportional to σₐ, and in-scattering
 * adds the lamp, whose light the medium scatters into the beam.
 *
 * Returns the photons (`{ kind: 'beam' | 'emitted' | 'lamp', start,
 * points, lengths, segmentBounces, fate, inScattered, ballistic }`, times in
 * seconds) and the check: the fraction of beam photons that cross the slab
 * without interacting, its standard error, and exp(−σₜd).
 */
export function simulateSlab({
  absorption, scattering, terms, seed, beamCount = 700, emissionRate = 140, lampCount = 1500,
}) {
  const random = createRandom(seed);
  const sigmaA = terms.absorption ? absorption : 0;
  const sigmaS = terms.outScattering ? scattering : 0;
  const medium = { absorption: sigmaA, extinction: sigmaA + sigmaS };
  const photons = [];
  const launch = (kind, start, origin, direction) => {
    const path = trace(origin, direction, medium, random);
    photons.push({ kind, start, ...path, lengths: arcLengths(path.points) });
  };

  for (let i = 0; i < beamCount; i += 1) {
    const start = 1.4 * random();
    launch('beam', start, [0, BEAM.y + (2 * random() - 1) * BEAM.halfWidth], [1, 0]);
  }
  if (terms.emission) {
    const count = Math.round(emissionRate * sigmaA);
    for (let i = 0; i < count; i += 1) {
      const start = 1.8 * random();
      const x = SLAB.start + (SLAB.end - SLAB.start) * random();
      const y = SLAB.bottom + (SLAB.top - SLAB.bottom) * random();
      const angle = 2 * Math.PI * random();
      launch('emitted', start, [x, y], [Math.cos(angle), Math.sin(angle)]);
    }
  }
  if (terms.inScattering) {
    for (let i = 0; i < lampCount; i += 1) {
      const start = 1.4 * random();
      const angle = -Math.PI / 2 + (2 * random() - 1) * LAMP.halfAngle;
      launch('lamp', start, [LAMP.x + (2 * random() - 1) * 0.04, LAMP.y], [Math.cos(angle), Math.sin(angle)]);
    }
  }

  let ballistic = 0;
  for (const photon of photons) {
    photon.ballistic = photon.kind === 'beam' && photon.segmentBounces.every((b) => b === 0)
      && photon.points.at(-1)[0] >= SLAB.end;
    if (photon.ballistic) ballistic += 1;
  }
  const fraction = ballistic / beamCount;
  return {
    photons,
    check: {
      fraction,
      standardError: Math.sqrt(Math.max(fraction * (1 - fraction), 1e-12) / beamCount),
      expected: Math.exp(-medium.extinction * (SLAB.end - SLAB.start)),
      extinction: medium.extinction,
    },
  };
}

/**
 * Where a photon is `elapsed` seconds after its start: the index of the
 * segment it is on and the point, or null before it starts. A photon whose
 * path has ended stays at its last point.
 */
export function photonPosition(photon, elapsed) {
  if (elapsed < 0) return null;
  const travelled = elapsed * SPEED;
  const { lengths, points } = photon;
  if (travelled >= lengths.at(-1)) return { segment: points.length - 2, point: points.at(-1), done: true };
  let i = 1;
  while (lengths[i] < travelled) i += 1;
  const span = lengths[i] - lengths[i - 1];
  const f = span > 0 ? (travelled - lengths[i - 1]) / span : 1;
  const [ax, ay] = points[i - 1];
  const [bx, by] = points[i];
  return { segment: i - 1, point: [ax + f * (bx - ax), ay + f * (by - ay)], done: false };
}
