/**
 * An estimate of the memory needed to backpropagate through a volume
 * renderer. Automatic differentiation keeps every intermediate value of the
 * forward pass for the backward pass, so memory grows with everything that
 * is evaluated; an adjoint method recomputes values in the backward pass
 * instead of storing them.
 *
 * Bytes throughout. The model counts only the stored per-sample values
 * (network activations), not the network's weights or the images.
 */

/**
 * Memory of an automatic-differentiation tape: R rays × N samples per ray ×
 * (1 + S secondary samples per sample) × B bounces × b bytes per sample.
 */
export function tapeBytes({ rays, samples, secondary, bounces, bytesPerSample }) {
  return rays * samples * (1 + secondary) * bounces * bytesPerSample;
}

/**
 * Memory of an adjoint method that recomputes each sample in the backward
 * pass and keeps one sample per ray at a time: R × b, whatever the number
 * of samples, secondary rays, and bounces.
 */
export function adjointBytes({ rays, bytesPerSample }) {
  return rays * bytesPerSample;
}

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/** Bytes in binary units, to two significant digits or more: "2 GB", "2.5 GB", "130 GB". */
export function formatBytes(bytes) {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = value >= 10 || Number.isInteger(value) ? 0 : 1;
  return `${value.toFixed(digits)} ${UNITS[unit]}`;
}

/** 1024ⁿ bytes for unit names, so slides can state sizes as "4 KB" or "80 GB". */
export function unitBytes(unit) {
  const power = UNITS.indexOf(unit);
  if (power < 0) throw new Error(`Unknown unit "${unit}"`);
  return 1024 ** power;
}
