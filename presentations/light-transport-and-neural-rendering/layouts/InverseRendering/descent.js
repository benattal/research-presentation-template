/**
 * Inverse rendering in the flatland room: recovering the albedo θ (RGB) of
 * the left wall from one image of the camera, by gradient descent on
 * ℓ(θ) = ‖Ĉ(θ) − C̃‖², with C̃ the image of the room as built (the wall's
 * true albedo) and Ĉ(θ) the image rendered with the wall's albedo set to θ.
 *
 * The wall is diffuse, so its scattering block is linear in its albedo:
 * the room for θ is the room as built with that block scaled per channel,
 * and (∂A/∂θ_c) x is the light the wall reflects in channel c divided by
 * θ_c. The derivative of the light, ∂x/∂θ = (I − A)⁻¹ (∂A/∂θ) x, is one
 * more solve; channels do not mix, so one solve gives all three
 * derivatives (channel c of the result is ∂x_c/∂θ_c).
 */
import { BINS, stateIndex } from '../flatland/scene.js';
import { bounce, cameraImage, solve } from '../flatland/transport.js';

/** The surface whose albedo is recovered. */
export const WALL = 'left wall';
/** The first guess: a grey wall. */
export const FIRST_GUESS = [0.5, 0.5, 0.5];
/** Gradient steps shown, after the first guess. */
export const STEPS = 30;
/** Relative tolerance of the solves (the images are drawn at 8 bits). */
const TOLERANCE = 1e-7;

/**
 * CSS color of an albedo: reflectance × 255 per channel, the rule the
 * room's material colors follow (scene.js: red [0.8, 0.2, 0.13] is about
 * #c8452f), so the recovered albedo reaches the red wall's color.
 */
export function albedoColor(albedo) {
  const [r, g, b] = albedo.map((value) => Math.round(255 * Math.min(1, Math.max(0, value))));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * The room and its operators with the wall's albedo set to `theta`: the
 * transport of `env` (a `flatlandRoom`) with the wall's scattering blocks
 * scaled, and a copy of its room whose wall patches carry the albedo and
 * its color, so that drawings of the room show the wall as it is now.
 */
export function wallTransport(env, theta) {
  const { transport } = env;
  const scatter = Float64Array.from(transport.scatter);
  const patches = env.room.patches.map((patch) => {
    if (patch.group !== WALL) return patch;
    for (let c = 0; c < 3; c += 1) {
      const factor = theta[c] / patch.albedo[c];
      const offset = (patch.index * 3 + c) * BINS * BINS;
      for (let k = 0; k < BINS * BINS; k += 1) scatter[offset + k] *= factor;
    }
    return { ...patch, albedo: [...theta], color: albedoColor(theta) };
  });
  const room = { ...env.room, patches };
  return { ...transport, room, scatter };
}

/** The light the wall reflects per unit albedo, (∂A/∂θ) x, channel by channel. */
function wallSource(transport, x, theta) {
  const reflected = bounce(transport, x);
  const source = new Float64Array(reflected.length);
  for (const patch of transport.room.patches) {
    if (patch.group !== WALL) continue;
    for (let bin = 0; bin < BINS; bin += 1) {
      const i = stateIndex(patch.index, bin) * 3;
      for (let c = 0; c < 3; c += 1) source[i + c] = reflected[i + c] / theta[c];
    }
  }
  return source;
}

/**
 * One evaluation at θ: the room, the light x, the rendered image Ĉ, the
 * derivative image ∂Ĉ/∂θ (channel c holds ∂Ĉ_c/∂θ_c), the loss, and its
 * gradient ∇θ ℓ = 2 (∂θ Ĉ)ᵀ (Ĉ − C̃).
 */
export function evaluate(env, theta, measured) {
  const transport = wallTransport(env, theta);
  const step = (v) => bounce(transport, v);
  const x = solve(transport.emission, step, TOLERANCE);
  const image = cameraImage(transport, x);
  const derivative = cameraImage(transport, solve(wallSource(transport, x, theta), step, TOLERANCE));
  const gradient = [0, 0, 0];
  let loss = 0;
  for (let i = 0; i < image.length; i += 1) {
    const residual = image[i] - measured[i];
    loss += residual * residual;
    gradient[i % 3] += 2 * residual * derivative[i];
  }
  return { theta, room: transport.room, x, image, derivative, loss, gradient };
}

/**
 * The step size η, fixed for every step: one over the curvature of ℓ at
 * the first guess, summed over the channels, Σ_c 2 Σ (∂Ĉ_c/∂θ_c)². Each
 * channel's own curvature stays below that sum along the whole descent
 * (red's grows as its albedo rises), so no channel overshoots and the
 * loss falls at every step (tests/inverse-rendering.test.mjs). The image
 * depends least on blue, which converges slowest.
 */
function stepSize(first) {
  const curvature = [0, 0, 0];
  first.derivative.forEach((value, i) => { curvature[i % 3] += 2 * value * value; });
  return 1 / (curvature[0] + curvature[1] + curvature[2]);
}

/**
 * Gradient descent from FIRST_GUESS, computed one iterate at a time as
 * they are asked for: `iterate(k)` is the evaluation at θ_k
 * (0 ≤ k ≤ STEPS), with θ_{k+1} = θ_k − η ∇θ ℓ(θ_k); `computed` is how
 * many exist. The measured image C̃ is the camera's image of `env` itself.
 */
export function createDescent(env) {
  const measured = cameraImage(env.transport, env.steady);
  const iterates = [evaluate(env, FIRST_GUESS, measured)];
  const eta = stepSize(iterates[0]);
  const iterate = (k) => {
    if (!(Number.isInteger(k) && k >= 0 && k <= STEPS)) throw new Error(`descent: no iterate ${k}`);
    while (iterates.length <= k) {
      const { theta, gradient } = iterates.at(-1);
      iterates.push(evaluate(env, theta.map((value, c) => value - eta * gradient[c]), measured));
    }
    return iterates[k];
  };
  return { measured, eta, iterate, get computed() { return iterates.length; } };
}
