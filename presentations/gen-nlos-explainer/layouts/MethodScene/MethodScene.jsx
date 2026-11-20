/**
 * The method on one picture of the captured scene, over three slides that
 * share this layout and read as one animation: each slide begins on the
 * picture the slide before it ends on, and moves from there.
 *
 *   phase "processing" (2 steps)    a 3D view: the RGB image and the depth
 *                                   from direct light become a colored
 *                                   point cloud; then the NLOS volume
 *                                   appears behind it. The two inputs sit
 *                                   left of the view.
 *   phase "conditioning" (1 step)   the view turns to the target
 *                                   trajectory while the inputs give way to
 *                                   the three videos a camera on that
 *                                   trajectory renders; the trajectory is
 *                                   drawn, and then the camera moves along
 *                                   it, in step with the videos.
 *   phase "generation" (1 step)     the 3D view leaves; the three videos
 *                                   stay where they were, as stills of
 *                                   their last view, and a diagram builds
 *                                   from them to the generated video:
 *                                   encoders, tokens, the noisy target
 *                                   tokens, the transformer, the decoder.
 *
 * Fields:
 *   phase       which of the three pictures, as above.
 *   scene       the 3D view's data, printed by the media script: { image,
 *               camera: { width, height, fx, fy, cx, cy, depth, depthRange },
 *               volume: { src, size, columns, box }, trajectory: { center,
 *               radius, arcDegrees, frames } } (vaseScene.js). The image,
 *               the depth map, and the volume's atlas are PNG files, loaded
 *               as images.
 *   cues        per build step, the seconds from the step's start at which
 *               its motions begin (they follow the narration):
 *                 processing    [{ depth, unproject }, { volume }]
 *                 conditioning  [{ trajectory }]: the trajectory is drawn
 *                               in ARC_SECONDS from here; the stream video
 *                               leaves its first view after `streams.lead`
 *                 generation    [{ encoder, tokens, noisy, transformer,
 *                               lora, denoised, decoder, output }]: the
 *                               parts of the diagram, left to right
 *   labels      { pointCloud, volume, trajectory? }: labels in the 3D view.
 *   inputs      (processing, conditioning) { image: { label }, lightVideo:
 *               { src, poster, label, stillSeconds }, direct, indirect }:
 *               the two inputs, and under the light video the names of the
 *               two parts of the light, each shown from the step that uses
 *               it. The conditioning slide shows them leaving, with the
 *               light video as its poster.
 *   streams     the three conditioning videos, stacked in a column with
 *               gaps (TILE and STREAM_TOPS below, times 1.5):
 *               { labels: [3], final } and, on the conditioning slide,
 *               { src, poster, fps, frames, lead, holdLast, stillSeconds }.
 *               The video shows the first target view for `lead` frames
 *               more than one, plays the `frames` views forward, holds the
 *               last for `holdLast` frames more, and plays back. `final` is
 *               a still of that hold: what the generation slide shows.
 *   generated   (generation) { src, poster, stillSeconds }: the generated
 *               video, where the diagram ends. It is best revealed (the cue
 *               `output`) while it holds its first view.
 *   generation  (generation) { encoder, noisyTokens, transformer, lora,
 *               denoised, decoder, output }: the diagram's labels.
 *
 * Each part of the picture has a panel behind it (`--bg-panel`), and the
 * panels stand side by side over the area's height: at the left the inputs,
 * and after them the stream tiles in a narrower one; the 3D view, whose
 * canvas has the panel's shade and which begins where the left panel ends;
 * and, in the generation phase, where the 3D view was, one for each stage
 * of the diagram (STAGES). A flow line of the diagram crosses the black
 * between two panels.
 *
 * A slide holds one video element, so its clips cannot drift apart, and
 * nothing that holds a playing video changes opacity: a veil over it, in
 * the panel's shade, does. Everything moves by the step clock, as a
 * function of the time since the step began (`pictureAt`, and the diagram's `reveal` marks). The
 * moving camera of the 3D view reads the time of the stream video itself,
 * so the two stay in step however the video is driven. A still frame shows
 * each step's end, with the video at `stillSeconds`.
 *
 * A step that the page moves on to plays from its start, and continues
 * from whatever the step before was showing at that moment (`beginStep`);
 * a step the page comes back to shows its end.
 */
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Media from '@core/stage/Media.jsx';
import Text from '@core/stage/Text.jsx';
import { ease, stillFrames, useStageCanvas } from '@core/stage/canvas.js';
import { SETTLED_MS, useStepClock } from '@core/stage/playback.js';
import {
  acquireVaseScene, createVaseScene, hasParkedVaseScene, pointCloudFromPixels, releaseVaseScene, volumeFromAtlas,
} from './vaseScene.js';
import './MethodScene.css';

/** The method's three slides share this overview; phase selects the highlighted stage. */
const METHOD_STAGES = [
  { phase: 'processing', label: '1. Processing the capture' },
  { phase: 'conditioning', label: '2. Conditioning videos' },
  { phase: 'generation', label: '3. Video generation' },
];

/** Stage pixels inside the area under the title (1168 × 572). */
const AREA = { width: 1168, height: 572 };
/** Panels: stage pixels between a panel's edge and what it holds, and of black between two panels. */
const INSET = 12;
const GAP = 12;
/** The left panel holds a column: the three stream tiles (one stitched file spans them), or the two inputs. */
/**
 * The stream tiles: windows onto one stitched file whose tiles are 140
 * pixels apart by 190 (times 1.5), so a tile's size sets the spacing. They
 * start under a title row (the generation slide's "Input", level with its
 * stages' titles) and each tile's caption.
 */
const TITLE_TOP = 8;
const TILE = 134;
const STREAM_PITCH = (TILE * 190) / 140;
const STREAM_TOPS = [0, 1, 2].map((i) => TITLE_TOP + 24 + 8 + 24 + 6 + i * STREAM_PITCH);
const STREAMS_HEIGHT = STREAM_TOPS[2] + TILE - STREAM_TOPS[0];
const INPUT = 230;
const INPUT_TOPS = [40, 305];
/** Line height of a note (MethodScene.css), for notes stacked under a tile. */
const NOTE_LINE = 24;
/** The left panel's width around the inputs (their longer caption sets it) and around the stream tiles. */
const LEFT_PANEL = { inputs: 272, streams: 200 };
const INPUT_LEFT = (LEFT_PANEL.inputs - INPUT) / 2;
/** The stream tiles' left edge: centered in their panel. */
const TILE_LEFT = (LEFT_PANEL.streams - TILE) / 2;
/**
 * The 3D view: a panel that begins GAP after the left panel. Its canvas has
 * this size on every slide; while the left panel is the wider one, the
 * view is clipped to begin after it (`panels.left` of a picture).
 */
const VIEW = { left: LEFT_PANEL.streams + GAP, top: 0, width: AREA.width - LEFT_PANEL.streams - GAP, height: AREA.height };
/** Stage pixels a veil extends past the video it covers: a video's edge must not show around it. */
const VEIL_MARGIN = 2;

/** The first global step of each phase (the steps of the three slides in order) and its number of build steps. */
const PHASES = {
  processing: { first: 0, steps: 2 },
  conditioning: { first: 2, steps: 1 },
  generation: { first: 3, steps: 1 },
};
const LAST_STEP = 3;

/**
 * Viewing cameras of the 3D view: for the point cloud, the volume, and the
 * trajectory. `shift` moves the picture right, in stage pixels: the first
 * two are centered in the part of the view that the inputs' panel leaves.
 */
const VIEWS = {
  cloud: { eye: [0.82, 0.43, 0.62], target: [-0.01, 0, -0.75], fov: 28, shift: 102 },
  volume: { eye: [1.05, 0.85, 0.5], target: [0.03, 0.07, -0.75], fov: 30.5, shift: 41 },
  trajectory: { eye: [1.45, 1.15, 1.3], target: [0.4, 0.14, -0.6], fov: 23, shift: 0 },
};

/** How long each motion lasts, in seconds. */
const TINT_SECONDS = 0.6;
const UNPROJECT_SECONDS = 3.4;
const TO_VOLUME_SECONDS = 2.4;
const VOLUME_SECONDS = 1.8;
const TO_TRAJECTORY_SECONDS = 1.3;
const ARC_SECONDS = 0.9;
/** A label, an arrow, or a part of the diagram appearing. */
const FADE_SECONDS = 0.4;
const REVEAL_SECONDS = 0.35;
/** Conditioning: the inputs leave, then the stream tiles appear one after the other. */
const INPUTS_OUT_SECONDS = 0.4;
const STREAMS_IN = { start: 0.45, stagger: 0.12, seconds: 0.45 };
/** Generation: the 3D view leaves, to this share of its size; the generated video appears. */
const VIEW_OUT_SECONDS = 0.6;
const VIEW_OUT_SCALE = 0.96;
const OUTPUT_SECONDS = 0.5;
/** How long a step takes to absorb the difference between its start and what the step before was showing. */
const CATCH_UP_SECONDS = 0.8;
/** How recently another step must have drawn for the page to have come straight from it, in ms. */
const HANDOVER_MS = 1000;

/**
 * The 3D view's labels: the world point each names, where its text sits
 * from that point's place on screen (stage pixels), which side of the text
 * that position is, and whether a leader joins the two.
 */
const ANCHORS = {
  'label-point-cloud': { point: [0, -0.2, -0.84], dx: -24, dy: 48, side: 'top', leader: true },
  'label-volume': { point: [0, -0.04, -1.27], dx: 180, dy: -54, side: 'left', leader: true },
  'label-trajectory': { point: [0.6, 0, -0.16], dx: 0, dy: 14, side: 'top', leader: false },
};
/** Stage pixels a leader stops short of its text and of the point it names. */
const LEADER_GAP = { text: 6, point: 5 };

/**
 * The generation diagram, in stage pixels of the area; rows are the stream
 * tiles' centers. STAGES are the panels of its three stages, after the
 * stream tiles' panel and where the 3D view was: the encoding into tokens,
 * with the noisy target tokens; the transformer, with the target tokens it
 * denoises; the decoder and the generated video. A panel shows at its `cue`, the cue of the first part
 * it holds.
 */
const ROWS = STREAM_TOPS.map((top) => top + TILE / 2);
const MIDDLE = ROWS[1];
const TOKEN = { size: 16, gap: 4, count: 6, pitch: 24 };
const TOKEN_ROW_WIDTH = TOKEN.count * TOKEN.size + (TOKEN.count - 1) * TOKEN.gap;
/** Each stage's panel; its title sits at the upper left. */
const STAGES = {
  encoding: { cue: 'encoder', left: 212, width: 250 },
  transformer: { cue: 'transformer', left: 474, width: 294 },
  decoding: { cue: 'decoder', left: 780, width: 388 },
};
const STAGE_TITLE_TOP = TITLE_TOP;
/**
 * The middle stream's token row is level with its encoder, so its arrow is
 * straight; the other two arrows turn at `stack.bend` with corners of
 * radius `stack.corner`.
 */
const DIAGRAM = {
  encoder: { left: 228, right: 276, wide: 40, narrow: 22 },
  stack: {
    left: 332,
    bend: 298,
    corner: 8,
    tops: [-1, 0, 1].map((row) => MIDDLE + row * TOKEN.pitch - TOKEN.size / 2),
    noisyTop: MIDDLE + 2 * TOKEN.pitch - TOKEN.size / 2 + 8,
  },
  transformer: { left: 488, right: 648, top: MIDDLE - 170, bottom: MIDDLE + 170, layers: 5, layerHeight: 44, layerGap: 18 },
  denoised: { left: 700 },
  decoder: { left: 794, right: 838, wide: 40, narrow: 22 },
  output: { left: 862, size: 294 },
};
/** Each conditioning stream's color (warped RGB, MIP, MIP depth): its tokens and arrows. */
const TOKEN_COLORS = ['#e8e8e8', '#f08a24', '#8fd05a'];
/** Seconds between the parts of the diagram that one cue reveals in a row: rows, tokens, layers. */
const STAGGER = { row: 0.14, token: 0.06, layer: 0.08 };

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
    shift: mix(a.shift, b.shift, t),
  };
}

/** A fixed pseudo-random value in [0, 1) for item `i`: the gray levels of the noisy tokens. */
function noise(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * The picture at `seconds` into global step `step` (0 and 1: processing; 2:
 * conditioning; 3: generation): `scene`, what the 3D view draws (vaseScene.js
 * `draw`); `panels.left`, the left panel's width in stage pixels, after
 * which the 3D view's panel begins; and `parts`, the opacity of each named
 * part of the page. A motion
 * of an earlier step is finished; one of a later step has not begun, so
 * each step starts on the picture the step before ends on. `cues` are the
 * current step's. The moving camera is on target view `scene.targetIndex`:
 * the first until the stream video moves it, the last (`lastView`) once the
 * stream tiles are stills of that view.
 */
function pictureAt(step, seconds, cues, lastView) {
  /** Progress, 0 to 1, of a motion of step `at` that lasts `duration` from `delay` after the cue `name` (null: the step's start). */
  const motion = (at, name, duration, delay = 0) => {
    if (step !== at) return step > at ? 1 : 0;
    if (name !== null && typeof cues?.[name] !== 'number') throw new Error(`methodScene: this step needs the cue "${name}"`);
    return ramp(seconds, (name === null ? 0 : cues[name]) + delay, duration);
  };
  const tint = motion(0, 'depth', TINT_SECONDS);
  const unproject = motion(0, 'unproject', UNPROJECT_SECONDS);
  const toVolume = motion(1, 'volume', TO_VOLUME_SECONDS);
  const toTrajectory = motion(2, null, TO_TRAJECTORY_SECONDS);
  const streams = STREAM_TOPS.map((_, i) => motion(2, null, STREAMS_IN.seconds, STREAMS_IN.start + i * STREAMS_IN.stagger));
  return {
    scene: {
      ...mixView(mixView(VIEWS.cloud, VIEWS.volume, ease(toVolume)), VIEWS.trajectory, ease(toTrajectory)),
      unproject: ease(unproject),
      // The depth map shows on the image plane, and the colors return as the pixels leave it.
      depthTint: tint * (1 - ramp(unproject, 0.15, 0.55)),
      volume: ease(motion(1, 'volume', VOLUME_SECONDS)),
      trajectory: ease(motion(2, 'trajectory', ARC_SECONDS)),
      targetIndex: step === LAST_STEP ? lastView : 0,
    },
    // As the view turns, the left panel narrows from the inputs to the stream tiles, and the view widens after it.
    panels: { left: mix(LEFT_PANEL.inputs, LEFT_PANEL.streams, ease(toTrajectory)) },
    parts: {
      inputs: 1 - motion(2, null, INPUTS_OUT_SECONDS),
      direct: motion(0, 'depth', FADE_SECONDS),
      indirect: motion(1, null, FADE_SECONDS),
      'label-point-cloud': motion(0, 'unproject', FADE_SECONDS, UNPROJECT_SECONDS - FADE_SECONDS),
      'label-volume': motion(1, 'volume', FADE_SECONDS, VOLUME_SECONDS / 2),
      'label-trajectory': motion(2, 'trajectory', FADE_SECONDS, ARC_SECONDS / 2),
      ...Object.fromEntries(streams.flatMap((shown, i) => [[`stream-${i}`, shown], [`stream-veil-${i}`, 1 - shown]])),
      view: 1 - ease(motion(3, null, VIEW_OUT_SECONDS)),
      // Over the generated video: the slide's black until the panel behind it shows, then that panel's shade.
      'output-cover': 1 - motion(3, STAGES.decoding.cue, REVEAL_SECONDS),
      'output-veil': 1 - motion(3, 'output', OUTPUT_SECONDS),
    },
  };
}

/**
 * `now` with the difference between `was` and `began` added, times `left`:
 * every number of a picture, wherever all three have one.
 */
function carried(now, was, began, left) {
  if (typeof now === 'number') {
    return typeof was === 'number' && typeof began === 'number' ? now + left * (was - began) : now;
  }
  if (Array.isArray(now)) return now.map((value, i) => carried(value, was?.[i], began?.[i], left));
  return Object.fromEntries(Object.entries(now).map(([name, value]) => [name, carried(value, was?.[name], began?.[name], left)]));
}

/**
 * What the page last drew of the method's picture, in any slide of this
 * layout: `{ step, picture, at }` (`at` in ms, `performance.now()`). The
 * slide that follows begins from it.
 */
let lastDrawn = null;

/**
 * How a slide begins global step `step`: `{ step, play, from }`.
 *
 * The page moved on to it (or shows it first: a reload, the record view):
 * `play`, from the step's start; when it came straight from an earlier
 * step, `from` is the picture that step was showing, which may be short of
 * its end (a key pressed during its animation), and the new step carries
 * the difference for CATCH_UP_SECONDS instead of jumping.
 *
 * The page came back to it: not `play`, so it shows its end. That is the
 * case straight after a later step, and for the last step when the method's
 * picture was last on this step (back from the slide after these three).
 * Layouts are not told the direction of navigation; this reads it from
 * what was drawn last.
 */
function beginStep(step) {
  const last = lastDrawn;
  const straight = last !== null && performance.now() - last.at < HANDOVER_MS;
  if (straight && last.step > step) return { step, play: false, from: null };
  if (step === LAST_STEP && last?.step === LAST_STEP) return { step, play: false, from: null };
  return { step, play: true, from: straight && last.step < step ? last.picture : null };
}

/**
 * The target view (fractional between frames) the stream video shows at
 * `seconds`: frame k of the file is on screen during [k, k + 1) / fps, and
 * the file shows the first view for `lead` frames more, plays the views
 * forward, holds the last for `holdLast` frames more, and plays back.
 */
function targetViewAt(seconds, { fps, frames, lead, holdLast }) {
  const last = frames - 1;
  const position = seconds * fps - 0.5 - lead;
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

/** Set an inline style only when it changes: the clock draws on every frame, mostly the same picture. */
function setStyle(element, property, value) {
  if (element.style[property] !== value) element.style[property] = value;
}

/** The clip last given to each element: the browser rewrites the value it is given, so the style cannot be compared. */
const clips = new WeakMap();

/** Clip a panel by `inset` (the four insets of CSS `inset()`), keeping the panels' rounded corners. */
function setClip(element, inset) {
  if (clips.get(element) === inset) return;
  clips.set(element, inset);
  element.style.clipPath = `inset(${inset} round var(--radius-panel))`;
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

/**
 * A path from (x0, y0) to (x1, y1) that runs level, turns at `bend` with
 * rounded corners of `radius`, and runs level again into its end; straight
 * when the two ends are level.
 */
function elbow(x0, y0, x1, y1, bend, radius) {
  if (Math.abs(y1 - y0) < 0.5) return `M ${x0} ${y0} L ${x1} ${y1}`;
  const down = Math.sign(y1 - y0);
  const r = Math.min(radius, Math.abs(y1 - y0) / 2);
  return `M ${x0} ${y0} L ${bend - r} ${y0} Q ${bend} ${y0} ${bend} ${y0 + down * r} `
    + `L ${bend} ${y1 - down * r} Q ${bend} ${y1} ${bend + r} ${y1} L ${x1} ${y1}`;
}

/**
 * Marks an element of the generation diagram as appearing `delay` seconds
 * after the cue `cue` of its step (spread it on the element); the step
 * clock fades it in over REVEAL_SECONDS.
 */
function reveal(cue, delay = 0) {
  return { 'data-cue': cue, 'data-delay': delay };
}

/** Length of an arrowhead along its arrow, in diagram pixels. */
const ARROW_HEAD = 10;

/**
 * The arrowhead of the diagram's arrows. Its base sits at the end of the path and it extends ARROW_HEAD past
 * it, so a path that ends ARROW_HEAD before the point it shows (`arrowTo`) has its shaft stop at the head's
 * base instead of running under it to the tip.
 */
function Arrowhead({ id }) {
  return (
    <defs>
      <marker
        id={id}
        viewBox="0 0 10 10"
        refX="0"
        refY="5"
        markerWidth={ARROW_HEAD}
        markerHeight={ARROW_HEAD}
        markerUnits="userSpaceOnUse"
        orient="auto"
      >
        <path d="M 0 1 L 10 5 L 0 9 z" fill="context-stroke" />
      </marker>
    </defs>
  );
}

/** Where a rightward arrow's path ends for its head's tip to be at `x`. */
function arrowTo(x) {
  return x - ARROW_HEAD;
}

/** A row of tokens, or with `vertical` a column; with `cue`, they appear one after the other from `delay` after it. */
function TokenRow({ left, top, fill, opacities, cue, delay = 0, vertical = false }) {
  const step = TOKEN.size + TOKEN.gap;
  return Array.from({ length: TOKEN.count }, (_, i) => (
    <rect
      key={i}
      {...(cue ? reveal(cue, delay + i * STAGGER.token) : {})}
      x={vertical ? left : left + i * step}
      y={vertical ? top + i * step : top}
      width={TOKEN.size}
      height={TOKEN.size}
      rx="3"
      fill={fill}
      fillOpacity={opacities ? opacities[i] : 1}
    />
  ));
}

/**
 * The two inputs of the processing phase, in the left panel. Nothing is
 * drawn from them to the 3D view in the panel beside it: the image sits on
 * the input camera's image plane there, and its pixels move out to the
 * point cloud. Under the light video, the two parts
 * of the light are named in their colors, each when the step that uses it
 * begins. `leaving`: the inputs are a named part that the step clock fades
 * out, and the light video is its poster.
 */
function Inputs({ inputs, image, leaving }) {
  const notesTop = INPUT_TOPS[1] + INPUT + 8;
  const lightVideo = leaving
    ? { type: 'image', src: inputs.lightVideo.poster }
    : { type: 'video', src: inputs.lightVideo.src, poster: inputs.lightVideo.poster };
  return (
    <div className="method-scene-group" data-part={leaving ? 'inputs' : undefined}>
      <div className="method-scene-input-title"><Text>{inputs.title}</Text></div>
      <figure className="method-scene-tile" style={{ left: INPUT_LEFT, top: INPUT_TOPS[0], width: INPUT, height: INPUT }}>
        <figcaption className="method-scene-caption"><Text>{inputs.image.label}</Text></figcaption>
        <img className="method-scene-media" src={image} alt="" />
      </figure>
      <figure className="method-scene-tile" style={{ left: INPUT_LEFT, top: INPUT_TOPS[1], width: INPUT, height: INPUT }}>
        <figcaption className="method-scene-caption"><Text>{inputs.lightVideo.label}</Text></figcaption>
        <Media item={lightVideo} className="method-scene-media" />
      </figure>
      <span data-part="direct" className="method-scene-note method-scene-note--direct" style={{ left: INPUT_LEFT, top: notesTop, width: INPUT / 2, textAlign: 'center' }}>
        <Text>{inputs.direct}</Text>
      </span>
      <span data-part="indirect" className="method-scene-note method-scene-note--indirect" style={{ left: INPUT_LEFT + INPUT / 2, top: notesTop, width: INPUT / 2, textAlign: 'center' }}>
        <Text>{inputs.indirect}</Text>
      </span>
    </div>
  );
}

/**
 * The three stream tiles, in the left panel: the stitched file under them,
 * the panel's shade over the file's black between two tiles, and each
 * tile's veil over the file and its caption, both named parts. A tile is
 * the black square its video is drawn on, with no outline.
 * `playing`: the file is the video; otherwise it is the still of the last
 * view. `fromLast`: the video will start on its hold of the last view, so
 * that still is what shows until it has a frame.
 */
function Streams({ streams, playing, fromLast }) {
  const file = playing
    ? { type: 'video', src: streams.src, poster: fromLast ? streams.final : streams.poster }
    : { type: 'image', src: streams.final };
  return (
    <>
      <div className="method-scene-video" style={{ left: TILE_LEFT, top: STREAM_TOPS[0], width: TILE, height: STREAMS_HEIGHT }}>
        <Media item={file} className="method-scene-media method-scene-media--stitched" />
      </div>
      {STREAM_TOPS.slice(1).map((top, i) => (
        <div
          key={top}
          className="method-scene-veil"
          style={{
            left: TILE_LEFT - VEIL_MARGIN,
            top: STREAM_TOPS[i] + TILE,
            width: TILE + 2 * VEIL_MARGIN,
            height: top - STREAM_TOPS[i] - TILE,
          }}
        />
      ))}
      {streams.labels.map((label, i) => (
        <Fragment key={label}>
          <div
            data-part={`stream-veil-${i}`}
            className="method-scene-veil"
            style={{
              left: TILE_LEFT - VEIL_MARGIN,
              top: STREAM_TOPS[i] - VEIL_MARGIN,
              width: TILE + 2 * VEIL_MARGIN,
              height: TILE + 2 * VEIL_MARGIN,
            }}
          />
          <div
            data-part={`stream-${i}`}
            className="method-scene-tile method-scene-tile--stream"
            style={{ left: TILE_LEFT, top: STREAM_TOPS[i], width: TILE, height: TILE }}
          >
            <div className="method-scene-caption"><Text>{label}</Text></div>
          </div>
        </Fragment>
      ))}
    </>
  );
}

/**
 * The diagram of the generation phase, from the stream tiles to the
 * generated video (`generated`, the slide's one video, under a veil until
 * its cue, and under a second one in the slide's black until the panel
 * behind it shows), over the panels of its stages. Every part carries the
 * cue that reveals it (`reveal`). The transformer's name is as wide as the
 * transformer, on two lines.
 */
function GenerationDiagram({ generation, generated }) {
  const { encoder, stack, transformer, denoised, decoder, output } = DIAGRAM;
  const stackRight = stack.left + TOKEN_ROW_WIDTH;
  const layersHeight = transformer.layers * transformer.layerHeight + (transformer.layers - 1) * transformer.layerGap;
  const layerTop = (i) => MIDDLE - layersHeight / 2 + i * (transformer.layerHeight + transformer.layerGap);
  // The target tokens stand in a column beside the transformer, centered on the middle row.
  const denoisedRight = denoised.left + TOKEN.size;
  const speckle = (TOKEN.size - 6) / 2;
  const head = 'url(#method-scene-arrowhead)';
  const outputBox = { left: output.left, top: MIDDLE - output.size / 2, width: output.size, height: output.size };
  const transformerWidth = transformer.right - transformer.left;
  const notes = [
    { text: generation.encoder, left: (encoder.left + encoder.right) / 2, top: ROWS[0] - encoder.wide - 32, at: reveal('encoder', 0.15) },
    { text: generation.noisyTokens, left: stack.left + TOKEN_ROW_WIDTH / 2, top: stack.noisyTop + TOKEN.size + 8, at: reveal('noisy', 0.2) },
    {
      text: generation.transformer,
      left: (transformer.left + transformer.right) / 2,
      top: transformer.top - 2 * NOTE_LINE - 8,
      width: transformerWidth,
      at: reveal('transformer', 0.2),
    },
    { text: generation.lora, left: (transformer.left + transformer.right) / 2, top: transformer.bottom + 8, accent: true, at: reveal('lora', 0.1) },
    { text: generation.denoised, left: denoised.left + TOKEN.size / 2, top: MIDDLE + TOKEN_ROW_WIDTH / 2 + 8, at: reveal('denoised', 0.3) },
    { text: generation.decoder, left: (decoder.left + decoder.right) / 2, top: MIDDLE - decoder.wide - 32, at: reveal('decoder', 0.15) },
  ];
  return (
    <>
      <span {...reveal(STAGES.encoding.cue)} className="method-scene-stage-title" style={{ left: INSET, top: STAGE_TITLE_TOP }}>
        <Text>{generation.input}</Text>
      </span>
      {Object.entries(STAGES).map(([name, { cue, left, width }]) => (
        <Fragment key={name}>
          <div {...reveal(cue)} className="method-scene-panel" style={{ left, width }} />
          <span {...reveal(cue, 0.1)} className="method-scene-stage-title" style={{ left: left + INSET, top: STAGE_TITLE_TOP }}>
            <Text>{generation.stages[name]}</Text>
          </span>
        </Fragment>
      ))}
      <svg className="method-scene-diagram" viewBox={`0 0 ${AREA.width} ${AREA.height}`}>
        <Arrowhead id="method-scene-arrowhead" />
        {ROWS.map((y, i) => {
          const rowY = stack.tops[i] + TOKEN.size / 2;
          return (
            <g key={y}>
              <path
                {...reveal('encoder', i * STAGGER.row)}
                className="method-scene-flow"
                style={{ stroke: TOKEN_COLORS[i] }}
                d={`M ${TILE_LEFT + TILE + 8} ${y} L ${arrowTo(encoder.left - 3)} ${y}`}
                markerEnd={head}
              />
              <path
                {...reveal('encoder', i * STAGGER.row + 0.15)}
                className="method-scene-shape"
                d={trapezoid(encoder.left, encoder.right, y, encoder.wide, encoder.narrow)}
              />
              <path
                {...reveal('tokens', i * STAGGER.row)}
                className="method-scene-flow"
                style={{ stroke: TOKEN_COLORS[i] }}
                d={elbow(encoder.right + 4, y, arrowTo(stack.left - 6), rowY, stack.bend, stack.corner)}
                markerEnd={head}
              />
              <TokenRow left={stack.left} top={stack.tops[i]} fill={TOKEN_COLORS[i]} cue="tokens" delay={i * STAGGER.row + 0.3} />
            </g>
          );
        })}

        {/* Each noisy token, with speckles inside it, so the row reads as noise and not as a gray stream. */}
        {Array.from({ length: TOKEN.count }, (_, token) => {
          const x = stack.left + token * (TOKEN.size + TOKEN.gap);
          return (
            <g key={token} {...reveal('noisy', token * STAGGER.token)}>
              <rect x={x} y={stack.noisyTop} width={TOKEN.size} height={TOKEN.size} rx="3" fill="#ffffff" fillOpacity={0.22 + 0.6 * noise(token)} />
              {Array.from({ length: 4 }, (_, k) => {
                const i = 4 * token + k;
                return (
                  <rect
                    key={k}
                    x={x + 2 + (i % 2) * (speckle + 2)}
                    y={stack.noisyTop + 2 + (Math.floor(i / 2) % 2) * (speckle + 2)}
                    width={speckle}
                    height={speckle}
                    fill={noise(i + 40) > 0.5 ? '#ffffff' : '#000000'}
                    fillOpacity={0.25 + 0.5 * noise(i + 90)}
                  />
                );
              })}
            </g>
          );
        })}

        <path
          {...reveal('transformer')}
          className="method-scene-flow"
          d={`M ${stackRight + 10} ${MIDDLE} L ${arrowTo(transformer.left - 5)} ${MIDDLE}`}
          markerEnd={head}
        />
        <rect
          {...reveal('transformer', 0.2)}
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
              {...reveal('transformer', 0.35 + i * STAGGER.layer)}
              className="method-scene-layer"
              x={transformer.left + 14}
              y={layerTop(i)}
              width={transformer.right - transformer.left - 28}
              height={transformer.layerHeight}
              rx="5"
            />
            <rect
              {...reveal('lora', i * STAGGER.layer)}
              className="method-scene-lora"
              x={transformer.right - 14 - 22}
              y={layerTop(i) + 6}
              width="16"
              height={transformer.layerHeight - 12}
              rx="3"
            />
          </g>
        ))}

        <path
          {...reveal('denoised')}
          className="method-scene-flow"
          d={`M ${transformer.right + 8} ${MIDDLE} L ${arrowTo(denoised.left - 7)} ${MIDDLE}`}
          markerEnd={head}
        />
        <TokenRow left={denoised.left} top={MIDDLE - TOKEN_ROW_WIDTH / 2} fill="var(--accent)" cue="denoised" delay={0.2} vertical />
        <path
          {...reveal('decoder')}
          className="method-scene-flow"
          d={`M ${denoisedRight + 8} ${MIDDLE} L ${arrowTo(decoder.left - 3)} ${MIDDLE}`}
          markerEnd={head}
        />
        <path
          {...reveal('decoder', 0.15)}
          className="method-scene-shape"
          d={trapezoid(decoder.left, decoder.right, MIDDLE, decoder.narrow, decoder.wide)}
        />
        <path
          {...reveal('output')}
          className="method-scene-flow"
          d={`M ${decoder.right + 4} ${MIDDLE} L ${arrowTo(output.left - 5)} ${MIDDLE}`}
          markerEnd={head}
        />
      </svg>
      {notes.map(({ text, left, top, width, accent, at }) => (
        <span
          key={text}
          {...at}
          className={[
            'method-scene-note method-scene-note--centered',
            width ? 'method-scene-note--wrapped' : '',
            accent ? 'method-scene-note--accent' : '',
          ].join(' ')}
          style={{ left, top, width }}
        >
          <Text>{text}</Text>
        </span>
      ))}

      <div className="method-scene-video" style={outputBox}>
        <Media item={{ type: 'video', src: generated.src, poster: generated.poster }} className="method-scene-media" />
      </div>
      {['output-veil', 'output-cover'].map((part) => (
        <div
          key={part}
          data-part={part}
          className={`method-scene-veil${part === 'output-cover' ? ' method-scene-veil--slide' : ''}`}
          style={{
            left: outputBox.left - VEIL_MARGIN,
            top: outputBox.top - VEIL_MARGIN,
            width: outputBox.width + 2 * VEIL_MARGIN,
            height: outputBox.height + 2 * VEIL_MARGIN,
          }}
        />
      ))}
      <div className="method-scene-tile" style={outputBox}>
        <div {...reveal('output')} className="method-scene-caption method-scene-caption--ours"><Text>{generation.output}</Text></div>
      </div>
    </>
  );
}

export default function MethodScene({ slide, buildStep }) {
  const { scene, labels, inputs, streams, generated, generation } = slide;
  const phase = PHASES[slide.phase];
  if (!phase) throw new Error(`Slide "${slide.id}": methodScene needs "phase": ${Object.keys(PHASES).join(', ')}`);
  const needed = {
    processing: ['scene', 'cues', 'labels', 'inputs'],
    conditioning: ['scene', 'cues', 'labels', 'inputs', 'streams'],
    generation: ['scene', 'cues', 'labels', 'streams', 'generated', 'generation'],
  }[slide.phase];
  for (const field of needed) {
    if (!slide[field]) throw new Error(`Slide "${slide.id}": the ${slide.phase} phase needs "${field}"`);
  }
  if (slide.phase === 'generation' && Object.keys(STAGES).some((name) => typeof generation.stages?.[name] !== 'string')) {
    throw new Error(`Slide "${slide.id}": "generation.stages" needs a title for each of ${Object.keys(STAGES).join(', ')}`);
  }
  if (slide.phase === 'generation' && typeof generation.input !== 'string') {
    throw new Error(`Slide "${slide.id}": "generation.input" needs the stream tiles' title`);
  }
  if ((slide.buildSteps?.length ?? 1) !== phase.steps || slide.cues.length !== phase.steps) {
    throw new Error(`Slide "${slide.id}": the ${slide.phase} phase has ${phase.steps} build steps, each with its cues`);
  }
  // The generation phase shows the 3D view only while it leaves: it takes one when a frame first needs it.
  const [viewNeeded, setViewNeeded] = useState(slide.phase !== 'generation');
  const playing = slide.phase === 'conditioning';

  const step = phase.first + buildStep;
  const [begun, setBegun] = useState(() => beginStep(step));
  let timeline = begun;
  if (begun.step !== step) {
    timeline = beginStep(step);
    setBegun(timeline);
  }

  // The area has a fixed size in stage pixels, so it measures the stage's scale as a canvas would.
  const [areaRef, ratio] = useStageCanvas();
  const leftPanelRef = useRef(null);
  const viewRef = useRef(null);
  const canvasHolder = useRef(null);
  const imageRef = useRef(null);
  const depthRef = useRef(null);
  const volumeRef = useRef(null);
  const sceneView = useRef(null);
  const parts = useRef(new Map());
  const reveals = useRef([]);
  /** The timeline last drawn and the clock's time in it, to draw again between the clock's frames. */
  const drawn = useRef({ timeline: null, ms: 0 });
  const [measured, setMeasured] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const onDataLoad = () => setDataLoaded([imageRef, depthRef, volumeRef].every((image) => loaded(image.current)));
  const sceneKey = [scene.image, scene.camera.depth, scene.volume.src].join(' ');

  const draw = (ms) => {
    drawn.current = { timeline, ms };
    const cues = slide.cues[buildStep];
    const lastView = scene.trajectory.frames - 1;
    const seconds = (timeline.play ? ms : SETTLED_MS) / 1000;
    let picture = pictureAt(step, seconds, cues, lastView);
    if (timeline.from) {
      const left = 1 - ease(ramp(seconds, 0, CATCH_UP_SECONDS));
      if (left > 0) picture = carried(picture, timeline.from, pictureAt(step, 0, cues, lastView), left);
    }
    const video = playing ? areaRef.current.querySelector('video') : null;
    if (video) picture.scene.targetIndex = targetViewAt(video.currentTime, streams);
    lastDrawn = { step, picture, at: performance.now() };

    // The left panel is as wide as the picture says, and the 3D view's panel begins GAP after it.
    setClip(leftPanelRef.current, `0 ${LEFT_PANEL.inputs - picture.panels.left}px 0 0`);
    setClip(viewRef.current, `0 0 0 ${picture.panels.left + GAP - VIEW.left}px`);

    for (const [name, elements] of parts.current) {
      if (picture.parts[name] === undefined) throw new Error(`methodScene: no part named "${name}"`);
      for (const element of elements) setStyle(element, 'opacity', String(picture.parts[name]));
    }
    for (const { element, cue, delay } of reveals.current) {
      if (typeof cues[cue] !== 'number') throw new Error(`methodScene: this step needs the cue "${cue}"`);
      setStyle(element, 'opacity', String(ramp(seconds, cues[cue] + delay, REVEAL_SECONDS)));
    }

    // The 3D view and its labels show once there is a view to place them. It leaves by fading
    // and by receding a little; once gone, it is not drawn.
    const view = sceneView.current;
    const showing = picture.parts.view > 0;
    if (showing && !viewNeeded) setViewNeeded(true);
    setStyle(viewRef.current, 'visibility', showing && view ? 'visible' : 'hidden');
    if (!showing || !view) return;
    setStyle(viewRef.current, 'transform', `scale(${mix(VIEW_OUT_SCALE, 1, picture.parts.view)})`);
    view.draw(picture.scene);

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

  // The named parts of the page and the diagram's marked parts, found again after every render and before any draw.
  useLayoutEffect(() => {
    const found = new Map();
    for (const element of areaRef.current.querySelectorAll('[data-part]')) {
      found.set(element.dataset.part, [...(found.get(element.dataset.part) ?? []), element]);
    }
    parts.current = found;
    reveals.current = [...areaRef.current.querySelectorAll('[data-cue]')].map((element) => (
      { element, cue: element.dataset.cue, delay: Number(element.dataset.delay) }
    ));
  });

  // The 3D view: the one the slide before gave back, or a new one once the three data images have loaded.
  useLayoutEffect(() => {
    onDataLoad();
    setMeasured(true);
  }, []);
  useLayoutEffect(() => {
    if (!viewNeeded || !(dataLoaded || hasParkedVaseScene(sceneKey))) return undefined;
    const view = acquireVaseScene(sceneKey, canvasHolder.current, () => {
      const [image, depth, volume] = [imageRef.current, depthRef.current, volumeRef.current];
      const background = getComputedStyle(canvasHolder.current).getPropertyValue('--bg-panel').trim();
      if (!background) throw new Error('methodScene: the theme does not define --bg-panel');
      return createVaseScene({
        scene,
        background,
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
  }, [viewNeeded, dataLoaded, sceneKey, scene, canvasHolder]);

  // Sized to the stage's scale once that is measured: until then a view from the slide before keeps its size.
  useLayoutEffect(() => {
    if (measured) sceneView.current?.resize(VIEW.width, VIEW.height, ratio);
  });

  // Drawn after every render and before the page is painted, so that no frame shows a part
  // unplaced: a new step from its start (a still frame from its end), otherwise the time last drawn.
  useLayoutEffect(() => {
    const first = stillFrames() ? SETTLED_MS : 0;
    drawRef.current(drawn.current.timeline === timeline ? drawn.current.ms : first);
  });

  useStepClock(buildStep, draw);

  // Without a running clock (a still frame, the record view) the video's own moves redraw the picture.
  useEffect(() => {
    const video = playing ? areaRef.current.querySelector('video') : null;
    if (!video) return undefined;
    const events = ['loadeddata', 'seeked', 'pause', 'timeupdate'];
    const redraw = () => drawRef.current(drawn.current.ms);
    for (const name of events) video.addEventListener(name, redraw);
    return () => {
      for (const name of events) video.removeEventListener(name, redraw);
    };
  }, [playing]);

  useStillVideo(areaRef, (generated ?? (playing ? streams : inputs.lightVideo)).stillSeconds);

  // Back from the generation slide, whose stream tiles are stills of the last view, the video
  // starts on its hold of that view: the tiles go on from what they showed.
  const [fromLast] = useState(() => playing && !timeline.play && !stillFrames());
  useLayoutEffect(() => {
    if (fromLast) areaRef.current.querySelector('video').currentTime = (streams.lead + streams.frames - 0.5) / streams.fps;
  }, []);

  return (
    <div className="slide--method-scene">
      <header className="slide-header method-overview" aria-label="Method stages">
        {METHOD_STAGES.map(({ phase, label }) => (
          <h2 key={phase} className="method-overview-stage" aria-current={slide.phase === phase ? 'step' : undefined}>
            <Text>{label}</Text>
          </h2>
        ))}
      </header>
      <div className="method-scene" ref={areaRef} style={{ width: AREA.width, height: AREA.height }}>
        <img ref={imageRef} className="method-scene-data" src={scene.image} alt="" onLoad={onDataLoad} />
        <img ref={depthRef} className="method-scene-data" src={scene.camera.depth} alt="" onLoad={onDataLoad} />
        <img ref={volumeRef} className="method-scene-data" src={scene.volume.src} alt="" onLoad={onDataLoad} />
        <div ref={leftPanelRef} className="method-scene-panel" style={{ left: 0, width: LEFT_PANEL.inputs }} />
        <div
          ref={viewRef}
          data-part="view"
          className={`method-scene-view${slide.phase === 'generation' ? ' method-scene-view--leaving' : ''}`}
          style={VIEW}
        >
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
        {streams && <Streams streams={streams} playing={playing} fromLast={fromLast} />}
        {/* After the stream tiles: the inputs leave over the veils of the tiles that take their place. */}
        {slide.phase !== 'generation' && <Inputs inputs={inputs} image={scene.image} leaving={playing} />}
        {generation && <GenerationDiagram generation={generation} generated={generated} />}
      </div>
    </div>
  );
}
