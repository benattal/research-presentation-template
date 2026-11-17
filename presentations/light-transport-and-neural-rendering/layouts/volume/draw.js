/**
 * Canvas drawing for the volume rendering figures: light in a medium on a
 * dark render panel (tone mapped, glowing, adding up), and clean line and
 * bar plots on the white slide aligned with the ray above them.
 *
 * Every function draws in stage pixels on a context already scaled with
 * `ctx.setTransform(ratio, …)` (see `useStageCanvas`). Colors come from the
 * theme's custom properties (`themeColors`); radiance is linear RGB.
 */
import { toneMap } from '../flatland/render.js';

/** Parse `#rrggbb` into [r, g, b] bytes. */
function hexToRgb(hex) {
  const value = hex.trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error(`Expected a #rrggbb color, got "${hex}"`);
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}

/** Theme colors the volume figures use, by custom property name without the dashes. */
export const VOLUME_COLORS = [
  'render-bg', 'light-0', 'light-1', 'light-2', 'light-3', 'light-4', 'medium',
  'ink-light-0', 'ink-light-1', 'ink-light-2', 'ink-light-3', 'ink-light-4', 'ink-medium',
  'text-primary', 'text-secondary', 'text-muted', 'border-light',
];

/**
 * The theme's colors as [r, g, b] bytes, keyed by name. Throws when a
 * property is missing or not `#rrggbb`, so a renamed token fails loudly.
 * `--border-light` is an rgba() color and comes back as its CSS string.
 */
export function themeColors(element, names = VOLUME_COLORS) {
  const style = getComputedStyle(element);
  return Object.fromEntries(names.map((name) => {
    const value = style.getPropertyValue(`--${name}`).trim();
    if (!value) throw new Error(`The theme does not define --${name}`);
    return [name, value.startsWith('#') ? hexToRgb(value) : value];
  }));
}

/** A color in bytes as linear RGB in [0, 1], so light colors add physically. */
export function linear(rgb) {
  return rgb.map((v) => (v / 255) ** 2.2);
}

/** CSS rgba() of a byte color. */
export function rgba([r, g, b], alpha = 1) {
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/** CSS color of linear radiance after the renders' tone map at `gain`. */
export function radianceCss(radiance, gain) {
  const [r, g, b] = toneMap(radiance[0], radiance[1], radiance[2], gain);
  return `rgb(${r}, ${g}, ${b})`;
}

const scratchCanvases = new Map();
function scratchCanvas(width, height) {
  const key = `${width}x${height}`;
  if (!scratchCanvases.has(key)) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    scratchCanvases.set(key, canvas);
  }
  return scratchCanvases.get(key);
}

/**
 * Draw a grid of linear RGB radiance (`values`, row 0 at the top) into
 * `rect` over the background: tone mapped at `gain`, smoothly upscaled,
 * with a soft additive bloom so bright light glows past its edges.
 * `blend` in [0, 1] scales the radiance, for fading a picture in.
 */
export function drawRadiance(ctx, values, columns, rows, rect, gain, background, blend = 1) {
  const canvas = scratchCanvas(columns, rows);
  const scratch = canvas.getContext('2d');
  const image = scratch.createImageData(columns, rows);
  for (let cell = 0; cell < columns * rows; cell += 1) {
    const [r, g, b] = toneMap(blend * values[cell * 3], blend * values[cell * 3 + 1], blend * values[cell * 3 + 2], gain);
    image.data[cell * 4] = Math.max(r, background[0]);
    image.data[cell * 4 + 1] = Math.max(g, background[1]);
    image.data[cell * 4 + 2] = Math.max(b, background[2]);
    image.data[cell * 4 + 3] = 255;
  }
  scratch.putImageData(image, 0, 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, rect.x, rect.y, rect.width, rect.height);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.3;
  ctx.filter = 'blur(10px)';
  ctx.drawImage(canvas, rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

/** A rounded dark panel: the background of every render of light. */
export function drawPanel(ctx, rect, background, radius = 6) {
  ctx.save();
  ctx.fillStyle = rgba(background);
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
  ctx.fill();
  ctx.restore();
}

/**
 * Map data to a plot's rectangle: x over `xRange` across the width, y over
 * `yRange` from the bottom up. Returns `{ x(v), y(v), rect }`.
 */
export function plotScale(rect, [x0, x1], [y0, y1]) {
  return {
    rect,
    x: (v) => rect.x + ((v - x0) / (x1 - x0)) * rect.width,
    y: (v) => rect.y + rect.height - ((v - y0) / (y1 - y0)) * rect.height,
  };
}

/** Thin axes: the baseline and the left edge of a plot. */
export function drawAxes(ctx, rect, color) {
  ctx.save();
  ctx.strokeStyle = rgba(color, 0.9);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rect.x + 0.5, rect.y);
  ctx.lineTo(rect.x + 0.5, rect.y + rect.height + 0.5);
  ctx.lineTo(rect.x + rect.width, rect.y + rect.height + 0.5);
  ctx.stroke();
  ctx.restore();
}

/** Stroke y(x) through the points `xs`, `ys` (the first `count` of them). */
export function strokeSeries(ctx, scale, xs, ys, style, count = xs.length) {
  if (count < 2) return;
  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width ?? 2;
  ctx.lineJoin = 'round';
  if (style.dash) ctx.setLineDash(style.dash);
  ctx.beginPath();
  for (let i = 0; i < count; i += 1) {
    const px = scale.x(xs[i]);
    const py = scale.y(ys[i]);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

/** Fill the area between y(x) and the baseline y = 0 (the first `count` points). */
export function fillSeries(ctx, scale, xs, ys, fill, count = xs.length) {
  if (count < 2) return;
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(scale.x(xs[0]), scale.y(0));
  for (let i = 0; i < count; i += 1) ctx.lineTo(scale.x(xs[i]), scale.y(ys[i]));
  ctx.lineTo(scale.x(xs[count - 1]), scale.y(0));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** A glowing dot of light on a render panel. */
export function glowDot(ctx, [x, y], color, radius, alpha = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(x, y, 0, x, y, radius * 4);
  halo.addColorStop(0, rgba(color, 0.55 * alpha));
  halo.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, radius * 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}
