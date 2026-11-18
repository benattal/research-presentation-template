import { useEffect, useMemo, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { ease, useStepTransition } from '@core/stage/canvas.js';
import Chart from '@core/stage/Chart.jsx';
import RoomView from '../flatland/RoomView.jsx';
import { drawGlowPoint, drawPixelWedge, drawRoomCamera } from '../flatland/overlays.js';
import { SURFACE_GAIN, derived } from '../flatland/pictures.js';
import { ROOM_VIEW, drawRoom, pixelWedge } from '../flatland/render.js';
import { MEASURED_PIXEL, flatlandRoom } from '../flatland/rooms.js';
import { CAMERA, cameraRay, castRay } from '../flatland/scene.js';
import {
  ORDERS, fluenceInFlight, patchesAt, pixelTransient, solveTransient,
} from '../flatland/transient.js';
import './TransientFlatland.css';

const ROOM = ROOM_VIEW;
const CHART = [338, 320];
/** Time bins of the solve: 0.2 m each, 180 m in all, so the light still to arrive is below 1 ppm. */
const STEP = 0.2;
const BINS = 900;
/** The pulse lasts 3 bins (0.6 m, 2 ns). */
const PULSE_BINS = 3;
/** Bins of the plotted histogram, in solve bins (0.6 m, 2 ns each), and the plotted range in meters. */
const PLOT_BIN = 3;
const PLOT_RANGE = 42;
/** Meters of path per nanosecond: the speed of light. The room is 10 m wide. */
const METERS_PER_NS = 0.2998;
/** Rays across the measured pixel. */
const PIXEL_RAYS = 16;

/** Bounce orders plotted together: direct light, the second bounce, and every later one. */
const GROUPS = [[1], [2], range(3, ORDERS)];
const GROUP_NAMES = ['direct', 'bounce 2', '3 or more'];

/** The light of the room's renders (`--light-1`), for the light travelling to the camera in the pixel's wedge. */
const ARRIVING_LIGHT = [255, 210, 122];
/** Color stops of the wedge's light, from the camera to the floor. */
const WEDGE_STOPS = 48;

function range(from, to) {
  return Array.from({ length: to - from }, (_, i) => from + i);
}

const luminance = (v, i) => 0.2126 * v[i * 3] + 0.7152 * v[i * 3 + 1] + 0.0722 * v[i * 3 + 2];

/** The pulse's transient and the measured pixel's histogram by bounce order. */
function transientRoom(env) {
  return derived(env.steady, 'transient', () => {
    const { patches } = env.room;
    const E = new Float64Array(patches.length * 3);
    for (const patch of patches) {
      if (!patch.emission) continue;
      for (let c = 0; c < 3; c += 1) E[patch.index * 3 + c] = patch.emission[c];
    }
    const transient = solveTransient(env.transport, E, { step: STEP, bins: BINS, pulseBins: PULSE_BINS });
    const rays = [];
    for (let i = 0; i < PIXEL_RAYS; i += 1) {
      const s = MEASURED_PIXEL[0] + ((i + 0.5) / PIXEL_RAYS) * (MEASURED_PIXEL[1] - MEASURED_PIXEL[0]);
      const hit = castRay(env.room, CAMERA.position, cameraRay(CAMERA, s));
      rays.push({ patch: hit.patch.index, distance: hit.distance });
    }
    const histograms = pixelTransient(transient, rays);
    // The pixel's light at each arrival time (all orders, luminance), and its distance to the floor.
    const arrival = Float64Array.from({ length: BINS }, (_, t) => histograms.slice(1).reduce((sum, order) => sum + luminance(order, t), 0));
    const distance = rays.reduce((sum, ray) => sum + ray.distance, 0) / rays.length;
    return { transient, histograms, arrival, arrivalPeak: Math.max(...arrival), distance };
  });
}

/**
 * The light now in the pixel's wedge, on its way to the camera: at
 * distance s from the camera it arrives at time + s, so its brightness is
 * the pixel's arrival then, relative to the brightest arrival (a fixed
 * exposure for every step, unlike the room's). A glow at the camera is
 * the light arriving now.
 */
function drawArrivingLight(ctx, env, transform, result, time) {
  const { camera, ends } = pixelWedge(env.room, transform, MEASURED_PIXEL);
  const floor = [(ends[0][0] + ends[1][0]) / 2, (ends[0][1] + ends[1][1]) / 2];
  const at = (t) => {
    const bin = Math.round(t / STEP);
    if (bin < 0 || bin >= BINS) return 0;
    return result.arrival[bin] / result.arrivalPeak;
  };
  const shade = (value) => Math.min(1, 0.95 * Math.sqrt(value));
  // The wedge is a few pixels wide near the camera, so the light is drawn as a glowing line along its middle.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (const pass of [{ width: 14, blur: 5, alpha: 0.45 }, { width: 4, blur: 0, alpha: 1 }]) {
    const gradient = ctx.createLinearGradient(...camera, ...floor);
    for (let k = 0; k <= WEDGE_STOPS; k += 1) {
      const s = (k / WEDGE_STOPS) * result.distance;
      gradient.addColorStop(k / WEDGE_STOPS, `rgba(${ARRIVING_LIGHT.join(', ')}, ${pass.alpha * shade(at(time + s))})`);
    }
    ctx.filter = pass.blur ? `blur(${pass.blur}px)` : 'none';
    ctx.strokeStyle = gradient;
    ctx.lineWidth = pass.width;
    ctx.beginPath();
    ctx.moveTo(...camera);
    ctx.lineTo(...floor);
    ctx.stroke();
  }
  ctx.restore();
  const now = shade(at(time));
  if (now > 0.01) drawGlowPoint(ctx, transform, CAMERA.position, `rgba(${ARRIVING_LIGHT.join(', ')}, ${now})`, 9);
}

/** The plotted histogram up to time `time` (m): stacked bars per bounce order, per 2 ns, in radiance per ns. */
function histogramBars(histograms, time) {
  const perNs = METERS_PER_NS / (PLOT_BIN * STEP);
  const series = [];
  const count = Math.floor(PLOT_RANGE / (PLOT_BIN * STEP));
  const base = new Float64Array(count);
  GROUPS.forEach((orders, group) => {
    const points = [];
    for (let b = 0; b < count; b += 1) {
      const start = b * PLOT_BIN;
      if (start * STEP > time) break;
      let value = 0;
      for (const order of orders) {
        for (let t = start; t < start + PLOT_BIN; t += 1) value += luminance(histograms[order], t);
      }
      value *= perNs;
      const center = ((start + PLOT_BIN / 2) * STEP) / METERS_PER_NS;
      if (value > 0) points.push([center, base[b] + value, base[b]]);
      base[b] += value;
    }
    series.push({ kind: 'bars', points, barWidth: (PLOT_BIN * STEP) / METERS_PER_NS * 0.92, className: `transient-group-${group + 1}` });
  });
  return { series, top: Math.max(...base) };
}

/**
 * Transient light transport in the flatland room: the lamp flashes a 2 ns
 * pulse, and build steps `{ time }` (meters of light travel) show the light
 * in flight at that time, the measured pixel's view with the light in it
 * on its way to the camera, and the pixel's transient histogram so far,
 * stacked by bounce order (direct light first, the indirect tail after).
 * Moving forward animates the time. Dragging on the plot sets the time.
 *
 * Content fields: `title`, `subtitle`, `buildSteps` ({ time } each, in
 * meters; the room is 10 m wide).
 */
export default function TransientFlatland({ slide, buildStep }) {
  const env = flatlandRoom('diffuse', 'lamp');
  const result = useMemo(() => transientRoom(env), [env]);
  const times = slide.buildSteps.map((entry) => entry.time);
  const step = Math.min(buildStep, times.length - 1);
  const [scrubbed, setScrubbed] = useState(null);
  useEffect(() => setScrubbed(null), [buildStep]);
  const fromStep = useStepTransition(step);
  const from = fromStep !== null ? times[fromStep] : null;
  const time = scrubbed ?? times[step];
  const [shownTime, setShownTime] = useState(time);

  // Each step has its own exposure (the light in flight dims by orders of magnitude), shown
  // relative to the first step's; moving forward blends the two exposures.
  const gainAt = (t) => derived(result.transient.total, `gain:${t}`, () => meanExposure(env.table, fluenceInFlight(env.table, result.transient, t)));
  const reference = gainAt(times[0]);

  const paint = (ctx, progress) => {
    const a = from !== null && scrubbed === null ? ease(progress) : 1;
    const t = from !== null && scrubbed === null ? from + (time - from) * a : time;
    const target = gainAt(scrubbed === null ? times[step] : times[stepBefore(times, scrubbed)]);
    const gain = from !== null && scrubbed === null ? Math.exp((1 - a) * Math.log(gainAt(from)) + a * Math.log(target)) : target;
    if (progress === 1 || Math.abs(t - shownTime) > 0.5) setShownTime(t);
    const surfaces = patchesAt(result.transient, t);
    const transform = drawRoom(ctx, env.room, { x: 0, y: 0, width: ROOM[0], height: ROOM[1] }, {
      table: env.table,
      fluence: fluenceInFlight(env.table, result.transient, t),
      fluenceGain: gain,
      surfaces,
      surfaceGain: gain * SURFACE_GAIN,
    });
    drawPixelWedge(ctx, env.room, transform, MEASURED_PIXEL, [76, 201, 240], { fill: 0.1, line: 0.5 });
    drawArrivingLight(ctx, env, transform, result, t);
    drawRoomCamera(ctx, transform);
    drawExposure(ctx, gain / reference);
  };

  const { series } = useMemo(() => histogramBars(result.histograms, shownTime), [result, shownTime]);
  // The axes are those of the whole histogram from the first step, so they stay put as light arrives.
  const whole = useMemo(() => histogramBars(result.histograms, Infinity), [result]);
  const yTop = niceCeiling(whole.top);
  const ns = (meters) => meters / METERS_PER_NS;
  const xMax = ns(PLOT_RANGE);
  const ticks = [0, 40, 80, 120].filter((v) => v <= xMax);

  return (
    <div className="slide--transient-flatland">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="transient-body">
        <RoomView
          width={ROOM[0]}
          height={ROOM[1]}
          paint={paint}
          animationKey={`${step}`}
          duration={from !== null ? 1800 : 0}
          redrawKey={`${scrubbed}`}
          className="transient-room"
        />
        <div className="transient-side">
          <div className="transient-time"><Text>{`$\\tau = ${Math.round(ns(shownTime))}$ ns`}</Text></div>
          <Chart
            width={CHART[0]}
            height={CHART[1]}
            x={{ min: 0, max: xMax, ticks: ticks.map((v) => ({ value: v, label: String(v) })), label: '$\\tau$ (ns)' }}
            // The arrival times are what the speaker reads; the radiance needs only its axis, no values.
            y={{ min: 0, max: yTop, ticks: [], label: 'radiance / ns' }}
            series={series}
            marks={[{ x: ns(shownTime), className: 'transient-cursor' }]}
            onPointer={(value) => setScrubbed(value * METERS_PER_NS)}
            className="transient-chart"
          />
          <ul className="transient-legend">
            {GROUP_NAMES.map((name, i) => (
              <li key={name} className={`transient-group-${i + 1}`}>{name}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * An exposure from the mean light in the room (outside the box): sparse
 * light, like the first wavefront, comes out bright, and light spread
 * evenly through the room, like the late glow, stays dim.
 */
function meanExposure(table, light) {
  let sum = 0;
  let count = 0;
  for (let cell = 0; cell < table.width * table.height; cell += 1) {
    if (table.solid[cell]) continue;
    sum += 0.2126 * light[cell * 3] + 0.7152 * light[cell * 3 + 1] + 0.0722 * light[cell * 3 + 2];
    count += 1;
  }
  return sum > 0 ? (0.07 * count) / sum : 1;
}

/** The index of the last step whose time is at most `t` (the first step if none). */
function stepBefore(times, t) {
  let index = 0;
  times.forEach((value, i) => {
    if (value <= t) index = i;
  });
  return index;
}

/** The exposure relative to the first step's, at the bottom left of the render. */
function drawExposure(ctx, factor) {
  if (factor < 1.5) return;
  ctx.save();
  ctx.font = "18px 'Inter Variable', Inter, sans-serif";
  ctx.fillStyle = 'rgba(215, 219, 228, 0.85)';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`exposure ×${Math.round(factor)}`, 14, ROOM[1] - 12);
  ctx.restore();
}

function niceCeiling(value) {
  const power = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 2.5, 5, 10].map((m) => m * power).find((v) => v >= value * 0.999);
}
