/**
 * The beam slide's check: a floor reflects the same fraction of the
 * spotlight's flux whatever its finish, and that fraction is the floor's
 * albedo (luminance), because propagation loses nothing on the way down.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MATERIALS } from '../layouts/flatland/scene.js';
import { reflectedFraction } from '../layouts/FloorScattering/reflection.js';

const [r, g, b] = MATERIALS.white.albedo;
const albedo = 0.2126 * r + 0.7152 * g + 0.0722 * b;

describe('floor scattering', () => {
  for (const finish of ['diffuse', 'glossy', 'mirror']) {
    it(`a ${finish} floor reflects its albedo of the beam`, () => {
      const fraction = reflectedFraction(finish);
      assert.ok(Math.abs(fraction - albedo) < 1e-3, `${finish}: ${fraction} against ${albedo}`);
    });
  }
});
