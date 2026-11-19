import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { mediaUrl, whenIdle } from '@core/presentation/preload.js';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useStageCanvas } from '@core/stage/canvas.js';
import { useStepClock } from '@core/stage/playback.js';
import {
  BUNNY, RELAYS, ROOM, SCAN_COLUMNS, SCAN_ROWS, TEAPOT, VIEW,
  bunnyGeometry, lidarPoint, lightVideoRows, measureIndirect, pulse, viewPixel, viewScanOrder,
} from './cornerScene.js';
import { acquireLidarRender, prepareLidarRender, releaseLidarRender } from './lidarRender.js';
import { PLOT_END, STEPS, frameAt, settledAt } from './timeline.js';
import './LidarCapture.css';

/** The labels a slide must give, by key. */
const LABEL_KEYS = ['laser', 'mirrors', 'detector', 'relays', 'occluder', 'hidden', 'video', 'direct', 'indirect', 'flight', 'time', 'counts'];

/**
 * Labels of the render: the world point (m) each is placed by, and where
 * its text goes from the point's place on the stage (`side`: the text
 * ends left of it, starts right of it, or is centered above or below it;
 * `shift`: stage pixels added to that).
 */
const SCENE_LABELS = [
  { key: 'relays', point: [0, ROOM.height - 0.1, ROOM.size], side: 'left', shift: [-18, 0] },
  { key: 'hidden', point: [BUNNY.position[0], BUNNY.height, BUNNY.position[2]], side: 'above', shift: [6, -10] },
  { key: 'occluder', point: [TEAPOT.position[0] + 0.12, 0, TEAPOT.position[2] + 0.02], side: 'below', shift: [0, 2] },
  { key: 'laser', point: lidarPoint([-0.315, 0.11, -0.15]), side: 'left', shift: [-16, -6] },
  { key: 'mirrors', point: lidarPoint([0.24, 0.11, -0.13]), side: 'right', shift: [22, 14] },
  { key: 'detector', point: lidarPoint([-0.09, 0.11, 0.16]), side: 'left', shift: [-22, 12] },
];

/* ---------------------------------------------------------------------------
 * The measurement plot.
 * ------------------------------------------------------------------------ */

/** The plot, in stage pixels: its box, the margins of its axes, and the largest value of its vertical axis (the first direct peak = 1). */
const PLOT = { width: 352, height: 256, left: 6, right: 12, top: 44, bottom: 48, valueMax: 1.1 };
const TICKS = [0, 5, 10, 15, 20];
/**
 * The height of the first measurement's indirect peak in the plot, as a
 * fraction of its direct peak. Indirect light is weaker than that by orders
 * of magnitude; the plot shows when it arrives and for how long, not how
 * much there is.
 */
const INDIRECT_LEVEL = 0.3;
/**
 * How the other measurements' peaks compare with the first one's: by their
 * strengths' ratio to these powers. The ratios span orders of magnitude,
 * and the plot keeps only which is larger.
 */
const DIRECT_COMPRESSION = 0.35;
const INDIRECT_COMPRESSION = 0.1;
/** Where the time of flight is marked, as a value of the vertical axis. */
const FLIGHT_VALUE = 0.46;
/** Sampling of the plot's traces, in ns. */
const TRACE_STEP = 0.02;

const plotX = (t) => PLOT.left + (t / PLOT_END) * (PLOT.width - PLOT.left - PLOT.right);
/** The trace's zero sits a few pixels above the axis line, so the axis stays visible under it. */
const plotY = (v) => PLOT.height - PLOT.bottom - 3 - (v / PLOT.valueMax) * (PLOT.height - PLOT.bottom - PLOT.top - 3);

/** The heights of the direct peak of each of `RELAYS` in the plot. */
const DIRECT_LEVELS = RELAYS.map((relay) => (relay.strength / RELAYS[0].strength) ** DIRECT_COMPRESSION);

function tracePath(ctx, value, from, to) {
  ctx.beginPath();
  ctx.moveTo(plotX(from), plotY(value(from)));
  for (let t = from + TRACE_STEP; t < to; t += TRACE_STEP) ctx.lineTo(plotX(t), plotY(value(t)));
  ctx.lineTo(plotX(to), plotY(value(to)));
}

/** Stroke `value` over [from, to] (ns) in `color`, with a soft fill under it. */
function drawTrace(ctx, value, from, to, color) {
  if (to <= from) return;
  ctx.save();
  tracePath(ctx, value, from, to);
  ctx.lineTo(plotX(to), plotY(0));
  ctx.lineTo(plotX(from), plotY(0));
  ctx.closePath();
  ctx.globalAlpha *= 0.2;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha /= 0.2;
  tracePath(ctx, value, from, to);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.25;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

/**
 * The plot at one frame: the axes, and the measurement at each point as
 * far as its sweep: the direct return, and after it the indirect light of
 * `transients` (cornerScene.js's `measureIndirect` for each of `RELAYS`, or
 * null before the hidden object is known); the sweep's cursor; and the
 * mark of the first measurement's time of flight.
 */
function drawPlot(ctx, plot, colors, transients) {
  ctx.clearRect(0, 0, PLOT.width, PLOT.height);
  if (plot.opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = plot.opacity;
  const axisY = PLOT.height - PLOT.bottom;
  const right = PLOT.width - PLOT.right;
  ctx.strokeStyle = colors.axis;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(PLOT.left, PLOT.top - 8);
  ctx.lineTo(PLOT.left, axisY);
  ctx.lineTo(right + 6, axisY);
  for (const t of TICKS) {
    ctx.moveTo(plotX(t), axisY);
    ctx.lineTo(plotX(t), axisY + 6);
  }
  ctx.stroke();

  plot.traces.forEach(({ sweep, level }, k) => {
    const { direct } = RELAYS[k];
    const transient = transients?.[k] ?? null;
    ctx.globalAlpha = plot.opacity * level;
    // The direct return: flat until the pulse arrives.
    drawTrace(ctx, (t) => DIRECT_LEVELS[k] * pulse(t - direct), 0, Math.min(sweep, transient ? direct + transient.span[0] : sweep), colors.direct);
    if (!transient) return;
    const [from, to] = transient.span.map((delay) => direct + delay);
    const indirectLevel = INDIRECT_LEVEL * (transient.strength / transients[0].strength) ** INDIRECT_COMPRESSION;
    drawTrace(ctx, (t) => indirectLevel * transient.at(t - direct), from, Math.min(sweep, to), colors.indirect);
    // After the indirect light, the trace is flat again.
    drawTrace(ctx, () => 0, to, sweep, colors.direct);
  });

  if (plot.flight > 0) {
    // The time of flight: from the moment the pulse leaves to the direct peak, drawn from the left.
    const [from, to] = [plotX(0) + 4, plotX(RELAYS[0].direct) - 7];
    const end = from + (to - from) * plot.flight;
    const y = plotY(FLIGHT_VALUE);
    ctx.globalAlpha = plot.opacity * Math.min(1, 4 * plot.flight);
    ctx.strokeStyle = colors.cursor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(from, y - 6);
    ctx.lineTo(from, y + 6);
    ctx.moveTo(from, y);
    ctx.lineTo(end, y);
    ctx.moveTo(end, y - 6);
    ctx.lineTo(end, y + 6);
    ctx.stroke();
  }

  if (plot.cursor.opacity > 0) {
    const x = plotX(Math.min(plot.cursor.at, PLOT_END));
    ctx.globalAlpha = plot.opacity * plot.cursor.opacity * 0.6;
    ctx.strokeStyle = colors.cursor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, PLOT.top - 8);
    ctx.lineTo(x, axisY);
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------------------------------------------------------------------------
 * The video of propagating light.
 * ------------------------------------------------------------------------ */

/** The video's size on the stage, in pixels: a whole number of them for each step of the scan's grid. */
const SCAN_CELL = 32;
const VIDEO = { width: SCAN_COLUMNS * SCAN_CELL, height: SCAN_ROWS * SCAN_CELL };
/** How bright the video's still image is under its light: the direct light of every pixel at once, dimmed. */
const STILL_LEVEL = 0.34;
/** Radius of the ring that marks the measured point in the video, in stage pixels. */
const MARKER_RADIUS = 7;

/** The scan's order of each of the video's pixels (`viewScanOrder`): worked out once. */
const PIXEL_ORDER = new Uint16Array(VIEW.columns * VIEW.rows);
for (let row = 0; row < VIEW.rows; row++) {
  for (let column = 0; column < VIEW.columns; column++) PIXEL_ORDER[row * VIEW.columns + column] = viewScanOrder(column, row);
}

/** The red, green, and blue bytes of a CSS color. */
function colorBytes(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return ctx.getImageData(0, 0, 1, 1).data.slice(0, 3);
}

/**
 * A drawer of the video of propagating light (cornerScene.js's
 * `lightVideoRows`) into canvases of the size of `VIDEO`:
 * `draw(ctx, video, state)` draws the frame of `state` (the `video` of a
 * frame of timeline.js). Each pixel shows the still image, dimmed, and over
 * it the direct light (in `colors.direct`) and the indirect light
 * (`colors.indirect`) at the state's time. While the scan fills the video,
 * a pixel shows from the moment the beam passes its block, with a flash.
 */
function createVideoDrawer(colors) {
  const buffer = document.createElement('canvas');
  buffer.width = VIEW.columns;
  buffer.height = VIEW.rows;
  const bufferCtx = buffer.getContext('2d');
  const image = bufferCtx.createImageData(VIEW.columns, VIEW.rows);
  const direct = colorBytes(colors.direct);
  const indirect = colorBytes(colors.indirect);
  for (let pixel = 0; pixel < VIEW.columns * VIEW.rows; pixel++) image.data[4 * pixel + 3] = 255;

  return {
    draw(ctx, video, state) {
      const passed = state.reveal === null ? Infinity : state.reveal >= 1 ? Infinity : state.reveal * SCAN_COLUMNS * SCAN_ROWS;
      const scanning = Number.isFinite(passed);
      for (let pixel = 0; pixel < VIEW.columns * VIEW.rows; pixel++) {
        const since = passed - PIXEL_ORDER[pixel] - 0.5;
        const shown = since >= 0 ? 1 : 1 - state.blank;
        const flash = scanning && since >= 0 ? Math.exp(-since / 2.5) : 0;
        const still = STILL_LEVEL * video.shade[pixel] * shown * (1 + 2.5 * flash);
        const delay = state.time - video.direct[pixel];
        const lit = state.light > 0 && Number.isFinite(delay);
        const white = still + (lit ? state.light * pulse(delay) * (0.4 + 0.6 * video.shade[pixel]) : 0);
        const amber = lit ? state.light * video.indirectAt(pixel, delay) : 0;
        image.data[4 * pixel] = Math.min(255, white * direct[0] + amber * indirect[0]);
        image.data[4 * pixel + 1] = Math.min(255, white * direct[1] + amber * indirect[1]);
        image.data[4 * pixel + 2] = Math.min(255, white * direct[2] + amber * indirect[2]);
      }
      bufferCtx.putImageData(image, 0, 0);
      // Each pixel of the video is a sharp square, as a capture's are: one direction of the beam.
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 1;
      ctx.drawImage(buffer, 0, 0, VIDEO.width, VIDEO.height);

      if (state.marker.opacity > 0) {
        // The measured point: one pixel of the video.
        const [x, y] = viewPixel(RELAYS[state.marker.relay].point);
        ctx.globalAlpha = state.marker.opacity;
        ctx.strokeStyle = colors.cursor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc((x / VIEW.columns) * VIDEO.width, (y / VIEW.rows) * VIDEO.height, MARKER_RADIUS, 0, 2 * Math.PI);
        ctx.stroke();
      }
    },
  };
}

/* ---------------------------------------------------------------------------
 * The hidden object.
 * ------------------------------------------------------------------------ */

/** RGBA bytes of a loaded image. */
function imagePixels(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
}

/**
 * What follows from the hidden object's mesh image, in parts (a generator
 * that yields between them and returns the whole): its surface, the
 * indirect light it returns to each of `RELAYS`, and the scene's video of
 * propagating light.
 */
function* hiddenObjectParts(image) {
  const geometry = bunnyGeometry(imagePixels(image));
  yield;
  const transients = [];
  for (const relay of RELAYS) {
    transients.push(measureIndirect(geometry, relay));
    yield;
  }
  const video = yield* lightVideoRows(geometry);
  return { geometry, transients, video };
}

/**
 * The hidden object of each mesh image, by the image's path in the slide:
 * `value` once it is worked out, and `parts`, the work in progress. It
 * follows from the image alone, so it is worked out once for the page,
 * ahead of the slide in parts (`prepare`) or at once when a slide needs it.
 */
const hiddenObjects = new Map();

function hiddenObjectEntry(meshPath, image) {
  if (!hiddenObjects.has(meshPath)) hiddenObjects.set(meshPath, { parts: hiddenObjectParts(image), value: null });
  return hiddenObjects.get(meshPath);
}

/** Work out one more part of a hidden object; true once it is complete. */
function workOn(entry) {
  if (entry.value) return true;
  const part = entry.parts.next();
  if (part.done) entry.value = part.value;
  return part.done;
}

function hiddenObjectOf(meshPath, image) {
  const entry = hiddenObjectEntry(meshPath, image);
  while (!workOn(entry));
  return entry.value;
}

/** The longest the page works on a hidden object before it lets the browser handle input, in ms. */
const PREPARE_SLICE_MS = 6;

/* ---------------------------------------------------------------------------
 * The layout.
 * ------------------------------------------------------------------------ */

/**
 * Lidar capture: a three.js render of the website's corner scene (two
 * relay walls, the teapot occluder, the bunny hidden behind it) and of a
 * confocal lidar on a breadboard in front of it; beside them, the scene's
 * video of propagating light as the lidar captures it, and a plot of the
 * measurement at one visible point. Four build steps (timeline.js): the
 * video plays; one measurement, from the pulse leaving the laser to the
 * indirect light's return, sweeps the plot once; the measurements at three
 * other visible points follow, each with its own wavefronts and its own
 * peaks; the laser scans, a dot marks each point it visits, and the video
 * fills in the scan's order and plays. The light moves at one playback
 * speed, and every time shown follows from the scene's distances
 * (c = 0.3 m/ns).
 *
 * A step that is reached going backward (from a later step, or from the
 * next slide) shows its settled frame.
 *
 * Fields:
 *   title         the slide's title.
 *   hiddenObject  { mesh }: the bunny's mesh, packed into an image (the
 *                 capture and record views wait for images; the format is
 *                 documented in the slide's sources, make-bunny-mesh.mjs).
 *   labels        { laser, mirrors, detector, relays, occluder, hidden }
 *                 beside the parts of the render, { video } over the video,
 *                 and { direct, indirect, flight, time, counts } on the
 *                 plot (`flight` names the time of flight).
 *   buildSteps    four.
 */
export default function LidarCapture({ slide, buildStep }) {
  const missing = LABEL_KEYS.filter((key) => typeof slide.labels?.[key] !== 'string');
  if (missing.length) throw new Error(`lidarCapture: slide "${slide.id}" needs labels.${missing.join(', labels.')}`);
  if (typeof slide.hiddenObject?.mesh !== 'string') throw new Error(`lidarCapture: slide "${slide.id}" needs hiddenObject.mesh`);
  if (slide.buildSteps?.length !== STEPS.length) {
    throw new Error(`lidarCapture: slide "${slide.id}" needs ${STEPS.length} build steps (${STEPS.join(', ')})`);
  }

  const [hostRef, ratio] = useStageCanvas();
  const meshRef = useRef(null);
  const videoRef = useRef(null);
  const plotRef = useRef(null);
  const labelRefs = useRef({});
  const partRefs = useRef({});
  const [view, setView] = useState(null);
  // The render while it can be drawn: React detaches the layout's elements, and this effect's
  // cleanup gives the render back, before the step clock stops, and a frame may fall in between.
  const liveRender = useRef(null);
  const meshPath = slide.hiddenObject.mesh;
  const [hiddenObject, setHiddenObject] = useState(() => hiddenObjects.get(meshPath)?.value ?? null);

  // Whether the step is shown settled: it was reached from a later step, or the slide from the one after it.
  const arrival = useRef({ step: null, settled: false });
  if (arrival.current.step !== buildStep) {
    const from = arrival.current.step;
    arrival.current = { step: buildStep, settled: from === null ? buildStep > 0 : buildStep < from };
  }
  const startMs = arrival.current.settled ? settledAt(buildStep) : 0;

  // The render: the page's, with its canvas placed on this slide for as long as the slide is shown.
  useLayoutEffect(() => {
    const host = hostRef.current;
    const style = getComputedStyle(host);
    const token = (name) => style.getPropertyValue(name).trim();
    const colors = {
      direct: token('--direct'),
      indirect: token('--indirect'),
      scan: token('--lidar-capture-scan'),
      axis: token('--text-secondary'),
      cursor: token('--text-primary'),
    };
    const render = acquireLidarRender();
    render.setColors(colors);
    render.canvas.className = 'lidar-capture-canvas';
    host.appendChild(render.canvas);
    liveRender.current = render;
    setView({ render, colors, videoDrawer: createVideoDrawer(colors), width: host.offsetWidth, height: host.offsetHeight });
    return () => {
      liveRender.current = null;
      render.canvas.remove();
      releaseLidarRender(render);
    };
  }, [hostRef]);

  // In the commit that places the render, so the first frame drawn has the hidden object when it is known.
  useLayoutEffect(() => {
    if (view && hiddenObject && !view.render.hasHiddenObject()) view.render.setHiddenObject(hiddenObject);
  }, [view, hiddenObject]);
  const hiddenShown = Boolean(view && hiddenObject);

  // The image may have loaded before React listened for it.
  useEffect(() => {
    const image = meshRef.current;
    if (image.complete && image.naturalWidth > 0) setHiddenObject(hiddenObjectOf(meshPath, image));
  }, [meshPath]);

  useStepClock(buildStep, (ms) => {
    if (!view || liveRender.current !== view.render) return;
    const { render, colors, videoDrawer } = view;
    const frame = frameAt(buildStep, startMs + ms);
    render.setSize(view.width, view.height, ratio);
    render.draw(frame);

    for (const { key, point, shift } of SCENE_LABELS) {
      const [x, y] = render.project(point);
      labelRefs.current[key].style.transform = `translate(${(x + shift[0]).toFixed(1)}px, ${(y + shift[1]).toFixed(1)}px)`;
    }

    const parts = partRefs.current;
    const videoCtx = videoRef.current.getContext('2d');
    videoCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (hiddenObject) videoDrawer.draw(videoCtx, hiddenObject.video, frame.video);
    parts.video.style.opacity = hiddenObject ? 1 : 0;

    const transients = hiddenObject?.transients ?? null;
    const plotCtx = plotRef.current.getContext('2d');
    plotCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawPlot(plotCtx, frame.plot, colors, transients);
    parts.plot.style.opacity = frame.plot.opacity;
    parts.direct.style.opacity = frame.plot.direct;
    parts.indirect.style.opacity = transients ? frame.plot.indirect : 0;
    parts.flight.style.opacity = frame.plot.flight;
    if (transients) parts.indirect.style.left = `${plotX(RELAYS[0].direct + transients[0].peakDelay)}px`;
  }, { still: settledAt(buildStep), until: arrival.current.settled ? 0 : settledAt(buildStep) });

  const part = (name) => (element) => { partRefs.current[name] = element; };
  return (
    <div className="lidar-capture">
      <SlideTitle title={slide.title} />
      <div className="lidar-capture-figure" data-hidden-object={hiddenShown ? 'shown' : 'loading'}>
        <div className="lidar-capture-render" ref={hostRef} />
        <img
          className="lidar-capture-mesh"
          src={mediaUrl(meshPath)}
          alt=""
          ref={meshRef}
          onLoad={(event) => setHiddenObject(hiddenObjectOf(meshPath, event.currentTarget))}
        />
        {SCENE_LABELS.map(({ key, side }) => (
          <div key={key} className={`lidar-capture-label lidar-capture-label--${side}`} ref={(element) => { labelRefs.current[key] = element; }}>
            <span><Text>{slide.labels[key]}</Text></span>
          </div>
        ))}
        <div className="lidar-capture-parts">
          <div className="lidar-capture-part lidar-capture-video" ref={part('video')}>
            <span className="lidar-capture-part-label"><Text>{slide.labels.video}</Text></span>
            <canvas
              ref={videoRef}
              style={{ width: VIDEO.width, height: VIDEO.height }}
              width={Math.round(VIDEO.width * ratio)}
              height={Math.round(VIDEO.height * ratio)}
            />
          </div>
          <div className="lidar-capture-part lidar-capture-plot" ref={part('plot')}>
            <div className="lidar-capture-plot-box" style={{ width: PLOT.width, height: PLOT.height }}>
              <canvas ref={plotRef} width={Math.round(PLOT.width * ratio)} height={Math.round(PLOT.height * ratio)} />
              <span className="lidar-capture-plot-label" style={{ left: PLOT.left - 2, top: 0 }}><Text>{slide.labels.counts}</Text></span>
              {TICKS.map((t) => (
                <span key={t} className="lidar-capture-plot-tick" style={{ left: plotX(t), top: PLOT.height - PLOT.bottom + 9 }}>{t}</span>
              ))}
              <span className="lidar-capture-plot-label lidar-capture-plot-label--time" style={{ top: PLOT.height - PLOT.bottom + 29 }}><Text>{slide.labels.time}</Text></span>
              <span
                className="lidar-capture-plot-mark lidar-capture-plot-mark--direct"
                style={{ left: plotX(RELAYS[0].direct), top: plotY(1) - 30 }}
                ref={part('direct')}
              >
                <Text>{slide.labels.direct}</Text>
              </span>
              <span
                className="lidar-capture-plot-mark lidar-capture-plot-mark--indirect"
                style={{ top: plotY(INDIRECT_LEVEL) - 40 }}
                ref={part('indirect')}
              >
                <Text>{slide.labels.indirect}</Text>
              </span>
              <span
                className="lidar-capture-plot-mark"
                style={{ left: plotX(RELAYS[0].direct / 2), top: plotY(FLIGHT_VALUE) - 34 }}
                ref={part('flight')}
              >
                <Text>{slide.labels.flight}</Text>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Ahead of the slide (the audience view calls it while the page is idle):
 * the hidden object from its mesh image, a few milliseconds at a time, and
 * the page's render with its shaders compiled and each step's settled
 * frame drawn once.
 */
LidarCapture.prepare = async (slide) => {
  const meshPath = slide.hiddenObject.mesh;
  const image = new Image();
  image.src = mediaUrl(meshPath);
  await image.decode();
  await whenIdle();
  const entry = hiddenObjectEntry(meshPath, image);
  let sliceStart = performance.now();
  while (!workOn(entry)) {
    if (performance.now() - sliceStart < PREPARE_SLICE_MS) continue;
    await whenIdle();
    sliceStart = performance.now();
  }
  await whenIdle();
  await prepareLidarRender(entry.value, STEPS.map((_, step) => frameAt(step, settledAt(step))), whenIdle);
};
