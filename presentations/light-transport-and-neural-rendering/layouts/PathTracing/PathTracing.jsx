import { motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { ease, stillFrames, useStepTransition } from '@core/stage/canvas.js';
import EquationStack from '@core/stage/EquationStack.jsx';
import RoomView from '../flatland/RoomView.jsx';
import { cameraSurfacePoint, gatherAt } from '../flatland/gather.js';
import {
  drawCosineLobe, drawGlowPoint, drawIncidentFan, drawLightSegments, drawRoomCamera, incidentGain, lightColor,
} from '../flatland/overlays.js';
import {
  cameraRays, exactImage, rayTable, seededRandom, surfaceWalk, tracePaths,
} from '../flatland/pathSamples.js';
import { SURFACE_GAIN, derived, sceneGain } from '../flatland/pictures.js';
import { RENDER_BACKGROUND, ROOM_VIEW, autoGain, drawRoom, roomTransform } from '../flatland/render.js';
import { MEASURED_PIXEL, flatlandRoom } from '../flatland/rooms.js';
import {
  CAMERA, angleAt, binOf, stateIndex,
} from '../flatland/scene.js';
import { patchRadiosity } from '../flatland/transport.js';
import { Strip } from '../TransportMatrix/elementViews.jsx';
import './PathTracing.css';

const ROOM = ROOM_VIEW;
const ROOM_RECT = { x: 0, y: 0, width: ROOM[0], height: ROOM[1] };
const STRIP_SIZE = [620, 24];
/** Camera pixels and evenly spaced rays per pixel (a path starts on one of them). */
const PIXELS = 64;
const RAYS_PER_PIXEL = 16;
/** Paths kept per pixel for drawing, and the seed of every path. */
const KEPT = 2;
const SEED = 11;

/**
 * The steps before the path counts: the integral at x, one sampled
 * direction, the same picture while the slide shows why the sample is
 * right on average, and one random walk.
 */
const EXPLANATION = ['integral', 'sample', 'average', 'walk'];
/**
 * The seed of the drawn walk from x: it reaches the lamp after three
 * scatterings (x, the red wall, the floor), across the room.
 */
const WALK_SEED = 99;
const WALK_SCATTERINGS = 3;
/** Radius of the cosine lobe at x, in room units (as on the rendering equation slide). */
const LOBE = 1.7;
const SCATTER_COLOR = 'rgba(255, 159, 67, 0.95)';
/** Render colors of light that has bounced 0, 1, 2, 3 times: the theme's --light-0 … --light-3. */
const BOUNCE_COLORS = ['rgb(255, 241, 201)', 'rgb(255, 210, 122)', 'rgb(255, 159, 67)', 'rgb(255, 107, 61)'];

const luminance = (v, j) => 0.2126 * v[j * 3] + 0.7152 * v[j * 3 + 1] + 0.0722 * v[j * 3 + 2];

/** The camera, its exact image, and the path-traced images for every count, computed once per room. */
function tracedRoom(env, counts) {
  return derived(env.steady, `path-tracing:${counts.join(',')}`, () => {
    const rays = rayTable(env.room);
    const camera = cameraRays(env.room, PIXELS, RAYS_PER_PIXEL);
    const exact = exactImage(camera, env.steady);
    const traced = tracePaths(env.transport, rays, camera, counts, SEED, KEPT);
    return { camera, exact, traced };
  });
}

/**
 * The point x the measured pixel sees, the incident light there, one
 * direction sampled from the cosine lobe (the first step of the drawn
 * walk), and the walk itself, from x to the lamp.
 */
function walkScene(env) {
  return derived(env.steady, 'path-tracing-walk', () => {
    const seen = cameraSurfacePoint(env.room, (MEASURED_PIXEL[0] + MEASURED_PIXEL[1]) / 2);
    const gather = gatherAt(env.room, seen.patch, seen.u, env.steady, env.transport.emission);
    const walk = surfaceWalk(env.room, gather.point, seen.patch, seededRandom(WALK_SEED), 2 * WALK_SCATTERINGS);
    if (!walk.lit || walk.vertices.length !== WALK_SCATTERINGS + 1 || walk.patches[1].emission) {
      throw new Error(`pathTracing: the walk of seed ${WALK_SEED} must reach the lamp after ${WALK_SCATTERINGS} scatterings`);
    }
    // The light arriving at x along the walk's first ray: the outgoing light of the surface it reaches.
    const [x, first] = walk.vertices;
    const back = [x[0] - first[0], x[1] - first[1]];
    const s = stateIndex(walk.patches[1].index, binOf(angleAt(walk.patches[1], back))) * 3;
    return {
      patch: seen.patch,
      gather,
      gain: incidentGain(gather),
      walk,
      sampled: [env.steady[s], env.steady[s + 1], env.steady[s + 2]],
    };
  });
}

/**
 * The color of a path's light (linear RGB) at exposure `gain`, keeping its
 * hue: the brightness is tone mapped as the renders map it, and the
 * channels keep their linear ratios. Tone mapping each channel on its own
 * would saturate bright green-wall light (green and blue both near 1) to
 * cyan, the color this lecture keeps for importance.
 */
function pathColor(rgb, gain) {
  const largest = Math.max(rgb[0], rgb[1], rgb[2]);
  if (!(largest > 0)) return 'rgb(0, 0, 0)';
  const y = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  const brightness = (1 - Math.exp(-y * gain)) ** (1 / 1.8);
  const [r, g, b] = rgb.map((v) => Math.round(255 * brightness * (v / largest)));
  return `rgb(${r}, ${g}, ${b})`;
}

/** A count with a thousands separator, as TeX: 4096 becomes 4{,}096. */
function texCount(n) {
  return n.toLocaleString('en-US').replaceAll(',', '{,}');
}

/** Path length of a drawn path, in room units, for growing it from the camera. */
function pathLength(path) {
  return path.rays.reduce((sum, [x0, y0, x1, y1]) => sum + Math.hypot(x1 - x0, y1 - y0), 0);
}

/** `t` ∈ [0, 1] of the way from `a` to `b`. */
function partway(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** The part of a polyline `points` within `length` room units of its start, as segments. */
function polylinePart(points, length) {
  const segments = [];
  let travelled = 0;
  for (let i = 1; i < points.length && travelled < length; i += 1) {
    const span = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    segments.push({ a: points[i - 1], b: partway(points[i - 1], points[i], Math.min(1, (length - travelled) / span)) });
    travelled += span;
  }
  return segments;
}

function drawCameraLabel(ctx, transform) {
  // Under the camera, outside its fan of rays, outlined in the render's background so paths stay behind it.
  const [cx, cy] = transform.toCanvas(CAMERA.position);
  ctx.save();
  ctx.font = "18px 'Inter Variable', Inter, sans-serif";
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = RENDER_BACKGROUND;
  ctx.strokeText('camera', cx + 6, cy + 36);
  ctx.fillStyle = 'rgba(215, 219, 228, 0.95)';
  ctx.fillText('camera', cx + 6, cy + 36);
  ctx.restore();
}

/**
 * Path tracing in the flatland room, from the scattering integral to
 * random walks. The first four build steps are at the point x imaged by
 * the measured pixel: the incident light over every direction, weighted
 * by the cosine lobe (the integral); one direction sampled from the lobe
 * and its light (the one-sample estimate); the same picture again, for
 * the step whose line shows why that estimate is right on average (its
 * `justification`); and the walk that repeats the
 * sampling at every surface it reaches until it finds the lamp, traced from
 * the camera and then lit from the lamp, each ray in the color of the
 * bounce its light is in (e, Ae, A²e, A³e). The steps after them
 * (`{ paths: n }`) show random walks on A = SG from the camera's 64 pixels
 * (flatland/pathSamples.js): drawn paths (up to two per pixel), bright where
 * they reached the lamp and faint where they ended without light, and under the
 * room the camera's image from n paths per pixel against the exact image.
 *
 * Content fields: `title`, `subtitle`, `lines` (EquationStack lines for
 * the first four steps), and `buildSteps`: four steps, then one
 * `{ paths: n }` per count.
 */
export default function PathTracing({ slide, buildStep }) {
  const env = flatlandRoom('diffuse', 'lamp');
  const counts = slide.buildSteps.slice(EXPLANATION.length).map((entry) => entry.paths);
  if (slide.buildSteps.slice(0, EXPLANATION.length).some((entry) => entry.paths !== undefined)
    || counts.length === 0 || counts.some((n) => !Number.isInteger(n) || n < 1)) {
    throw new Error(`pathTracing: needs ${EXPLANATION.length} build steps, then one { "paths": n } per count`);
  }
  const step = Math.min(buildStep, slide.buildSteps.length - 1);
  const fromStep = useStepTransition(step);
  const stage = step < EXPLANATION.length ? EXPLANATION[step] : 'paths';
  const countIndex = step - EXPLANATION.length;
  const n = countIndex >= 0 ? counts[countIndex] : null;
  const scene = walkScene(env);
  const countsKey = counts.join(',');
  // Tracing every path takes about 0.1 s: do it while the browser is idle after arriving, so neither
  // arriving nor the first count waits for it (tracedRoom caches it). Still frames show one step and
  // never step on, and without idle callbacks the first count traces them.
  useEffect(() => {
    if (stillFrames() || typeof window.requestIdleCallback !== 'function') return undefined;
    const handle = window.requestIdleCallback(() => tracedRoom(env, counts));
    return () => window.cancelIdleCallback(handle);
  }, [env, countsKey]);
  const traced = n === null ? null : tracedRoom(env, counts);
  const stripGain = useMemo(() => (traced ? 0.6 * autoGain(traced.exact, 0.9) : 1), [traced]);
  const gain = sceneGain(env, false);
  const shownPerPixel = n === null ? 0 : Math.min(n, KEPT);
  const previousPerPixel = fromStep !== null && fromStep >= EXPLANATION.length ? Math.min(counts[fromStep - EXPLANATION.length], KEPT) : 0;
  const drawn = useMemo(
    () => (traced
      ? traced.traced.kept.filter((path) => path.index < shownPerPixel).map((path) => ({ ...path, length: pathLength(path) }))
      : []),
    [traced, shownPerPixel],
  );
  const longest = Math.max(1, ...drawn.filter((path) => path.index >= previousPerPixel).map((path) => path.length));
  const animates = fromStep === step - 1 && (stage !== 'paths' || shownPerPixel > previousPerPixel);
  const duration = { integral: 0, sample: 1400, average: 0, walk: 3200, paths: n === 1 ? 2400 : 1400 }[stage];

  const paintWalk = (ctx, transform, progress) => {
    const { gather, patch, walk } = scene;
    const x = gather.point;
    const moving = fromStep === step - 1 ? progress : 1;
    const span = (a, b) => ease(Math.min(1, Math.max(0, (moving - a) / (b - a))));
    const fan = { integral: 1, sample: 1 - 0.88 * span(0, 0.3), average: 0.12, walk: 0.12 * (1 - span(0, 0.2)) }[stage];
    drawIncidentFan(ctx, transform, gather, patch, { gain: scene.gain, weight: 1, alpha: fan });
    const lobe = stage === 'walk' ? 1 - span(0, 0.2) : 1;
    drawCosineLobe(ctx, transform, patch, x, LOBE, { color: SCATTER_COLOR, alpha: lobe, width: 3 });
    const [, first] = walk.vertices;
    // One direction from the lobe: the light of the surface it reaches arrives at x.
    const arrive = stage === 'sample' ? span(0.3, 1) : 1;
    const sampledAlpha = stage === 'walk' ? 1 - span(0, 0.2) : 1;
    if (stage !== 'integral' && arrive > 0 && sampledAlpha > 0) {
      drawLightSegments(ctx, transform, [{ a: first, b: partway(first, x, 0.96 * arrive), color: lightColor(scene.sampled, scene.gain) }], { width: 3, glow: 9, alpha: sampledAlpha });
    }
    // The camera's ray to x: where the path starts.
    drawLightSegments(ctx, transform, [{ a: CAMERA.position, b: x, color: 'rgba(200, 206, 220, 0.55)' }], { width: 1.2, glow: 0 });
    if (stage === 'walk') {
      // Traced from the camera to the lamp, then lit from the lamp back to the camera, one bounce per ray.
      const points = [CAMERA.position, ...walk.vertices];
      const total = points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0);
      const trace = polylinePart(points, span(0, 0.45) * total);
      drawLightSegments(ctx, transform, trace.map((segment) => ({ ...segment, color: 'rgba(200, 206, 220, 0.55)' })), { width: 1.2, glow: 0 });
      const rays = points.length - 1;
      const lit = [];
      for (let i = rays - 1; i >= 0; i -= 1) {
        // Ray i (from points[i] to points[i + 1]) carries light that has bounced rays − 1 − i times.
        const order = rays - 1 - i;
        const t = span(0.45 + (0.55 * order) / rays, 0.45 + (0.55 * (order + 1)) / rays);
        if (t > 0) lit.push({ a: points[i + 1], b: partway(points[i + 1], points[i], t), color: BOUNCE_COLORS[order] });
      }
      drawLightSegments(ctx, transform, lit, { width: 3, glow: 9 });
      for (const vertex of walk.vertices.slice(1, -1)) drawGlowPoint(ctx, transform, vertex, 'rgba(255, 255, 255, 0.9)', 2.5);
    }
    drawGlowPoint(ctx, transform, x, 'rgba(255, 255, 255, 0.95)', 3.5);
  };

  const paintPaths = (ctx, transform, progress) => {
    const reach = (fromStep === step - 1 ? progress : 1) * longest;
    const dark = [];
    const lit = [];
    const faint = shownPerPixel === 1 ? 0.2 : 0.13;
    // Paths that found light are drawn in its color, at one exposure for every path.
    const pathGain = 0.12;
    for (const path of drawn) {
      const found = luminance(path.value, 0) > 0;
      // Paths shown on the step before stay whole; the new ones grow from the camera.
      const limit = path.index < previousPerPixel ? Infinity : reach;
      let travelled = 0;
      for (const [x0, y0, x1, y1] of path.rays) {
        const length = Math.hypot(x1 - x0, y1 - y0);
        if (travelled >= limit) break;
        const t = Math.min(1, (limit - travelled) / length);
        const segment = { a: [x0, y0], b: [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t] };
        if (found) lit.push({ ...segment, color: pathColor(path.value, pathGain) });
        else dark.push({ ...segment, color: `rgba(150, 160, 182, ${faint})` });
        travelled += length;
      }
    }
    drawLightSegments(ctx, transform, dark, { width: 0.8, glow: 0 });
    drawLightSegments(ctx, transform, lit, { width: 2, glow: 8 });
  };

  const paint = (ctx, progress) => {
    const transform = drawRoom(ctx, env.room, ROOM_RECT, {
      table: env.table,
      fluence: null,
      surfaces: derived(env.steady, 'radiosity', () => patchRadiosity(env.transport, env.steady)),
      surfaceGain: gain * SURFACE_GAIN * 0.35,
    });
    if (stage === 'paths') paintPaths(ctx, transform, progress);
    else paintWalk(ctx, transform, progress);
    drawRoomCamera(ctx, transform);
    drawCameraLabel(ctx, transform);
  };

  const [labelLeft, labelTop] = roomTransform(ROOM_RECT).toCanvas(scene.gather.point);

  return (
    <div className="slide--path-tracing">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="paths-body">
        <div className="paths-left">
          <div className="paths-room">
            <RoomView
              width={ROOM[0]}
              height={ROOM[1]}
              paint={paint}
              animationKey={`${step}`}
              duration={animates ? duration : 0}
            />
            <motion.span
              className="paths-room-label"
              style={{ left: labelLeft - 16, top: labelTop - 18 }}
              initial={false}
              animate={{ opacity: stage === 'paths' ? 0 : 1 }}
              transition={{ duration: 0.35 }}
            >
              <Text>{'$\\mathbf{x}$'}</Text>
            </motion.span>
          </div>
          <div className={`paths-strips${traced ? '' : ' paths-strips--hidden'}`}>
            <div className="paths-strip">
              <span className="paths-strip-label">estimate</span>
              {traced && <Strip image={traced.traced.images.get(n)} gain={stripGain} width={STRIP_SIZE[0]} height={STRIP_SIZE[1]} />}
            </div>
            <div className="paths-strip">
              <span className="paths-strip-label">exact</span>
              {traced && <Strip image={traced.exact} gain={stripGain} width={STRIP_SIZE[0]} height={STRIP_SIZE[1]} />}
            </div>
          </div>
        </div>
        <div className="paths-side">
          <EquationStack lines={slide.lines} step={Math.min(step, EXPLANATION.length - 1)} className="paths-lines" />
          <motion.div
            className="paths-count"
            initial={false}
            animate={{ opacity: n === null ? 0 : 1 }}
            transition={{ duration: 0.35 }}
          >
            <Text>{`$n = ${texCount(n ?? counts[0])}$`}</Text>
            {(n ?? counts[0]) === 1 ? ' path per pixel' : ' paths per pixel'}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
