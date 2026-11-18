/**
 * Pieces shared by the light element slides (TransportMatrix,
 * OpticalComputing): each element's light in the room, the room under a
 * pattern of elements as their weighted sum, the exposure for a pattern,
 * the elements drawn on the ceiling with a value per element as bars
 * hanging from them, and a 1D image as a strip of light.
 */
import { useEffect } from 'react';
import { useStageCanvas } from '@core/stage/canvas.js';
import { patchesToState } from '../flatland/diffuse.js';
import { weightedSum } from '../flatland/lightElements.js';
import { drawImageStrip } from '../flatland/overlays.js';
import { derived } from '../flatland/pictures.js';
import { RENDER_BACKGROUND, autoGain, roomTransform } from '../flatland/render.js';
import { fluence, patchRadiosity } from '../flatland/transport.js';

/** Height of a strip of light, in stage pixels. */
export const STRIP = 30;
/** Longest bar hanging from a ceiling element, in stage pixels. */
const BAR = 70;
/** Colors of the bars: light (a pattern of the elements). */
export const BAR_COLORS = { light: 'rgba(255, 241, 201, 0.7)' };

/** Per element: its light as a full state vector and its fluence, computed once. */
export function elementPictures(env) {
  return derived(env.B[0], 'element-pictures', () => env.B.map((B) => {
    const state = patchesToState(env.room, B);
    return { state, fluence: fluence(env.table, state), surfaces: patchRadiosity(env.transport, state) };
  }));
}

/** The light in the room under pattern p, as the weighted sum of the elements' pictures. */
export function patternPicture(env, p) {
  const pictures = elementPictures(env);
  return {
    fluence: Float32Array.from(weightedSum(pictures.map((picture) => picture.fluence), p)),
    surfaces: weightedSum(pictures.map((picture) => picture.surfaces), p),
  };
}

/**
 * One exposure per slide, from a reference pattern: the room's (below the
 * auto-exposure, so one element's light falls off visibly) and the image
 * strip's.
 */
export function exposures(env, reference) {
  const picture = patternPicture(env, reference);
  const image = weightedSum(env.images, reference);
  return { room: 0.16 * autoGain(picture.fluence), strip: 0.6 * autoGain(image, 0.9) };
}

/** Ticks between the light elements along the ceiling. */
export function drawElements(ctx, transform, elements) {
  ctx.save();
  ctx.strokeStyle = 'rgba(215, 219, 228, 0.55)';
  ctx.lineWidth = 1;
  for (const patch of elements) {
    for (const end of [patch.a, patch.b]) {
      const [x, y] = transform.toCanvas(end);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 7);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * A value per element as a bar hanging from it, its length proportional
 * to the value (the largest `scale` long, BAR stage pixels; `scale`
 * defaults to the largest value), in `color` (BAR_COLORS).
 */
export function drawElementBars(ctx, transform, elements, values, color, scale = Math.max(...values)) {
  if (!(scale > 0)) return;
  ctx.save();
  ctx.fillStyle = color;
  elements.forEach((patch, k) => {
    if (values[k] <= 0) return;
    const a = transform.toCanvas(patch.a);
    const b = transform.toCanvas(patch.b);
    const left = Math.min(a[0], b[0]);
    const width = Math.abs(b[0] - a[0]);
    ctx.fillRect(left + 0.36 * width, a[1] + 10, 0.28 * width, BAR * Math.min(1, values[k] / scale));
  });
  ctx.restore();
}

/**
 * A strip of light: a 1D image (RGB per pixel) tone-mapped at `gain`,
 * `width` × `height` stage pixels; `highlight` outlines one pixel.
 */
export function Strip({ image, gain, width, height = STRIP, highlight, className = '' }) {
  const [ref, ratio] = useStageCanvas();
  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = RENDER_BACKGROUND;
    ctx.fillRect(0, 0, width, height);
    drawImageStrip(ctx, image, gain, { x: 0, y: 0, width, height });
    if (highlight !== undefined) {
      const w = width / (image.length / 3);
      ctx.strokeStyle = 'rgba(76, 201, 240, 0.95)';
      ctx.lineWidth = 2;
      ctx.strokeRect(highlight * w + 1, 1, w - 2, height - 2);
    }
  }, [ref, ratio, image, gain, width, height, highlight]);
  return (
    <canvas
      ref={ref}
      className={className}
      width={Math.round(width * ratio)}
      height={Math.round(height * ratio)}
      style={{ width, height, display: 'block', borderRadius: 3 }}
    />
  );
}

/** The element index under stage point (x, y) of the room render, if it is near the ceiling. */
export function elementAt(env, [x, y], size) {
  const transform = roomTransform({ x: 0, y: 0, width: size[0], height: size[1] });
  const [rx, ry] = transform.toRoom([x, y]);
  if (ry < 4.6) return -1;
  return env.elements.findIndex((patch) => rx >= Math.min(patch.a[0], patch.b[0]) && rx <= Math.max(patch.a[0], patch.b[0]));
}

