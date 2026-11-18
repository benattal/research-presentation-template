import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { ease, useStepTransition } from '../canvas/canvas.js';
import EquationStack from '../equations/EquationStack.jsx';
import RoomView from '../flatland/RoomView.jsx';
import {
  GATHER_RAYS_PER_BIN, cameraSurfacePoint, gatherAt, nearestSurfacePoint,
} from '../flatland/gather.js';
import {
  drawCosineLobe, drawDirectionBins, drawGlowPoint, drawIncidentFan, drawLightSegments, drawPatchTicks,
  fanRays, incidentGain, lightColor,
} from '../flatland/overlays.js';
import { SURFACE_GAIN, cachedFluence, derived, sceneGain } from '../flatland/pictures.js';
import { ROOM_VIEW, drawRoom, roomTransform } from '../flatland/render.js';
import { MEASURED_PIXEL, flatlandRoom } from '../flatland/rooms.js';
import {
  BINS, CAMERA, angleAt, binOf, castRay, direction, stateIndex,
} from '../flatland/scene.js';
import { fluence, patchRadiosity } from '../flatland/transport.js';
import './RenderingEquation.css';

const ROOM = ROOM_VIEW;
const ROOM_RECT = { x: 0, y: 0, width: ROOM[0], height: ROOM[1] };
const STEP_COUNT = 6;

/** How far the lamp's light is drawn from the lamp, in room units (as the transport operator slide draws e). */
const LEAVING = 2;
/** The solved light filling the room, at this fraction of the scene's exposure: a dim room under the overlays. */
const ROOM_LIGHT = 0.1;
/** Length of the drawn outgoing ray L_o(x, ω_o), in room units. */
const BEAM = 2.2;
/** Radius of the cosine lobe and of the direction bins at x, in room units. */
const LOBE = 1.7;
/** The direction ω_i traced to r(x, ω_i), in radians from the normal at x (toward the ceiling). */
const TRACE_ANGLE = -0.2;
/** Opacity of what an earlier equation showed, while a later one is current. */
const DIM = 0.3;

/** Render colors of the terms, the theme's --light-* roles (theme.css). */
const EMISSION_LIGHT = 'rgb(255, 241, 201)';
const SCATTER_COLOR = 'rgba(255, 159, 67, 0.95)';
const TRACE_COLOR = 'rgba(232, 71, 95, 0.95)';
const GEOMETRY_COLOR = 'rgba(232, 236, 244, 0.8)';

/**
 * What each build step shows once settled, as opacities: the lamp's light
 * (L_e), the incident light at x (the integral's L_i), the cosine lobe
 * (f_r cos θ_i), the one traced ray (r(x, ω_i)), the surface points every
 * direction reaches (G), and the discretization (patches, direction bins).
 */
const SETTLED = [
  { lamp: 0, fan: 0, lobe: 0, trace: 0, hits: 0, bins: 0 },
  { lamp: 1, fan: 0, lobe: 0, trace: 0, hits: 0, bins: 0 },
  { lamp: 1, fan: 1, lobe: 1, trace: 0, hits: 0, bins: 0 },
  { lamp: DIM, fan: DIM, lobe: DIM, trace: 1, hits: 0, bins: 0 },
  { lamp: 1, fan: 1, lobe: 1, trace: 0, hits: 1, bins: 0 },
  { lamp: 1, fan: 0, lobe: 1, trace: 0, hits: 1, bins: 1 },
];

/** Animation length of the move into each step, in ms. */
const DURATIONS = [0, 1400, 2000, 2200, 2800, 1400];

/**
 * The overlays at `progress` ∈ [0, 1] of the move into `step` from `from`
 * (null when not moving forward by one step: the settled state).
 */
function overlaysAt(step, from, progress) {
  const settled = {
    ...SETTLED[step], lampReach: LEAVING, fanReach: 1, weight: 1, traceOut: 1, traceBack: 1, hitsOut: 1, hitLines: 0,
  };
  if (from !== step - 1 || progress >= 1) return settled;
  const span = (a, b) => ease(Math.min(1, Math.max(0, (progress - a) / (b - a))));
  const before = SETTLED[from];
  const state = { ...settled };
  if (step === 1) {
    // The lamp's light leaves it.
    state.lampReach = span(0, 1) * LEAVING;
  } else if (step === 2) {
    // Incident light arrives at x from every direction, then is weighted by f_r cos θ_i.
    state.fanReach = span(0, 0.55);
    state.weight = span(0.55, 1);
    state.lobe = span(0.55, 1);
  } else if (step === 3) {
    // The integral dims; one direction is traced to the surface it reaches, and that surface's light returns.
    const fade = span(0, 0.25);
    for (const key of ['lamp', 'fan', 'lobe']) state[key] = before[key] + (settled[key] - before[key]) * fade;
    state.traceOut = span(0.1, 0.5);
    state.traceBack = span(0.55, 1);
  } else if (step === 4) {
    // G: every direction is traced; the light of the surfaces reached arrives at x. S: the lobe.
    state.trace = 1 - span(0, 0.15);
    state.lamp = DIM + (1 - DIM) * span(0, 0.3);
    state.hitsOut = span(0.05, 0.4);
    state.hitLines = span(0.05, 0.15) * (1 - span(0.45, 0.75));
    state.hits = span(0.3, 0.42);
    state.fan = progress < 0.4 ? DIM * (1 - span(0, 0.15)) : 1;
    state.fanReach = progress < 0.4 ? 1 : span(0.4, 0.75);
    state.lobe = progress < 0.75 ? DIM * (1 - span(0, 0.15)) : span(0.75, 1);
  } else if (step === 5) {
    // The surfaces split into patches and the directions into bins.
    state.bins = span(0, 0.8);
    state.fan = 1 - span(0.2, 0.8);
  }
  return state;
}

/** The incident light at `point` on `patch` from direction θ (radians from the normal): the ray's end and its light. */
function incidentAlong(env, patch, point, theta) {
  const d = direction(patch, theta);
  const hit = castRay(env.room, point, d, patch.segment);
  const s = stateIndex(hit.patch.index, binOf(angleAt(hit.patch, [-d[0], -d[1]]))) * 3;
  return { end: hit.point, direction: d, radiance: [env.steady[s], env.steady[s + 1], env.steady[s + 2]] };
}

/** One ray per direction bin, through the bin's middle, with the mean light of the bin's gather rays. */
function binRays(gather) {
  const sums = Array.from({ length: BINS }, () => ({ radiance: [0, 0, 0], count: 0, end: null }));
  for (const ray of gather.rays) {
    const bin = sums[binOf(ray.theta)];
    ray.radiance.forEach((value, c) => { bin.radiance[c] += value; });
    bin.count += 1;
    if (ray.k === GATHER_RAYS_PER_BIN / 2) bin.end = ray.end;
  }
  return sums.filter((bin) => bin.count > 0 && bin.end)
    .map((bin) => ({ end: bin.end, radiance: bin.radiance.map((value) => value / bin.count) }));
}

/** A segment from `a` toward `b`, `t` ∈ [0, 1] of the way. */
function partway(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function drawDashed(ctx, transform, a, b, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(...transform.toCanvas(a));
  ctx.lineTo(...transform.toCanvas(b));
  ctx.stroke();
  ctx.restore();
}

function drawDot(ctx, transform, p, color, radius, alpha) {
  const [x, y] = transform.toCanvas(p);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

/**
 * The rendering equation at one surface point x of the lamp-lit room, term
 * by term, each term's picture drawn in the render color of its term's
 * class: the outgoing light L_o(x, ω_o) (white: x and the ray toward the
 * camera), the lamp's emitted light L_e (term-emission), the scattering
 * integral (term-operator: the incident light arriving at x from every
 * direction, in its own color, weighted by the dashed cosine lobe), the
 * ray-tracing function r(x, ω_i) (term-bounce-4: one direction traced to
 * the surface it reaches, whose light returns along it), then L = L_e + SGL
 * (every direction traced, G, then the lobe, S), and x = e + Ax (patch
 * boundaries and direction bins). x starts at the floor point the measured
 * pixel sees, the x of the path tracing slide; clicking a surface moves it.
 *
 * Content fields: `title`, `subtitle`, `lines` (EquationStack lines; a
 * line's `step` is the build step it appears at), and six `buildSteps`,
 * each with a short `label` shown under the room.
 */
export default function RenderingEquation({ slide, buildStep }) {
  if (slide.buildSteps?.length !== STEP_COUNT) throw new Error(`renderingEquation: needs ${STEP_COUNT} build steps`);
  const env = flatlandRoom('diffuse', 'lamp');
  const [point, setPoint] = useState(() => {
    const seen = cameraSurfacePoint(env.room, (MEASURED_PIXEL[0] + MEASURED_PIXEL[1]) / 2);
    return { patch: seen.patch.index, u: seen.u };
  });
  const step = Math.min(buildStep, STEP_COUNT - 1);
  const fromStep = useStepTransition(step);
  const patch = env.room.patches[point.patch];

  const scene = useMemo(() => {
    const gather = gatherAt(env.room, patch, point.u, env.steady, env.transport.emission);
    const x = gather.point;
    const toCamera = [CAMERA.position[0] - x[0], CAMERA.position[1] - x[1]];
    const thetaOut = Math.max(-1.2, Math.min(1.2, angleAt(patch, toCamera)));
    const outgoing = direction(patch, thetaOut);
    return {
      gather,
      x,
      outgoing,
      beamEnd: [x[0] + outgoing[0] * BEAM, x[1] + outgoing[1] * BEAM],
      traced: incidentAlong(env, patch, x, TRACE_ANGLE),
      bins: binRays(gather),
      gain: incidentGain(gather),
    };
  }, [env, patch, point.u]);

  const gain = sceneGain(env, false);
  const roomLight = cachedFluence(env.table, env.steady, Infinity, 'source');

  const paint = (ctx, progress) => {
    const state = overlaysAt(step, fromStep, progress);
    const { gather, x } = scene;
    // The dim solved room, plus the lamp's light leaving it.
    const light = new Float32Array(roomLight.length);
    const lampLight = state.lamp > 0 && state.lampReach > 0
      ? (state.lampReach >= LEAVING
        ? cachedFluence(env.table, env.transport.emission, LEAVING, 'source')
        : fluence(env.table, env.transport.emission, state.lampReach, { from: 'source' }))
      : null;
    for (let i = 0; i < light.length; i += 1) light[i] = ROOM_LIGHT * roomLight[i] + (lampLight ? state.lamp * lampLight[i] : 0);
    const transform = drawRoom(ctx, env.room, ROOM_RECT, {
      table: env.table,
      fluence: light,
      fluenceGain: gain,
      surfaces: derived(env.steady, 'radiosity', () => patchRadiosity(env.transport, env.steady)),
      surfaceGain: gain * SURFACE_GAIN,
    });

    // x = e + Ax: patches and direction bins.
    drawPatchTicks(ctx, transform, env.room, { color: GEOMETRY_COLOR, alpha: state.bins });
    drawDirectionBins(ctx, transform, patch, x, LOBE, { color: GEOMETRY_COLOR, alpha: 0.6 * state.bins });

    // G: every direction traced from x to the surface it reaches.
    if (state.hitLines > 0) {
      ctx.save();
      ctx.globalAlpha = 0.8 * state.hitLines;
      ctx.strokeStyle = TRACE_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const ray of fanRays(gather)) {
        ctx.moveTo(...transform.toCanvas(x));
        ctx.lineTo(...transform.toCanvas(partway(x, ray.end, state.hitsOut)));
      }
      ctx.stroke();
      ctx.restore();
    }

    // The incident light, then the same light per bin.
    drawIncidentFan(ctx, transform, gather, patch, {
      gain: scene.gain, reach: state.fanReach, weight: state.weight, alpha: state.fan,
    });
    const binAlpha = state.bins * (1 - state.fan);
    if (binAlpha > 0) {
      const segments = scene.bins.map((bin) => {
        const theta = angleAt(patch, [bin.end[0] - x[0], bin.end[1] - x[1]]);
        const rgb = bin.radiance.map((value, c) => value * patch.albedo[c] * Math.cos(theta));
        return { a: bin.end, b: partway(bin.end, x, 0.96), color: lightColor(rgb, scene.gain) };
      });
      drawLightSegments(ctx, transform, segments, { width: 2.2, glow: 5, alpha: binAlpha });
    }

    // The surface points r(x, ω_i) of the drawn directions: those of the rays, then of the bins.
    if (state.hits > 0) {
      const fanHits = state.hitsOut >= 1 ? state.hits * Math.max(state.fan, state.hitLines) : 0;
      for (const ray of fanRays(gather)) drawDot(ctx, transform, ray.end, TRACE_COLOR, 3.5, fanHits);
      for (const bin of scene.bins) drawDot(ctx, transform, bin.end, TRACE_COLOR, 4.5, state.hits * binAlpha);
    }

    drawCosineLobe(ctx, transform, patch, x, LOBE, { color: SCATTER_COLOR, alpha: state.lobe, width: 3 });

    // One direction ω_i traced to r(x, ω_i), and the light leaving r(x, ω_i) toward x.
    if (state.trace > 0) {
      const { end, radiance } = scene.traced;
      ctx.save();
      ctx.globalAlpha = state.trace;
      if (state.traceBack > 0) {
        drawLightSegments(ctx, transform, [{ a: end, b: partway(end, x, 0.96 * state.traceBack), color: lightColor(radiance, scene.gain) }], { width: 3, glow: 8 });
      }
      drawDashed(ctx, transform, x, partway(x, end, state.traceOut), TRACE_COLOR);
      ctx.restore();
      if (state.traceOut >= 1) drawDot(ctx, transform, end, TRACE_COLOR, 7, state.trace);
    }

    // L_o(x, ω_o): the light leaving x toward the camera.
    drawLightSegments(ctx, transform, [{ a: x, b: scene.beamEnd, color: lightColor(gather.outgoing, scene.gain) }], { width: 3, glow: 9 });
    drawGlowPoint(ctx, transform, x, 'rgba(255, 255, 255, 0.95)', 3.5);
  };

  const pick = (event, position) => {
    if (event.button !== 0) return;
    // A click anywhere picks the nearest surface point, so every click moves x.
    const hit = nearestSurfacePoint(env.room, roomTransform(ROOM_RECT).toRoom(position), Infinity);
    if (hit) setPoint({ patch: hit.patch.index, u: hit.u });
  };

  // Labels over the render, in stage pixels, each fading with what it names.
  const transform = roomTransform(ROOM_RECT);
  const at = (p, dx = 0, dy = 0) => {
    const [left, top] = transform.toCanvas(p);
    return { left: left + dx, top: top + dy };
  };
  const settled = SETTLED[step];
  const traceDirection = scene.traced.direction;
  const labels = [
    { key: 'x', tex: '$\\mathbf{x}$', style: at(scene.x, -16, -18), opacity: 1, tone: 'geometry' },
    { key: 'out', tex: '$\\omega_o$', style: at(scene.beamEnd, 14, -14), opacity: 1, tone: 'geometry' },
    { key: 'emitted', tex: '$L_e$', style: at([6.3, 5.55]), opacity: settled.lamp, tone: 'emission' },
    {
      key: 'in',
      tex: '$\\omega_i$',
      style: at([scene.x[0] + traceDirection[0] * 1.4, scene.x[1] + traceDirection[1] * 1.4], -20, 0),
      opacity: settled.trace,
      tone: 'geometry',
    },
    { key: 'hit', tex: '$r(\\mathbf{x}, \\omega_i)$', style: at(scene.traced.end, 52, 22), opacity: settled.trace, tone: 'trace' },
  ];

  return (
    <div className="slide--rendering-equation">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="rendering-equation-main">
        <div className="rendering-equation-room">
          <RoomView
            width={ROOM[0]}
            height={ROOM[1]}
            paint={paint}
            animationKey={`${step}`}
            duration={fromStep === step - 1 ? DURATIONS[step] : 0}
            redrawKey={`${point.patch}|${point.u}`}
            className="rendering-equation-canvas"
            onPointerDown={pick}
          />
          {labels.map((label) => (
            <motion.span
              key={label.key}
              className={`rendering-equation-label rendering-equation-label--${label.tone}`}
              style={label.style}
              initial={false}
              animate={{ opacity: label.opacity }}
              transition={{ duration: 0.35 }}
            >
              <Text>{label.tex}</Text>
            </motion.span>
          ))}
        </div>
        <EquationStack lines={slide.lines} step={step} className="rendering-equation-lines" />
        <p className="rendering-equation-room-label"><Text>{slide.buildSteps[step].label}</Text></p>
      </div>
    </div>
  );
}
