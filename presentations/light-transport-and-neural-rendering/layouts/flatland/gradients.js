/**
 * Gradients of a pixel with respect to surface albedos, by the adjoint and
 * by finite differences, for the flatland room.
 *
 * Scaling the albedo of patch p by (1 + s) scales its scattering block, so
 * ∂A/∂s = S_p G (S restricted to p) and the adjoint gradient is
 * ∂m/∂s = yᵀ (∂A/∂s) x = Σ over p's states of y ⊙ (A x).
 */
import { BINS, createRoom, stateIndex } from './scene.js';
import { bounce, buildTransport, solve } from './transport.js';

/** ∂m/∂s_p for every patch p: importance times the light the patch reflects. */
export function albedoGradients(transport, steady, importance) {
  const reflected = bounce(transport, steady);
  const gradients = new Float64Array(transport.room.patches.length);
  for (const patch of transport.room.patches) {
    let sum = 0;
    for (let bin = 0; bin < BINS; bin += 1) {
      const i = stateIndex(patch.index, bin) * 3;
      for (let c = 0; c < 3; c += 1) sum += importance[i + c] * reflected[i + c];
    }
    gradients[patch.index] = sum;
  }
  return gradients;
}

const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);

/**
 * The finite difference (m(1 + h) − m(1)) / h of the pixel `sensor` when
 * every albedo of `group` is scaled by 1 + h.
 */
export function finiteDifference(floorFinish, sensor, group, h = 1e-4) {
  const measure = (scale) => {
    const room = createRoom({ floorFinish });
    for (const patch of room.patches) {
      if (patch.group === group) patch.albedo = patch.albedo.map((value) => value * scale);
    }
    const transport = buildTransport(room);
    return dot(sensor, solve(transport.emission, (x) => bounce(transport, x)));
  };
  return (measure(1 + h) - measure(1)) / h;
}
