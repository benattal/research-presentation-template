/**
 * Things drawn over a room render (render.js): rays and paths of light,
 * devices (cameras, a projector), light elements on the ceiling, and a
 * camera's 1D image as a strip of pixels. Canvas code in stage pixels;
 * `transform` is the room transform drawRoom returns.
 */
import { CAMERA, cameraRay, castRay } from './scene.js';
import { toneMap } from './render.js';

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
