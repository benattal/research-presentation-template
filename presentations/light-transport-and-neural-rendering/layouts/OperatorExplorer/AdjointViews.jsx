import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useStageCanvas } from '@core/stage/canvas.js';
import EquationStack from '@core/stage/EquationStack.jsx';
import RoomView from '../flatland/RoomView.jsx';
import { albedoGradients } from '../flatland/gradients.js';
import { SURFACE_GAIN, cachedFluence, derived, sceneGain, subtract } from '../flatland/pictures.js';
import { MEASURED_PIXEL, flatlandRoom } from '../flatland/rooms.js';
import {
  IMPORTANCE_TINT, ROOM_VIEW, autoGain, drawRoom, pixelWedge, roomTransform,
} from '../flatland/render.js';
import {
  BINS, GROUPS, createRoom, stateIndex,
} from '../flatland/scene.js';
import {
  bounce, bounceAdjoint, buildTransport, cameraImage, patchRadiosity, pixelResponse, solve,
} from '../flatland/transport.js';
import { Strip } from '../TransportMatrix/elementViews.jsx';
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
    steps: [{ picture: steadyLight, camera: true, caption: 'light $x$' }],
    lines: [
      {
        tex: '$m = \\langle \\htmlClass{term-adjoint}{q}, x \\rangle = \\sum_j \\htmlClass{term-adjoint}{q_j}\\, x_j$',
        label: 'weighted sum',
      },
    ],
    note: '$j$: surfaces and directions',
  },
  // The second line is a question to the class: its right side shows one step after its left side.
  derivative: {
    given: '$\\theta$: red wall albedo',
    steps: [
      { picture: steadyLight, caption: 'light $x$' },
      { picture: steadyLight, caption: 'light $x$' },
      { picture: steadyLight, caption: 'light $x$' },
      { picture: wallLeaving, caption: '$(\\partial_\\theta A)\\, x$' },
      { picture: transportedDerivative, caption: '$\\partial_\\theta x$' },
    ],
    lines: [
      { tex: '$x = e + Ax$', label: 'emission $e$, one bounce $A$' },
      { tex: '$\\partial_\\theta x$', rhs: '$(\\partial_\\theta A)\\, x + A\\, \\partial_\\theta x$' },
      { tex: '$(I - A)\\, \\partial_\\theta x = (\\partial_\\theta A)\\, x$', step: 3 },
      { tex: '$\\partial_\\theta x = (I - A)^{-1} (\\partial_\\theta A)\\, x$', step: 4 },
    ],
  },
  operator: {
    header: '$\\partial_\\theta A = (\\partial_\\theta S)\\, G + S\\, (\\partial_\\theta G)$',
    given: 'scattering $S$, propagation $G$',
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
 * The room drawn as `picture(env)`, with the camera and the wedge of
 * `pixel` (the measured pixel by default; null for none) when `camera` is
 * set, and a ring at `marker` (room coordinates). With `pickAt` (room
 * coordinates → a target or null), the cursor is a pointer over a target
 * and a click passes that target to `onPick`.
 */
function AdjointRoom({
  env, picture, camera = false, pixel = MEASURED_PIXEL, size = ROOM_VIEW, marker = null, pickAt = null, onPick = null,
}) {
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
      pixel: camera ? pixel : null,
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
  }, [ref, ratio, env, picture, camera, pixel, marker, width, height]);
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
      {camera && pixel && <WedgeLabel env={env} size={size} />}
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

/** The importance picture beside the sensitivity view's room, in stage pixels: the side column's width. */
const SENSITIVITY_THUMB = [340, 204];

/**
 * Importance as sensitivity: step 0 shows y = ∂m/∂e; step 1 adds light δe
 * at one surface (click any surface to move it) and shows the light it
 * adds, δx = (I − A)⁻¹δe, whose effect on the pixel the equations beside it
 * state two ways, ⟨q, δx⟩ = ⟨y, δe⟩: the large room is δx with the pixel's
 * wedge q, and the importance y under the equations has the same ring at δe.
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
  const marker = step === 1 ? env.room.patches[patchIndex].center : null;
  return (
    <div className="slide--operator-explorer">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="operator-main">
        <div className="operator-render" data-no-swipe>
          <AdjointRoom
            env={env}
            picture={step === 0 ? importancePicture : added}
            camera
            marker={marker}
            pickAt={step === 1 ? patchAt : null}
            onPick={setPatchIndex}
          />
          <RoomCaption>{step === 0 ? '$\\htmlClass{term-adjoint}{y}$' : '$\\delta x = (I - A)^{-1}\\, \\delta e$'}</RoomCaption>
        </div>
        <SideEquations lines={SENSITIVITY_LINES} step={step}>
          <motion.div className="adjoint-views-thumb" {...fade(step === 1)}>
            <AdjointRoom env={env} picture={importancePicture} camera size={SENSITIVITY_THUMB} marker={marker} />
            <RoomCaption className="adjoint-views-caption--pair">{'importance $\\htmlClass{term-adjoint}{y}$'}</RoomCaption>
          </motion.div>
        </SideEquations>
      </div>
    </div>
  );
}

/**
 * The derivative of the pixel with respect to the albedo of each patch,
 * ∂m/∂θ = ⟨y, (∂θA)x⟩ (flatland/gradients.js), as a brightness per unit
 * length from 0 to 1, and the surfaces ordered by their total, largest
 * first. All are positive: brighter surfaces only brighten the pixel.
 * With `importance` the adjoint of a loss instead of the pixel's, the same
 * for the loss (positive too, for the loss of the backprop view).
 */
function surfaceGradients(env, importance = env.importance) {
  return derived(importance, 'surface-gradients', () => {
    const perPatch = albedoGradients(env.transport, env.steady, importance);
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
 * scaled by `reveal(group)` (0 to 1), and the camera with its pixel
 * (`pixel`, none for a loss over every pixel). A band's opacity is its
 * level to the power `exponent`, which keeps small gradients visible, and
 * its width is `band` room units.
 */
function paintGradient(ctx, env, gradients, reveal, [width, height], {
  pixel = MEASURED_PIXEL, exponent = 1 / 3, band = GRADIENT_BAND,
} = {}) {
  const transform = drawRoom(ctx, env.room, { x: 0, y: 0, width, height }, {
    table: env.table,
    fluence: cachedFluence(env.table, env.steady, Infinity, 'source'),
    fluenceGain: sceneGain(env, false) * GRADIENT_BACKDROP,
    palette: 'light',
    camera: true,
    pixel,
  });
  ctx.save();
  for (const patch of env.room.patches) {
    // For one pixel, the floor it sees directly has about 18 times the others' gradient; a cube root keeps them visible beside it.
    const alpha = reveal(patch.group) * gradients.level[patch.index] ** exponent;
    if (alpha < 0.02) continue;
    const inward = (point) => [point[0] + band * patch.normal[0], point[1] + band * patch.normal[1]];
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

/** The reference image's room is this one with the red wall darker: its albedo scaled by this factor. */
const REFERENCE_WALL = 0.6;
/** Pixels of the camera image in the radiative backpropagation view, and camera rays per pixel of its sensors. */
const IMAGE_PIXELS = 48;
const SENSOR_SAMPLES = 16;
/** Each room of the radiative backpropagation view, in stage pixels: three across the content width with 44 between. */
const BACKPROP_ROOM = [360, 216];
const BACKPROP_STRIP = 24;

const imageLuminance = (image, k) => 0.2126 * image[k * 3] + 0.7152 * image[k * 3 + 1] + 0.0722 * image[k * 3 + 2];

/**
 * Radiative backpropagation in the room, for the loss ℓ = Σₖ ‖mₖ − m̃ₖ‖²
 * between the camera image m and a reference image m̃ of the same room with
 * a darker red wall: the residual ∂ℓ/∂m = 2(m − m̃) (positive in every
 * pixel and channel, since the reference only has less light), the adjoint
 * source Σₖ (∂ℓ/∂mₖ) qₖ over every pixel's sensor qₖ, and its importance
 * y = (I − Aᵀ)⁻¹ Σₖ (∂ℓ/∂mₖ) qₖ, one adjoint solve. Computed once.
 */
function lossAdjoint(env) {
  return derived(env.steady, 'loss-adjoint', () => {
    const reference = createRoom({ floorFinish: env.room.floorFinish, light: env.room.light });
    for (const patch of reference.patches) {
      if (patch.group === WALL) patch.albedo = patch.albedo.map((value) => value * REFERENCE_WALL);
    }
    const referenceTransport = buildTransport(reference);
    const referenceLight = solve(referenceTransport.emission, (v) => bounce(referenceTransport, v));
    const image = cameraImage(env.transport, env.steady, IMAGE_PIXELS);
    const target = cameraImage(referenceTransport, referenceLight, IMAGE_PIXELS);
    const residual = image.map((value, i) => 2 * (value - target[i]));
    const source = new Float64Array(env.room.size * 3);
    for (let k = 0; k < IMAGE_PIXELS; k += 1) {
      const sensor = pixelResponse(env.transport, k / IMAGE_PIXELS, (k + 1) / IMAGE_PIXELS, SENSOR_SAMPLES);
      for (let i = 0; i < sensor.length; i += 1) if (sensor[i]) source[i] += residual[k * 3 + (i % 3)] * sensor[i];
    }
    const importance = solve(source, (v) => bounceAdjoint(env.transport, v));
    // The residual as a strip in the importance color: its luminance, tinted.
    const tinted = new Float64Array(IMAGE_PIXELS * 3);
    for (let k = 0; k < IMAGE_PIXELS; k += 1) {
      for (let c = 0; c < 3; c += 1) tinted[k * 3 + c] = imageLuminance(residual, k) * IMPORTANCE_TINT[c];
    }
    return {
      image, target, residual: tinted, source, importance,
      imageGain: autoGain(image, 0.9),
      residualGain: autoGain(tinted, 0.95),
    };
  });
}

/**
 * The loss's importance y, drawn as cyan light leaving the camera, as the
 * pixel's in importancePicture. It fills most of the room (most of the
 * room is in the camera's view), so it is exposed at half the auto
 * exposure, which keeps the brighter importance near the red wall distinct.
 */
function lossImportancePicture(env) {
  const { importance, source } = lossAdjoint(env);
  const scattered = derived(importance, 'without-sensor', () => subtract(importance, source));
  const fluence = cachedFluence(env.table, scattered, Infinity, 'source');
  const gain = derived(scattered, 'gain', () => 0.5 * autoGain(fluence));
  return {
    fluence,
    fluenceGain: gain,
    surfaces: derived(importance, 'radiosity', () => patchRadiosity(env.transport, importance)),
    surfaceGain: gain * SURFACE_GAIN,
    palette: 'importance',
  };
}

/** A strip of pixels with its label above it. */
function LabelledStrip({ label, image, gain }) {
  return (
    <div className="adjoint-backprop-strip">
      <span className="adjoint-backprop-strip-label"><Text>{label}</Text></span>
      <Strip image={image} gain={gain} width={BACKPROP_ROOM[0]} height={BACKPROP_STRIP} />
    </div>
  );
}

/** The equation over the three rooms, as on the slide before: the gradient of a loss from one adjoint solve. */
const BACKPROP_HEADER = [{
  tex: '$\\partial_\\theta \\ell = \\langle \\htmlClass{term-adjoint}{y},\\, (\\partial_\\theta A)\\, x \\rangle, \\quad \\htmlClass{term-adjoint}{y} = (I - A^\\top)^{-1} \\sum_k \\dfrac{\\partial \\ell}{\\partial m_k}\\, \\htmlClass{term-adjoint}{q_k}$',
  label: 'one adjoint solve for the whole loss',
}];

/**
 * Radiative backpropagation, after Nimier-David et al. 2020 (Fig. 2), drawn
 * in the room: three rooms side by side, one per build step. The primal
 * rendering, the light x, with the camera's image m and the reference m̃
 * under it (step 0); the residual ∂ℓ/∂m emitted from the camera and its
 * importance y (step 1); the gradient of the loss with respect to each
 * surface's albedo, ⟨y, (∂θA)x⟩, as bands (step 2), largest on the red
 * wall, the surface the reference differs in.
 */
function BackpropView({ slide, buildStep, env }) {
  const step = Math.min(buildStep, 2);
  const loss = lossAdjoint(env);
  const gradients = surfaceGradients(env, loss.importance);
  // Linear opacity: the red wall's gradient, about twice the floor's per unit length, stands out.
  const paint = (ctx) => paintGradient(ctx, env, gradients, () => 1, BACKPROP_ROOM, { pixel: null, exponent: 1, band: 0.3 });
  return (
    <div className="slide--operator-explorer">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="adjoint-backprop-header">
        <EquationStack lines={BACKPROP_HEADER} step={0} />
      </div>
      <div className="adjoint-backprop">
        <div className="adjoint-backprop-panel">
          <AdjointRoom env={env} picture={steadyLight} camera pixel={null} size={BACKPROP_ROOM} />
          <RoomCaption className="adjoint-views-caption--pair">{'light $x$'}</RoomCaption>
          <LabelledStrip label="image $m$" image={loss.image} gain={loss.imageGain} />
          <LabelledStrip label={'reference $\\tilde m$'} image={loss.target} gain={loss.imageGain} />
        </div>
        <motion.div className="adjoint-backprop-panel" {...fade(step >= 1)}>
          <AdjointRoom env={env} picture={lossImportancePicture} camera pixel={null} size={BACKPROP_ROOM} />
          <RoomCaption className="adjoint-views-caption--pair">{'importance $\\htmlClass{term-adjoint}{y}$'}</RoomCaption>
          <LabelledStrip label={'$\\partial \\ell / \\partial m = 2(m - \\tilde m)$'} image={loss.residual} gain={loss.residualGain} />
        </motion.div>
        <motion.div className="adjoint-backprop-panel" {...fade(step >= 2)}>
          <RoomView width={BACKPROP_ROOM[0]} height={BACKPROP_ROOM[1]} paint={paint} className="operator-room" />
          <RoomCaption className="adjoint-views-caption--pair">{'gradient $\\partial_\\theta \\ell$'}</RoomCaption>
          <p className="adjoint-views-given"><Text>{"$\\theta$: each surface's albedo"}</Text></p>
        </motion.div>
      </div>
    </div>
  );
}

/** The views with their own component; every other view is a VIEWS entry, drawn by StepViews. */
const SPECIAL_VIEWS = { sensitivity: SensitivityView, gradient: GradientView, backprop: BackpropView };

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
 *   changes of the pixel, each beside its picture;
 * - `backprop`: radiative backpropagation for a loss over the whole image:
 *   the light and the image against a reference, the importance of the
 *   loss, and the gradient for every surface's albedo.
 *
 * Content fields: `title`, `subtitle`, `view`, and `buildSteps` with one
 * entry per step of the view (1, 5, 2, 4, 2, and 3).
 */
export default function AdjointViews({ slide, buildStep }) {
  const env = flatlandRoom('diffuse', 'lamp');
  const View = SPECIAL_VIEWS[slide.view] ?? StepViews;
  return <View slide={slide} buildStep={buildStep} env={env} />;
}

