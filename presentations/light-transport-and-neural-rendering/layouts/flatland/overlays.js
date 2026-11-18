/**
 * Things drawn over a room render (render.js): rays and paths of light,
 * devices (cameras, a projector), light elements on the ceiling, and a
 * camera's 1D image as a strip of pixels. Canvas code in stage pixels;
 * `transform` is the room transform drawRoom returns.
 */
import { GATHER_RAYS_PER_BIN } from './gather.js';
import {
  BINS, CAMERA, cameraRay, castRay, direction,
} from './scene.js';
import { toneMap } from './render.js';

const luminance = (rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

/** CSS color of linear RGB light at exposure `gain`, through the render's tone curve. */
export function lightColor(rgb, gain, alpha = 1) {
  const [r, g, b] = toneMap(rgb[0], rgb[1], rgb[2], gain);
  return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Line segments of light, added to what is there: `segments` are
 * { a, b, color } in room units with a CSS color, drawn `width` stage
 * pixels wide with a soft glow.
 */
export function drawLightSegments(ctx, transform, segments, { width = 1.5, glow = 4, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineWidth = width;
  ctx.globalAlpha = alpha;
  for (const { a, b, color } of segments) {
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    ctx.beginPath();
    ctx.moveTo(...transform.toCanvas(a));
    ctx.lineTo(...transform.toCanvas(b));
    ctx.stroke();
  }
  ctx.restore();
}

/** A bright point of light at room position `p`, radius `radius` stage pixels. */
export function drawGlowPoint(ctx, transform, p, color, radius = 6) {
  const [x, y] = transform.toCanvas(p);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.3, color);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius * 3, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

/**
 * A camera (or projector) glyph at room position `position`, looking at
 * `lookAt`: a body and a lens, light gray, scaled with the room.
 */
export function drawDevice(ctx, transform, position, lookAt, { color = '#d7dbe4', size = 1 } = {}) {
  const [cx, cy] = transform.toCanvas(position);
  const angle = Math.atan2(-(lookAt[1] - position[1]), lookAt[0] - position[0]);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const s = (transform.scale / 70) * size;
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.fillRect(-16, -9, 18, 18);
  ctx.beginPath();
  ctx.moveTo(2, -5);
  ctx.lineTo(11, -9);
  ctx.lineTo(11, 9);
  ctx.lineTo(2, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The camera of the room's images (CAMERA), as drawRoom draws it. */
export function drawRoomCamera(ctx, transform, options) {
  drawDevice(ctx, transform, CAMERA.position, CAMERA.lookAt, options);
}

/**
 * The wedge of rays of camera pixel [s0, s1] (image coordinates), from the
 * camera to the surfaces it sees, filled faintly in `color` (an [r, g, b]
 * byte triple).
 */
export function drawPixelWedge(ctx, room, transform, [s0, s1], color, { fill = 0.16, line = 0.7, steps = 12 } = {}) {
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const d = cameraRay(CAMERA, s0 + ((s1 - s0) * i) / steps);
    const hit = castRay(room, CAMERA.position, d);
    if (hit) points.push(transform.toCanvas(hit.point));
  }
  const [cx, cy] = transform.toCanvas(CAMERA.position);
  ctx.save();
  ctx.fillStyle = `rgba(${color.join(', ')}, ${fill})`;
  ctx.strokeStyle = `rgba(${color.join(', ')}, ${line})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  for (const [x, y] of points) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * A 1D image as a strip of pixels in stage rectangle (x, y, width,
 * height): `image` is RGB per pixel (left to right), tone-mapped at `gain`.
 */
export function drawImageStrip(ctx, image, gain, { x, y, width, height }) {
  const pixels = image.length / 3;
  const w = width / pixels;
  ctx.save();
  for (let j = 0; j < pixels; j += 1) {
    ctx.fillStyle = lightColor([image[j * 3], image[j * 3 + 1], image[j * 3 + 2]], gain);
    ctx.fillRect(x + j * w, y, Math.ceil(w + 0.5), height);
  }
  ctx.restore();
}

/**
 * The exposure for the incident rays of a gather (gather.js): the median
 * incident light sits mid-curve, so rays of different light keep apart.
 */
export function incidentGain(gather) {
  const values = gather.rays.map((ray) => luminance(ray.radiance)).sort((a, b) => a - b);
  return 0.55 / Math.max(1e-6, values[Math.floor(values.length / 2)]);
}

/** The rays of a gather that `drawIncidentFan` draws: `perBin` evenly spaced rays of each direction bin. */
export function fanRays(gather, perBin = 3) {
  const every = Math.round(GATHER_RAYS_PER_BIN / perBin);
  return gather.rays.filter((ray) => ray.k % every === Math.floor(every / 2) && ray.k < every * perBin);
}

/**
 * The incident light of a gather at its point, as rays of light: `perBin`
 * evenly spaced rays of each direction bin, each in the color of the light
 * arriving along it. A ray runs from the surface it comes from toward the
 * point, `reach` ∈ [0, 1] of the way (light arriving), and stops `gap` room
 * units short of the point, so the rays do not saturate it. `weight` ∈
 * [0, 1] blends each ray's light toward f_r cos θ relative to its largest
 * value (albedo × cos θ for the diffuse BRDF ρ/2), so grazing light dims.
 */
export function drawIncidentFan(ctx, transform, gather, patch, {
  gain, reach = 1, weight = 0, alpha = 1, perBin = 3, gap = 0.2,
}) {
  if (alpha <= 0 || reach <= 0) return;
  const [px, py] = gather.point;
  const segments = fanRays(gather, perBin).map((ray) => {
    const rgb = ray.radiance.map((value, c) => value * (1 - weight + weight * patch.albedo[c] * Math.cos(ray.theta)));
    const d = [ray.end[0] - px, ray.end[1] - py];
    const length = Math.hypot(d[0], d[1]);
    const near = Math.min(gap, length) / length;
    const head = 1 - (1 - near) * reach;
    return { a: ray.end, b: [px + d[0] * head, py + d[1] * head], color: lightColor(rgb, gain) };
  });
  drawLightSegments(ctx, transform, segments, { width: 1.4, glow: 3, alpha });
}

/**
 * The cosine lobe at a surface point: r = radius · cos θ (room units), a
 * circle touching the surface at the point, dashed, in `color`.
 */
export function drawCosineLobe(ctx, transform, patch, point, radius, { color, alpha = 1, width = 2 }) {
  if (alpha <= 0) return;
  const [cx, cy] = transform.toCanvas(point);
  const R = radius * transform.scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  for (let i = 0; i <= 64; i += 1) {
    const theta = -Math.PI / 2 + (i / 64) * Math.PI;
    const d = direction(patch, theta);
    const r = R * Math.cos(theta);
    if (i === 0) ctx.moveTo(cx + d[0] * r, cy - d[1] * r);
    else ctx.lineTo(cx + d[0] * r, cy - d[1] * r);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * The direction bins at a surface point: a half circle of `radius` room
 * units with a spoke at each of the BINS + 1 bin edges.
 */
export function drawDirectionBins(ctx, transform, patch, point, radius, { color, alpha = 1 }) {
  if (alpha <= 0) return;
  const [cx, cy] = transform.toCanvas(point);
  const r = radius * transform.scale;
  const normalAngle = Math.atan2(-patch.normal[1], patch.normal[0]);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, normalAngle - Math.PI / 2, normalAngle + Math.PI / 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  for (let b = 0; b <= BINS; b += 1) {
    const d = direction(patch, -Math.PI / 2 + (b * Math.PI) / BINS);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + d[0] * r, cy - d[1] * r);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * The patches of the room's surfaces: a short tick into the room at every
 * patch boundary, `length` room units long.
 */
export function drawPatchTicks(ctx, transform, room, { color, alpha = 1, length = 0.16 }) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const patch of room.patches) {
    for (const end of [patch.a, patch.b]) {
      const [x0, y0] = transform.toCanvas(end);
      const [x1, y1] = transform.toCanvas([end[0] + patch.normal[0] * length, end[1] + patch.normal[1] * length]);
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
    }
  }
  ctx.stroke();
  ctx.restore();
}
