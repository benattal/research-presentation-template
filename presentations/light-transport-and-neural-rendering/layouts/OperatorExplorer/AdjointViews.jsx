import { useEffect, useMemo, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useStageCanvas } from '../canvas/canvas.js';
import { albedoGradients, finiteDifference } from '../flatland/gradients.js';
import { SURFACE_GAIN, cachedFluence, derived, sceneGain, subtract } from '../flatland/pictures.js';
import { MEASURED_PIXEL, flatlandRoom } from '../flatland/rooms.js';
import { ROOM_VIEW, autoGain, drawRoom, roomTransform } from '../flatland/render.js';
import { BINS, stateIndex } from '../flatland/scene.js';
import { bounce, fluence, patchRadiosity, solve } from '../flatland/transport.js';
import './OperatorExplorer.css';

const ROOM_SIZE = ROOM_VIEW;
/** The wall whose albedo the derivative and gradient views differentiate. */
const WALL = 'left wall';
/** How far the geometry view moves the box, in room units. */
const BOX_SHIFT = 0.3;
/** Colors inside renders, per unit value: importance, a gradient, warm added light. */
const IMPORTANCE_TINT = [0.3, 0.79, 0.94];
const GRADIENT_TINT = [1, 0.86, 1];
const WARM_TINT = [1, 0.78, 0.5];
/** Surface groups for the per-wall gradient, in the order of the bars. */
const WALL_GROUPS = [['left wall', 'red wall'], ['right wall', 'green wall'], ['ceiling', 'ceiling'], ['floor', 'floor'], ['box', 'box']];
const GAINED_TINT = [1, 0.78, 0.45];
const LOST_TINT = [0.36, 0.55, 1];

function luminance(v, i) {
  return 0.2126 * v[i] + 0.7152 * v[i + 1] + 0.0722 * v[i + 2];
}

/** The light the wall reflects, (∂A/∂ρ) x: A x restricted to the wall's states. */
function wallSource(env) {
  return derived(env.steady, `wall-source:${WALL}`, () => {
    const reflected = bounce(env.transport, env.steady);
    const source = new Float64Array(reflected.length);
    for (const patch of env.room.patches) {
      if (patch.group !== WALL) continue;
      for (let bin = 0; bin < BINS; bin += 1) {
        const i = stateIndex(patch.index, bin) * 3;
        for (let c = 0; c < 3; c += 1) source[i + c] = reflected[i + c];
      }
    }
    return source;
  });
}

/** ∂x/∂ρ = (I − A)⁻¹ (∂A/∂ρ) x: the wall's extra light, transported. */
function lightDerivative(env) {
  const source = wallSource(env);
  return derived(source, 'transported', () => solve(source, (v) => bounce(env.transport, v)));
}

function lightPicture(env, state, gain) {
  return {
    fluence: cachedFluence(env.table, state, Infinity, 'source'),
    fluenceGain: gain,
    surfaces: derived(state, 'radiosity', () => patchRadiosity(env.transport, state)),
    surfaceGain: gain * SURFACE_GAIN,
    palette: 'light',
  };
}

/** Light gained (warm) and lost (blue) when the box moves right: the visibility change. */
function geometryPicture(env) {
  const moved = flatlandRoom('diffuse', 'lamp', BOX_SHIFT);
  const before = cachedFluence(env.table, env.transport.emission, Infinity, 'source');
  const after = cachedFluence(moved.table, moved.transport.emission, Infinity, 'source');
  const gain = sceneGain(env, false) * 2;
  const result = new Float32Array(before.length);
  for (let i = 0; i < before.length; i += 3) {
    const change = luminance(after, i) - luminance(before, i);
    const tint = change > 0 ? GAINED_TINT : LOST_TINT;
    for (let c = 0; c < 3; c += 1) result[i + c] = gain * Math.abs(change) * tint[c];
  }
  return { fluence: result, fluenceGain: 1, surfaces: null, surfaceGain: 1, palette: 'light', room: moved.room, table: moved.table };
}

function gradientPicture(env, gradients) {
  const light = cachedFluence(env.table, env.steady, Infinity, 'source');
  const scattered = derived(env.importance, 'without-sensor', () => subtract(env.importance, env.sensor));
  const importance = cachedFluence(env.table, scattered, Infinity, 'source');
  const gl = sceneGain(env, false) * 0.1;
  const gi = sceneGain(env, true) * 0.1;
  const fluence = new Float32Array(light.length);
  for (let i = 0; i < light.length; i += 3) {
    const y = luminance(importance, i);
    for (let c = 0; c < 3; c += 1) fluence[i + c] = gl * light[i + c] + gi * y * IMPORTANCE_TINT[c];
  }
  const largest = Math.max(...gradients.map(Math.abs));
  const surfaces = new Float64Array(gradients.length * 3);
  gradients.forEach((g, p) => {
    for (let c = 0; c < 3; c += 1) surfaces[p * 3 + c] = (Math.abs(g) / largest) * GRADIENT_TINT[c];
  });
  return { fluence, fluenceGain: 1, surfaces, surfaceGain: 8, palette: 'light' };
}

/**
 * Each view is a list of steps: the picture of the room, the equation, and
 * a short label. `camera` draws the camera and the measured pixel.
 */
const VIEWS = {
  measurement: [
    {
      tex: 'm = \\langle \\htmlClass{term-adjoint}{q}, x \\rangle',
      label: 'one pixel',
      camera: true,
      picture: (env) => lightPicture(env, env.steady, sceneGain(env, false)),
    },
  ],
  derivative: [
    {
      tex: 'x = e + Ax',
      label: 'light',
      picture: (env) => lightPicture(env, env.steady, sceneGain(env, false)),
    },
    {
      tex: '\\partial_\\rho x = (\\partial_\\rho A)\\, x + A\\, \\partial_\\rho x',
      label: 'differentiate $x = e + Ax$; $\\theta = \\rho$, red wall albedo',
      picture: (env) => lightPicture(env, env.steady, sceneGain(env, false)),
    },
    {
      tex: '(\\partial_\\rho A)\\, x',
      label: 'source on the red wall',
      picture: (env) => leavingPicture(env, wallSource(env), derivativeGain(env)),
    },
    {
      tex: '\\partial_\\rho x = (I - A)^{-1} (\\partial_\\rho A)\\, x',
      label: 'transported',
      picture: (env) => lightPicture(env, lightDerivative(env), derivativeGain(env)),
    },
  ],
  operator: [
    {
      tex: '(\\partial_\\theta S)\\, G\\, x',
      label: 'material',
      picture: (env) => lightPicture(env, wallSource(env), derivativeGain(env)),
    },
    {
      tex: 'S\\, (\\partial_\\theta G)\\, x',
      label: 'geometry',
      picture: geometryPicture,
    },
  ],
  gradient: [
    {
      tex: 'x = (I - A)^{-1} e',
      label: 'light',
      picture: (env) => lightPicture(env, env.steady, sceneGain(env, false)),
    },
    {
      tex: '\\htmlClass{term-adjoint}{y = (I - A^\\top)^{-1} q}',
      label: 'importance',
      camera: true,
      picture: (env) => {
        const scattered = derived(env.importance, 'without-sensor', () => subtract(env.importance, env.sensor));
        const gain = sceneGain(env, true);
        return {
          fluence: cachedFluence(env.table, scattered, Infinity, 'source'),
          fluenceGain: gain,
          surfaces: derived(env.importance, 'radiosity', () => patchRadiosity(env.transport, env.importance)),
          surfaceGain: gain * SURFACE_GAIN,
          palette: 'importance',
        };
      },
    },
    {
      tex: '\\partial_\\rho m = \\langle \\htmlClass{term-adjoint}{y}, (\\partial_\\rho A)\\, x \\rangle',
      label: 'gradient',
      camera: true,
      check: true,
      picture: (env) => gradientPicture(env, albedoGradients(env.transport, env.steady, env.importance)),
    },
  ],
};

/** Light drawn only near the surfaces it leaves (within 2 room units). */
function leavingPicture(env, state, gain) {
  return {
    fluence: cachedFluence(env.table, state, 2, 'source'),
    fluenceGain: gain,
    surfaces: derived(state, 'radiosity', () => patchRadiosity(env.transport, state)),
    surfaceGain: gain * SURFACE_GAIN,
    palette: 'light',
  };
}

/** Sum of the per-patch gradients over each surface group. */
function wallGradients(env, gradients) {
  return WALL_GROUPS.map(([group, label]) => ({
    label,
    value: env.room.patches.filter((patch) => patch.group === group).reduce((sum, patch) => sum + gradients[patch.index], 0),
  }));
}

function derivativeGain(env) {
  const transported = lightDerivative(env);
  return derived(transported, 'gain', () => autoGain(cachedFluence(env.table, transported, Infinity, 'source')));
}

/** Light added at one patch, emitted equally in every direction. */
function patchSource(env, patchIndex) {
  const source = new Float64Array(env.room.size * 3);
  for (let bin = 0; bin < BINS; bin += 1) {
    for (let c = 0; c < 3; c += 1) source[stateIndex(patchIndex, bin) * 3 + c] = 1;
  }
  return source;
}

const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);

/** The patch nearest to a point in room units, if one is within reach. */
function nearestPatch(env, point, reach = 0.8) {
  let best = null;
  for (const patch of env.room.patches) {
    const d = Math.hypot(patch.center[0] - point[0], patch.center[1] - point[1]);
    if (d < reach && (!best || d < best.d)) best = { patch, d };
  }
  return best?.patch ?? null;
}

/**
 * Importance as sensitivity: step 0 shows y = ∂m/∂e; step 1 adds light δe
 * at one surface (click any surface to move it), transports it forward,
 * and compares the pixel's change qᵀδx with the adjoint's yᵀδe.
 */
function SensitivityView({ slide, buildStep, env }) {
  const [ref, ratio] = useStageCanvas();
  const [width, height] = ROOM_SIZE;
  const [patchIndex, setPatchIndex] = useState(() => env.room.patches.find((patch) => patch.group === 'box' && patch.normal[1] > 0.5).index);
  const step = Math.min(buildStep, 1);
  const perturbation = useMemo(() => {
    const source = patchSource(env, patchIndex);
    const light = solve(source, (v) => bounce(env.transport, v));
    return { source, light, forward: dot(env.sensor, light), adjoint: dot(env.importance, source) };
  }, [env, patchIndex]);
  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const scattered = derived(env.importance, 'without-sensor', () => subtract(env.importance, env.sensor));
    const importance = cachedFluence(env.table, scattered, Infinity, 'source');
    const gi = sceneGain(env, true);
    let picture;
    if (step === 0) {
      picture = { fluence: importance, fluenceGain: gi, surfaces: patchRadiosity(env.transport, env.importance), surfaceGain: gi * SURFACE_GAIN, palette: 'importance' };
    } else {
      const light = fluence(env.table, perturbation.light, Infinity);
      const gl = autoGain(light) * 0.45;
      const combined = new Float32Array(light.length);
      for (let i = 0; i < light.length; i += 3) {
        const y = luminance(importance, i);
        const l = luminance(light, i);
        for (let c = 0; c < 3; c += 1) combined[i + c] = gl * l * WARM_TINT[c] + 0.15 * gi * y * IMPORTANCE_TINT[c];
      }
      picture = { fluence: combined, fluenceGain: 1, surfaces: patchRadiosity(env.transport, perturbation.light), surfaceGain: gl * SURFACE_GAIN, palette: 'light' };
    }
    const transform = drawRoom(ctx, env.room, { x: 0, y: 0, width, height }, { table: env.table, ...picture, camera: true, pixel: MEASURED_PIXEL });
    if (step === 1) {
      const [cx, cy] = transform.toCanvas(env.room.patches[patchIndex].center);
      for (const [color, width] of [['#05060a', 5], ['#ffffff', 2]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  }, [ref, ratio, env, step, perturbation, patchIndex, width, height]);
  const pick = (event) => {
    if (step !== 1) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const stage = [((event.clientX - rect.left) * width) / rect.width, ((event.clientY - rect.top) * height) / rect.height];
    const patch = nearestPatch(env, roomTransform({ x: 0, y: 0, width, height }).toRoom(stage));
    if (patch) setPatchIndex(patch.index);
  };
  const lines = [
    { tex: '\\htmlClass{term-adjoint}{y} = \\partial m / \\partial e', label: 'sensitivity of the pixel' },
    { tex: '\\delta m = \\langle q, \\delta x \\rangle = \\langle \\htmlClass{term-adjoint}{y}, \\delta e \\rangle', label: 'light added at one surface' },
  ][step];
  return (
    <div className="slide--operator-explorer">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="operator-main">
        <div className="operator-render" data-no-swipe>
          <canvas
            ref={ref}
            className="operator-room"
            width={Math.round(width * ratio)}
            height={Math.round(height * ratio)}
            style={{ width, height, cursor: step === 1 ? 'pointer' : 'default' }}
            onClick={pick}
          />
        </div>
        <div className="operator-side">
          <div className="operator-equation operator-equation--small"><Text>{`$${'{'}${lines.tex}${'}'}$`}</Text></div>
          <p className="operator-label"><Text>{lines.label}</Text></p>
          {step === 1 && (
            <dl className="operator-check">
              <dt><Text>{'forward, $\\langle q, \\delta x \\rangle$'}</Text></dt>
              <dd>{perturbation.forward.toFixed(5)}</dd>
              <dt><Text>{'adjoint, $\\langle y, \\delta e \\rangle$'}</Text></dt>
              <dd>{perturbation.adjoint.toFixed(5)}</dd>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

function AdjointRoom({ env, step }) {
  const [ref, ratio] = useStageCanvas();
  const [width, height] = ROOM_SIZE;
  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const { room, table, ...picture } = step.picture(env);
    drawRoom(ctx, room ?? env.room, { x: 0, y: 0, width, height }, {
      table: table ?? env.table,
      ...picture,
      camera: Boolean(step.camera),
      pixel: step.camera ? MEASURED_PIXEL : null,
    });
  }, [ref, ratio, env, step, width, height]);
  return (
    <canvas
      ref={ref}
      className="operator-room"
      width={Math.round(width * ratio)}
      height={Math.round(height * ratio)}
      style={{ width, height }}
    />
  );
}

/**
 * The adjoint section's views of the flatland room, chosen by `view`:
 *
 * - `measurement`: the lit room and the pixel m = qᵀx;
 * - `derivative`: the light x, the new source (∂A)x on the red wall when
 *   its albedo changes, and that source transported, ∂x = (I − A)⁻¹(∂A)x;
 * - `operator`: the material term (∂S)Gx and the geometry term S(∂G)x
 *   (light gained and lost when the box moves);
 * - `gradient`: the light x, the pixel's importance y, and the gradient
 *   yᵀ(∂A)x glowing on each surface, with the red wall's value checked
 *   against a finite difference;
 * - `sensitivity`: importance as y = ∂m/∂e, then light added at one
 *   (clickable) surface, with the forward and adjoint changes of the pixel.
 *
 * Content fields: `title`, `subtitle`, `view`, and `buildSteps` with one
 * entry per step of the view.
 */
export default function AdjointViews({ slide, buildStep }) {
  const env = flatlandRoom('diffuse', 'lamp');
  if (slide.view === 'sensitivity') return <SensitivityView slide={slide} buildStep={buildStep} env={env} />;
  return <StepViews slide={slide} buildStep={buildStep} env={env} />;
}

function StepViews({ slide, buildStep, env }) {
  const steps = VIEWS[slide.view];
  if (!steps) throw new Error(`Unknown adjoint view "${slide.view}"`);
  const step = steps[Math.min(buildStep, steps.length - 1)];
  const check = useMemo(() => {
    if (!step.check) return null;
    const gradients = albedoGradients(env.transport, env.steady, env.importance);
    const walls = wallGradients(env, gradients);
    const adjoint = walls.find((wall) => wall.label === 'red wall').value;
    const largest = Math.max(...walls.map((wall) => Math.abs(wall.value)));
    return { adjoint, walls, largest, difference: finiteDifference('diffuse', env.sensor, WALL) };
  }, [env, step]);
  return (
    <div className="slide--operator-explorer">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="operator-main">
        <div className="operator-render">
          <AdjointRoom env={env} step={step} />
        </div>
        <div className="operator-side">
          <div className="operator-equation operator-equation--small"><Text>{`$${'{'}${step.tex}${'}'}$`}</Text></div>
          <p className="operator-label"><Text>{step.label}</Text></p>
          {check && (
            <>
              <ul className="operator-bars">
                {check.walls.map((wall) => (
                  <li key={wall.label}>
                    <span>{wall.label}</span>
                    <span className="operator-bar" style={{ width: `${(100 * Math.abs(wall.value)) / check.largest}%` }} />
                  </li>
                ))}
              </ul>
              <dl className="operator-check">
                <dt>red wall, adjoint</dt>
                <dd>{check.adjoint.toFixed(5)}</dd>
                <dt>finite difference</dt>
                <dd>{check.difference.toFixed(5)}</dd>
              </dl>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
