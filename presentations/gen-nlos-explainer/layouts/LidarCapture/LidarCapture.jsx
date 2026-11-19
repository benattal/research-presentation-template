import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { mediaUrl, whenIdle } from '@core/presentation/preload.js';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useStageCanvas } from '@core/stage/canvas.js';
import { useStepClock } from '@core/stage/playback.js';
import { BUNNY, ROOM, TEAPOT, TIMES, bunnyGeometry, lidarPoint, measureIndirect, pulse } from './cornerScene.js';
import { acquireLidarRender, prepareLidarRender, releaseLidarRender } from './lidarRender.js';
import { PLOT_END, STEPS, frameAt, settledAt, stillAt } from './timeline.js';
import './LidarCapture.css';

/** The labels a slide must give, by key. */
const LABEL_KEYS = ['laser', 'mirrors', 'detector', 'relays', 'occluder', 'hidden', 'direct', 'indirect', 'time', 'counts'];

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

/** The measurement plot, in stage pixels: its box, the margins of its axes, and the largest value of its vertical axis (direct peak = 1). */
const PLOT = { width: 430, height: 264, left: 16, right: 16, top: 42, bottom: 48, valueMax: 1.12 };
const TICKS = [0, 5, 10, 15, 20];
/**
 * The height of the indirect peak in the plot, as a fraction of the direct
 * peak. Indirect light is weaker than that by orders of magnitude; the
 * plot shows when it arrives and for how long, not how much there is.
 */
const INDIRECT_LEVEL = 0.3;
/** Sampling of the plot's traces, in ns. */
const TRACE_STEP = 0.02;

const plotX = (t) => PLOT.left + (t / PLOT_END) * (PLOT.width - PLOT.left - PLOT.right);
/** The trace's zero sits a few pixels above the axis line, so the axis stays visible under it. */
const plotY = (v) => PLOT.height - PLOT.bottom - 3 - (v / PLOT.valueMax) * (PLOT.height - PLOT.bottom - PLOT.top - 3);

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
 * The plot at one frame: the axes, and the measurement at x_p as far as
 * the sweep: the direct return at `TIMES.direct`, and the indirect light
 * of `transient` (cornerScene.js's `measureIndirect`, or null) after it.
 */
function drawPlot(ctx, plot, colors, transient) {
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

  const sweep = Math.min(plot.sweep, PLOT_END);
  // The direct return: flat until the pulse arrives.
  drawTrace(ctx, (t) => pulse(t - TIMES.direct), 0, Math.min(sweep, transient ? TIMES.direct + transient.span[0] : sweep), colors.direct);
  if (transient) {
    const [from, to] = transient.span.map((delay) => TIMES.direct + delay);
    drawTrace(ctx, (t) => INDIRECT_LEVEL * transient.at(t - TIMES.direct), from, Math.min(sweep, to), colors.indirect);
    // After the indirect light, the trace is flat again.
    drawTrace(ctx, () => 0, to, sweep, colors.direct);
  }
  if (plot.cursor > 0) {
    ctx.globalAlpha = plot.opacity * plot.cursor * 0.6;
    ctx.strokeStyle = colors.cursor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotX(sweep), PLOT.top - 8);
    ctx.lineTo(plotX(sweep), axisY);
    ctx.stroke();
  }
  ctx.restore();
}

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
 * The hidden object of each mesh image, by the image's path in the slide:
 * its surface and the indirect light it returns to x_p. Both follow from
 * the image alone, so they are worked out once for the page.
 */
const hiddenObjects = new Map();

function hiddenObjectOf(meshPath, image) {
  if (!hiddenObjects.has(meshPath)) {
    const geometry = bunnyGeometry(imagePixels(image));
    hiddenObjects.set(meshPath, { geometry, indirect: measureIndirect(geometry) });
  }
  return hiddenObjects.get(meshPath);
}

/**
 * Lidar capture: a three.js render of the website's corner scene (two
 * relay walls, the teapot occluder, the bunny hidden behind it) and of a
 * confocal lidar on a breadboard in front of it, with a plot of the
 * measurement at one visible point x_p. Four build steps: a pulse travels
 * from the laser by the scanning mirrors to x_p, and the plot's empty axes
 * appear; its direct return travels back to the detector and the plot
 * draws a sharp peak; a wavefront from x_p reaches the hidden object,
 * which lights faintly, the light returns by x_p to the detector, and the
 * plot adds a weak, later peak; the laser scans, and a dot marks each
 * point it visits on the visible surfaces. The light moves at one
 * playback speed, and the plot's time axis matches the scene's distances
 * (c = 0.3 m/ns).
 *
 * Fields:
 *   title         the slide's title.
 *   hiddenObject  { mesh }: the bunny's mesh, packed into an image (the
 *                 capture and record views wait for images; the format is
 *                 documented in the slide's sources, make-bunny-mesh.mjs).
 *   labels        { laser, mirrors, detector, relays, occluder, hidden }
 *                 beside the parts of the render, and { direct, indirect,
 *                 time, counts } on the plot.
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
  const plotRef = useRef(null);
  const labelRefs = useRef({});
  const plotLabelRefs = useRef({});
  const [view, setView] = useState(null);
  // The render while it can be drawn: React detaches the layout's elements, and this effect's
  // cleanup gives the render back, before the step clock stops, and a frame may fall in between.
  const liveRender = useRef(null);
  const meshPath = slide.hiddenObject.mesh;
  const [hiddenObject, setHiddenObject] = useState(() => hiddenObjects.get(meshPath) ?? null);

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
    setView({ render, colors, width: host.offsetWidth, height: host.offsetHeight });
    return () => {
      liveRender.current = null;
      render.canvas.remove();
      releaseLidarRender(render);
    };
  }, [hostRef]);

  // In the commit that places the render, so the first frame drawn has the hidden object when it is known.
  useLayoutEffect(() => {
    if (view && hiddenObject && !view.render.indirect()) view.render.setHiddenObject(hiddenObject);
  }, [view, hiddenObject]);
  const hiddenShown = Boolean(view && hiddenObject);

  // The image may have loaded before React listened for it.
  useEffect(() => {
    const image = meshRef.current;
    if (image.complete && image.naturalWidth > 0) setHiddenObject(hiddenObjectOf(meshPath, image));
  }, [meshPath]);

  useStepClock(buildStep, (ms) => {
    if (!view || liveRender.current !== view.render) return;
    const { render, colors } = view;
    const frame = frameAt(buildStep, ms);
    render.setSize(view.width, view.height, ratio);
    render.draw(frame);

    for (const { key, point, shift } of SCENE_LABELS) {
      const [x, y] = render.project(point);
      labelRefs.current[key].style.transform = `translate(${(x + shift[0]).toFixed(1)}px, ${(y + shift[1]).toFixed(1)}px)`;
    }

    const transient = render.indirect();
    const ctx = plotRef.current.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawPlot(ctx, frame.plot, colors, transient);
    const plotLabels = plotLabelRefs.current;
    plotLabels.axes.style.opacity = frame.plot.opacity;
    plotLabels.direct.style.opacity = frame.plot.opacity * frame.plot.direct;
    plotLabels.indirect.style.opacity = transient ? frame.plot.opacity * frame.plot.indirect : 0;
    if (transient) plotLabels.indirect.style.left = `${plotX(TIMES.direct + transient.peakDelay)}px`;
  }, { still: stillAt(buildStep), until: settledAt(buildStep) });

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
        <div className="lidar-capture-plot" style={{ width: PLOT.width, height: PLOT.height }}>
          <canvas ref={plotRef} width={Math.round(PLOT.width * ratio)} height={Math.round(PLOT.height * ratio)} />
          <div className="lidar-capture-plot-axes" ref={(element) => { plotLabelRefs.current.axes = element; }}>
            <span className="lidar-capture-plot-label" style={{ left: PLOT.left - 2, top: PLOT.top - 38 }}><Text>{slide.labels.counts}</Text></span>
            {TICKS.map((t) => (
              <span key={t} className="lidar-capture-plot-tick" style={{ left: plotX(t), top: PLOT.height - PLOT.bottom + 9 }}>{t}</span>
            ))}
            <span className="lidar-capture-plot-label lidar-capture-plot-label--time" style={{ top: PLOT.height - PLOT.bottom + 28 }}><Text>{slide.labels.time}</Text></span>
          </div>
          <span
            className="lidar-capture-plot-peak lidar-capture-plot-peak--direct"
            style={{ left: plotX(TIMES.direct) + 14, top: plotY(0.97) }}
            ref={(element) => { plotLabelRefs.current.direct = element; }}
          >
            <Text>{slide.labels.direct}</Text>
          </span>
          <span
            className="lidar-capture-plot-peak lidar-capture-plot-peak--indirect"
            style={{ top: plotY(INDIRECT_LEVEL) - 30 }}
            ref={(element) => { plotLabelRefs.current.indirect = element; }}
          >
            <Text>{slide.labels.indirect}</Text>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Ahead of the slide (the audience view calls it while the page is idle):
 * the hidden object from its mesh image, and the page's render with its
 * shaders compiled and each step's still frame drawn once.
 */
LidarCapture.prepare = async (slide) => {
  const meshPath = slide.hiddenObject.mesh;
  const image = new Image();
  image.src = mediaUrl(meshPath);
  await image.decode();
  await whenIdle();
  const hiddenObject = hiddenObjectOf(meshPath, image);
  await whenIdle();
  await prepareLidarRender(hiddenObject, STEPS.map((_, step) => frameAt(step, stillAt(step))), whenIdle);
};
