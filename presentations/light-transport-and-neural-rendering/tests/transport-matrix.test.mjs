/**
 * A column and a row of the light transport matrix as light in the room
 * (layouts/TransportMatrix/columnsAndRows.js): the listed paths of a row,
 * summed by their number of bounces, are the terms (C Aⁿ E)_jk of
 * T = C (I + A + A² + ⋯) E, and the paths drawn are real light paths, from
 * an element to where pixel j's rays land, unblocked.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bouncePatches } from '../layouts/flatland/diffuse.js';
import { elementEmission, lightElementRoom, oneHot } from '../layouts/flatland/lightElements.js';
import { ROOM_HEIGHT, ROOM_WIDTH, castRay } from '../layouts/flatland/scene.js';
import {
  ROW_BOUNCES, pixelRays, rowPathWeights, rowPaths, rowShares,
} from '../layouts/TransportMatrix/columnsAndRows.js';

const env = lightElementRoom();
const { diffuse, elements, camera } = env;
const n = diffuse.n;
const luminance = (v, i) => 0.2126 * v[i] + 0.7152 * v[i + 1] + 0.0722 * v[i + 2];
/** Rows the tests use: a floor pixel (the slide's row) and a pixel that images the ceiling. */
const ROWS = [28, 62];

describe('a row of the light transport matrix', () => {
  for (const j of ROWS) {
    it(`pixel ${j}: the paths, summed by bounces, are the terms (C Aⁿ E)_jk`, () => {
      const weights = rowPathWeights(env, j);
      elements.forEach((_, k) => {
        let term = elementEmission(diffuse, elements, oneHot(elements.length, k));
        for (let bounces = 0; bounces <= ROW_BOUNCES; bounces += 1) {
          let exact = 0;
          for (let p = 0; p < n; p += 1) exact += camera.Q[j * n + p] * luminance(term, p * 3);
          const listed = weights
            .filter((path) => path.element === k && path.bounces === bounces)
            .reduce((sum, path) => sum + path.weight, 0);
          assert.ok(Math.abs(listed - exact) <= 1e-12 + 1e-9 * exact, `element ${k}, ${bounces} bounces: ${listed} vs ${exact}`);
          term = bouncePatches(diffuse, term);
        }
      });
    });

    it(`pixel ${j}: every drawn path starts on its element, ends where pixel ${j}'s rays land, and is unblocked`, () => {
      const ends = camera.rays.filter((ray) => ray.pixel === j).map((ray) => ray.hit.point);
      const count = 420;
      const paths = rowPaths(env, j, count);
      assert.ok(paths.length >= 0.98 * count, `${paths.length} of ${count} paths drawn`);
      for (const path of paths) {
        const { a, b } = elements[path.element];
        const [x, y] = path.points[0];
        assert.ok(Math.abs(y - a[1]) < 1e-9 && x >= Math.min(a[0], b[0]) - 1e-9 && x <= Math.max(a[0], b[0]) + 1e-9, 'starts on its element');
        assert.equal(path.points.length, path.bounces + 1);
        assert.ok(ends.some((end) => end === path.points.at(-1)), 'ends on a point pixel j images');
        for (let i = 1; i < path.points.length; i += 1) {
          const [from, to] = [path.points[i - 1], path.points[i]];
          const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
          const hit = castRay(env.room, from, [(to[0] - from[0]) / length, (to[1] - from[1]) / length]);
          assert.ok(hit && Math.abs(hit.distance - length) < 1e-6, 'segment unblocked');
        }
      }
    });
  }

  it('the shares of a row grow with each term shown, up to the whole entries T_jk', () => {
    for (const j of ROWS) {
      const whole = rowShares(env, j, null);
      let before = elements.map(() => 0);
      for (let bounces = 0; bounces <= ROW_BOUNCES; bounces += 1) {
        const shares = rowShares(env, j, bounces);
        elements.forEach((_, k) => {
          assert.ok(shares[k] >= before[k] && shares[k] <= whole[k] * (1 + 1e-9), `pixel ${j}, element ${k}, ${bounces} bounces`);
        });
        before = shares;
      }
    }
  });

  it('the paths up to ROW_BOUNCES carry part of each entry T_jk, never more', () => {
    for (const j of ROWS) {
      const weights = rowPathWeights(env, j);
      elements.forEach((_, k) => {
        const listed = weights.filter((path) => path.element === k).reduce((sum, path) => sum + path.weight, 0);
        const entry = luminance(env.images[k], j * 3);
        assert.ok(listed > 0 && listed <= entry * (1 + 1e-9), `pixel ${j}, element ${k}: ${listed} of ${entry}`);
      });
    }
  });
});

describe('a column of the light transport matrix', () => {
  it('each pixel ray ends on a surface of the room', () => {
    const points = pixelRays(env);
    assert.equal(points.length, camera.pixels);
    for (const [x, y] of points) {
      assert.ok(x >= -1e-9 && x <= ROOM_WIDTH + 1e-9 && y >= -1e-9 && y <= ROOM_HEIGHT + 1e-9);
      const onWall = [x, ROOM_WIDTH - x, y, ROOM_HEIGHT - y].some((distance) => Math.abs(distance) < 1e-9);
      const onBox = x >= 5.6 - 1e-9 && x <= 7.6 + 1e-9 && y <= 2.2 + 1e-9;
      assert.ok(onWall || onBox, `ray ends at ${x}, ${y}`);
    }
  });
});
