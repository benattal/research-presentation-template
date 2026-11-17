/**
 * Cached quantities the flatland layouts draw: fluence images and other
 * values derived from a state vector, and the one exposure per room and
 * direction that keeps bounces at their true relative brightness.
 *
 * Caches are keyed by the state vector itself (a WeakMap), so they live as
 * long as the room that produced the vector.
 */
import { autoGain } from './render.js';
import { fluence } from './transport.js';

/** Surfaces glow brighter than the fluence around them for the same exposure. */
export const SURFACE_GAIN = 2.4;

const derivedValues = new WeakMap();

/** `compute()` once per state vector and name. */
export function derived(state, name, compute) {
  let byName = derivedValues.get(state);
  if (!byName) {
    byName = new Map();
    derivedValues.set(state, byName);
  }
  if (!byName.has(name)) byName.set(name, compute());
  return byName.get(name);
}

/** The fluence of a state vector, cached by extent and the end it is measured from. */
export function cachedFluence(table, state, extent, from) {
  return derived(state, `fluence:${extent}:${from}`, () => fluence(table, state, extent, { from }));
}

export function subtract(a, b) {
  return a.map((value, i) => value - b[i]);
}

/**
 * One exposure per room and direction: set by the direct light (e) for
 * light, and by the scattered importance (y − q) for importance.
 */
export function sceneGain(env, adjoint) {
  const reference = adjoint
    ? derived(env.importance, 'without-sensor', () => subtract(env.importance, env.sensor))
    : env.transport.emission;
  return derived(reference, 'scene-gain', () => autoGain(cachedFluence(env.table, reference, Infinity, 'source')));
}
