/**
 * The scattering integral at one surface point of the diffuse room:
 *
 *   L_o = L_e + ∫ f L_i(θ) cos θ dθ,  f = ρ/2 (diffuse, flatland),
 *
 * by quadrature over `perBin` rays in each of the 16 direction bins. Each
 * ray finds the surface it sees and reads that surface's outgoing radiance
 * toward the point from a solved light field x (the steady state).
 */
import {
  BINS, BIN_WIDTH, angleAt, binOf, binRange, castRay, direction, pointOn, stateIndex,
} from './scene.js';

/** Rays per direction bin of the gather. */
export const GATHER_RAYS_PER_BIN = 16;

/**
 * Gather at the point u ∈ [0, 1] along `patch`, from outgoing state `x`
 * and emission `e`. Returns the point, the rays (angle, hit point, incident
 * radiance, and its weighted contribution f L cos θ dθ, RGB), the emission,
 * the gathered sum, and the solved value of the patch's light, x.
 */
export function gatherAt(room, patch, u, x, e, perBin = GATHER_RAYS_PER_BIN) {
  if (patch.finish !== 'diffuse') throw new Error('The gather view needs a diffuse surface');
  const point = pointOn(patch, u);
  const dTheta = BIN_WIDTH / perBin;
  const rays = [];
  const gathered = [0, 0, 0];
  for (let bin = 0; bin < BINS; bin += 1) {
    const [lo] = binRange(bin);
    for (let k = 0; k < perBin; k += 1) {
      const theta = lo + (k + 0.5) * dTheta;
      const d = direction(patch, theta);
      const hit = castRay(room, point, d, patch.segment);
      if (!hit) continue;
      const back = [-d[0], -d[1]];
      const s = stateIndex(hit.patch.index, binOf(angleAt(hit.patch, back))) * 3;
      const radiance = [x[s], x[s + 1], x[s + 2]];
      const weighted = radiance.map((value, c) => (patch.albedo[c] / 2) * value * Math.cos(theta) * dTheta);
      weighted.forEach((value, c) => {
        gathered[c] += value;
      });
      rays.push({ theta, end: hit.point, radiance, weighted });
    }
  }
  const out = stateIndex(patch.index, BINS / 2) * 3;
  const emitted = [e[out], e[out + 1], e[out + 2]];
  return {
    point,
    rays,
    emitted,
    gathered,
    outgoing: gathered.map((value, c) => value + emitted[c]),
    solved: [x[out], x[out + 1], x[out + 2]],
  };
}

/** The point of the room's surfaces nearest to `p` (room units), within `reach`: { patch, u } or null. */
export function nearestSurfacePoint(room, p, reach = 0.6) {
  let best = null;
  for (const segment of room.segments) {
    const ex = segment.b[0] - segment.a[0];
    const ey = segment.b[1] - segment.a[1];
    const t = Math.min(1, Math.max(0, ((p[0] - segment.a[0]) * ex + (p[1] - segment.a[1]) * ey) / (ex * ex + ey * ey)));
    const distance = Math.hypot(segment.a[0] + t * ex - p[0], segment.a[1] + t * ey - p[1]);
    if (distance > reach || (best && distance >= best.distance)) continue;
    const local = Math.min(segment.patchCount - 1e-9, t * segment.patchCount);
    const index = Math.floor(local);
    best = { distance, patch: room.patches[segment.firstPatch + index], u: Math.min(0.98, Math.max(0.02, local - index)) };
  }
  return best && { patch: best.patch, u: best.u };
}
