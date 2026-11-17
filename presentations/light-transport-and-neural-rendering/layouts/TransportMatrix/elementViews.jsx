/**
 * Pieces shared by the light element slides (TransportMatrix,
 * OpticalComputing): each element's light in the room, the room under a
 * pattern of elements as their weighted sum, the exposure for a pattern,
 * the elements drawn on the ceiling, and a 1D image as a strip of light.
 */
import { useEffect } from 'react';
import { useStageCanvas } from '../canvas/canvas.js';
import { patchesToState } from '../flatland/diffuse.js';
import { weightedSum } from '../flatland/lightElements.js';
import { drawImageStrip } from '../flatland/overlays.js';
import { derived } from '../flatland/pictures.js';
import { RENDER_BACKGROUND, autoGain, roomTransform } from '../flatland/render.js';
import { fluence, patchRadiosity } from '../flatland/transport.js';

/** Height of a strip of light, in stage pixels. */
export const STRIP = 30;

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

/** Ticks between the light elements along the ceiling, and a glow on the lit ones. */
export function drawElements(ctx, transform, elements, p, color) {
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
  if (color) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = Math.max(5, 0.14 * transform.scale);
    ctx.lineCap = 'butt';
    const largest = Math.max(...p);
    elements.forEach((patch, k) => {
      if (p[k] <= 0) return;
      ctx.strokeStyle = color(p[k] / largest);
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 8;
      const a = transform.toCanvas(patch.a);
      const b = transform.toCanvas(patch.b);
      ctx.beginPath();
      ctx.moveTo(a[0] + 2, a[1] + ctx.lineWidth / 2 + 2);
      ctx.lineTo(b[0] - 2, b[1] + ctx.lineWidth / 2 + 2);
      ctx.stroke();
    });
  }
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

