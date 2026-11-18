import { useMemo, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import Chart from '../charts/Chart.jsx';
import RoomView from '../flatland/RoomView.jsx';
import { GATHER_RAYS_PER_BIN, gatherAt, nearestSurfacePoint } from '../flatland/gather.js';
import { drawGlowPoint, drawLightSegments, lightColor } from '../flatland/overlays.js';
import { SURFACE_GAIN, cachedFluence, derived, sceneGain } from '../flatland/pictures.js';
import { ROOM_VIEW, drawRoom, roomTransform } from '../flatland/render.js';
import { flatlandRoom } from '../flatland/rooms.js';
import { BINS, direction } from '../flatland/scene.js';
import { patchRadiosity } from '../flatland/transport.js';
import './ScatteringGather.css';

const ROOM = ROOM_VIEW;
const CHART = [338, 270];
/** The point gathered at first: the floor left of the box, under the lamp's edge. */
const START = { group: 'floor', x: 3.31 };
/** Rays drawn per direction bin (the sum uses all of the gather's rays). */
const DRAWN_PER_BIN = 3;
/** Radius of the half circle of directions, in room units. */
const HALF_CIRCLE = 1.3;
/** Rays stop this far (room units) from the point, so their sum does not saturate it. */
const RAY_GAP = 0.2;

/** The build steps: directions, incident light, weighted by the BRDF and cosine, and the sum. */
const STEP_COUNT = 4;

const luminance = (v) => 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];

function startPoint(room) {
  const patch = room.patches.find((p) => p.group === START.group && Math.abs(p.center[0] - START.x) < 0.3);
  return { patch: patch.index, u: 0.5 };
}

/** The equation, with the term of the current step in color and the rest muted. */
function equation(step) {
  const term = (on, cls, tex) => `\\htmlClass{${on ? cls : 'term-muted'}}{${tex}}`;
  return `$L_o = ${term(step >= 3, 'term-bounce-1', 'L_e')} + ${term(step >= 3, 'term-bounce-1', '\\int')}`
    + `${term(step >= 2, 'term-operator', 'f_r')}\\, ${term(step >= 1, 'term-bounce-1', 'L_i')}`
    + `\\, ${term(step >= 2, 'term-operator', '\\cos\\theta')}\\, ${term(step === 0, 'term-bounce-1', 'd\\theta')}$`;
}

/**
 * The scattering integral at one surface point, in the lamp's lit room:
 * build steps show the half circle of directions at the point, the rays
 * to the surface visible in each direction (colored by its outgoing light,
 * L_i), the rays weighted by the BRDF and cosine, and their sum, the
 * point's outgoing light L_o, against L_o of its patch from the solve of
 * x = e + Ax. A plot
 * beside the room shows L_i(θ) and f_r L_i cos θ over the directions.
 * Clicking a surface moves the point.
 *
 * Content fields: `title`, `subtitle`, and four `buildSteps`, each with a
 * short `label` shown under the room.
 */
export default function ScatteringGather({ slide, buildStep }) {
  if (slide.buildSteps?.length !== STEP_COUNT) throw new Error(`scatteringGather: needs ${STEP_COUNT} build steps`);
  const env = flatlandRoom('diffuse', 'lamp');
  const [point, setPoint] = useState(() => startPoint(env.room));
  const step = Math.min(buildStep, STEP_COUNT - 1);
  const patch = env.room.patches[point.patch];
  const gather = useMemo(
    () => gatherAt(env.room, patch, point.u, env.steady, env.transport.emission),
    [env, patch, point.u],
  );
  const gain = sceneGain(env, false);
  const surfaceGain = gain * SURFACE_GAIN;
  // Rays get their own exposure: the median incident light sits mid-curve, so colors stay apart.
  const rayGain = useMemo(() => {
    const values = gather.rays.map((ray) => luminance(ray.radiance)).sort((a, b) => a - b);
    return 0.55 / Math.max(1e-6, values[Math.floor(values.length / 2)]);
  }, [gather]);

  const paint = (ctx, progress) => {
    const transform = drawRoom(ctx, env.room, { x: 0, y: 0, width: ROOM[0], height: ROOM[1] }, {
      table: env.table,
      fluence: cachedFluence(env.table, env.steady, Infinity, 'source'),
      fluenceGain: gain * 0.07,
      surfaces: derived(env.steady, 'radiosity', () => patchRadiosity(env.transport, env.steady)),
      surfaceGain,
    });
    // DRAWN_PER_BIN evenly spaced rays of each bin's GATHER_RAYS_PER_BIN.
    const every = Math.round(GATHER_RAYS_PER_BIN / DRAWN_PER_BIN);
    const shown = gather.rays.filter((ray) => ray.k % every === Math.floor(every / 2) && ray.k < every * DRAWN_PER_BIN);
    if (step === 0) drawHalfCircle(ctx, transform, patch, gather.point, progress);
    if (step >= 1) {
      const reach = step === 1 ? progress : 1;
      // From step 2 on, each ray is scaled by f_r cos θ relative to its largest value, 2 f_r = albedo
      // (blended in as step 2 animates); the sum dims the rays under the point's own light.
      const blend = step === 2 ? progress : 1;
      const dim = step === 3 ? 1 - 0.55 * progress : 1;
      const segments = shown.map((ray) => {
        const rgb = ray.radiance.map((value, c) => dim * value * (step >= 2 ? 1 - blend + blend * patch.albedo[c] * Math.cos(ray.theta) : 1));
        const d = [ray.end[0] - gather.point[0], ray.end[1] - gather.point[1]];
        const length = Math.hypot(...d);
        const start = Math.min(RAY_GAP, length) / length;
        const along = start + (1 - start) * reach;
        return {
          a: [gather.point[0] + d[0] * along, gather.point[1] + d[1] * along],
          b: [gather.point[0] + d[0] * start, gather.point[1] + d[1] * start],
          color: lightColor(rgb, rayGain),
        };
      });
      drawLightSegments(ctx, transform, segments, { width: 1.4, glow: 3 });
    }
    if (step >= 2) drawCosineLobe(ctx, transform, patch, gather.point);
    if (step >= 3) drawOutgoing(ctx, transform, patch, gather.point, lightColor(gather.outgoing, rayGain), progress);
    drawGlowPoint(ctx, transform, gather.point, 'rgba(255, 255, 255, 0.95)', 3.5);
  };

  const pick = (event, [x, y]) => {
    if (event.button !== 0) return;
    const transform = roomTransform({ x: 0, y: 0, width: ROOM[0], height: ROOM[1] });
    // A click anywhere picks the nearest surface point, so every click moves the point.
    const hit = nearestSurfacePoint(env.room, transform.toRoom([x, y]), Infinity);
    if (hit && hit.patch.finish === 'diffuse') setPoint({ patch: hit.patch.index, u: hit.u });
  };

  const degrees = (theta) => (theta * 180) / Math.PI;
  const incident = gather.rays.map((ray) => [degrees(ray.theta), luminance(ray.radiance)]);
  const weighted = gather.rays.map((ray) => [
    degrees(ray.theta),
    luminance(ray.radiance.map((value, c) => (patch.albedo[c] / 2) * value * Math.cos(ray.theta))),
  ]);
  const top = niceCeiling(Math.max(...incident.map(([, v]) => v), 0.1));
  const series = [];
  if (step >= 1) series.push({ kind: step >= 2 ? 'line' : 'area', points: incident, className: step >= 2 ? 'gather-chart-incident-faint' : 'gather-chart-incident' });
  if (step >= 2) series.push({ kind: 'area', points: weighted, className: step >= 3 ? 'gather-chart-weighted-sum' : 'gather-chart-weighted' });
  if (step >= 2) series.push({ kind: 'line', points: weighted, className: 'gather-chart-weighted-line' });

  return (
    <div className="slide--scattering-gather">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="gather-body">
        <div className="gather-left">
          <RoomView
            width={ROOM[0]}
            height={ROOM[1]}
            paint={paint}
            animationKey={`${step}|${point.patch}|${point.u}`}
            duration={[900, 1400, 900, 900][step]}
            className="gather-room"
            onPointerDown={pick}
          />
          <p className="gather-room-label"><Text>{slide.buildSteps[step].label}</Text></p>
        </div>
        <div className="gather-side">
          <div className="gather-equation"><Text>{equation(step)}</Text></div>
          <Chart
            width={CHART[0]}
            height={CHART[1]}
            x={{ min: -90, max: 90, ticks: [-90, -45, 0, 45, 90].map((v) => ({ value: v, label: `${v}°` })), label: '$\\theta$' }}
            y={{ min: 0, max: top, ticks: [0, top / 2, top].map((v) => ({ value: v, label: formatTick(v) })), label: 'radiance' }}
            series={series}
            notes={step >= 1 ? noteLabels(step, incident, weighted) : []}
          />
          {step >= 3 && (
            <dl className="gather-check">
              <dt><Text>{'$L_o$ gathered'}</Text></dt>
              <dd>{luminance(gather.outgoing).toFixed(3)}</dd>
              <dt><Text>{'$L_o$ solved'}</Text></dt>
              <dd>{luminance(gather.solved).toFixed(3)}</dd>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

/** Labels of the plotted curves, beside their highest points. */
function noteLabels(step, incident, weighted) {
  const peak = (points) => points.reduce((best, p) => (p[1] > best[1] ? p : best), points[0]);
  const notes = [];
  const [ix, iy] = peak(incident);
  notes.push({ x: ix, y: iy, text: '$L_i$', dx: ix > 40 ? -10 : 10, dy: -14, align: ix > 40 ? 'right' : 'left', className: 'gather-note-incident' });
  if (step >= 2) {
    const [wx, wy] = peak(weighted);
    notes.push({ x: wx, y: wy, text: '$f_r L_i \\cos\\theta$', dx: wx > 0 ? -12 : 12, dy: -16, align: wx > 0 ? 'right' : 'left', className: 'gather-note-weighted' });
  }
  return notes;
}

function niceCeiling(value) {
  const power = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 2.5, 5, 10].map((m) => m * power).find((v) => v >= value * 0.999);
}

function formatTick(value) {
  return value === 0 ? '0' : String(Number(value.toPrecision(2)));
}

/** The half circle of directions at the point: an arc with a spoke at each bin edge. */
function drawHalfCircle(ctx, transform, patch, point, progress) {
  ctx.save();
  ctx.strokeStyle = 'rgba(232, 236, 244, 0.75)';
  ctx.lineWidth = 1.5;
  const [cx, cy] = transform.toCanvas(point);
  const r = HALF_CIRCLE * transform.scale * (0.4 + 0.6 * progress);
  const normalAngle = Math.atan2(-patch.normal[1], patch.normal[0]);
  ctx.beginPath();
  ctx.arc(cx, cy, r, normalAngle - Math.PI / 2, normalAngle + Math.PI / 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(232, 236, 244, 0.35)';
  for (let b = 0; b <= BINS; b += 1) {
    const d = direction(patch, -Math.PI / 2 + (b * Math.PI) / BINS);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + d[0] * r, cy - d[1] * r);
    ctx.stroke();
  }
  ctx.restore();
}

/** The cosine lobe at the point: r = R cos θ, a circle touching the surface there. */
function drawCosineLobe(ctx, transform, patch, point) {
  const [cx, cy] = transform.toCanvas(point);
  const R = HALF_CIRCLE * transform.scale;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 210, 122, 0.9)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  for (let i = 0; i <= 64; i += 1) {
    const theta = -Math.PI / 2 + (i / 64) * Math.PI;
    const d = direction(patch, theta);
    const r = R * Math.cos(theta);
    const x = cx + d[0] * r;
    const y = cy - d[1] * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

/** The point's outgoing light L_o: diffuse, the same in every direction, a glowing half disc. */
function drawOutgoing(ctx, transform, patch, point, color, progress) {
  const [cx, cy] = transform.toCanvas(point);
  const r = 0.9 * HALF_CIRCLE * transform.scale * (0.3 + 0.7 * progress);
  const normalAngle = Math.atan2(-patch.normal[1], patch.normal[0]);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, normalAngle - Math.PI / 2, normalAngle + Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
