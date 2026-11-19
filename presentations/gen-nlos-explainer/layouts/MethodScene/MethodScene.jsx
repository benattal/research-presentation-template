/**
 * The method on one picture of the captured scene, over three slides that
 * share this layout, so that what one slide ends on is what the next
 * starts from:
 *
 *   phase "processing" (2 steps)    a 3D view: the RGB image and the depth
 *                                   from direct light become a colored
 *                                   point cloud; then the NLOS volume
 *                                   appears behind it. The two inputs sit
 *                                   left of the view.
 *   phase "conditioning" (1 step)   the same view with the target
 *                                   trajectory and a camera moving along
 *                                   it; left of it, the three videos that
 *                                   camera renders, in step with it.
 *   phase "generation" (1 step)     the three videos where they were, and a
 *                                   diagram from them to the generated
 *                                   video: encoders, tokens, the noisy
 *                                   target tokens, the transformer, the
 *                                   decoder.
 *
 * Fields:
 *   phase       which of the three pictures, as above.
 *   scene       (processing, conditioning) the 3D view's data, printed by
 *               the media script: { image, camera: { width, height, fx, fy,
 *               cx, cy, depth, depthRange }, volume: { src, size, columns,
 *               box }, trajectory: { center, radius, arcDegrees, frames } }
 *               (vaseScene.js). The image, the depth map, and the volume's
 *               atlas are PNG files, loaded as images.
 *   cues        (processing, conditioning) per build step, the seconds from
 *               the step's start at which each motion of the 3D view
 *               begins (they follow the narration):
 *                 processing    [{ depth, unproject }, { volume }]
 *                 conditioning  [{ trajectory }]
 *   labels      { pointCloud, volume, trajectory? }: labels in the 3D view.
 *   inputs      (processing) { image: { label }, lightVideo: { src, poster,
 *               label, stillSeconds }, direct, indirect }: the two inputs
 *               and the labels of the arrows from the light video.
 *   streams     (conditioning, generation) { src, poster, labels: [3], fps,
 *               frames, holdLast, stillSeconds }: one video file of the
 *               three conditioning videos stacked in a column with black
 *               gaps (PANEL and STREAM_TOPS below, times 1.5), playing the
 *               `frames` target views forward, holding the last for
 *               `holdLast` frames, playing back, and holding the first. On
 *               the generation slide the file spans the area's width and
 *               holds the generated video too, where the diagram ends.
 *   generation  (generation) { encoder, noisyTokens, transformer, lora,
 *               denoised, decoder, output }: the diagram's labels.
 *
 * A slide holds one video element, so its clips cannot drift apart. What a
 * build step shows appears at once; only the 3D view moves, by the step
 * clock, as a function of the time since the step began. Its moving camera
 * reads the time of the stream video itself, so the two stay in step
 * however the video is driven. A still frame shows the video at
 * `stillSeconds`.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Media from '@core/stage/Media.jsx';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { ease, stillFrames, useStageCanvas } from '@core/stage/canvas.js';
import { useStepClock } from '@core/stage/playback.js';
import {
  acquireVaseScene, createVaseScene, hasParkedVaseScene, pointCloudFromPixels, releaseVaseScene, volumeFromAtlas,
} from './vaseScene.js';
import './MethodScene.css';

/** Stage pixels inside the area under the title (1168 × 572). */
const AREA = { width: 1168, height: 572 };
/** The left column: the two inputs, or the three stream panels (one stitched video spans them). */
const PANEL = 140;
const STREAM_TOPS = [41, 231, 421];
const STREAMS_HEIGHT = STREAM_TOPS[2] + PANEL - STREAM_TOPS[0];
const INPUT_TOPS = [106, 346];
/** The 3D view. */
const VIEW = { left: 172, top: 0, width: 996, height: 572 };

/** The first global step of each phase (the steps of the three slides in order) and its number of build steps. */
const PHASES = {
  processing: { first: 0, steps: 2 },
  conditioning: { first: 2, steps: 1 },
  generation: { first: 3, steps: 1 },
};

/** Viewing cameras of the 3D view: for the point cloud, the volume, and the trajectory. */
const VIEWS = {
  cloud: { eye: [0.82, 0.43, 0.62], target: [-0.01, 0, -0.75], fov: 28 },
  volume: { eye: [1.05, 0.85, 0.5], target: [0.03, 0.07, -0.75], fov: 29 },
  trajectory: { eye: [1.45, 1.15, 1.3], target: [0.4, 0.14, -0.6], fov: 23 },
};

/**
 * The 3D view's labels: the world point each names, where its text sits
 * from that point's place on screen (stage pixels), which side of the text
 * that position is, and whether a leader joins the two.
 */
const ANCHORS = {
  'label-point-cloud': { point: [0, -0.2, -0.84], dx: -24, dy: 48, side: 'top', leader: true },
  'label-volume': { point: [0, -0.04, -1.27], dx: 225, dy: -54, side: 'left', leader: true },
  'label-trajectory': { point: [0.6, 0, -0.16], dx: 0, dy: 14, side: 'top', leader: false },
};
/** Stage pixels a leader stops short of its text and of the point it names. */
const LEADER_GAP = { text: 6, point: 5 };

/** The generation diagram, in stage pixels of the area; rows are the stream panels' centers. */
const ROWS = STREAM_TOPS.map((top) => top + PANEL / 2);
const MIDDLE = ROWS[1];
const TOKEN = { size: 16, gap: 4, count: 6, pitch: 22 };
const TOKEN_ROW_WIDTH = TOKEN.count * TOKEN.size + (TOKEN.count - 1) * TOKEN.gap;
const DIAGRAM = {
  encoder: { left: 190, right: 234, wide: 34, narrow: 18 },
  stack: {
    left: 314,
    tops: [-1.5, -0.5, 0.5].map((row) => MIDDLE + row * TOKEN.pitch - TOKEN.size / 2),
    noisyTop: MIDDLE + 1.5 * TOKEN.pitch - TOKEN.size / 2 + 8,
  },
  transformer: { left: 478, right: 618, top: MIDDLE - 130, bottom: MIDDLE + 130, layers: 5, layerHeight: 34, layerGap: 13 },
  denoised: { left: 656 },
  decoder: { left: 800, right: 844, wide: 34, narrow: 18 },
  output: { left: 880, size: 288 },
};
/** Fill of each conditioning stream's tokens: warped RGB, MIP, MIP depth. */
const TOKEN_COLORS = ['#e8e8e8', '#f08a24', '#8fd05a'];

function ramp(seconds, start, duration) {
  return Math.min(1, Math.max(0, (seconds - start) / duration));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function mixView(a, b, t) {
  return {
    eye: a.eye.map((value, i) => mix(value, b.eye[i], t)),
    target: a.target.map((value, i) => mix(value, b.target[i], t)),
    fov: mix(a.fov, b.fov, t),
  };
}

/** A fixed pseudo-random value in [0, 1) for item `i`: the gray levels of the noisy tokens. */
function noise(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * The 3D picture at `seconds` into global step `step` (0 and 1: processing;
 * 2: conditioning): `scene`, what the view draws (vaseScene.js `draw`,
 * without the moving camera's frame), and `parts`, which named parts of the
 * page show (1 or 0). A motion of an earlier step is finished; one of a
 * later step has not begun. `cues` are the current step's; the trajectory
 * is drawn in `forwardSeconds`, the time the stream video takes from the
 * first target view to the last, so it grows with the moving camera.
 */
function pictureAt(step, seconds, cues, forwardSeconds) {
  /** Progress, 0 to 1, of a motion of step `at` that lasts `duration` from the cue `name`. */
  const motion = (at, name, duration) => {
    if (step !== at) return step > at ? 1 : 0;
    if (typeof cues?.[name] !== 'number') throw new Error(`methodScene: this step needs the cue "${name}"`);
    return ramp(seconds, cues[name], duration);
  };
  const tint = motion(0, 'depth', 0.6);
  const unproject = motion(0, 'unproject', 3.4);
  const toVolume = motion(1, 'volume', 2.4);
  const volume = motion(1, 'volume', 1.8);
  const toTrajectory = motion(2, 'trajectory', 1.8);
  const drawn = motion(2, 'trajectory', forwardSeconds);
  return {
    scene: {
      ...mixView(mixView(VIEWS.cloud, VIEWS.volume, ease(toVolume)), VIEWS.trajectory, ease(toTrajectory)),
      unproject: ease(unproject),
      // The depth map shows on the image plane, and the colors return as the pixels leave it.
      depthTint: tint * (1 - ramp(unproject, 0.15, 0.55)),
      volume: ease(volume),
      trajectory: drawn,
    },
    parts: {
      direct: tint > 0 ? 1 : 0,
      indirect: step >= 1 ? 1 : 0,
      'label-point-cloud': unproject === 1 ? 1 : 0,
      'label-volume': step >= 1 ? 1 : 0,
      'label-trajectory': step >= 2 ? 1 : 0,
    },
  };
}

/**
 * The target view (fractional between frames) the stream video shows at
 * `seconds`: frame k of the file is on screen during [k, k + 1) / fps, and
 * the file plays the views forward, holds the last, plays back, and holds
 * the first until it loops.
 */
function targetViewAt(seconds, { fps, frames, holdLast }) {
  const last = frames - 1;
  const position = seconds * fps - 0.5;
  if (position <= last + holdLast) return Math.min(last, Math.max(0, position));
  return Math.max(0, last - (position - last - holdLast));
}

/** Pixels of a loaded <img>, decoded into RGBA bytes. */
function imagePixels(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height).data;
}

function loaded(image) {
  return Boolean(image?.complete && image.naturalWidth > 0);
}

/** In a still frame, show the slide's video at `seconds`: a chosen moment of its loop. */
function useStillVideo(area, seconds) {
  useEffect(() => {
    const video = area.current.querySelector('video');
    if (!video || !stillFrames()) return undefined;
    const seek = () => { video.currentTime = seconds; };
    if (video.readyState >= 1) seek();
    else video.addEventListener('loadedmetadata', seek, { once: true });
    return () => video.removeEventListener('loadedmetadata', seek);
  }, [area, seconds]);
}

/** A trapezoid between x `left` and `right`, centered on `y`, with half heights `from` and `to`. */
function trapezoid(left, right, y, from, to) {
  return `M ${left} ${y - from} L ${right} ${y - to} L ${right} ${y + to} L ${left} ${y + from} Z`;
}

function Arrowhead({ id }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="context-stroke" />
      </marker>
    </defs>
  );
}

function TokenRow({ left, top, fill, opacities }) {
  return Array.from({ length: TOKEN.count }, (_, i) => (
    <rect
      key={i}
      x={left + i * (TOKEN.size + TOKEN.gap)}
      y={top}
      width={TOKEN.size}
      height={TOKEN.size}
      rx="3"
      fill={fill}
      fillOpacity={opacities ? opacities[i] : 1}
    />
  ));
}

/** The two inputs of the processing phase and the arrows from them toward the 3D view. */
function Inputs({ inputs, image }) {
  const lightMiddle = INPUT_TOPS[1] + PANEL / 2;
  const arrows = [
    { y: INPUT_TOPS[0] + PANEL / 2, modifier: '' },
    { y: lightMiddle - 16, modifier: ' method-scene-flow--direct', part: 'direct' },
    { y: lightMiddle + 16, modifier: ' method-scene-flow--indirect', part: 'indirect' },
  ];
  return (
    <>
      <figure className="method-scene-tile" style={{ left: 0, top: INPUT_TOPS[0], width: PANEL, height: PANEL }}>
        <figcaption className="method-scene-caption"><Text>{inputs.image.label}</Text></figcaption>
        <img className="method-scene-media" src={image} alt="" />
      </figure>
      <figure className="method-scene-tile" style={{ left: 0, top: INPUT_TOPS[1], width: PANEL, height: PANEL }}>
        <figcaption className="method-scene-caption"><Text>{inputs.lightVideo.label}</Text></figcaption>
        <Media
          item={{ type: 'video', src: inputs.lightVideo.src, poster: inputs.lightVideo.poster }}
          className="method-scene-media"
        />
      </figure>
      <svg className="method-scene-diagram" viewBox={`0 0 ${AREA.width} ${AREA.height}`}>
        <Arrowhead id="method-scene-input-arrowhead" />
        {arrows.map(({ y, modifier, part }) => (
          <path
            key={y}
            data-part={part}
            className={`method-scene-flow${modifier}`}
            d={`M ${PANEL + 10} ${y} L ${PANEL + 100} ${y}`}
            markerEnd="url(#method-scene-input-arrowhead)"
          />
        ))}
      </svg>
      <span data-part="direct" className="method-scene-note method-scene-note--direct" style={{ left: PANEL + 12, top: lightMiddle - 16 - 30 }}>
        <Text>{inputs.direct}</Text>
      </span>
      <span data-part="indirect" className="method-scene-note method-scene-note--indirect" style={{ left: PANEL + 12, top: lightMiddle + 16 + 6 }}>
        <Text>{inputs.indirect}</Text>
      </span>
    </>
  );
}

/**
 * The slide's one video, the stream panels' captions, and, with `output`,
 * the caption of the generated video (the file then spans the area's
 * width and holds that video too).
 */
function Streams({ streams, output }) {
  return (
    <>
      <div
        className="method-scene-video"
        style={{ left: 0, top: STREAM_TOPS[0], width: output ? AREA.width : PANEL, height: STREAMS_HEIGHT }}
      >
        <Media item={{ type: 'video', src: streams.src, poster: streams.poster }} className="method-scene-media method-scene-media--stitched" />
      </div>
      {streams.labels.map((label, i) => (
        <div key={label} className="method-scene-tile method-scene-tile--outlined" style={{ left: 0, top: STREAM_TOPS[i], width: PANEL, height: PANEL }}>
          <div className="method-scene-caption"><Text>{label}</Text></div>
        </div>
      ))}
      {output && (
        <div
          className="method-scene-tile"
          style={{ left: DIAGRAM.output.left, top: MIDDLE - DIAGRAM.output.size / 2, width: DIAGRAM.output.size, height: DIAGRAM.output.size }}
        >
          <div className="method-scene-caption method-scene-caption--ours"><Text>{output}</Text></div>
        </div>
      )}
    </>
  );
}

/** The diagram of the generation phase, from the stream panels to the generated video. */
function GenerationDiagram({ generation }) {
  const { encoder, stack, transformer, denoised, decoder, output } = DIAGRAM;
  const stackRight = stack.left + TOKEN_ROW_WIDTH;
  const layersHeight = transformer.layers * transformer.layerHeight + (transformer.layers - 1) * transformer.layerGap;
  const layerTop = (i) => MIDDLE - layersHeight / 2 + i * (transformer.layerHeight + transformer.layerGap);
  const denoisedRight = denoised.left + TOKEN_ROW_WIDTH;
  const head = 'url(#method-scene-arrowhead)';
  const notes = [
    { text: generation.encoder, left: (encoder.left + encoder.right) / 2, top: ROWS[0] - encoder.wide - 32 },
    { text: generation.noisyTokens, left: stack.left + TOKEN_ROW_WIDTH / 2, top: stack.noisyTop + TOKEN.size + 8 },
    { text: generation.transformer, left: (transformer.left + transformer.right) / 2, top: transformer.top - 34 },
    { text: generation.lora, left: (transformer.left + transformer.right) / 2, top: transformer.bottom + 8, accent: true },
    { text: generation.denoised, left: denoised.left + TOKEN_ROW_WIDTH / 2, top: MIDDLE + TOKEN.size / 2 + 8 },
    { text: generation.decoder, left: (decoder.left + decoder.right) / 2, top: MIDDLE - decoder.wide - 32 },
  ];
  return (
    <>
      <svg className="method-scene-diagram" viewBox={`0 0 ${AREA.width} ${AREA.height}`}>
        <Arrowhead id="method-scene-arrowhead" />
        {ROWS.map((y, i) => {
          const rowY = stack.tops[i] + TOKEN.size / 2;
          const bend = (encoder.right + stack.left) / 2;
          return (
            <g key={y}>
              <path className="method-scene-flow" d={`M ${PANEL + 8} ${y} L ${encoder.left - 5} ${y}`} markerEnd={head} />
              <path className="method-scene-shape" d={trapezoid(encoder.left, encoder.right, y, encoder.wide, encoder.narrow)} />
              <path
                className="method-scene-flow"
                d={`M ${encoder.right + 4} ${y} C ${bend} ${y}, ${bend} ${rowY}, ${stack.left - 8} ${rowY}`}
                markerEnd={head}
              />
              <TokenRow left={stack.left} top={stack.tops[i]} fill={TOKEN_COLORS[i]} />
            </g>
          );
        })}

        <TokenRow
          left={stack.left}
          top={stack.noisyTop}
          fill="#ffffff"
          opacities={Array.from({ length: TOKEN.count }, (_, i) => 0.22 + 0.6 * noise(i))}
        />
        {/* Speckles inside each token, so the row reads as noise and not as a gray stream. */}
        {Array.from({ length: TOKEN.count * 4 }, (_, i) => (
          <rect
            key={i}
            x={stack.left + Math.floor(i / 4) * (TOKEN.size + TOKEN.gap) + 2 + (i % 2) * 7}
            y={stack.noisyTop + 2 + (Math.floor(i / 2) % 2) * 7}
            width="5"
            height="5"
            fill={noise(i + 40) > 0.5 ? '#ffffff' : '#000000'}
            fillOpacity={0.25 + 0.5 * noise(i + 90)}
          />
        ))}

        <path className="method-scene-flow" d={`M ${stackRight + 10} ${MIDDLE} L ${transformer.left - 7} ${MIDDLE}`} markerEnd={head} />
        <rect
          className="method-scene-shape"
          x={transformer.left}
          y={transformer.top}
          width={transformer.right - transformer.left}
          height={transformer.bottom - transformer.top}
          rx="12"
        />
        {Array.from({ length: transformer.layers }, (_, i) => (
          <g key={i}>
            <rect
              className="method-scene-layer"
              x={transformer.left + 14}
              y={layerTop(i)}
              width={transformer.right - transformer.left - 28}
              height={transformer.layerHeight}
              rx="5"
            />
            <rect
              className="method-scene-lora"
              x={transformer.right - 14 - 22}
              y={layerTop(i) + 6}
              width="16"
              height={transformer.layerHeight - 12}
              rx="3"
            />
          </g>
        ))}

        <path className="method-scene-flow" d={`M ${transformer.right + 8} ${MIDDLE} L ${denoised.left - 9} ${MIDDLE}`} markerEnd={head} />
        <TokenRow left={denoised.left} top={MIDDLE - TOKEN.size / 2} fill="var(--accent)" />
        <path className="method-scene-flow" d={`M ${denoisedRight + 8} ${MIDDLE} L ${decoder.left - 5} ${MIDDLE}`} markerEnd={head} />
        <path className="method-scene-shape" d={trapezoid(decoder.left, decoder.right, MIDDLE, decoder.narrow, decoder.wide)} />
        <path className="method-scene-flow" d={`M ${decoder.right + 4} ${MIDDLE} L ${output.left - 7} ${MIDDLE}`} markerEnd={head} />
      </svg>
      {notes.map(({ text, left, top, accent }) => (
        <span
          key={text}
          className={`method-scene-note method-scene-note--centered${accent ? ' method-scene-note--accent' : ''}`}
          style={{ left, top }}
        >
          <Text>{text}</Text>
        </span>
      ))}
    </>
  );
}

export default function MethodScene({ slide, buildStep }) {
  const { scene, labels, inputs, streams, generation } = slide;
  const phase = PHASES[slide.phase];
  if (!phase) throw new Error(`Slide "${slide.id}": methodScene needs "phase": ${Object.keys(PHASES).join(', ')}`);
  const has3d = slide.phase !== 'generation';
  const needed = {
    processing: ['scene', 'cues', 'labels', 'inputs'],
    conditioning: ['scene', 'cues', 'labels', 'streams'],
    generation: ['streams', 'generation'],
  }[slide.phase];
  for (const field of needed) {
    if (!slide[field]) throw new Error(`Slide "${slide.id}": the ${slide.phase} phase needs "${field}"`);
  }
  if ((slide.buildSteps?.length ?? 1) !== phase.steps || (has3d && slide.cues.length !== phase.steps)) {
    throw new Error(`Slide "${slide.id}": the ${slide.phase} phase has ${phase.steps} build steps, each with its cues`);
  }

  // The area has a fixed size in stage pixels, so it measures the stage's scale as a canvas would.
  const [areaRef, ratio] = useStageCanvas();
  const canvasHolder = useRef(null);
  const imageRef = useRef(null);
  const depthRef = useRef(null);
  const volumeRef = useRef(null);
  const sceneView = useRef(null);
  const parts = useRef(new Map());
  const drawnMs = useRef(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const onDataLoad = () => setDataLoaded([imageRef, depthRef, volumeRef].every((image) => loaded(image.current)));
  const sceneKey = has3d ? [scene.image, scene.camera.depth, scene.volume.src].join(' ') : null;

  const draw = (ms) => {
    drawnMs.current = ms;
    if (!has3d) return;
    const forwardSeconds = streams ? (streams.frames - 1) / streams.fps : 1;
    const picture = pictureAt(phase.first + buildStep, ms / 1000, slide.cues[buildStep], forwardSeconds);
    for (const [name, elements] of parts.current) {
      if (picture.parts[name] === undefined) throw new Error(`methodScene: no part named "${name}"`);
      for (const element of elements) element.style.opacity = String(picture.parts[name]);
    }
    const view = sceneView.current;
    if (!view) return;
    const video = streams && areaRef.current.querySelector('video');
    view.draw({ ...picture.scene, targetIndex: video ? targetViewAt(video.currentTime, streams) : 0 });

    // Each label's text and leader follow the point it names.
    for (const [name, { point, dx, dy, side }] of Object.entries(ANCHORS)) {
      const at = view.project(point);
      const text = { x: at.x + dx, y: at.y + dy };
      const length = Math.hypot(dx, dy);
      for (const element of parts.current.get(name) ?? []) {
        if (element.tagName === 'line') {
          element.setAttribute('x1', at.x + (dx / length) * LEADER_GAP.point);
          element.setAttribute('y1', at.y + (dy / length) * LEADER_GAP.point);
          element.setAttribute('x2', text.x - (side === 'left' ? LEADER_GAP.text : 0));
          element.setAttribute('y2', text.y - (side === 'top' ? LEADER_GAP.text : 0));
        } else {
          const shift = side === 'left' ? 'translate(0, -50%)' : 'translate(-50%, 0)';
          element.style.transform = `translate(${text.x}px, ${text.y}px) ${shift}`;
        }
      }
    }
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;

  // The named parts of the page, found again after every render and before the clock draws.
  useLayoutEffect(() => {
    const found = new Map();
    for (const element of areaRef.current.querySelectorAll('[data-part]')) {
      found.set(element.dataset.part, [...(found.get(element.dataset.part) ?? []), element]);
    }
    parts.current = found;
  });

  // The 3D view: the one the slide before gave back, or a new one once the three data images have loaded.
  useLayoutEffect(() => {
    if (has3d) onDataLoad();
  }, []);
  useLayoutEffect(() => {
    if (!has3d || !(dataLoaded || hasParkedVaseScene(sceneKey))) return undefined;
    const view = acquireVaseScene(sceneKey, canvasHolder.current, () => {
      const [image, depth, volume] = [imageRef.current, depthRef.current, volumeRef.current];
      return createVaseScene({
        scene,
        cloud: pointCloudFromPixels({ rgba: imagePixels(image), depthRgba: imagePixels(depth), camera: scene.camera }),
        voxels: volumeFromAtlas({
          rgba: imagePixels(volume), atlasWidth: volume.naturalWidth, size: scene.volume.size, columns: scene.volume.columns,
        }),
      });
    });
    sceneView.current = view;
    return () => {
      sceneView.current = null;
      releaseVaseScene(sceneKey, view);
    };
  }, [has3d, dataLoaded, sceneKey, scene, canvasHolder]);

  // Sized to the stage's scale, and drawn at once: a still frame has no clock to draw it later.
  useLayoutEffect(() => {
    if (!sceneView.current) return;
    sceneView.current.resize(VIEW.width, VIEW.height, ratio);
    drawRef.current(drawnMs.current);
  }, [dataLoaded, ratio]);

  useStepClock(buildStep, draw);

  // Without a running clock (a still frame, the record view) the video's own moves redraw the picture.
  useEffect(() => {
    const video = has3d && streams ? areaRef.current.querySelector('video') : null;
    if (!video) return undefined;
    const events = ['loadeddata', 'seeked', 'pause', 'timeupdate'];
    const redraw = () => drawRef.current(drawnMs.current);
    for (const name of events) video.addEventListener(name, redraw);
    return () => {
      for (const name of events) video.removeEventListener(name, redraw);
    };
  }, [has3d, streams]);

  useStillVideo(areaRef, (inputs?.lightVideo ?? streams).stillSeconds);

  return (
    <div className="slide--method-scene">
      <SlideTitle title={slide.title} />
      <div className="method-scene" ref={areaRef} style={{ width: AREA.width, height: AREA.height }}>
        {has3d && (
          <>
            <img ref={imageRef} className="method-scene-data" src={scene.image} alt="" onLoad={onDataLoad} />
            <img ref={depthRef} className="method-scene-data" src={scene.camera.depth} alt="" onLoad={onDataLoad} />
            <img ref={volumeRef} className="method-scene-data" src={scene.volume.src} alt="" onLoad={onDataLoad} />
            <div className="method-scene-view" style={VIEW}>
              <div ref={canvasHolder} className="method-scene-canvas" />
              <svg className="method-scene-diagram" viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}>
                {Object.keys(ANCHORS).filter((name) => ANCHORS[name].leader).map((name) => (
                  <line key={name} data-part={name} className="method-scene-leader" />
                ))}
              </svg>
              <span data-part="label-point-cloud" className="method-scene-note method-scene-note--anchored"><Text>{labels.pointCloud}</Text></span>
              <span data-part="label-volume" className="method-scene-note method-scene-note--anchored"><Text>{labels.volume}</Text></span>
              {labels.trajectory && (
                <span data-part="label-trajectory" className="method-scene-note method-scene-note--anchored method-scene-note--accent">
                  <Text>{labels.trajectory}</Text>
                </span>
              )}
            </div>
          </>
        )}
        {slide.phase === 'processing' && <Inputs inputs={inputs} image={scene.image} />}
        {streams && <Streams streams={streams} output={generation?.output} />}
        {generation && <GenerationDiagram generation={generation} />}
      </div>
    </div>
  );
}
