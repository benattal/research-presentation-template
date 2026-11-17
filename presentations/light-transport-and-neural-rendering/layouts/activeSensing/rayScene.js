/**
 * The scene the time-of-flight and lidar slides share, seen along one
 * camera ray: a camera with a light source beside it at the origin, looking
 * along +x through a patch of fog at a wall. The slides draw it as a 2D
 * cross-section of a 3D scene, so light falls off as 1/t².
 *
 * Distances in meters, densities in 1/m.
 */

export const RAY_SCENE = {
  fog: { center: [1.5, 0], radius: 0.5, density: 1.0, albedo: 0.4 },
  wall: { depth: 2.6, albedo: 0.8 },
  near: 0.4,
  far: 3.2,
  step: 0.05,
};

/** Density inside the wall: opaque within one sample interval. */
const WALL_DENSITY = 1e4;

/** The fog's density at a point of the cross-section: a smooth bump, zero outside its radius. */
export function fogDensity(fog, [x, y]) {
  const r2 = ((x - fog.center[0]) ** 2 + (y - fog.center[1]) ** 2) / fog.radius ** 2;
  return r2 >= 1 ? 0 : fog.density * (1 - r2) ** 2;
}

/**
 * The quadrature samples of the camera ray along +x: uniform spacing
 * `scene.step` from `scene.near`, so the wall's depth falls on a sample.
 * Each sample is `{ t, delta, sigma, albedo, kind }` with kind 'fog' or
 * 'wall'; `fog: false` removes the fog (one opaque surface).
 */
export function raySamples(scene, { fog = true } = {}) {
  const count = Math.round((scene.far - scene.near) / scene.step);
  return Array.from({ length: count }, (_, i) => {
    const t = scene.near + i * scene.step;
    const inWall = t >= scene.wall.depth - 1e-9;
    if (inWall) return { t, delta: scene.step, sigma: WALL_DENSITY, albedo: scene.wall.albedo, kind: 'wall' };
    const sigma = fog ? fogDensity(scene.fog, [t, 0]) : 0;
    return { t, delta: scene.step, sigma, albedo: scene.fog.albedo, kind: 'fog' };
  });
}
