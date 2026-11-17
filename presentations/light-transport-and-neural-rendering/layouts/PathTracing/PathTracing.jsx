import { useMemo } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import Chart from '../charts/Chart.jsx';
import RoomView from '../flatland/RoomView.jsx';
import { drawLightSegments, drawRoomCamera } from '../flatland/overlays.js';
import {
  cameraRays, exactImage, rayTable, relativeError, tracePaths,
} from '../flatland/pathSamples.js';
import { SURFACE_GAIN, derived, sceneGain } from '../flatland/pictures.js';
import { autoGain, drawRoom } from '../flatland/render.js';
import { flatlandRoom } from '../flatland/rooms.js';
import { CAMERA } from '../flatland/scene.js';
import { patchRadiosity } from '../flatland/transport.js';
import { Strip } from '../TransportMatrix/elementViews.jsx';
import './PathTracing.css';

const ROOM = [720, 432];
const STRIP_SIZE = [620, 24];
const CHART = [418, 280];
/** Camera pixels and evenly spaced rays per pixel (a path starts on one of them). */
const PIXELS = 64;
const RAYS_PER_PIXEL = 16;
/** Paths kept per pixel for drawing, and the seed of every path. */
const KEPT = 2;
const SEED = 11;

const luminance = (v, j) => 0.2126 * v[j * 3] + 0.7152 * v[j * 3 + 1] + 0.0722 * v[j * 3 + 2];

/** The camera, its exact image, and the path-traced images for every count, computed once per room. */
function tracedRoom(env, counts) {
  return derived(env.steady, `path-tracing:${counts.join(',')}`, () => {
    const rays = rayTable(env.room);
    const camera = cameraRays(env.room, PIXELS, RAYS_PER_PIXEL);
    const exact = exactImage(camera, env.steady);
    const traced = tracePaths(env.transport, rays, camera, counts, SEED, KEPT);
    const errors = new Map(counts.map((n) => [n, relativeError(traced.images.get(n), exact)]));
    return { camera, exact, traced, errors };
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

/**
 * Path tracing in the flatland room: random walks on A = SG from the
 * camera's 64 pixels (flatland/pathSamples.js). Build steps `{ paths: n }`
 * show the first n paths per pixel: drawn paths (up to two per pixel)
 * grow from the camera, bright where they found the lamp and faint where
 * they carried no light; under the room, the camera's image from n paths
 * against the exact image; beside it, each pixel's estimate against the
 * exact value, and the relative error for every n so far.
 *
 * Content fields: `title`, `subtitle`, `buildSteps` ({ paths } each).
 */
export default function PathTracing({ slide, buildStep }) {
  const env = flatlandRoom('diffuse', 'lamp');
  const counts = slide.buildSteps.map((entry) => entry.paths);
  if (counts.some((n) => !Number.isInteger(n) || n < 1)) throw new Error('pathTracing: every build step needs a whole number of "paths"');
  const step = Math.min(buildStep, counts.length - 1);
  const n = counts[step];
  const traced = useMemo(() => tracedRoom(env, counts), [env, counts.join(',')]);
  const estimate = traced.traced.images.get(n);
  const stripGain = useMemo(() => 0.6 * autoGain(traced.exact, 0.9), [traced]);
  const gain = sceneGain(env, false);
  const shownPerPixel = Math.min(n, KEPT);
  const drawn = useMemo(
    () => traced.traced.kept.filter((path) => path.index < shownPerPixel).map((path) => ({ ...path, length: pathLength(path) })),
    [traced, shownPerPixel],
  );
  const longest = Math.max(...drawn.map((path) => path.length));

  const paint = (ctx, progress) => {
    const transform = drawRoom(ctx, env.room, { x: 0, y: 0, width: ROOM[0], height: ROOM[1] }, {
      table: env.table,
      fluence: null,
      surfaces: derived(env.steady, 'radiosity', () => patchRadiosity(env.transport, env.steady)),
      surfaceGain: gain * SURFACE_GAIN * 0.35,
    });
    const reach = progress * longest;
    const dark = [];
    const lit = [];
    const faint = shownPerPixel === 1 ? 0.2 : 0.13;
    // Paths that found light are drawn in its color, at one exposure for every path.
    const pathGain = 0.12;
    for (const path of drawn) {
      const found = luminance(path.value, 0) > 0;
      let travelled = 0;
      for (const [x0, y0, x1, y1] of path.rays) {
        const length = Math.hypot(x1 - x0, y1 - y0);
        if (travelled >= reach) break;
        const t = Math.min(1, (reach - travelled) / length);
        const segment = { a: [x0, y0], b: [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t] };
        if (found) lit.push({ ...segment, color: pathColor(path.value, pathGain) });
        else dark.push({ ...segment, color: `rgba(150, 160, 182, ${faint})` });
        travelled += length;
      }
    }
    drawLightSegments(ctx, transform, dark, { width: 0.8, glow: 0 });
    drawLightSegments(ctx, transform, lit, { width: 2, glow: 8 });
    drawRoomCamera(ctx, transform);
    const [cx, cy] = transform.toCanvas(CAMERA.position);
    ctx.save();
    ctx.font = "18px 'Inter Variable', Inter, sans-serif";
    ctx.fillStyle = 'rgba(215, 219, 228, 0.95)';
    ctx.shadowColor = 'rgba(7, 9, 15, 0.95)';
    ctx.shadowBlur = 6;
    ctx.textAlign = 'right';
    ctx.fillText('camera', cx - 4, cy + 34);
    ctx.restore();
  };

  const exactPoints = Array.from({ length: PIXELS }, (_, j) => [j + 0.5, luminance(traced.exact, j)]);
  const estimatePoints = Array.from({ length: PIXELS }, (_, j) => [j + 0.5, luminance(estimate, j)]);
  const top = Math.ceil(1.6 * Math.max(...exactPoints.slice(0, PIXELS - 2).map(([, v]) => v)));

  return (
    <div className="slide--path-tracing">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="paths-body">
        <div className="paths-left">
          <RoomView
            width={ROOM[0]}
            height={ROOM[1]}
            paint={paint}
            animationKey={`${step}`}
            duration={n === 1 ? 2400 : 1400}
            className="paths-room"
          />
          <div className="paths-strip">
            <span className="paths-strip-label"><Text>{'$\\hat{c}$'}</Text></span>
            <Strip image={estimate} gain={stripGain} width={STRIP_SIZE[0]} height={STRIP_SIZE[1]} />
          </div>
          <div className="paths-strip">
            <span className="paths-strip-label"><Text>{'$c$'}</Text></span>
            <Strip image={traced.exact} gain={stripGain} width={STRIP_SIZE[0]} height={STRIP_SIZE[1]} />
          </div>
        </div>
        <div className="paths-side">
          <div className="paths-count"><Text>{`$n = ${texCount(n)}$`}</Text> paths per pixel</div>
          <Chart
            width={CHART[0]}
            height={CHART[1]}
            x={{ min: 0, max: PIXELS, ticks: [0, 16, 32, 48, 64].map((v) => ({ value: v, label: String(v) })), label: 'pixel' }}
            y={{ min: 0, max: top, ticks: [0, top / 2, top].map((v) => ({ value: v, label: String(v) })), label: 'radiance' }}
            series={[
              { kind: 'dots', points: estimatePoints, className: 'paths-estimate', radius: 3.2 },
              { kind: 'line', points: exactPoints, className: 'paths-exact' },
            ]}
            notes={[
              { x: 36, y: top * 0.92, text: '$\\hat{c}$ estimate', className: 'paths-note-estimate' },
              { x: 36, y: top * 0.78, text: '$c$ exact', className: 'paths-note-exact' },
            ]}
          />
          <table className="paths-errors">
            <thead>
              <tr>
                <th><Text>{'$n$'}</Text></th>
                <th>error</th>
              </tr>
            </thead>
            <tbody>
              {counts.map((count, i) => (
                <tr key={count} className={i === step ? 'paths-errors-current' : (i < step ? '' : 'paths-errors-later')}>
                  <td className="paths-errors-count">{count.toLocaleString('en-US')}</td>
                  <td className="paths-errors-value">{`${(100 * traced.errors.get(count)).toFixed(1)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
