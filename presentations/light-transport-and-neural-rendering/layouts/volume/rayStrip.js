/**
 * One camera ray drawn as light: a dark strip, the camera at its left end,
 * with a beam whose brightness is the radiance L(t) travelling toward the
 * camera, over a haze that shows the medium's extinction σₜ(t).
 */
import { drawPanel, drawRadiance, linear } from './draw.js';

const ROWS = 48;
/** Brightness of the haze at the plotted maximum of σₜ, in linear radiance at unit exposure. */
const HAZE = 0.14;

/**
 * Draw the strip into `rect` (stage pixels). `radiance` and `density` are
 * sampled at evenly spaced t from the camera (left) to the far end (right);
 * `densityMax` is the σₜ drawn as the densest haze; `gain` the exposure.
 */
export function drawRayStrip(ctx, rect, { radiance, density, densityMax }, colors, gain) {
  const light = linear(colors['light-1']);
  const medium = linear(colors.medium);
  const columns = radiance.length;
  const values = new Float32Array(columns * ROWS * 3);
  for (let row = 0; row < ROWS; row += 1) {
    const offset = (row + 0.5) / ROWS - 0.5;
    const beam = Math.exp(-((offset / 0.09) ** 2) / 2);
    for (let column = 0; column < columns; column += 1) {
      // The haze keeps the same look at any exposure; only the beam is exposed by `gain`.
      const haze = (HAZE / gain) * Math.min(1, density[column] / densityMax);
      for (let k = 0; k < 3; k += 1) {
        values[(row * columns + column) * 3 + k] = beam * radiance[column] * light[k] + haze * medium[k];
      }
    }
  }
  drawPanel(ctx, rect, colors['render-bg']);
  drawRadiance(ctx, values, columns, ROWS, rect, gain, colors['render-bg']);
}
