/**
 * Canvas drawing for the active-sensing figures (time of flight, lidar,
 * structured light): a dark render panel on which light glows and adds up,
 * the devices that emit and record it, and the surfaces it lands on.
 *
 * Every function draws in stage pixels on a context already scaled with
 * `ctx.setTransform(ratio, …)` (see `useStageCanvas`). Colors come from the
 * theme's custom properties, read with `themeColors`.
 */

/** Parse `#rrggbb` into [r, g, b] bytes. */
function hexToRgb(hex) {
  const value = hex.trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error(`Expected a #rrggbb color, got "${hex}"`);
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}

/**
 * The theme's colors as [r, g, b], keyed by custom property name without the
 * leading dashes (`light-1`, `render-bg`, `adjoint`, ...). Throws when a
 * property is missing, so a renamed token fails loudly.
 */
export function themeColors(element, names) {
  const style = getComputedStyle(element);
  return Object.fromEntries(names.map((name) => {
    const value = style.getPropertyValue(`--${name}`);
    if (!value) throw new Error(`The theme does not define --${name}`);
    return [name, hexToRgb(value)];
  }));
}

export function rgba([r, g, b], alpha = 1) {
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/**
 * Map scene coordinates (meters, y up) into `rect` (stage pixels), keeping
 * the aspect ratio and centering the scene's `bounds` { x0, x1, y0, y1 }.
 */
export function sceneTransform(bounds, rect) {
  const scale = Math.min(rect.width / (bounds.x1 - bounds.x0), rect.height / (bounds.y1 - bounds.y0));
  const left = rect.x + (rect.width - (bounds.x1 - bounds.x0) * scale) / 2;
  const top = rect.y + (rect.height - (bounds.y1 - bounds.y0) * scale) / 2;
  return {
    scale,
    toCanvas: ([x, y]) => [left + (x - bounds.x0) * scale, top + (bounds.y1 - y) * scale],
    toScene: ([cx, cy]) => [bounds.x0 + (cx - left) / scale, bounds.y1 - (cy - top) / scale],
  };
}

/** Fill the panel with the render background. */
export function clearPanel(ctx, width, height, background) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = rgba(background);
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * A line of light from `a` to `b` (canvas pixels): a soft halo and a bright
 * core, blended additively so overlapping light adds up.
 */
export function glowLine(ctx, a, b, color, { width = 2, intensity = 1, halo = 10 } = {}) {
  if (intensity <= 0.002) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(color, 0.22 * intensity);
  ctx.lineWidth = width + halo;
  ctx.filter = `blur(${halo / 2}px)`;
  ctx.beginPath();
  ctx.moveTo(...a);
  ctx.lineTo(...b);
  ctx.stroke();
  ctx.filter = 'none';
  ctx.strokeStyle = rgba(color, Math.min(1, 0.9 * intensity));
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

/**
 * A ray of light whose brightness varies along it: `brightness(s)` for s in
 * [0, 1] from `a` to `b`, sampled at `samples` points into a gradient, so
 * the halo and the core are one stroke each.
 */
export function glowRay(ctx, a, b, color, brightness, { width = 2.5, halo = 12, samples = 96 } = {}) {
  if (a[0] === b[0] && a[1] === b[1]) return;
  const values = Array.from({ length: samples + 1 }, (_, k) => Math.max(0, brightness(k / samples)));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'butt';
  for (const pass of ['halo', 'core']) {
    const gradient = ctx.createLinearGradient(...a, ...b);
    values.forEach((value, k) => {
      gradient.addColorStop(k / samples, rgba(color, pass === 'halo' ? 0.25 * value : Math.min(1, value)));
    });
    ctx.filter = pass === 'halo' ? `blur(${halo / 2}px)` : 'none';
    ctx.lineWidth = pass === 'halo' ? width + halo : width;
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.stroke();
  }
  ctx.restore();
}

/** A soft round spot of light at `p` (canvas pixels), additive. */
export function glowSpot(ctx, p, color, radius, intensity = 1) {
  if (intensity <= 0.002) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const gradient = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], radius);
  gradient.addColorStop(0, rgba(color, Math.min(1, intensity)));
  gradient.addColorStop(0.35, rgba(color, 0.45 * Math.min(1, intensity)));
  gradient.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(p[0], p[1], radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

/** An unlit surface: a thin grey line from `a` to `b` (canvas pixels). */
export function drawSurface(ctx, a, b, color, { width = 4, alpha = 0.45 } = {}) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(...a);
  ctx.lineTo(...b);
  ctx.stroke();
  ctx.restore();
}

/**
 * A camera (or projector) body at `p` facing `angle` (radians, canvas
 * orientation): a small box and a lens cone, in a pale grey.
 */
export function drawDevice(ctx, p, angle, color, { size = 1 } = {}) {
  ctx.save();
  ctx.translate(...p);
  ctx.rotate(angle);
  ctx.scale(size, size);
  ctx.fillStyle = rgba(color, 0.92);
  ctx.beginPath();
  ctx.roundRect(-22, -11, 22, 22, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(10, -10);
  ctx.lineTo(10, 10);
  ctx.lineTo(0, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Text on the render panel, in the deck's body font. */
export function panelLabel(ctx, text, p, color, { align = 'left', baseline = 'middle', size = 18, alpha = 0.85 } = {}) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.font = `${size}px ${getComputedStyle(ctx.canvas).fontFamily}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = rgba(color, alpha);
  ctx.fillText(text, ...p);
  ctx.restore();
}

/** A dashed line from `a` to `b` (canvas pixels), not additive: guides and secondary rays. */
export function dashedLine(ctx, a, b, color, { width = 1.5, alpha = 0.7, dash = [6, 6] } = {}) {
  ctx.save();
  ctx.setLineDash(dash);
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(...a);
  ctx.lineTo(...b);
  ctx.stroke();
  ctx.restore();
}
