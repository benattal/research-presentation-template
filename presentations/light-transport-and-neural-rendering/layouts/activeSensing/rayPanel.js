/**
 * The render panel of the time-of-flight and lidar quadrature slides: the
 * camera and its source, the fog and the wall of `RAY_SCENE`, the beam of
 * light along the camera ray, and the quadrature samples glowing with the
 * light each one returns.
 */
import {
  clearPanel, drawDevice, drawSurface, glowRay, glowSpot, panelLabel, rgba, sceneTransform,
} from './draw.js';
import { fogDensity } from './rayScene.js';

/** The part of the scene the panel shows by default, in meters. */
export const RAY_PANEL_BOUNDS = { x0: -0.42, x1: 3.3, y0: -1.0, y1: 1.0 };

/** Theme colors the panel needs (`themeColors` names). */
export const RAY_PANEL_COLORS = ['render-bg', 'bg-elevated', 'text-muted', 'light-0', 'light-1', 'light-2', 'medium'];

/**
 * Draw the panel into a `width` × `height` area (stage pixels) of `ctx`.
 *
 * - `scene`: `RAY_SCENE` (or a variant);
 * - `samples`: the ray's quadrature samples (`raySamples`);
 * - `returns`: the light each sample returns, any units (≥ 0), drawn
 *   relative to the largest;
 * - `fog`: 0 to 1, how much of the fog is present (it fades out);
 * - `marker`: optional depth (m) of a bright mark on the ray, the depth whose
 *   light arrives at the time a lidar is binning;
 * - `bounds`: the part of the scene shown, in meters (`RAY_PANEL_BOUNDS`).
 *
 * Returns the scene-to-panel transform (`sceneTransform`).
 */
export function drawRayPanel(ctx, colors, { width, height }, {
  scene, samples, returns, fog, marker = null, bounds = RAY_PANEL_BOUNDS,
}) {
  const transform = sceneTransform(bounds, { x: 0, y: 0, width, height });
  const { toCanvas, scale } = transform;
  const depth = scene.wall.depth;
  clearPanel(ctx, width, height, colors['render-bg']);

  // The fog: a faint haze where the medium is, and the beam's light it scatters.
  if (fog > 0) {
    const center = toCanvas(scene.fog.center);
    const radius = scene.fog.radius * scale;
    const gradient = ctx.createRadialGradient(...center, 0, ...center, radius);
    gradient.addColorStop(0, rgba(colors.medium, 0.32 * fog));
    gradient.addColorStop(0.55, rgba(colors.medium, 0.14 * fog));
    gradient.addColorStop(1, rgba(colors.medium, 0));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(...center, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
    const labelY = Math.min(scene.fog.radius + 0.12, bounds.y1 - 0.12);
    panelLabel(ctx, 'fog', [toCanvas(scene.fog.center)[0], toCanvas([0, labelY])[1]], colors.medium, { align: 'center', alpha: 0.85 * fog });
  }

  const margin = 0.06 * (bounds.y1 - bounds.y0);
  drawSurface(ctx, toCanvas([depth, bounds.y0 + margin]), toCanvas([depth, bounds.y1 - margin]), colors['text-muted'], { alpha: 0.75 });
  panelLabel(ctx, 'wall', toCanvas([depth + 0.07, bounds.y1 - 2 * margin]), colors['bg-elevated'], { alpha: 0.6 });

  // The beam: light leaving the source, dimmed by the fog it crosses.
  const density = (t) => fog * fogDensity(scene.fog, [t, 0]);
  const steps = 400;
  const transmittance = new Float64Array(steps + 1);
  transmittance[0] = 1;
  for (let k = 0; k < steps; k += 1) {
    const t = ((k + 0.5) / steps) * depth;
    transmittance[k + 1] = transmittance[k] * Math.exp(-density(t) * (depth / steps));
  }
  const at = (s) => transmittance[Math.min(steps, Math.round(s * steps))];
  glowRay(ctx, toCanvas([0.02, 0]), toCanvas([depth, 0]), colors['light-1'], (s) => 0.75 * at(s) + 0.6 * density(s * depth) * at(s), { width: 2.5, halo: 12 });
  glowSpot(ctx, toCanvas([depth, 0]), colors['light-1'], 28, 0.95 * at(1) ** 2 + 0.05);

  // The samples: every one as a faint tick, and the light each returns as a glow.
  const brightest = Math.max(...returns, 1e-12);
  samples.forEach(({ t }, i) => {
    if (t > bounds.x1 - 0.1) return;
    const p = toCanvas([t, 0]);
    ctx.save();
    ctx.fillStyle = rgba(colors['bg-elevated'], 0.35);
    ctx.fillRect(p[0] - 0.75, p[1] + 9, 1.5, 6);
    ctx.restore();
    const share = returns[i] / brightest;
    if (share < 0.01) return;
    glowSpot(ctx, p, colors['light-0'], 5 + 11 * Math.sqrt(share), 0.35 + 0.65 * share);
  });

  if (marker !== null && marker > 0 && marker < bounds.x1) {
    glowSpot(ctx, toCanvas([marker, 0]), colors['light-0'], 22, 0.9);
  }

  drawDevice(ctx, toCanvas([-0.04, 0]), 0, colors['bg-elevated']);
  glowSpot(ctx, toCanvas([0.02, 0]), colors['light-0'], 16, 1);
  panelLabel(ctx, 'camera', [toCanvas([0, 0])[0] - 38, toCanvas([0, 0])[1] + 32], colors['bg-elevated'], { alpha: 0.6 });
  return transform;
}
