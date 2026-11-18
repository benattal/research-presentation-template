/**
 * The random walks of the path tracing slide (lt-path-tracing) and the
 * point x it shares with the rendering equation slide.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cameraSurfacePoint } from '../layouts/flatland/gather.js';
import {
  cameraRays, rayTable, seededRandom, surfaceWalk, tracePaths,
} from '../layouts/flatland/pathSamples.js';
import { MEASURED_PIXEL, flatlandRoom } from '../layouts/flatland/rooms.js';
import {
  CAMERA, angleAt, cameraRay, castRay, pointOn,
} from '../layouts/flatland/scene.js';

const env = flatlandRoom('diffuse', 'lamp');
const s = (MEASURED_PIXEL[0] + MEASURED_PIXEL[1]) / 2;

describe('the point the measured pixel sees', () => {
  it('is the camera ray\'s hit, on the floor', () => {
    const { patch, u } = cameraSurfacePoint(env.room, s);
    const hit = castRay(env.room, CAMERA.position, cameraRay(CAMERA, s));
    const point = pointOn(patch, u);
    assert.equal(patch.group, 'floor');
    assert.ok(Math.hypot(point[0] - hit.point[0], point[1] - hit.point[1]) < 1e-9);
  });
});

describe('a walk over the surfaces', () => {
  const { patch, u } = cameraSurfacePoint(env.room, s);
  const start = pointOn(patch, u);

  it('samples directions with the flatland cosine density, cos θ / 2', () => {
    // P(|θ| < π/6) = sin(π/6) = 1/2 under that density.
    const random = seededRandom(5);
    let inside = 0;
    const count = 4000;
    for (let i = 0; i < count; i += 1) {
      const walk = surfaceWalk(env.room, start, patch, random, 1);
      const d = [walk.vertices[1][0] - start[0], walk.vertices[1][1] - start[1]];
      if (Math.abs(angleAt(patch, d)) < Math.PI / 6) inside += 1;
    }
    assert.ok(Math.abs(inside / count - 0.5) < 0.03, `fraction ${inside / count}`);
  });

  it('moves from surface to surface and stops on the lamp', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const walk = surfaceWalk(env.room, start, patch, seededRandom(seed), 8);
      walk.vertices.forEach((vertex, i) => {
        const on = walk.patches[i];
        const along = (vertex[0] - on.a[0]) * on.tangent[0] + (vertex[1] - on.a[1]) * on.tangent[1];
        const off = (vertex[0] - on.a[0]) * on.normal[0] + (vertex[1] - on.a[1]) * on.normal[1];
        assert.ok(Math.abs(off) < 1e-9 && along > -1e-9 && along < on.length + 1e-9, `seed ${seed}, vertex ${i}`);
      });
      assert.equal(walk.lit, Boolean(walk.patches.at(-1).emission));
      assert.ok(walk.patches.slice(0, -1).every((p) => !p.emission));
    }
  });
});

describe('the estimator\'s walks', () => {
  it('give the same images for the same seed', () => {
    const rays = rayTable(env.room);
    const camera = cameraRays(env.room, 16, 4);
    const first = tracePaths(env.transport, rays, camera, [8, 32], 7, 1);
    const second = tracePaths(env.transport, rays, camera, [8, 32], 7, 1);
    assert.deepEqual(Array.from(first.images.get(32)), Array.from(second.images.get(32)));
    assert.ok(first.images.get(32).some((value) => value > 0));
  });
});
