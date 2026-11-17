/**
 * The math behind the flatland visuals of sections 2 and 4: the per-patch
 * solve of the diffuse room, path tracing as a random walk on A, the
 * transient, the light elements and their transport matrix, the coaxial
 * projector, the gather at a point, and the radiance cache. Each is checked
 * against the solve of transport.js.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BINS, CAMERA, angleAt, binOf, cameraRay, castRay, createRoom, stateIndex } from '../layouts/flatland/scene.js';
import { bounce, buildTransport, solve } from '../layouts/flatland/transport.js';
import {
  bouncePatches, diffuseTransport, formFactors, patchesToState, solvePatches,
} from '../layouts/flatland/diffuse.js';
import {
  cameraRays, exactImage, rayTable, relativeError, tracePaths,
} from '../layouts/flatland/pathSamples.js';
import { pixelTransient, solveTransient } from '../layouts/flatland/transient.js';
import { gatherAt } from '../layouts/flatland/gather.js';
import { cacheState, observedPatches, oneBounceFromCache } from '../layouts/flatland/cache.js';

const room = createRoom();
const transport = buildTransport(room);
const x = solve(transport.emission, (v) => bounce(transport, v));
const n = room.patches.length;
const lampEmission = new Float64Array(n * 3);
for (const patch of room.patches) {
  if (patch.emission) for (let c = 0; c < 3; c += 1) lampEmission[patch.index * 3 + c] = patch.emission[c];
}
const largest = (v) => Math.max(...v.map(Math.abs));
const luminance = (v, i) => 0.2126 * v[i * 3] + 0.7152 * v[i * 3 + 1] + 0.0722 * v[i * 3 + 2];

describe('diffuse room, per patch', () => {
  const diffuse = diffuseTransport(transport);

  it('form factors of the closed room sum to one per patch', () => {
    const F = formFactors(transport);
    for (let q = 0; q < n; q += 1) {
      const sum = F.slice(q * n, (q + 1) * n).reduce((s, v) => s + v, 0);
      assert.ok(Math.abs(sum - 1) < 1e-9, `patch ${q}: ${sum}`);
    }
  });

  it('one bounce per patch is one bounce of the full light field', () => {
    const B = solvePatches(diffuse, lampEmission);
    const full = patchesToState(room, bouncePatches(diffuse, B));
    const reference = bounce(transport, patchesToState(room, B));
    const error = largest(full.map((v, i) => v - reference[i]));
    assert.ok(error < 1e-12 * largest(reference), `error ${error}`);
  });

  it('the per-patch solve equals the iterative solve', () => {
    const state = patchesToState(room, solvePatches(diffuse, lampEmission));
    const error = largest(state.map((v, i) => v - x[i]));
    assert.ok(error < 1e-8 * largest(x), `error ${error}`);
  });

  it('refuses a room that is not all diffuse', () => {
    assert.throws(() => diffuseTransport(buildTransport(createRoom({ floorFinish: 'glossy' }))), /diffuse/);
  });
});

describe('path tracing as a random walk on A', () => {
  const rays = rayTable(room);

  it('the walk takes exactly the rays, with exactly the weights, of G', () => {
    const { rowStart, columns, values } = transport.propagation;
    for (let s = 0; s < room.size; s += 1) {
      const total = rays.cumulative[s * 36 + 35];
      const shares = new Map();
      let previous = 0;
      for (let r = 0; r < 36; r += 1) {
        const w = rays.cumulative[s * 36 + r] - previous;
        previous = rays.cumulative[s * 36 + r];
        const target = rays.target[s * 36 + r];
        if (target >= 0) shares.set(target, (shares.get(target) ?? 0) + w / total);
      }
      for (let k = rowStart[s]; k < rowStart[s + 1]; k += 1) {
        assert.ok(Math.abs((shares.get(columns[k]) ?? 0) - values[k]) < 1e-12, `state ${s}`);
        shares.delete(columns[k]);
      }
      assert.equal(shares.size, 0);
    }
  });

  it('the image converges to the exact image as 1/√n', () => {
    const camera = cameraRays(room, 32, 8);
    const exact = exactImage(camera, x);
    const { images } = tracePaths(transport, rays, camera, [64, 1024], 3, 0);
    const coarse = relativeError(images.get(64), exact);
    const fine = relativeError(images.get(1024), exact);
    // 16 times the paths: about a quarter of the error, and a few percent in all.
    assert.ok(fine < coarse / 2.5, `${coarse} → ${fine}`);
    assert.ok(fine < 0.12, `error ${fine}`);
  });
});

describe('transient light transport', () => {
  const transient = solveTransient(transport, lampEmission, { step: 0.2, bins: 900, pulseBins: 3 });

  it('every patch\'s light, summed over time, is its steady state', () => {
    const steady = solvePatches(diffuseTransport(transport), lampEmission);
    for (let i = 0; i < n * 3; i += 1) {
      let sum = 0;
      for (let t = 0; t < transient.bins; t += 1) sum += transient.total[t * n * 3 + i];
      assert.ok(Math.abs(sum - steady[i]) < 1e-5 * steady[i] + 1e-12, `entry ${i}: ${sum} vs ${steady[i]}`);
    }
  });

  it('a pixel records nothing before the shortest path and its histogram sums to its steady value', () => {
    const d = cameraRay(CAMERA, 0.44);
    const hit = castRay(room, CAMERA.position, d);
    const histograms = pixelTransient(transient, [{ patch: hit.patch.index, distance: hit.distance }]);
    let total = 0;
    let first = Infinity;
    histograms.forEach((h) => {
      for (let t = 0; t < transient.bins; t += 1) {
        const value = luminance(h, t);
        total += value;
        if (value > 0) first = Math.min(first, t * transient.step);
      }
    });
    const steady = luminance(x, stateIndex(hit.patch.index, binOf(angleAt(hit.patch, [-d[0], -d[1]]))));
    assert.ok(Math.abs(total - steady) < 1e-5 * steady, `${total} vs ${steady}`);
    // The nearest lamp point to the floor point, then the camera: no light can arrive sooner.
    const lampToFloor = Math.hypot(Math.max(0, 4.2 - hit.point[0]), 6 - hit.point[1]);
    assert.ok(first >= lampToFloor + hit.distance - 1, `first light at ${first}`);
  });
});

describe('light elements and their transport matrix', async () => {
  const {
    angleBetween, dominantEigenvector, elementReturns, lightElementRoom, oneHot, powerIteration, relightingCheck,
  } = await import('../layouts/flatland/lightElements.js');
  const env = lightElementRoom();

  it('a weighted sum of columns is the photo rendered directly', () => {
    const p = Float64Array.from(env.elements, (_, k) => (k % 3) / 2);
    const { relative } = relightingCheck(env, p);
    assert.ok(relative < 1e-8, `relative difference ${relative}`);
  });

  it('power iteration reaches the dominant eigenvector in a few photos', () => {
    const T = elementReturns(env);
    const K = env.elements.length;
    const v = dominantEigenvector(T, K);
    assert.ok(v.every((value) => value > 0));
    const angles = powerIteration(T, oneHot(K, 1), 4).map((p) => angleBetween(p, v));
    for (let t = 1; t < angles.length; t += 1) assert.ok(angles[t] < angles[t - 1]);
    assert.ok(angles[4] < 1, `angle after 4 photos: ${angles[4]}°`);
  });

  it('a coaxial projector: the photo is its direct and indirect parts, and the diagonal keeps the direct light', async () => {
    const { coaxialSystem, photo } = await import('../layouts/flatland/projector.js');
    const system = coaxialSystem(env.diffuse, 32, 8);
    const all = new Float64Array(32).fill(1);
    const full = photo(system, all);
    const diagonal = photo(system, all, (j, k) => j === k);
    const rest = photo(system, all, (j, k) => j !== k);
    assert.ok(largest(full.map((v, i) => v - diagonal[i] - rest[i])) < 1e-12 * largest(full));
    for (let j = 0; j < 32; j += 1) {
      for (let c = 0; c < 3; c += 1) assert.ok(diagonal[j * 3 + c] >= system.direct[j][c] - 1e-15);
    }
  });
});

describe('the scattering integral at a point', () => {
  it('averaged over a patch with the quadrature of G, the gather is the solved light', () => {
    for (const patch of room.patches.filter((p) => p.finish === 'diffuse')) {
      const sum = [0, 0, 0];
      for (let i = 0; i < 6; i += 1) {
        const g = gatherAt(room, patch, (i + 0.5) / 6, x, transport.emission, 6);
        for (let c = 0; c < 3; c += 1) sum[c] += g.outgoing[c] / 6;
      }
      const solved = x.slice(stateIndex(patch.index, BINS / 2) * 3, stateIndex(patch.index, BINS / 2) * 3 + 3);
      for (let c = 0; c < 3; c += 1) assert.ok(Math.abs(sum[c] - solved[c]) < 2e-3 * solved[c], `patch ${patch.index}: ${sum[c]} vs ${solved[c]}`);
    }
  });
});

describe('a radiance cache', () => {
  const observed = observedPatches(room);
  const cache = cacheState(room, x, observed);
  const estimate = oneBounceFromCache(transport, cache);

  it('leaves unobserved only the surfaces behind the box', () => {
    const hidden = room.patches.filter((patch) => !observed[patch.index]);
    assert.ok(hidden.length > 0);
    for (const patch of hidden) assert.ok(patch.center[0] > 2.5 && patch.center[0] < 5.7 && patch.center[1] < 2.3, `patch ${patch.index}`);
  });

  it('its bias is one bounce of the cache\'s error, and never adds light', () => {
    const bias = estimate.map((v, i) => v - x[i]);
    const predicted = bounce(transport, cache.map((v, i) => v - x[i]));
    assert.ok(largest(bias.map((v, i) => v - predicted[i])) < 1e-8 * largest(x));
    assert.ok(bias.every((v) => v <= 1e-9 * largest(x)));
  });
});
