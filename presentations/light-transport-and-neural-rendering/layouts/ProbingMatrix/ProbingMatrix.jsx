import { useMemo } from 'react';
import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import RoomView from '../flatland/RoomView.jsx';
import { patchesToState } from '../flatland/diffuse.js';
import { lightElementRoom } from '../flatland/lightElements.js';
import { drawRoomCamera } from '../flatland/overlays.js';
import { SURFACE_GAIN, derived } from '../flatland/pictures.js';
import { coaxialSystem, photo, roomUnderPattern } from '../flatland/projector.js';
import { autoGain, drawRoom } from '../flatland/render.js';
import { CAMERA, ROOM_HEIGHT, ROOM_WIDTH, cameraRay, castRay } from '../flatland/scene.js';
import { fluence, patchRadiosity } from '../flatland/transport.js';
import { Strip } from '../TransportMatrix/elementViews.jsx';
import './ProbingMatrix.css';

const RENDER = [366, 220];
const STRIP_HEIGHT = 18;
/** Projector and camera pixels. */
const PIXELS = 64;

const luminanceSum = (image) => {
  let sum = 0;
  for (let j = 0; j < image.length / 3; j += 1) sum += 0.2126 * image[j * 3] + 0.7152 * image[j * 3 + 1] + 0.0722 * image[j * 3 + 2];
  return sum;
};

/**
 * The projector's own light in the air: fluence I / r (2D) at every grid
 * point the projector lights, from a point source of unit intensity per
 * radian at the camera, inside its field of view.
 */
function beamFluence(room, table) {
  const { width, height } = table;
  const result = new Float32Array(width * height * 3);
  const forward = cameraRay(CAMERA, 0.5);
  const half = CAMERA.fov / 2;
  for (let j = 0; j < height; j += 1) {
    for (let i = 0; i < width; i += 1) {
      const x = ((i + 0.5) / width) * ROOM_WIDTH;
      const y = ROOM_HEIGHT - ((j + 0.5) / height) * ROOM_HEIGHT;
      const d = [x - CAMERA.position[0], y - CAMERA.position[1]];
      const r = Math.hypot(...d);
      if (r < 1e-6) continue;
      const u = [d[0] / r, d[1] / r];
      const angle = Math.acos(Math.min(1, u[0] * forward[0] + u[1] * forward[1]));
      if (angle > half) continue;
      const hit = castRay(room, CAMERA.position, u);
      if (!hit || hit.distance < r) continue;
      const cell = j * width + i;
      for (let c = 0; c < 3; c += 1) result[cell * 3 + c] = 1 / Math.max(r, 0.3);
    }
  }
  return result;
}

/** The three pictures (photo, direct, indirect), their probed photos, and the shares that check them. */
function probing(env) {
  return derived(env.B[0], 'probing', () => {
    const system = coaxialSystem(env.diffuse, PIXELS);
    const all = new Float64Array(PIXELS).fill(1);
    const { E, B } = roomUnderPattern(system, all);
    const indirectB = B.map((value, i) => value - E[i]);
    const beam = beamFluence(env.room, env.table);
    const picture = (perPatch, withBeam) => {
      const state = patchesToState(env.room, perPatch);
      const light = fluence(env.table, state);
      if (withBeam) for (let i = 0; i < light.length; i += 1) light[i] += beam[i];
      return { fluence: light, surfaces: patchRadiosity(env.transport, state) };
    };
    const photos = {
      photo: photo(system, all),
      direct: photo(system, all, (j, k) => j === k),
      indirect: photo(system, all, (j, k) => j !== k),
    };
    const directTotal = system.direct.reduce((sum, rgb) => sum + 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2], 0);
    const indirectTotal = luminanceSum(photos.photo) - directTotal;
    return {
      pictures: { photo: picture(B, true), direct: picture(E, true), indirect: picture(indirectB, false) },
      photos,
      shares: {
        indirect: indirectTotal / luminanceSum(photos.photo),
        indirectKept: (luminanceSum(photos.direct) - directTotal) / indirectTotal,
      },
    };
  });
}

const PANELS = [
  { key: 'photo', name: 'photo', mask: '\\Pi = \\mathbf{1}\\mathbf{1}^\\top', kept: () => true },
  { key: 'direct', name: 'direct', mask: '\\Pi = I', kept: (j, k) => j === k },
  { key: 'indirect', name: 'indirect', mask: '\\Pi = \\mathbf{1}\\mathbf{1}^\\top - I', kept: (j, k) => j !== k },
];

/** Side of the square blocks, and width of the vector blocks, in stage pixels. */
const BLOCK = 132;
const BAR = 18;

/**
 * c = (Π ⊙ T) 1 as blocks: the probing matrix Π drawn as its pattern of
 * ones (dark) and zeros (blank) for the current panel, T and the vectors
 * as plain outlines. A block diagram, not a picture of T's values.
 */
function ProbeBlocks({ kept }) {
  const cells = 16;
  const cell = BLOCK / cells;
  const gap = 34;
  const x = { c: 0, pi: BAR + gap, t: BAR + 2 * gap + BLOCK, one: BAR + 2 * gap + 2 * BLOCK + 10 };
  const width = x.one + BAR;
  const ones = [];
  for (let j = 0; j < cells; j += 1) {
    for (let k = 0; k < cells; k += 1) {
      if (kept(j, k)) ones.push(<rect key={`${j}-${k}`} x={x.pi + k * cell} y={j * cell} width={cell} height={cell} className="probing-block-one" shapeRendering="crispEdges" />);
    }
  }
  const label = (key, tex, left) => (
    <span key={key} className="probing-block-label" style={{ left, top: BLOCK + 6 }}><Text>{tex}</Text></span>
  );
  return (
    <div className="probing-blocks" style={{ width, height: BLOCK + 40 }}>
      <svg width={width} height={BLOCK}>
        <rect x={x.c} y={0} width={BAR} height={BLOCK} className="probing-block" />
        <rect x={x.pi} y={0} width={BLOCK} height={BLOCK} className="probing-block" />
        {ones}
        <rect x={x.t} y={0} width={BLOCK} height={BLOCK} className="probing-block" />
        <rect x={x.one} y={0} width={BAR} height={BLOCK} className="probing-block" />
        <text x={BAR + gap / 2} y={BLOCK / 2 + 9} className="probing-block-sign">=</text>
        <text x={x.pi + BLOCK + gap / 2} y={BLOCK / 2 + 9} className="probing-block-sign">⊙</text>
      </svg>
      {label('c', '$c$', x.c + BAR / 2)}
      {label('pi', '$\\Pi$', x.pi + BLOCK / 2)}
      {label('t', '$\\mathbf{T}$', x.t + BLOCK / 2)}
      {label('one', '$\\mathbf{1}$', x.one + BAR / 2)}
    </div>
  );
}

/**
 * Light transport probing with a projector that shares the camera's 64
 * pixels (flatland/projector.js). Three renders of the room, one per build
 * step: the ordinary photo (Π = 11ᵀ), direct light only (Π = I: each
 * camera pixel sees only the projector pixel on the same ray), and
 * indirect light only (the complement), each with its probed photo
 * (Π ⊙ T)1 under it. The check: how much indirect light the direct-only
 * photo keeps (the diagonal of T's indirect part), and the indirect share
 * of the photo. Under the renders: `equations`, the product drawn as
 * blocks with the current step's Π, and short `labels` defining the
 * symbols.
 *
 * Content fields: `title`, `subtitle`, `equations`, `labels`, and three
 * `buildSteps`.
 */
export default function ProbingMatrix({ slide, buildStep }) {
  if (!Array.isArray(slide.equations) || !Array.isArray(slide.labels)) throw new Error('probingMatrix: `equations` and `labels` are required');
  const env = lightElementRoom();
  const result = useMemo(() => probing(env), [env]);
  const gains = useMemo(() => ({
    room: 0.32 * autoGain(result.pictures.photo.fluence, 0.97),
    strip: 0.6 * autoGain(result.photos.photo, 0.9),
  }), [result]);
  const step = Math.min(buildStep, PANELS.length - 1);
  const notes = {
    photo: `${Math.round(100 * result.shares.indirect)}% indirect`,
    direct: `${(100 * result.shares.indirectKept).toFixed(1)}% of indirect kept`,
    indirect: 'no direct light',
  };

  return (
    <div className="slide--probing-matrix">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="probing-row">
        {PANELS.map((panel, i) => (
          <motion.figure
            key={panel.key}
            className="probing-panel"
            initial={false}
            animate={{ opacity: i <= step ? 1 : 0 }}
            transition={{ duration: 0.35 }}
          >
            {i > 0 && <span className="probing-sign">{i === 1 ? '=' : '+'}</span>}
            <RoomView
              width={RENDER[0]}
              height={RENDER[1]}
              animationKey={panel.key}
              paint={(ctx) => {
                const picture = result.pictures[panel.key];
                const transform = drawRoom(ctx, env.room, { x: 0, y: 0, width: RENDER[0], height: RENDER[1] }, {
                  table: env.table,
                  fluence: picture.fluence,
                  fluenceGain: gains.room,
                  surfaces: picture.surfaces,
                  surfaceGain: gains.room * SURFACE_GAIN,
                });
                drawRoomCamera(ctx, transform);
              }}
            />
            <Strip image={result.photos[panel.key]} gain={gains.strip} width={RENDER[0]} height={STRIP_HEIGHT} />
            <figcaption>
              <span className="probing-name">
                {panel.name}
                <span className="probing-mask"><Text>{`$${panel.mask}$`}</Text></span>
              </span>
              <span className="probing-note">{notes[panel.key]}</span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
      <div className="probing-bottom">
        <div className="probing-equations">
          {slide.equations.map((line) => <div key={line}><Text>{line}</Text></div>)}
        </div>
        <ProbeBlocks kept={PANELS[step].kept} />
        <div className="probing-labels">
          {slide.labels.map((line) => <p key={line}><Text>{line}</Text></p>)}
        </div>
      </div>
    </div>
  );
}
