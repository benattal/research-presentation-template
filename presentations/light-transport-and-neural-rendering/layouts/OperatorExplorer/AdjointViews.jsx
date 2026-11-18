import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useStageCanvas } from '../canvas/canvas.js';
import EquationStack from '../equations/EquationStack.jsx';
import RoomView from '../flatland/RoomView.jsx';
import { albedoGradients } from '../flatland/gradients.js';
import { SURFACE_GAIN, cachedFluence, derived, sceneGain, subtract } from '../flatland/pictures.js';
import { MEASURED_PIXEL, flatlandRoom } from '../flatland/rooms.js';
import { ROOM_VIEW, autoGain, drawRoom, pixelWedge, roomTransform } from '../flatland/render.js';
import { BINS, GROUPS, stateIndex } from '../flatland/scene.js';
import { bounce, patchRadiosity, solve } from '../flatland/transport.js';
import './OperatorExplorer.css';
import './AdjointViews.css';

/**
 * The gradient view's large room and the thumbnails beside it, in stage
 * pixels (the room's 10 × 6 aspect): 736 + 48 + 384 spans the stage's
 * content width.
 */
const GRADIENT_ROOM = [736, 442];
const GRADIENT_THUMB = [384, 230];
/** How long the surfaces take to light up, one after another, in ms. */
const REVEAL_MS = 2400;
/**
 * The gradient picture: the light under it, at this fraction of its
 * exposure; the width of the band along each surface, in room units; and
 * the band's color (RGB, an amber unlike any light or importance color).
 */
const GRADIENT_BACKDROP = 0.06;
const GRADIENT_BAND = 0.16;
const GRADIENT_INK = '255, 200, 60';
/** The wall whose albedo the derivative views differentiate. */
const WALL = 'left wall';
/** How far the geometry view moves the box, in room units. */
const BOX_SHIFT = 0.3;
/** Colors of light gained and lost when the box moves, per unit luminance. */
const GAINED_TINT = [1, 0.78, 0.45];
const LOST_TINT = [0.36, 0.55, 1];

const fade = (visible) => ({ initial: false, animate: { opacity: visible ? 1 : 0 }, transition: { duration: 0.35 } });

function luminance(v, i) {
  return 0.2126 * v[i] + 0.7152 * v[i + 1] + 0.0722 * v[i + 2];
}

/** The light the wall reflects, (∂A/∂θ) x = (∂S/∂θ) G x: A x restricted to the wall's states. */
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

/** ∂x/∂θ = (I − A)⁻¹ (∂A/∂θ) x: the wall's extra light, transported. */
function lightDerivative(env) {
  const source = wallSource(env);
  return derived(source, 'transported', () => solve(source, (v) => bounce(env.transport, v)));
}

/** One exposure for the derivative pictures: set by the transported derivative. */
function derivativeGain(env) {
  const transported = lightDerivative(env);
  return derived(transported, 'gain', () => autoGain(cachedFluence(env.table, transported, Infinity, 'source')));
}

/** Light of `state` in the room, as a render: true color, rays drawn their full length. */
function lightPicture(env, state, gain) {
  return {
    fluence: cachedFluence(env.table, state, Infinity, 'source'),
    fluenceGain: gain,
    surfaces: derived(state, 'radiosity', () => patchRadiosity(env.transport, state)),
    surfaceGain: gain * SURFACE_GAIN,
    palette: 'light',
  };
}

/** Light drawn only near the surfaces it leaves (within 2 room units). */
function leavingPicture(env, state, gain) {
  return { ...lightPicture(env, state, gain), fluence: cachedFluence(env.table, state, 2, 'source') };
}

/** The pixel's importance y, drawn as cyan light leaving the camera (the sensor term q is the wedge). */
function importancePicture(env) {
  const scattered = derived(env.importance, 'without-sensor', () => subtract(env.importance, env.sensor));
  const gain = sceneGain(env, true);
  return {
    fluence: cachedFluence(env.table, scattered, Infinity, 'source'),
    fluenceGain: gain,
    surfaces: derived(env.importance, 'radiosity', () => patchRadiosity(env.transport, env.importance)),
    surfaceGain: gain * SURFACE_GAIN,
    palette: 'importance',
  };
}

const steadyLight = (env) => lightPicture(env, env.steady, sceneGain(env, false));
const wallLeaving = (env) => leavingPicture(env, wallSource(env), derivativeGain(env));
const transportedDerivative = (env) => lightPicture(env, lightDerivative(env), derivativeGain(env));

/**
 * Light gained (warm) and lost (blue) by direct lighting when the box moves
 * right: the change of visibility, drawn in the moved room.
 */
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

/** The legend of the geometry picture, as two colored words. */
const GAIN_LEGEND = (
  <span className="adjoint-views-legend">
    <span className="adjoint-views-legend--gained">warm: gained</span>
    {' · '}
    <span className="adjoint-views-legend--lost">blue: lost</span>
  </span>
);

/**
 * The views of a single room, by `view`. Each has its steps (the picture,
 * whether the camera and its pixel are drawn, the caption under the room)
 * and the equations beside the room: an optional `header` shown on every
 * step, an optional `given` label, and `lines` built one per step in an
 * equation stack that keeps its places.
 */
const VIEWS = {
  measurement: {
    steps: [{ picture: steadyLight, camera: true }],
    lines: [
      {
        tex: '$m = \\langle \\htmlClass{term-adjoint}{q}, x \\rangle = \\sum_j \\htmlClass{term-adjoint}{q_j}\\, x_j$',
        label: 'weighted sum',
      },
    ],
    note: '$j$: surfaces and directions',
  },
  derivative: {
    given: '$\\theta$: red wall albedo',
    steps: [
      { picture: steadyLight, caption: '$x$' },
      { picture: steadyLight, caption: '$x$' },
      { picture: wallLeaving, caption: '$(\\partial_\\theta A)\\, x$' },
      { picture: transportedDerivative, caption: '$\\partial_\\theta x$' },
    ],
    lines: [
      { tex: '$x = e + Ax$' },
      { tex: '$\\partial_\\theta x = (\\partial_\\theta A)\\, x + A\\, \\partial_\\theta x$' },
      { tex: '$(I - A)\\, \\partial_\\theta x = (\\partial_\\theta A)\\, x$' },
      { tex: '$\\partial_\\theta x = (I - A)^{-1} (\\partial_\\theta A)\\, x$' },
    ],
  },
  operator: {
    header: '$\\partial_\\theta A = (\\partial_\\theta S)\\, G + S\\, (\\partial_\\theta G)$',
    steps: [
      { picture: wallLeaving },
      { picture: geometryPicture, caption: GAIN_LEGEND },
    ],
    lines: [
      { tex: '$(\\partial_\\theta S)\\, G\\, x$', label: '$\\theta$: red wall albedo' },
      { tex: '$S\\, (\\partial_\\theta G)\\, x$', label: '$\\theta$: box position' },
    ],
  },
};

/** The "q" beside the measured pixel's wedge, positioned over a room drawn at `size`. */
function WedgeLabel({ env, size }) {
  const [width, height] = size;
  const { camera, ends } = pixelWedge(env.room, roomTransform({ x: 0, y: 0, width, height }), MEASURED_PIXEL);
  const far = [(ends[0][0] + ends[1][0]) / 2, (ends[0][1] + ends[1][1]) / 2];
  const along = [far[0] - camera[0], far[1] - camera[1]];
  const length = Math.hypot(...along);
  // 30% of the way from the camera, beside the wedge on its upper-left side (the normal (−dy, dx) in canvas coordinates).
  const offset = 0.045 * width;
  const left = camera[0] + 0.3 * along[0] - (along[1] / length) * offset;
  const top = camera[1] + 0.3 * along[1] + (along[0] / length) * offset;
  return <span className="adjoint-views-wedge" style={{ left, top, fontSize: 0.04 * width }}><Text>{'$q$'}</Text></span>;
}

/**
 * The room drawn as `picture(env)`, with the camera and the measured pixel
 * when `camera` is set, and a ring at `marker` (room coordinates). With
 * `pickAt` (room coordinates → a target or null), the cursor is a pointer
 * over a target and a click passes that target to `onPick`.
 */
function AdjointRoom({ env, picture, camera = false, size = ROOM_VIEW, marker = null, pickAt = null, onPick = null }) {
  const [ref, ratio] = useStageCanvas();
  const [width, height] = size;
  const [overTarget, setOverTarget] = useState(false);
  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const { room, table, ...shown } = picture(env);
    const transform = drawRoom(ctx, room ?? env.room, { x: 0, y: 0, width, height }, {
      table: table ?? env.table,
      ...shown,
      camera,
      pixel: camera ? MEASURED_PIXEL : null,
    });
    if (marker) {
      const [cx, cy] = transform.toCanvas(marker);
      for (const [color, lineWidth] of [['#05060a', 5], ['#ffffff', 2]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.arc(cx, cy, 16 * (width / ROOM_VIEW[0]), 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  }, [ref, ratio, env, picture, camera, marker, width, height]);
  const targetOf = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const stage = [((event.clientX - rect.left) * width) / rect.width, ((event.clientY - rect.top) * height) / rect.height];
    return pickAt(roomTransform({ x: 0, y: 0, width, height }).toRoom(stage));
  };
  const handlers = pickAt ? {
    onMouseMove: (event) => setOverTarget(targetOf(event) !== null),
    onMouseLeave: () => setOverTarget(false),
    onClick: (event) => {
      const target = targetOf(event);
      if (target !== null) onPick(target);
    },
  } : {};
  return (
    <div className="adjoint-views-room" style={{ width, height }}>
      <canvas
        ref={ref}
        className="operator-room"
        width={Math.round(width * ratio)}
        height={Math.round(height * ratio)}
        style={{ width, height, cursor: pickAt && overTarget ? 'pointer' : 'default' }}
        {...handlers}
      />
      {camera && <WedgeLabel env={env} size={size} />}
    </div>
  );
}

/** A caption under a room; it keeps its height when empty, so nothing below it moves. */
function RoomCaption({ children, className = '' }) {
  return <p className={`adjoint-views-caption ${className}`}>{typeof children === 'string' ? <Text>{children}</Text> : children}</p>;
}

/** The equations beside a room: header, given label, and the stack built up to `step`. */
function SideEquations({ header, given, lines, note, step, children }) {
  return (
    <div className="operator-side adjoint-views-side">
      {header && <div className="adjoint-views-header"><Text>{header}</Text></div>}
      {given && <p className="adjoint-views-given"><Text>{given}</Text></p>}
      <div className="adjoint-views-lines">
        <EquationStack lines={lines} step={step} />
      </div>
      {note && <p className="adjoint-views-given"><Text>{note}</Text></p>}
      {children}
    </div>
  );
}

function StepViews({ slide, buildStep, env }) {
  const view = VIEWS[slide.view];
  if (!view) throw new Error(`Unknown adjoint view "${slide.view}"`);
  const step = Math.min(buildStep, view.steps.length - 1);
  const shown = view.steps[step];
  return (
    <div className="slide--operator-explorer">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="operator-main">
        <div className="operator-render">
          <AdjointRoom env={env} picture={shown.picture} camera={Boolean(shown.camera)} />
          <RoomCaption>{shown.caption ?? ''}</RoomCaption>
        </div>
        <SideEquations header={view.header} given={view.given} lines={view.lines} note={view.note} step={step} />
      </div>
    </div>
  );
}

/** Light added at one patch, emitted equally in every direction. */
function patchSource(env, patchIndex) {
  const source = new Float64Array(env.room.size * 3);
  for (let bin = 0; bin < BINS; bin += 1) {
    for (let c = 0; c < 3; c += 1) source[stateIndex(patchIndex, bin) * 3 + c] = 1;
  }
  return source;
}

/** The patch nearest to a point in room units, if one is within reach. */
function nearestPatch(env, point, reach = 0.8) {
  let best = null;
  for (const patch of env.room.patches) {
    const d = Math.hypot(patch.center[0] - point[0], patch.center[1] - point[1]);
    if (d < reach && (!best || d < best.d)) best = { patch, d };
  }
  return best?.patch ?? null;
}

const SENSITIVITY_LINES = [
  { tex: '$\\htmlClass{term-adjoint}{y} = \\partial m / \\partial e$', label: 'sensitivity of the pixel' },
  { tex: '$\\delta m = \\langle q, \\delta x \\rangle = \\langle \\htmlClass{term-adjoint}{y}, \\delta e \\rangle$', label: 'light $\\delta e$ added at one surface' },
];

/**
 * Importance as sensitivity: step 0 shows y = ∂m/∂e; step 1 adds light δe
 * at one surface (click any surface to move it) and shows the light it
 * adds, δx = (I − A)⁻¹δe, whose effect on the pixel the equations beside it
 * state two ways, ⟨q, δx⟩ = ⟨y, δe⟩.
 */
function SensitivityView({ slide, buildStep, env }) {
  const [patchIndex, setPatchIndex] = useState(() => env.room.patches.find((patch) => patch.group === 'box' && patch.normal[1] > 0.5).index);
  const step = Math.min(buildStep, 1);
  const added = useMemo(() => {
    const light = solve(patchSource(env, patchIndex), (v) => bounce(env.transport, v));
    const gain = autoGain(cachedFluence(env.table, light, Infinity, 'source'), 0.97) * 0.6;
    return () => lightPicture(env, light, gain);
  }, [env, patchIndex]);
  const patchAt = (point) => nearestPatch(env, point)?.index ?? null;
  return (
    <div className="slide--operator-explorer">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="operator-main">
        <div className="operator-render" data-no-swipe>
          <AdjointRoom
            env={env}
            picture={step === 0 ? importancePicture : added}
            camera
            marker={step === 1 ? env.room.patches[patchIndex].center : null}
            pickAt={step === 1 ? patchAt : null}
            onPick={setPatchIndex}
          />
          <RoomCaption>{step === 0 ? '$\\htmlClass{term-adjoint}{y}$' : '$\\delta x = (I - A)^{-1}\\, \\delta e$'}</RoomCaption>
        </div>
        <SideEquations lines={SENSITIVITY_LINES} step={step} />
      </div>
    </div>
  );
}

/**
 * The derivative of the pixel with respect to the albedo of each patch,
 * ∂m/∂θ = ⟨y, (∂θA)x⟩ (flatland/gradients.js), as a brightness per unit
 * length from 0 to 1, and the surfaces ordered by their total, largest
 * first. All are positive: brighter surfaces only brighten the pixel.
 */
function surfaceGradients(env) {
  return derived(env.importance, 'surface-gradients', () => {
    const perPatch = albedoGradients(env.transport, env.steady, env.importance);
    const density = env.room.patches.map((patch) => perPatch[patch.index] / patch.length);
    const largest = Math.max(...density);
    const total = (group) => env.room.patches.filter((patch) => patch.group === group).reduce((sum, patch) => sum + perPatch[patch.index], 0);
    return {
      level: density.map((value) => value / largest),
      order: [...GROUPS].sort((a, b) => total(b) - total(a)),
    };
  });
}

/**
 * The gradient picture: the light x, dimmed, with a band along each surface
 * on its lit side, more opaque the more its albedo changes the pixel and
 * scaled by `reveal(group)` (0 to 1), and the camera with its pixel.
 */
function paintGradient(ctx, env, gradients, reveal, [width, height]) {
  const transform = drawRoom(ctx, env.room, { x: 0, y: 0, width, height }, {
    table: env.table,
    fluence: cachedFluence(env.table, env.steady, Infinity, 'source'),
    fluenceGain: sceneGain(env, false) * GRADIENT_BACKDROP,
    palette: 'light',
    camera: true,
    pixel: MEASURED_PIXEL,
  });
  ctx.save();
  for (const patch of env.room.patches) {
    // The floor the pixel sees directly has about 18 times the others' gradient; a cube root keeps them visible beside it.
    const alpha = reveal(patch.group) * Math.cbrt(gradients.level[patch.index]);
    if (alpha < 0.02) continue;
    const inward = (point) => [point[0] + GRADIENT_BAND * patch.normal[0], point[1] + GRADIENT_BAND * patch.normal[1]];
    ctx.fillStyle = `rgba(${GRADIENT_INK}, ${alpha})`;
    ctx.beginPath();
    [patch.a, patch.b, inward(patch.b), inward(patch.a)].forEach((point, i) => {
      const [cx, cy] = transform.toCanvas(point);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** The large picture's caption at each step of the gradient view. */
const GRADIENT_CAPTIONS = [
  { tex: '$x = (I - A)^{-1} e$' },
  { tex: '$\\htmlClass{term-adjoint}{y = (I - A^\\top)^{-1} q}$' },
  { tex: '$\\partial_\\theta m = \\langle \\htmlClass{term-adjoint}{y}, (\\partial_\\theta A)\\, x \\rangle$', given: '$\\theta$: red wall albedo' },
  { tex: '$\\partial_\\theta m = \\langle \\htmlClass{term-adjoint}{y}, (\\partial_\\theta A)\\, x \\rangle$', given: "$\\theta$: each surface's albedo" },
];

/**
 * The gradient from one forward and one adjoint solve. A large room shows
 * the light x (step 0), then the importance y (step 1), each moving to a
 * thumbnail beside it once introduced; then the derivative of the pixel
 * with respect to the red wall's albedo, the wall lit by how much it
 * changes the pixel (step 2); then every surface lights up in turn, largest
 * first, each by its own derivative (step 3).
 */
function GradientView({ slide, buildStep, env }) {
  const step = Math.min(buildStep, GRADIENT_CAPTIONS.length - 1);
  const gradients = useMemo(() => surfaceGradients(env), [env]);
  const caption = GRADIENT_CAPTIONS[step];
  const paint = (ctx, progress) => {
    if (step < 2) {
      const { room, table, ...shown } = (step === 0 ? steadyLight : importancePicture)(env);
      drawRoom(ctx, env.room, { x: 0, y: 0, width: GRADIENT_ROOM[0], height: GRADIENT_ROOM[1] }, {
        table: env.table, ...shown, camera: step === 1, pixel: step === 1 ? MEASURED_PIXEL : null,
      });
      return;
    }
    // The red wall first; on the last step the other surfaces follow, one after another.
    const others = gradients.order.filter((group) => group !== WALL);
    const reveal = (group) => {
      if (group === WALL) return 1;
      if (step === 2) return 0;
      return Math.min(1, Math.max(0, progress * others.length - others.indexOf(group)));
    };
    paintGradient(ctx, env, gradients, reveal, GRADIENT_ROOM);
  };
  return (
    <div className="slide--operator-explorer">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="adjoint-gradient">
        <div className="operator-render">
          <div className="adjoint-views-room" style={{ width: GRADIENT_ROOM[0], height: GRADIENT_ROOM[1] }}>
            <RoomView
              width={GRADIENT_ROOM[0]}
              height={GRADIENT_ROOM[1]}
              paint={paint}
              animationKey={`${step}`}
              duration={step === 3 ? REVEAL_MS : 0}
              className="operator-room"
            />
            {step === 1 && <WedgeLabel env={env} size={GRADIENT_ROOM} />}
          </div>
          <div className="adjoint-gradient-caption">
            <Text>{caption.tex}</Text>
            {caption.given && <span className="adjoint-views-given"><Text>{caption.given}</Text></span>}
          </div>
        </div>
        <div className="adjoint-gradient-column">
          <motion.div {...fade(step >= 1)}>
            <AdjointRoom env={env} picture={steadyLight} size={GRADIENT_THUMB} />
            <RoomCaption className="adjoint-views-caption--pair">{'light $x$'}</RoomCaption>
          </motion.div>
          <motion.div {...fade(step >= 2)}>
            <AdjointRoom env={env} picture={importancePicture} camera size={GRADIENT_THUMB} />
            <RoomCaption className="adjoint-views-caption--pair">{'importance $\\htmlClass{term-adjoint}{y}$'}</RoomCaption>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * The adjoint section's views of the flatland room, chosen by `view`:
 *
 * - `measurement`: the lit room, the pixel's wedge q, and m = ⟨q, x⟩;
 * - `derivative`: x = e + Ax differentiated with respect to the red wall's
 *   albedo θ, one line per step, beside the light x, the source (∂θA)x on
 *   the wall, and that source transported, ∂θx = (I − A)⁻¹(∂θA)x;
 * - `operator`: ∂θA = (∂θS)G + S(∂θG): the material term (the same source
 *   on the wall) and the geometry term (light gained and lost when the box
 *   moves);
 * - `gradient`: the light x, then the importance y, then the room with each
 *   surface lit by the gradient ⟨y, (∂θA)x⟩ of the pixel with respect to
 *   its albedo: the red wall, then every surface in turn;
 * - `sensitivity`: importance as y = ∂m/∂e, then the light δx added by
 *   light δe at one (clickable) surface, with the forward and adjoint
 *   changes of the pixel.
 *
 * Content fields: `title`, `subtitle`, `view`, and `buildSteps` with one
 * entry per step of the view (1, 4, 2, 4, and 2).
 */
export default function AdjointViews({ slide, buildStep }) {
  const env = flatlandRoom('diffuse', 'lamp');
  if (slide.view === 'sensitivity') return <SensitivityView slide={slide} buildStep={buildStep} env={env} />;
  if (slide.view === 'gradient') return <GradientView slide={slide} buildStep={buildStep} env={env} />;
  return <StepViews slide={slide} buildStep={buildStep} env={env} />;
}

