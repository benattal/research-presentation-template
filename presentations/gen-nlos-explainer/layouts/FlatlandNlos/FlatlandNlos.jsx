import { useMemo, useRef } from 'react';
import { whenIdle } from '@core/presentation/preload.js';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { ease, useStageCanvas } from '@core/stage/canvas.js';
import { useStepClock } from '@core/stage/playback.js';
import {
  BIN, FRAME, GRID, HIDDEN_OUTLINE, ITERATIONS, LIDAR, OCCLUDER_OUTLINE, SETUPS,
  flatlandMeasurements, flatlandNlos, hiddenSurface, roundTrip, visible,
} from './nlos.js';
import './FlatlandNlos.css';

/** The figure under the title, in stage pixels. */
const FIGURE = { width: 1168, height: 400 };
/** Square panels in a row, with a label above each and a line under each. */
const PANEL = { size: 324, top: 38 };
/**
 * Where each panel's left edge is. Step 0: the planar setting, the scene,
 * the measurements. Step 1: the scene moves to the left, and the grid over
 * the hidden region appears between it and the measurements.
 */
const LEFT = { planar: 0, scene: [422, 0], grid: 364, image: 844 };
/** The top of the lines under the panels. */
const UNDER = PANEL.top + PANEL.size + 10;
/** The two operators' arrows, between the grid and the measurements: their ends and heights. */
const ARROWS = {
  from: LEFT.grid + PANEL.size + 12,
  to: LEFT.image - 56,
  forward: PANEL.top + PANEL.size / 2 - 22,
  adjoint: PANEL.top + PANEL.size / 2 + 22,
};

/** When things happen, in ms from the start of each step. */
const TIMELINE = {
  /** Step 0: the planar wall's scan points, from the top. */
  planarGrid: [400, 1900],
  /** Step 0: the lidar's pixels land on the scene's visible surfaces, from the top. */
  pixels: [3000, 4600],
  /** Step 0: confocal measurements at the marked scan points, one after another, each from time 0 to the image's end. */
  sweep: [5000, 9500],
  /** Step 0: the other scan points' measurements appear. */
  fill: [9600, 10300],
  /** Step 1: the planar setting leaves, the scene moves left, the grid and the operators appear. */
  focus: [0, 1600],
  /** Step 1: the adjoint of the marked scan points' measurements, one after another. */
  spread: [1700, 3950],
  /** Step 1: the adjoint of every other scan point's measurements. */
  accumulate: [4050, 5250],
  /** Step 1: CGLS iterations 1 to ITERATIONS. */
  iterations: [5600, 10400],
};

/** The scan points whose measurements step 0 shows as wavefronts: on the slanted wall (two) and the back wall. */
const MARKED = [[0.51, 0.9], [0.91, 0.57], [1, 0.21]];

/**
 * The first part of a marked scan point's sweep, over which its ring and
 * its mark appear, and the last part, over which its wavefront fades.
 */
const SWEEP_EDGES = { appear: 0.1, fade: 0.14 };

/** How far behind a wavefront a point of the hidden object stays lit, in room units. */
const TOUCH_GLOW = 0.02;

/** Directions sampled over the half-plane in front of a relay, to clip a wavefront where the scene blocks it. */
const WAVEFRONT_SAMPLES = 360;

/** Inferno, as in the paper's maximum-intensity projections: 11 stops from 0 to 1. */
const INFERNO = [
  [0, 0, 4], [22, 11, 57], [66, 10, 104], [106, 23, 110], [147, 38, 103], [188, 55, 84],
  [221, 81, 58], [243, 120, 25], [252, 165, 10], [246, 215, 70], [252, 255, 164],
];

/** A 256-entry RGB lookup table from color stops spaced evenly over [0, 1]. */
function lookupTable(stops) {
  const table = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i += 1) {
    const t = (i / 255) * (stops.length - 1);
    const k = Math.min(stops.length - 2, Math.floor(t));
    const f = t - k;
    for (let c = 0; c < 3; c += 1) table[i * 3 + c] = stops[k][c] + (stops[k + 1][c] - stops[k][c]) * f;
  }
  return table;
}

const INFERNO_TABLE = lookupTable(INFERNO);

function hexColor(value) {
  const hex = value.trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error(`FlatlandNlos: expected a #rrggbb theme color, got "${value}"`);
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

/** The theme's colors, read from its CSS custom properties (theme.css owns them). */
function themeColors(element) {
  const style = getComputedStyle(element);
  const read = (name) => style.getPropertyValue(name).trim();
  return {
    direct: read('--direct'),
    indirect: read('--indirect'),
    indirectRgb: hexColor(read('--indirect')),
    hidden: read('--hidden'),
    text: read('--text-primary'),
  };
}

/** Grays of the scene drawings: surfaces, the occluder's fill, the hidden object. */
const SCENE_COLORS = { surface: '#9c9c9c', occluder: '#242424', object: '#7d7d7d', lidar: '#e6e6e6' };

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const mix = (from, to, t) => from + (to - from) * t;
const phase = (ms, [from, to]) => clamp01((ms - from) / (to - from));

/** Progress, 0 to 1, of item i of `count` revealed in turn over a phase's progress p, each taking `span` items' time. */
function staggered(p, i, count, span) {
  return clamp01((p * (count + span) - i) / span);
}

/** What a frame shows: the progress of each part of the timeline, 0 to 1, at `ms` into `step`. */
function frameAt(step, ms) {
  if (step === 0) {
    return {
      planarGrid: phase(ms, TIMELINE.planarGrid),
      pixels: phase(ms, TIMELINE.pixels),
      sweep: phase(ms, TIMELINE.sweep),
      fill: phase(ms, TIMELINE.fill),
      focus: 0,
      spread: 0,
      accumulate: 0,
      iterations: 0,
    };
  }
  return {
    planarGrid: 1,
    pixels: 1,
    sweep: 1,
    fill: 1,
    focus: phase(ms, TIMELINE.focus),
    spread: phase(ms, TIMELINE.spread),
    accumulate: phase(ms, TIMELINE.accumulate),
    iterations: phase(ms, TIMELINE.iterations),
  };
}

/** The end of a step's timeline, after which its frames no longer change. */
function settledAfter(step) {
  return step === 0 ? TIMELINE.fill[1] : TIMELINE.iterations[1];
}

/** Room coordinates to stage pixels inside the panel whose left edge is `left`. */
function sceneTransform(left) {
  const scale = PANEL.size / (FRAME.x[1] - FRAME.x[0]);
  return {
    scale,
    toCanvas: ([x, y]) => [left + (x - FRAME.x[0]) * scale, PANEL.top + (FRAME.y[1] - y) * scale],
  };
}

/** The value below which `fraction` of the positive entries lie: a display range robust to a few bright cells. */
function positiveQuantile(values, fraction) {
  const positive = [];
  for (const value of values) if (value > 0) positive.push(value);
  if (positive.length === 0) return 1;
  positive.sort((a, b) => a - b);
  return positive[Math.floor(fraction * (positive.length - 1))];
}

/**
 * The solved scene (cached for the page) and what the drawing derives from
 * it once per mount: each scan point's peak measurement, the time range of
 * the measurement image, the marked scan points (each with the reach of
 * its wavefront in every direction and the hidden outline's points it
 * sees), the other scan points with a return, and the canvases the grid
 * and the measurements are drawn through.
 */
function useFlatland() {
  return useMemo(() => {
    const model = flatlandNlos();
    const { scans, op, b } = model;
    const all = SETUPS.nonplanar.all;

    let firstReturn = op.timeBins;
    let lastReturn = 0;
    const peaks = scans.map((_, s) => {
      let peak = { value: 0, bin: 0 };
      for (let k = 0; k < op.timeBins; k += 1) {
        const value = b[s * op.timeBins + k];
        if (value > 0) {
          firstReturn = Math.min(firstReturn, k);
          lastReturn = Math.max(lastReturn, k);
        }
        if (value > peak.value) peak = { value, bin: k };
      }
      return peak;
    });
    /** The time bins the measurement image spans: from a little before the first return to a little after the last. */
    const shownBins = [Math.floor(firstReturn * 0.82), Math.min(op.timeBins, Math.ceil(lastReturn * 1.05))];

    const surface = hiddenSurface(0.003);
    const nearest = (target) => scans.reduce((best, scan, s) => (
      Math.hypot(scan.point[0] - target[0], scan.point[1] - target[1])
        < Math.hypot(scans[best].point[0] - target[0], scans[best].point[1] - target[1]) ? s : best
    ), 0);
    const marked = MARKED.map((target) => {
      const index = nearest(target);
      const scan = scans[index];
      if (peaks[index].value === 0) throw new Error('FlatlandNlos: a marked scan point has no return');
      return {
        index,
        scan,
        wavefront: wavefrontReach(scan, all),
        touches: surface
          .filter(({ point }) => roundTrip(scan, point).weight > 0 && visible(scan.point, point, all))
          .map(({ point }) => ({ point, r: roundTrip(scan, point).r })),
      };
    });
    const markedRows = new Set(marked.map((each) => each.index));
    /** The other scan points with a return, in pixel order: the adjoint's second phase. */
    const otherRows = scans.map((_, s) => s).filter((s) => peaks[s].value > 0 && !markedRows.has(s));

    const grid = document.createElement('canvas');
    grid.width = GRID.n;
    grid.height = GRID.n;
    return {
      ...model, peaks, shownBins, marked, otherRows, grid,
      wavefronts: new Map(), quantiles: new Map(), measurements: null,
    };
  }, []);
}

/**
 * How far light from a scan point travels in each direction before the
 * scene blocks it: `angles` (radians from +x, over the half-plane in front
 * of the relay) and the `reach` along each.
 */
function wavefrontReach(scan, segments) {
  const facing = Math.atan2(scan.normal[1], scan.normal[0]);
  const angles = [];
  const reach = [];
  for (let i = 0; i <= WAVEFRONT_SAMPLES; i += 1) {
    const angle = facing - Math.PI / 2 + (Math.PI * i) / WAVEFRONT_SAMPLES;
    const end = [scan.point[0] + 4 * Math.cos(angle), scan.point[1] + 4 * Math.sin(angle)];
    // Bisect the visible length along the direction: `visible` owns what blocks light.
    let near = 0;
    let far = 4;
    if (visible(scan.point, end, segments)) near = far;
    while (far - near > 1e-3) {
      const middle = (near + far) / 2;
      const q = [scan.point[0] + middle * Math.cos(angle), scan.point[1] + middle * Math.sin(angle)];
      if (visible(scan.point, q, segments)) near = middle;
      else far = middle;
    }
    angles.push(angle);
    reach.push(near);
  }
  return { angles, reach };
}

/** Strokes the wavefront of radius `r` around a scan point: the arcs along which nothing blocks its light. */
function strokeWavefront(ctx, transform, scan, { angles, reach }, r) {
  const [cx, cy] = transform.toCanvas(scan.point);
  const radius = r * transform.scale;
  ctx.beginPath();
  let start = null;
  for (let i = 0; i <= angles.length; i += 1) {
    const open = i < angles.length && reach[i] > r;
    if (open && start === null) start = i;
    if (!open && start !== null) {
      // The canvas's y axis points down, so angles change sign and the arc runs counterclockwise.
      if (i - 1 > start) {
        ctx.moveTo(cx + radius * Math.cos(angles[start]), cy - radius * Math.sin(angles[start]));
        ctx.arc(cx, cy, radius, -angles[start], -angles[i - 1], true);
      }
      start = null;
    }
  }
  ctx.stroke();
}

function tracePolygon(ctx, transform, points) {
  ctx.beginPath();
  points.forEach((point, i) => {
    const [x, y] = transform.toCanvas(point);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

/** The lidar: a small body with its lens toward `angle` (radians from +x, counterclockwise in the room). */
function drawLidar(ctx, transform, angle) {
  const [x, y] = transform.toCanvas(LIDAR.position);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-angle);
  ctx.fillStyle = SCENE_COLORS.lidar;
  ctx.beginPath();
  ctx.roundRect(-17, -8, 16, 16, 2.5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-1, -4.5);
  ctx.lineTo(5, -7);
  ctx.lineTo(5, 7);
  ctx.lineTo(-1, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The outline of the grid over the hidden region, in the scene. */
function strokeHiddenRegion(ctx, transform, colors) {
  const [x0, y0] = transform.toCanvas([GRID.x0, GRID.y0 + GRID.size]);
  const size = GRID.size * transform.scale;
  ctx.strokeStyle = colors.hidden;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x0, y0, size, size);
}

/**
 * A scene: its surfaces, the occluder, the hidden object, the lidar, and
 * the direct light from the lidar to the scan points revealed so far
 * (`shown(i)` is scan point i's progress, 0 to 1: the ray grows, then the
 * point appears). `rays` is the opacity of the rays.
 */
function drawScene(ctx, transform, setup, scans, shown, rays, colors) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.fillStyle = SCENE_COLORS.object;
  tracePolygon(ctx, transform, HIDDEN_OUTLINE);
  ctx.fill();

  ctx.strokeStyle = SCENE_COLORS.surface;
  ctx.lineWidth = 2;
  tracePolygon(ctx, transform, OCCLUDER_OUTLINE);
  ctx.fillStyle = SCENE_COLORS.occluder;
  ctx.fill();
  ctx.stroke();
  for (const surface of setup.surfaces) {
    ctx.beginPath();
    ctx.moveTo(...transform.toCanvas(surface.a));
    ctx.lineTo(...transform.toCanvas(surface.b));
    ctx.stroke();
  }

  const lidar = transform.toCanvas(LIDAR.position);
  ctx.strokeStyle = colors.direct;
  ctx.lineWidth = 1;
  ctx.globalAlpha = rays;
  scans.forEach((scan, i) => {
    const progress = shown(i);
    if (progress <= 0) return;
    const reach = clamp01(progress / 0.7);
    const end = transform.toCanvas(scan.point);
    ctx.beginPath();
    ctx.moveTo(...lidar);
    ctx.lineTo(mix(lidar[0], end[0], reach), mix(lidar[1], end[1], reach));
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.hidden;
  scans.forEach((scan, i) => {
    const appear = clamp01((shown(i) - 0.7) / 0.3);
    if (appear <= 0) return;
    const [x, y] = transform.toCanvas(scan.point);
    ctx.beginPath();
    ctx.arc(x, y, 2.3 * appear, 0, 2 * Math.PI);
    ctx.fill();
  });
  drawLidar(ctx, transform, (LIDAR.top + LIDAR.bottom) / 2);
}

/** A soft point of light in `rgb`, paler at its center. */
function drawGlow(ctx, x, y, radius, rgb, alpha) {
  const pale = rgb.map((c) => Math.round(mix(c, 255, 0.55)));
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${pale.join(', ')}, ${alpha})`);
  gradient.addColorStop(0.4, `rgba(${rgb.join(', ')}, ${alpha * 0.7})`);
  gradient.addColorStop(1, `rgba(${rgb.join(', ')}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);
}

/** A ring around a scan point, marking it as one whose measurements are shown. */
function strokeRing(ctx, transform, scan, colors, alpha) {
  if (alpha <= 0) return;
  const [x, y] = transform.toCanvas(scan.point);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = colors.hidden;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 6.5, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

/** Clips to the grid over the hidden region, in the scene. */
function clipHiddenRegion(ctx, transform) {
  const [x0, y0] = transform.toCanvas([GRID.x0, GRID.y0 + GRID.size]);
  const size = GRID.size * transform.scale;
  ctx.beginPath();
  ctx.rect(x0, y0, size, size);
  ctx.clip();
}

/**
 * Black fading to clear over the scene panel's left and top edges, where
 * the scene is open: a wavefront drawn under it fades out toward the
 * panel's edge.
 */
function fadeOpenEdges(ctx, left) {
  const width = 36;
  const fade = (x0, y0, x1, y1) => {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    return gradient;
  };
  ctx.save();
  ctx.fillStyle = fade(left, 0, left + width, 0);
  ctx.fillRect(left - 1, PANEL.top - 1, width + 1, PANEL.size + 2);
  ctx.fillStyle = fade(0, PANEL.top, 0, PANEL.top + width);
  ctx.fillRect(left - 1, PANEL.top - 1, PANEL.size + 2, width + 1);
  ctx.restore();
}

/**
 * A marked scan point's confocal measurement at progress `u` of its sweep
 * (0 to 1): the time d that the sweep has reached, the radius d / 2 of the
 * wavefront whose light returns then, and the strength of the wavefront,
 * which falls off as 1 / r in 2D and fades out at the sweep's end.
 */
function sweepAt(model, u) {
  const r = (u * model.shownBins[1] * BIN) / 2;
  return { r, strength: u > 0 && u < 1 ? Math.min(1, 0.16 / r + 0.35) * clamp01((1 - u) / SWEEP_EDGES.fade) : 0 };
}

/** Step 0, under the scene: the wavefront around each marked scan point whose sweep is running. */
function drawWavefronts(ctx, transform, model, sweeps, colors) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = colors.indirect;
  ctx.lineWidth = 2;
  model.marked.forEach((each, i) => {
    const { r, strength } = sweepAt(model, sweeps[i]);
    if (strength <= 0) return;
    ctx.globalAlpha = strength;
    strokeWavefront(ctx, transform, each.scan, each.wavefront, r);
  });
  ctx.restore();
}

/** Step 0, over the scene: the hidden object's points lit just after a wavefront passes them. */
function drawTouches(ctx, transform, model, sweeps, colors) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  model.marked.forEach((each, i) => {
    const { r, strength } = sweepAt(model, sweeps[i]);
    if (strength <= 0) return;
    for (const touch of each.touches) {
      const behind = r - touch.r;
      if (behind < 0 || behind > 4 * TOUCH_GLOW) continue;
      const [x, y] = transform.toCanvas(touch.point);
      drawGlow(ctx, x, y, 5, colors.indirectRgb, 0.26 * Math.exp(-behind / TOUCH_GLOW));
    }
  });
  ctx.restore();
}

/**
 * Step 1's adjoint in the scene: the circle of scan point s's strongest
 * return, along which that measurement is spread. `inGrid` draws the part
 * over the hidden region, where the adjoint adds it to the grid; without
 * it, the whole circle, faint.
 */
function drawSpread(ctx, transform, model, s, strength, colors, { inGrid }) {
  const scan = model.scans[s];
  if (!model.wavefronts.has(s)) model.wavefronts.set(s, wavefrontReach(scan, SETUPS.nonplanar.known));
  ctx.save();
  if (inGrid) clipHiddenRegion(ctx, transform);
  ctx.strokeStyle = colors.indirect;
  ctx.lineWidth = inGrid ? 2 : 1.25;
  ctx.lineCap = 'round';
  ctx.globalAlpha = (inGrid ? 1 : 0.3) * strength;
  strokeWavefront(ctx, transform, scan, model.wavefronts.get(s), (model.peaks[s].bin * BIN) / 2);
  ctx.restore();
}

/**
 * The measurements b as an image at the resolution it is shown at: one row
 * per scan point (in pixel order, from the top), the time bins `shownBins`
 * across, from black through the indirect light's color toward
 * white. Each bin is shown times its weight in the least-squares problem
 * (d², which undoes the falloff), so near and far scan points' returns
 * read alike. Rows are resampled along time only.
 */
function measurementImage(model, ratio, rgb) {
  const { b, weights, scans, op, shownBins: [firstBin, endBin] } = model;
  const rows = scans.length;
  const bins = endBin - firstBin;
  const source = document.createElement('canvas');
  source.width = bins;
  source.height = rows;
  const sctx = source.getContext('2d');
  const pixels = sctx.createImageData(bins, rows);
  const shown = b.map((value, m) => value * weights[m % op.timeBins]);
  const top = positiveQuantile(shown, 0.995);
  for (let s = 0; s < rows; s += 1) {
    for (let k = 0; k < bins; k += 1) {
      const v = clamp01(shown[s * op.timeBins + firstBin + k] / top) ** 0.7;
      const toColor = clamp01(v / 0.75);
      const toWhite = clamp01((v - 0.75) / 0.25) * 0.6;
      const i = (s * bins + k) * 4;
      for (let c = 0; c < 3; c += 1) pixels.data[i + c] = rgb[c] * toColor * (1 - toWhite) + 255 * toWhite;
      pixels.data[i + 3] = 255;
    }
  }
  sctx.putImageData(pixels, 0, 0);

  const size = Math.round(PANEL.size * ratio);
  const image = document.createElement('canvas');
  image.width = size;
  image.height = size;
  const ictx = image.getContext('2d');
  ictx.imageSmoothingEnabled = true;
  ictx.imageSmoothingQuality = 'high';
  const rowEdge = (s) => Math.round((s * size) / rows);
  for (let s = 0; s < rows; s += 1) {
    ictx.drawImage(source, 0, s, bins, 1, 0, rowEdge(s), size, rowEdge(s + 1) - rowEdge(s));
  }
  return { image, ratio, rowTop: (s) => rowEdge(s) / ratio, rowHeight: (s) => (rowEdge(s + 1) - rowEdge(s)) / ratio };
}

/**
 * The measurement image: each marked scan point's row up to the time its
 * sweep has reached, with a line at that time while it runs; the other
 * rows at opacity `fill`; marks at the marked rows; and in step 1 an
 * outline around the row being spread back.
 */
function drawMeasurements(ctx, model, sweeps, fill, spreadRow, markStrength, colors) {
  const { image, ratio, rowTop, rowHeight } = model.measurements;
  const [firstBin, endBin] = model.shownBins;
  const left = LEFT.image;
  const top = PANEL.top;
  ctx.save();
  if (fill > 0) {
    ctx.globalAlpha = fill;
    ctx.drawImage(image, left, top, PANEL.size, PANEL.size);
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 1;
  model.marked.forEach((each, i) => {
    // Where the sweep's time falls in the image, as a fraction of its width.
    const reached = clamp01((sweeps[i] * endBin - firstBin) / (endBin - firstBin));
    const y = rowTop(each.index);
    const height = rowHeight(each.index);
    if (reached > 0 && fill < 1) {
      const width = reached * PANEL.size;
      ctx.drawImage(image, 0, y * ratio, width * ratio, height * ratio, left, top + y, width, height);
    }
    if (reached > 0 && sweeps[i] < 1) {
      const x = left + reached * PANEL.size;
      ctx.strokeStyle = colors.text;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, top + PANEL.size);
      ctx.stroke();
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(x, top + y - 5);
      ctx.lineTo(x, top + y + height + 5);
      ctx.stroke();
    }
    // A mark left of the row, in the scan points' red.
    ctx.globalAlpha = markStrength(i);
    ctx.fillStyle = colors.hidden;
    const middle = top + y + height / 2;
    ctx.beginPath();
    ctx.moveTo(left - 4, middle);
    ctx.lineTo(left - 11, middle - 4.5);
    ctx.lineTo(left - 11, middle + 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  });
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.strokeRect(left + 0.5, top + 0.5, PANEL.size - 1, PANEL.size - 1);
  if (spreadRow) {
    ctx.globalAlpha = spreadRow.strength;
    ctx.strokeStyle = colors.indirect;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(left - 1.5, top + rowTop(spreadRow.index) - 1, PANEL.size + 3, rowHeight(spreadRow.index) + 2);
  }
  ctx.restore();
}

/**
 * The grid over the hidden region, magnified into its panel and framed in
 * the hidden region's red: `values` (1 at the top of the range) through
 * inferno, with the hidden object's outline faint over it for reference.
 */
function drawGrid(ctx, model, values, colors) {
  const { grid } = model;
  const gctx = grid.getContext('2d');
  const pixels = gctx.createImageData(GRID.n, GRID.n);
  for (let j = 0; j < GRID.n; j += 1) {
    for (let i = 0; i < GRID.n; i += 1) {
      const level = values ? Math.round(255 * clamp01(values[j * GRID.n + i])) : 0;
      // Row j counts from the floor; image rows count from the top.
      const p = ((GRID.n - 1 - j) * GRID.n + i) * 4;
      pixels.data[p] = INFERNO_TABLE[level * 3];
      pixels.data[p + 1] = INFERNO_TABLE[level * 3 + 1];
      pixels.data[p + 2] = INFERNO_TABLE[level * 3 + 2];
      pixels.data[p + 3] = 255;
    }
  }
  gctx.putImageData(pixels, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(grid, LEFT.grid, PANEL.top, PANEL.size, PANEL.size);

  const scale = PANEL.size / GRID.size;
  const magnified = {
    toCanvas: ([x, y]) => [LEFT.grid + (x - GRID.x0) * scale, PANEL.top + (GRID.y0 + GRID.size - y) * scale],
  };
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  tracePolygon(ctx, magnified, HIDDEN_OUTLINE);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = colors.hidden;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(LEFT.grid, PANEL.top, PANEL.size, PANEL.size);
  ctx.restore();
}

/** A horizontal arrow from x0 to x1 at height y. */
function drawArrow(ctx, x0, x1, y, color, alpha) {
  const direction = Math.sign(x1 - x0);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1 - 8 * direction, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x1 - 12 * direction, y - 5.5);
  ctx.lineTo(x1 - 12 * direction, y + 5.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The display range of iterate k (1-based), cached. */
function iterateTop(model, k) {
  if (!model.quantiles.has(k)) model.quantiles.set(k, positiveQuantile(model.iterates[k - 1], 0.997));
  return model.quantiles.get(k);
}

/**
 * The estimate at a fraction of the CGLS phase, each iterate scaled to its
 * own range, blended between consecutive iterates; and the iteration shown.
 * Iterations come slowly at first, where each changes the estimate most.
 */
function iterateAt(model, progress) {
  const position = 1 + (ITERATIONS - 1) * progress ** 1.8;
  const k = Math.min(ITERATIONS - 1, Math.floor(position));
  const blend = position - k;
  const current = model.iterates[k - 1];
  const next = model.iterates[k];
  const currentTop = iterateTop(model, k);
  const nextTop = iterateTop(model, k + 1);
  const values = new Float32Array(current.length);
  for (let v = 0; v < values.length; v += 1) values[v] = (1 - blend) * (current[v] / currentTop) + blend * (next[v] / nextTop);
  return { values, iteration: Math.round(position) };
}

/**
 * The adjoint so far, scaled to its range: the marked scan points'
 * backprojections up to fractional count `spread`, then the others' up to
 * fractional count `accumulate`. With all of them it is Aᵀ D² b, the first
 * CGLS iterate up to scale.
 */
function adjointAt(model, spread, accumulate) {
  const values = new Float32Array(GRID.n * GRID.n);
  const add = (s, weight) => {
    if (weight <= 0) return;
    const backprojection = model.backprojections[s];
    for (let v = 0; v < values.length; v += 1) values[v] += weight * backprojection[v];
  };
  model.marked.forEach((each, i) => add(each.index, ease(clamp01(spread - i))));
  model.otherRows.forEach((s, i) => add(s, clamp01(accumulate - i)));
  const top = positiveQuantile(values, 0.997);
  for (let v = 0; v < values.length; v += 1) values[v] /= top;
  return values;
}

/**
 * NLOS reconstruction in 2D, computed live. Step 0: a planar relay wall
 * scanned on a uniform grid beside a scene whose visible surfaces are the
 * relays, scanned where the lidar's pixels land; around three scan points
 * in turn, a wavefront of radius d / 2 grows with time d, lights the hidden
 * object as it passes it, and that scan point's row of the measurements b
 * (scan point × time) fills in; then every row appears. Step 1: the planar
 * setting leaves, the scene moves left, and the grid over the hidden region
 * appears magnified; each scan point's measurements are spread back along
 * their circles (the adjoint), then CGLS iterations sharpen the estimate;
 * two arrows between the grid and the measurements name the forward
 * operator and the adjoint. Everything is a function of the step clock; a
 * still frame shows each step's end (the last iterate in step 1).
 *
 * Content fields: `title`, `buildSteps` (2), and `labels`: `planar`,
 * `nonplanar`, `grid`, `measurements` (above the panels); `planarSampling`
 * and `nonplanarSampling` (under the two scenes: how each is scanned);
 * `backprojection` (under the grid during the adjoint), `iteration` (the
 * word before the count); `time`, `scanPoint` (the measurements' axes);
 * `forward`, `adjoint` (the operators); `note` (what kind of picture this
 * is, at the lower right under the figure).
 */
export default function FlatlandNlos({ slide, buildStep }) {
  const { labels } = slide;
  const model = useFlatland();
  const [canvasRef, ratio] = useStageCanvas();
  const colorsRef = useRef(null);
  const planarLabels = useRef(null);
  const sceneLabels = useRef(null);
  const gridLabel = useRef(null);
  const backprojectionLabel = useRef(null);
  const iterationLabel = useRef(null);
  const iterationCount = useRef(null);
  const forwardLabel = useRef(null);
  const adjointLabel = useRef(null);

  const paint = (ms) => {
    const canvas = canvasRef.current;
    const step = Math.min(buildStep, 1);
    colorsRef.current ??= themeColors(canvas);
    const colors = colorsRef.current;
    if (model.measurements?.ratio !== ratio) model.measurements = measurementImage(model, ratio, colors.indirectRgb);
    const frame = frameAt(step, ms);
    const sweeps = model.marked.map((_, i) => clamp01(frame.sweep * model.marked.length - i));
    const planarOut = clamp01(frame.focus / 0.35);
    const move = ease(clamp01((frame.focus - 0.15) / 0.65));
    const gridIn = clamp01((frame.focus - 0.6) / 0.4);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, FIGURE.width, FIGURE.height);

    // The planar setting.
    if (planarOut < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - planarOut;
      const planar = sceneTransform(LEFT.planar);
      const rays = mix(0.42, 0.2, phase(ms, [TIMELINE.planarGrid[1], TIMELINE.planarGrid[1] + 600]));
      drawScene(
        ctx, planar, SETUPS.planar, model.planar,
        (i) => staggered(frame.planarGrid, i, model.planar.length, 1.5), step === 0 ? rays : 0.2, colors,
      );
      strokeHiddenRegion(ctx, planar, colors);
      ctx.restore();
    }

    // The adjoint, then the iterations, on the grid.
    let spreadRow = null;
    let iteration = null;
    if (gridIn > 0) {
      let values = null;
      if (frame.iterations > 0) {
        ({ values, iteration } = iterateAt(model, frame.iterations));
      } else if (frame.spread > 0) {
        const spread = frame.spread * model.marked.length;
        const accumulate = frame.accumulate * model.otherRows.length;
        values = adjointAt(model, spread, accumulate);
        if (frame.spread < 1) {
          const i = Math.min(model.marked.length - 1, Math.floor(spread));
          spreadRow = { index: model.marked[i].index, strength: Math.sin(Math.PI * clamp01(spread - i)) ** 0.5 };
        } else if (frame.accumulate > 0 && frame.accumulate < 1) {
          const i = Math.min(model.otherRows.length - 1, Math.floor(accumulate));
          spreadRow = { index: model.otherRows[i], strength: 1 };
        }
      }
      ctx.save();
      ctx.globalAlpha = gridIn;
      drawGrid(ctx, model, values, colors);
      ctx.restore();
    }

    // The scene, with the visible surfaces as relays: wavefronts under it, what they light over it.
    const sceneLeft = mix(LEFT.scene[0], LEFT.scene[1], move);
    const scene = sceneTransform(sceneLeft);
    const shown = (i) => staggered(frame.pixels, i, model.scans.length, 4);
    const rays = step === 0 ? mix(0.3, 0.13, phase(ms, [TIMELINE.pixels[1], TIMELINE.pixels[1] + 600])) : 0.13;
    const marking = (i) => clamp01(sweeps[i] / SWEEP_EDGES.appear) * (1 - planarOut);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sceneLeft, PANEL.top, PANEL.size, PANEL.size);
    ctx.clip();
    drawWavefronts(ctx, scene, model, sweeps, colors);
    if (spreadRow) drawSpread(ctx, scene, model, spreadRow.index, spreadRow.strength, colors, { inGrid: false });
    ctx.restore();
    fadeOpenEdges(ctx, sceneLeft);
    drawScene(ctx, scene, SETUPS.nonplanar, model.scans, shown, rays, colors);
    strokeHiddenRegion(ctx, scene, colors);
    drawTouches(ctx, scene, model, sweeps, colors);
    model.marked.forEach((each, i) => strokeRing(ctx, scene, each.scan, colors, marking(i)));
    if (spreadRow) {
      drawSpread(ctx, scene, model, spreadRow.index, spreadRow.strength, colors, { inGrid: true });
      strokeRing(ctx, scene, model.scans[spreadRow.index], colors, spreadRow.strength);
    }

    // The measurements.
    drawMeasurements(ctx, model, sweeps, frame.fill, spreadRow, marking, colors);

    // The operators; the forward operator is dim while only the adjoint is applied.
    const forwardStrength = gridIn * (frame.iterations > 0 ? 1 : 0.35);
    if (gridIn > 0) {
      drawArrow(ctx, ARROWS.from, ARROWS.to, ARROWS.forward, colors.direct, forwardStrength);
      drawArrow(ctx, ARROWS.to, ARROWS.from, ARROWS.adjoint, colors.indirect, gridIn);
    }

    // Labels that follow the clock.
    planarLabels.current.style.opacity = String(1 - planarOut);
    sceneLabels.current.style.transform = `translateX(${sceneLeft}px)`;
    gridLabel.current.style.opacity = String(gridIn);
    backprojectionLabel.current.style.opacity = String(frame.spread > 0 && iteration === null ? 1 : 0);
    iterationLabel.current.style.opacity = String(iteration === null ? 0 : 1);
    if (iteration !== null) iterationCount.current.textContent = String(iteration);
    forwardLabel.current.style.opacity = String(forwardStrength);
    adjointLabel.current.style.opacity = String(gridIn);
  };
  useStepClock(buildStep, paint, { until: settledAfter(Math.min(buildStep, 1)) });

  const box = (left, width, top) => ({ left, width, top });
  const arrowLabel = (top) => box(ARROWS.from - 10, ARROWS.to - ARROWS.from + 20, top);
  return (
    <div className="flatland-nlos">
      <SlideTitle title={slide.title} />
      <div className="flatland-nlos-stage">
        <div className="flatland-nlos-figure" style={{ width: FIGURE.width, height: FIGURE.height }}>
          <canvas
            ref={canvasRef}
            width={FIGURE.width * ratio}
            height={FIGURE.height * ratio}
            style={{ width: FIGURE.width, height: FIGURE.height }}
          />
          <div ref={planarLabels} className="flatland-nlos-group flatland-nlos-timed" style={box(LEFT.planar, PANEL.size, 0)}>
            <div className="flatland-nlos-label"><Text>{labels.planar}</Text></div>
            <div className="flatland-nlos-label flatland-nlos-label--under" style={{ top: UNDER }}>
              <Text>{labels.planarSampling}</Text>
            </div>
          </div>
          <div ref={sceneLabels} className="flatland-nlos-group" style={box(0, PANEL.size, 0)}>
            <div className="flatland-nlos-label"><Text>{labels.nonplanar}</Text></div>
            <div className="flatland-nlos-label flatland-nlos-label--under" style={{ top: UNDER }}>
              <Text>{labels.nonplanarSampling}</Text>
            </div>
          </div>
          <div ref={gridLabel} className="flatland-nlos-group flatland-nlos-timed" style={box(LEFT.grid, PANEL.size, 0)}>
            <div className="flatland-nlos-label"><Text>{labels.grid}</Text></div>
          </div>
          <div
            ref={backprojectionLabel}
            className="flatland-nlos-label flatland-nlos-label--under flatland-nlos-label--adjoint flatland-nlos-timed"
            style={box(LEFT.grid, PANEL.size, UNDER)}
          >
            <Text>{labels.backprojection}</Text>
          </div>
          <div
            ref={iterationLabel}
            className="flatland-nlos-label flatland-nlos-label--under flatland-nlos-label--count flatland-nlos-timed"
            style={box(LEFT.grid, PANEL.size, UNDER)}
          >
            <Text>{labels.iteration}</Text> <span ref={iterationCount}>{ITERATIONS}</span>
          </div>
          <div className="flatland-nlos-label" style={box(LEFT.image, PANEL.size, 0)}>
            <Text>{labels.measurements}</Text>
          </div>
          <div className="flatland-nlos-label flatland-nlos-label--axis" style={box(LEFT.image, PANEL.size, UNDER)}>
            <Text>{labels.time}</Text>
          </div>
          <div
            className="flatland-nlos-label flatland-nlos-label--axis flatland-nlos-label--scan-axis"
            style={box(LEFT.image - 28 - PANEL.size / 2, PANEL.size, PANEL.top + PANEL.size / 2 - 11)}
          >
            <Text>{labels.scanPoint}</Text>
          </div>
          <div
            ref={forwardLabel}
            className="flatland-nlos-label flatland-nlos-label--forward flatland-nlos-timed"
            style={arrowLabel(ARROWS.forward - 38)}
          >
            <Text>{labels.forward}</Text>
          </div>
          <div
            ref={adjointLabel}
            className="flatland-nlos-label flatland-nlos-label--adjoint flatland-nlos-timed"
            style={arrowLabel(ARROWS.adjoint + 10)}
          >
            <Text>{labels.adjoint}</Text>
          </div>
        </div>
        <div className="flatland-nlos-note"><Text>{labels.note}</Text></div>
      </div>
    </div>
  );
}

/**
 * Ahead of the slide (the audience view calls it while the page is idle):
 * the measurements, then the reconstruction, which the slide would
 * otherwise solve on the key press that arrives at it.
 */
FlatlandNlos.prepare = async () => {
  flatlandMeasurements();
  await whenIdle();
  flatlandNlos();
};
