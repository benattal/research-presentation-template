import { useEffect, useMemo, useRef } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { stillFrames, useAnimation, useStageCanvas } from '@core/stage/canvas.js';
import EquationStack from '@core/stage/EquationStack.jsx';
import { SURFACE_GAIN, cachedFluence, derived, sceneGain } from '../flatland/pictures.js';
import { flatlandRoom } from '../flatland/rooms.js';
import { autoGain, drawRoom, roomTransform, toneMap } from '../flatland/render.js';
import { CAMERA, cameraRay, castRay } from '../flatland/scene.js';
import { patchRadiosity } from '../flatland/transport.js';
import { STEPS, albedoColor, createDescent } from './descent.js';
import './InverseRendering.css';

/** The room render, in stage pixels (the room's 10 : 6). */
const ROOM = [620, 372];
/** The column of labels left of the room and the strips. */
const GUTTER = 72;
/** One strip (an image, or the albedo per iteration) and the space above it. */
const STRIP = 24;
const STRIP_GAP = 8;
/** Space between the room and the first strip. */
const ROOM_GAP = 14;
const WIDTH = GUTTER + ROOM[0];
const HEIGHT = ROOM[1] + ROOM_GAP + 4 * (STRIP + STRIP_GAP);
/** How long the loop runs on its build step, in ms: every iterate is shown in turn. */
const LOOP_MS = 5000;
/**
 * The rows under the room, top to bottom, and the build step each appears
 * at: the rendered image Ĉ, the measured image C̃, the derivative image
 * ∂θĈ, and the albedo θ_k at each iteration so far.
 */
const ROWS = [
  { key: 'rendered', label: '$\\hat C$', step: 0 },
  { key: 'measured', label: '$\\tilde C$', step: 1 },
  { key: 'derivative', label: '$\\partial_\\theta \\hat C$', step: 3 },
  { key: 'albedo', label: '$\\htmlClass{term-learned}{\\theta_k}$', step: 4 },
];
/** Where the "θ" label sits in the room, in room units: beside the left wall, halfway up. */
const WALL_LABEL = [0.55, 3.1];

const descents = new WeakMap();
/** The descent of the room as built, created once per room. */
function descentOf(env) {
  if (!descents.has(env)) descents.set(env, createDescent(env));
  return descents.get(env);
}

/** What drawing iterate k needs beyond the descent: the light in the room and on its surfaces. */
function picture(env, iterate) {
  return {
    fluence: cachedFluence(env.table, iterate.x, Infinity, 'source'),
    // Radiosity reads only each patch's index, the same in every iterate's room.
    surfaces: derived(iterate.x, 'radiosity', () => patchRadiosity(env.transport, iterate.x)),
  };
}

function rowTop(index) {
  return ROOM[1] + ROOM_GAP + index * (STRIP + STRIP_GAP);
}

/** An image strip: one cell per camera pixel, left to right, tone mapped at `gain`. */
function drawImage(ctx, image, gain, top) {
  const pixels = image.length / 3;
  const cell = ROOM[0] / pixels;
  for (let px = 0; px < pixels; px += 1) {
    const [r, g, b] = toneMap(image[px * 3], image[px * 3 + 1], image[px * 3 + 2], gain);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    // A little wider than the cell, so no seam shows between cells.
    ctx.fillRect(GUTTER + px * cell, top, cell + 0.6, STRIP);
  }
}

/**
 * The figure at iterate `k` and build step `step`: the room with the wall's
 * albedo θ_k, the camera and the edges of its view, and the rows shown at
 * this step.
 */
function paintFigure(ctx, env, descent, k, step, gains) {
  const iterate = descent.iterate(k);
  const { fluence, surfaces } = picture(env, iterate);
  const transform = drawRoom(ctx, iterate.room, { x: GUTTER, y: 0, width: ROOM[0], height: ROOM[1] }, {
    table: env.table,
    fluence,
    fluenceGain: gains.scene,
    surfaces,
    surfaceGain: gains.scene * SURFACE_GAIN,
    palette: 'light',
    camera: true,
  });
  // The edges of the camera's view: the strips below are what lies between them.
  ctx.save();
  ctx.strokeStyle = 'rgba(215, 219, 228, 0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  for (const s of [0, 1]) {
    const hit = castRay(iterate.room, CAMERA.position, cameraRay(CAMERA, s));
    ctx.beginPath();
    ctx.moveTo(...transform.toCanvas(CAMERA.position));
    ctx.lineTo(...transform.toCanvas(hit.point));
    ctx.stroke();
  }
  ctx.restore();

  if (step >= ROWS[0].step) drawImage(ctx, iterate.image, gains.image, rowTop(0));
  if (step >= ROWS[1].step) drawImage(ctx, descent.measured, gains.image, rowTop(1));
  if (step >= ROWS[2].step) drawImage(ctx, iterate.derivative, gains.derivative, rowTop(2));
  if (step >= ROWS[3].step) {
    const cell = ROOM[0] / (STEPS + 1);
    for (let j = 0; j <= k; j += 1) {
      ctx.fillStyle = albedoColor(descent.iterate(j).theta);
      ctx.fillRect(GUTTER + j * cell, rowTop(3), cell - 2, STRIP);
    }
  }
}

/**
 * Inverse rendering as a loop on the flatland room: the albedo θ of the
 * left wall is recovered from one camera image by gradient descent
 * (descent.js), redrawn after the analysis-by-synthesis figure of
 * Gkioulekas's CMU 15-468 lecture (credited by the slide).
 *
 * Beside the equations (`lines`, an EquationStack: render, compare,
 * gradient, update), the room is drawn with the wall's current albedo,
 * with strips under it that appear with their equations: the rendered
 * image Ĉ (step 0), the measured image C̃ (step 1), the derivative of the
 * rendering ∂θĈ (step 3), and on step 4 the loop: the iterates θ_0 … θ_30
 * play in turn, the room and the strips change with them, and a row of
 * swatches records θ_k. Until step 4 everything shows the first guess, a
 * grey wall; still frames show the last iterate.
 *
 * The descent's solves take about 20 ms each; they are made while the
 * browser is idle after arriving, so the loop does not wait for them.
 *
 * Content fields: `title`, `subtitle`, `lines`, and five build steps.
 */
export default function InverseRendering({ slide, buildStep }) {
  if (slide.buildSteps?.length !== 5) throw new Error(`inverseRendering: "${slide.id}" needs 5 build steps`);
  const step = Math.min(buildStep, 4);
  const env = flatlandRoom('diffuse', 'lamp');
  const descent = descentOf(env);
  const gains = useMemo(() => ({
    scene: sceneGain(env, false),
    image: autoGain(descent.measured, 0.9),
    derivative: 0.6 * autoGain(descent.iterate(0).derivative, 0.95),
  }), [env, descent]);
  const [ref, ratio] = useStageCanvas();
  const drawn = useRef(null);

  // The iterates and their light, one per idle callback, so the loop has them when it runs.
  useEffect(() => {
    if (stillFrames() || typeof window.requestIdleCallback !== 'function') return undefined;
    let handle = 0;
    const next = () => {
      const k = descent.computed;
      if (k > STEPS) return;
      picture(env, descent.iterate(k));
      handle = window.requestIdleCallback(next);
    };
    handle = window.requestIdleCallback(next);
    return () => window.cancelIdleCallback(handle);
  }, [env, descent]);

  useAnimation(`${step}|${ratio}`, step === 4 ? LOOP_MS : 0, (progress) => {
    const k = step === 4 ? Math.round(progress * STEPS) : 0;
    const key = `${k}|${step}|${ratio}`;
    if (drawn.current === key || !ref.current) return;
    drawn.current = key;
    const ctx = ref.current.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    paintFigure(ctx, env, descent, k, step, gains);
  });

  const wall = roomTransform({ x: GUTTER, y: 0, width: ROOM[0], height: ROOM[1] }).toCanvas(WALL_LABEL);
  return (
    <div className="slide--inverse-rendering">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="inverse-rendering-body">
        <div className="inverse-rendering-lines">
          <EquationStack lines={slide.lines} step={step} />
        </div>
        <div className="inverse-rendering-figure" style={{ width: WIDTH, height: HEIGHT }}>
          <canvas
            ref={ref}
            width={Math.round(WIDTH * ratio)}
            height={Math.round(HEIGHT * ratio)}
            style={{ width: WIDTH, height: HEIGHT, display: 'block' }}
          />
          <span className="inverse-rendering-wall" style={{ left: wall[0], top: wall[1] }}><Text>{'$\\theta$'}</Text></span>
          {ROWS.map((row, i) => (
            <span
              key={row.key}
              className="inverse-rendering-row"
              style={{ top: rowTop(i) + STRIP / 2, width: GUTTER - 14, opacity: step >= row.step ? 1 : 0 }}
            >
              <Text>{row.label}</Text>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
