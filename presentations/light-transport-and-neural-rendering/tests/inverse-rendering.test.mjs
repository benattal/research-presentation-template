/**
 * The inverse rendering slide's descent (layouts/InverseRendering/descent.js):
 * the room with the wall's albedo set is the room as built at the true
 * albedo, the derivative image matches finite differences, and gradient
 * descent from a grey wall recovers the red wall with the loss falling at
 * every step.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MATERIALS, createRoom } from '../layouts/flatland/scene.js';
import { bounce, buildTransport, cameraImage, solve } from '../layouts/flatland/transport.js';
import { STEPS, WALL, createDescent, evaluate } from '../layouts/InverseRendering/descent.js';

const room = createRoom();
const transport = buildTransport(room);
const env = { room, transport, steady: solve(transport.emission, (x) => bounce(transport, x)) };
const truth = MATERIALS.red.albedo;
const largest = (v) => Math.max(...v.map(Math.abs));

describe('inverse rendering of the wall albedo', () => {
  const descent = createDescent(env);

  it('the wall is the red wall, and its true albedo renders the measurement', () => {
    assert.ok(room.patches.some((patch) => patch.group === WALL && patch.material === 'red'));
    const atTruth = evaluate(env, truth, descent.measured);
    assert.ok(largest(atTruth.image.map((v, i) => v - descent.measured[i])) < 1e-5 * largest(descent.measured));
  });

  it('the derivative image matches finite differences', () => {
    const theta = [0.5, 0.4, 0.3];
    const at = evaluate(env, theta, descent.measured);
    const h = 1e-4;
    for (let c = 0; c < 3; c += 1) {
      const moved = evaluate(env, theta.map((value, k) => (k === c ? value + h : value)), descent.measured);
      for (let px = 0; px < at.image.length / 3; px += 1) {
        const i = px * 3 + c;
        const difference = (moved.image[i] - at.image[i]) / h;
        assert.ok(Math.abs(difference - at.derivative[i]) < 1e-3 * largest(at.derivative) + 1e-3 * Math.abs(difference), `channel ${c}, pixel ${px}`);
      }
    }
  });

  it('the loss falls at every step, without overshooting, to the true albedo', () => {
    let previous = descent.iterate(0);
    for (let k = 1; k <= STEPS; k += 1) {
      const current = descent.iterate(k);
      assert.ok(current.loss < previous.loss, `step ${k}: ${current.loss} ≥ ${previous.loss}`);
      for (let c = 0; c < 3; c += 1) {
        // Each channel moves toward its true value and does not pass it.
        const before = previous.theta[c] - truth[c];
        const after = current.theta[c] - truth[c];
        assert.ok(Math.abs(after) < Math.abs(before) + 1e-6 && after * before >= -1e-9, `step ${k}, channel ${c}`);
      }
      previous = current;
    }
    previous.theta.forEach((value, c) => assert.ok(Math.abs(value - truth[c]) < 0.025, `channel ${c}: ${value}`));
  });

  it('the camera image used is the room as built', () => {
    assert.deepEqual(Array.from(descent.measured), Array.from(cameraImage(transport, env.steady)));
  });
});
