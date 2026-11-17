/**
 * The figure the cloud slides share: the cloud on a dark panel with the
 * camera's pixels in a gutter at its left, and two plots under it on the
 * same t axis, so a point on a plot sits under the point of the ray it
 * describes. Geometry in stage pixels; world units as in cloud.js.
 */
import { CLOUD_EXTENT } from './cloud.js';
import { drawPanel, drawRadiance, radianceCss, rgba } from './draw.js';

/** Exposure of the cloud picture and of pixel colors. */
export const CLOUD_GAIN = 0.55;
export const PIXEL_GAIN = 2.4;

/**
 * Where the panel and the two plots go in a figure of the given size: a
 * `gutter` on the left for the camera and the plots' labels, the panel at
 * the cloud's aspect ratio in at most 40% of the height, the plots sharing
 * the rest, and room for the t label at the bottom.
 */
export function figureGeometry({ width, height }) {
  const gutter = 76;
  const gap = 16;
  const axis = 30;
  const aspect = (CLOUD_EXTENT.far - CLOUD_EXTENT.near) / CLOUD_EXTENT.height;
  const panelWidth = Math.max(0, Math.min(width - gutter, height * 0.4 * aspect));
  const panelHeight = panelWidth / aspect;
  const plotHeight = Math.max(0, (height - panelHeight - 2 * gap - axis) / 2);
  const panel = { x: gutter, y: 0, width: panelWidth, height: panelHeight };
  const upper = { x: gutter, y: panelHeight + gap, width: panelWidth, height: plotHeight };
  const lower = { x: gutter, y: upper.y + plotHeight + gap, width: panelWidth, height: plotHeight };
  return { gutter, panel, upper, lower, width: gutter + panelWidth, height };
}

/** Panel pixels of the world point (t, y). */
export function worldToPanel(panel, t, y) {
  return [
    panel.x + ((t - CLOUD_EXTENT.near) / (CLOUD_EXTENT.far - CLOUD_EXTENT.near)) * panel.width,
    panel.y + (1 - y / CLOUD_EXTENT.height) * panel.height,
  ];
}

/** The world t under panel x (stage pixels). */
export function panelToT(panel, x) {
  return CLOUD_EXTENT.near + ((x - panel.x) / panel.width) * (CLOUD_EXTENT.far - CLOUD_EXTENT.near);
}

/** The dark panel with the cloud's radiance grid (`renderCloud`'s `seen` or `emitted`) drawn on it. */
export function drawCloudPanel(ctx, geometry, values, image, colors, blend = 1) {
  drawPanel(ctx, geometry.panel, colors['render-bg']);
  drawRadiance(ctx, values, image.columns, image.rows, geometry.panel, CLOUD_GAIN, colors['render-bg'], blend);
}

/** A thin line along the camera ray at height y, across the panel. */
export function drawRayLine(ctx, panel, y, alpha = 0.45) {
  const [x0, py] = worldToPanel(panel, CLOUD_EXTENT.near, y);
  const [x1] = worldToPanel(panel, CLOUD_EXTENT.far, y);
  ctx.save();
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, py);
  ctx.lineTo(x1, py);
  ctx.stroke();
  ctx.restore();
}

/**
 * One camera pixel in the gutter, centered at height `centerY` (stage
 * pixels), filled with linear radiance `color`; outlined when `selected`.
 */
export function drawPixel(ctx, geometry, centerY, size, color, edgeColor, selected = false) {
  const x = geometry.gutter - size - 14;
  ctx.save();
  ctx.fillStyle = radianceCss(color, PIXEL_GAIN);
  ctx.fillRect(x, centerY - size / 2, size, size);
  if (selected) {
    ctx.strokeStyle = rgba(edgeColor);
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, centerY - size / 2 - 1, size + 2, size + 2);
  }
  ctx.restore();
}
