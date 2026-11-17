/**
 * Drawing the flatland room as light: the fluence filling the room (soft
 * shadows, color bleeding), surfaces glowing with the light that leaves or
 * arrives at them, the box, the camera. Pure canvas code; layouts decide
 * what state to show.
 */
import { CAMERA, ROOM_HEIGHT, ROOM_WIDTH, cameraRay, castRay } from './scene.js';

/** The color importance is drawn in (cyan), per unit luminance. */
const IMPORTANCE_TINT = [0.3, 0.79, 0.94];

/**
 * The size of the room render, in stage pixels, on every slide that shows
 * the room: one size, so the room does not jump between consecutive slides.
 */
export const ROOM_VIEW = [800, 480];

/** Background of renders, matching `--render-bg` in theme.css. */
export const RENDER_BACKGROUND = '#07090f';

/** Map linear RGB to display bytes: exposure, soft shoulder, then a gamma that keeps dark regions dark. */
export function toneMap(r, g, b, gain) {
  const map = (v) => Math.round(255 * (1 - Math.exp(-Math.max(0, v) * gain)) ** (1 / 1.8));
  return [map(r), map(g), map(b)];
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** RGB of a value in the given palette: light keeps its color, importance turns cyan. */
function paletteColor(palette, r, g, b) {
  if (palette === 'light') return [r, g, b];
  const y = luminance(r, g, b);
  return [y * IMPORTANCE_TINT[0], y * IMPORTANCE_TINT[1], y * IMPORTANCE_TINT[2]];
}

/**
 * A gain that maps the `quantile` brightest value of `values` (RGB triples)
 * to the knee of the tone curve, so the brightest light is bright and the
 * rest falls off as it does physically: the auto-exposure of a render.
 */
export function autoGain(values, quantile = 0.99) {
  const lum = [];
  for (let i = 0; i < values.length; i += 3) {
    const y = luminance(values[i], values[i + 1], values[i + 2]);
    if (y > 0) lum.push(y);
  }
  if (lum.length === 0) return 1;
  lum.sort((a, b) => a - b);
  const reference = lum[Math.min(lum.length - 1, Math.floor(quantile * lum.length))];
  return 1.1 / reference;
}

/** Where room coordinates land on the canvas, for a room drawn into `rect`. */
export function roomTransform(rect) {
  const scale = Math.min(rect.width / ROOM_WIDTH, rect.height / ROOM_HEIGHT);
  const left = rect.x + (rect.width - ROOM_WIDTH * scale) / 2;
  const top = rect.y + (rect.height - ROOM_HEIGHT * scale) / 2;
  return {
    scale,
    left,
    top,
    toCanvas: ([x, y]) => [left + x * scale, top + (ROOM_HEIGHT - y) * scale],
    toRoom: ([cx, cy]) => [(cx - left) / scale, ROOM_HEIGHT - (cy - top) / scale],
  };
}

const offscreen = new Map();
function scratchCanvas(width, height) {
  const key = `${width}x${height}`;
  if (!offscreen.has(key)) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    offscreen.set(key, canvas);
  }
  return offscreen.get(key);
}

/**
 * Two passes of a 3×3 binomial filter over the fluence grid, skipping
 * solid cells, to remove the speckle of the finite direction sampling.
 */
function smooth(fluence, width, height, solid) {
  let source = fluence;
  for (let pass = 0; pass < 2; pass += 1) {
    const target = new Float32Array(source.length);
    for (let j = 0; j < height; j += 1) {
      for (let i = 0; i < width; i += 1) {
        const cell = j * width + i;
        if (solid[cell]) continue;
        let r = 0;
        let g = 0;
        let b = 0;
        let total = 0;
        for (let dj = -1; dj <= 1; dj += 1) {
          for (let di = -1; di <= 1; di += 1) {
            const x = i + di;
            const y = j + dj;
            if (x < 0 || y < 0 || x >= width || y >= height) continue;
            const neighbor = y * width + x;
            if (solid[neighbor]) continue;
            const w = (2 - Math.abs(di)) * (2 - Math.abs(dj));
            r += w * source[neighbor * 3];
            g += w * source[neighbor * 3 + 1];
            b += w * source[neighbor * 3 + 2];
            total += w;
          }
        }
        target[cell * 3] = r / total;
        target[cell * 3 + 1] = g / total;
        target[cell * 3 + 2] = b / total;
      }
    }
    source = target;
  }
  return source;
}

function drawFluence(ctx, table, raw, gain, palette, transform) {
  const { width, height, solid } = table;
  const fluence = smooth(raw, width, height, solid);
  const canvas = scratchCanvas(width, height);
  const scratch = canvas.getContext('2d');
  const image = scratch.createImageData(width, height);
  for (let cell = 0; cell < width * height; cell += 1) {
    const [r, g, b] = paletteColor(palette, fluence[cell * 3], fluence[cell * 3 + 1], fluence[cell * 3 + 2]);
    const [R, G, B] = solid[cell] ? [0, 0, 0] : toneMap(r, g, b, gain);
    image.data[cell * 4] = R;
    image.data[cell * 4 + 1] = G;
    image.data[cell * 4 + 2] = B;
    image.data[cell * 4 + 3] = 255;
  }
  scratch.putImageData(image, 0, 0);
  const w = ROOM_WIDTH * transform.scale;
  const h = ROOM_HEIGHT * transform.scale;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.filter = `blur(${(0.02 * transform.scale).toFixed(2)}px)`;
  ctx.drawImage(canvas, transform.left, transform.top, w, h);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.35;
  ctx.filter = `blur(${(0.2 * transform.scale).toFixed(2)}px)`;
  ctx.drawImage(canvas, transform.left, transform.top, w, h);
  ctx.restore();
}

function line(ctx, transform, a, b) {
  const [ax, ay] = transform.toCanvas(a);
  const [bx, by] = transform.toCanvas(b);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
}

function drawSurfaces(ctx, room, transform, surfaces, gain, palette) {
  ctx.save();
  ctx.lineCap = 'butt';
  ctx.lineWidth = Math.max(1.5, 0.07 * transform.scale);
  for (const patch of room.patches) {
    ctx.strokeStyle = patch.color;
    ctx.globalAlpha = 0.4;
    line(ctx, transform, patch.a, patch.b);
  }
  ctx.globalAlpha = 1;
  if (surfaces) {
    ctx.globalCompositeOperation = 'lighter';
    for (const patch of room.patches) {
      const i = patch.index * 3;
      const [r, g, b] = paletteColor(palette, surfaces[i], surfaces[i + 1], surfaces[i + 2]);
      const [R, G, B] = toneMap(r, g, b, gain);
      if (R + G + B < 6) continue;
      ctx.strokeStyle = `rgb(${R}, ${G}, ${B})`;
      ctx.shadowColor = `rgb(${R}, ${G}, ${B})`;
      ctx.shadowBlur = 0.17 * transform.scale;
      line(ctx, transform, patch.a, patch.b);
    }
  }
  ctx.restore();
}

/**
 * A pixel's wedge on the canvas: the camera's position and the two points
 * where the pixel's edge rays (image coordinates [s0, s1]) hit the room,
 * in the canvas coordinates of `transform`.
 */
export function pixelWedge(room, transform, [s0, s1]) {
  const ends = [s0, s1].map((s) => transform.toCanvas(castRay(room, CAMERA.position, cameraRay(CAMERA, s)).point));
  return { camera: transform.toCanvas(CAMERA.position), ends };
}

function drawCamera(ctx, room, transform, pixel) {
  const [cx, cy] = transform.toCanvas(CAMERA.position);
  ctx.save();
  if (pixel) {
    const { ends } = pixelWedge(room, transform, pixel);
    ctx.fillStyle = 'rgba(76, 201, 240, 0.16)';
    ctx.strokeStyle = 'rgba(76, 201, 240, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(...ends[0]);
    ctx.lineTo(...ends[1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  const forward = cameraRay(CAMERA, 0.5);
  const angle = Math.atan2(-forward[1], forward[0]);
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(transform.scale / 70, transform.scale / 70);
  ctx.fillStyle = '#d7dbe4';
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

/**
 * Draw the room into `rect` (stage pixels) of a context already scaled to
 * stage pixels. `picture` says what to show:
 *
 * - `table`, `fluence`, `fluenceGain`: the light in the room (optional);
 * - `surfaces`, `surfaceGain`: per-patch RGB glow (optional);
 * - `palette`: 'light' (true color) or 'importance' (cyan);
 * - `camera`: draw the camera; `pixel`: [s0, s1] of the pixel to highlight.
 *
 * Returns the room transform, for hit testing.
 */
export function drawRoom(ctx, room, rect, picture) {
  const transform = roomTransform(rect);
  const palette = picture.palette ?? 'light';
  ctx.save();
  ctx.fillStyle = RENDER_BACKGROUND;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.beginPath();
  ctx.rect(transform.left, transform.top, ROOM_WIDTH * transform.scale, ROOM_HEIGHT * transform.scale);
  ctx.clip();
  if (picture.fluence) drawFluence(ctx, picture.table, picture.fluence, picture.fluenceGain, palette, transform);
  ctx.restore();
  ctx.save();
  const box = room.segments.filter((segment) => segment.group === 'box');
  if (box.length) {
    ctx.fillStyle = '#05060a';
    ctx.beginPath();
    const [first] = box;
    ctx.moveTo(...transform.toCanvas(first.a));
    for (const segment of box) ctx.lineTo(...transform.toCanvas(segment.b));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  drawSurfaces(ctx, room, transform, picture.surfaces, picture.surfaceGain ?? 1, palette);
  if (picture.camera) drawCamera(ctx, room, transform, picture.pixel);
  return transform;
}
