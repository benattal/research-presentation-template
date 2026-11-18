import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { ease, useAnimation, useStageCanvas } from '../canvas/canvas.js';
import {
  drawAxes, fillSeries, glowDot, linear, plotScale, radianceCss, rgba, strokeSeries, themeColors,
} from '../volume/draw.js';
import EquationLines from '../volume/EquationLines.jsx';
import { useFigureSize } from '../volume/figure.js';
import { solveTransfer } from '../volume/ray.js';
import { drawRayStrip } from '../volume/rayStrip.js';
import './IntegratingFactor.css';

/** The ray runs from the camera (t = 0) to a lamp at t = d = 1. */
const DEPTH = 1;
/** Extinction away from the bump, the bump's width, and the plotted range of σₜ (per unit length). */
const BASE_EXTINCTION = 0.25;
const BUMP_WIDTH = 0.07;
const EXTINCTION_MAX = 12;
/** The medium's source S = SOURCE_RATIO · σₜ (emission and in-scattering together), and the lamp's radiance L(d). */
const SOURCE_RATIO = 0.35;
const LAMP = 1;
const PIXEL_GAIN = 2.4;
const STEPS = 400;

function extinction(bump) {
  return (t) => BASE_EXTINCTION + bump.height * Math.exp(-(((t - bump.center) / BUMP_WIDTH) ** 2) / 2);
}

function figureGeometry({ width, height }) {
  const gutter = 64;
  const stripHeight = Math.min(120, height * 0.26);
  const gap = 46;
  const axis = 30;
  const strip = { x: gutter, y: 0, width: Math.max(0, width - gutter - 8), height: stripHeight };
  const plot = { x: gutter, y: stripHeight + gap, width: strip.width, height: Math.max(0, height - stripHeight - gap - axis) };
  return { gutter, strip, plot, width, height };
}

/**
 * The transport operator D = ω·∇ + σₜ inverted along a ray by its
 * integrating factor: the derivation, one line per build step, beside a
 * ray from the camera to a lamp through a bump of medium. The strip shows the light travelling to the
 * camera, L(t), from stepping the ODE (it agrees with the integrating
 * factor's formula: tests/volume.test.mjs); the plot shows σₜ(t) and the
 * transmittance T(t).
 *
 * Each build step is `{ label, equation }`, shown with every earlier one.
 * The transmittance curve appears from the second step. Drag the bump's
 * handle to move it (horizontally) and change its height (vertically).
 */
export default function IntegratingFactor({ slide, buildStep }) {
  const lines = slide.buildSteps;
  if (!lines?.every((line) => typeof line.equation === 'string')) {
    throw new Error(`integratingFactor: every build step of "${slide.id}" needs an "equation"`);
  }
  const showTransmittance = buildStep >= 1;

  const [bump, setBump] = useState({ center: 0.55, height: 6 });
  const [colors, setColors] = useState(null);
  const [figureRef, size] = useFigureSize();
  const [canvasRef, ratio] = useStageCanvas();
  const progressRef = useRef(1);
  const dragRef = useRef(false);
  const stepRef = useRef(buildStep);
  if (stepRef.current !== buildStep) {
    stepRef.current = buildStep;
    progressRef.current = 0;
  }

  useLayoutEffect(() => setColors(themeColors(canvasRef.current)), [canvasRef]);
  const geometry = useMemo(() => figureGeometry(size), [size]);

  const solution = useMemo(() => {
    const density = extinction(bump);
    const ray = { near: 0, far: DEPTH, density, source: (t) => SOURCE_RATIO * density(t), background: LAMP };
    const stepped = solveTransfer(ray, 2000);
    const t = Array.from({ length: STEPS + 1 }, (_, k) => (k / STEPS) * DEPTH);
    let depth = 0;
    const transmittance = [1];
    for (let k = 1; k <= STEPS; k += 1) {
      depth += 0.5 * (density(t[k - 1]) + density(t[k])) * (t[k] - t[k - 1]);
      transmittance.push(Math.exp(-depth));
    }
    return {
      t,
      density: t.map(density),
      transmittance,
      radiance: t.map((value) => stepped.radiance[Math.round((value / DEPTH) * 2000)]),
    };
  }, [bump]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !colors || geometry.width === 0) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, geometry.width, geometry.height);
    const { strip, plot } = geometry;
    const light = linear(colors['light-1']);

    // The strip: the medium as a faint haze, and the light travelling to the camera, L(t).
    drawRayStrip(ctx, strip, { ...solution, densityMax: EXTINCTION_MAX }, colors, 0.9);
    const middle = strip.y + strip.height / 2;
    glowDot(ctx, [strip.x + strip.width - 10, middle], colors['light-0'], 6);

    // The camera's pixel: L(0).
    const pixel = 30;
    ctx.fillStyle = radianceCss(light.map((v) => v * solution.radiance[0]), PIXEL_GAIN);
    ctx.fillRect(geometry.gutter - pixel - 14, middle - pixel / 2, pixel, pixel);
    ctx.strokeStyle = rgba(colors['text-primary']);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(geometry.gutter - pixel - 14, middle - pixel / 2, pixel, pixel);

    // The plot: σₜ(t) and, from the second step, T(t).
    const sigma = plotScale(plot, [0, DEPTH], [0, EXTINCTION_MAX]);
    const transmittance = plotScale(plot, [0, DEPTH], [0, 1.05]);
    fillSeries(ctx, sigma, solution.t, solution.density, rgba(colors['ink-medium'], 0.16));
    strokeSeries(ctx, sigma, solution.t, solution.density, { color: rgba(colors['ink-medium']), width: 2 });
    if (showTransmittance) {
      const count = Math.round((buildStep === 1 ? ease(progressRef.current) : 1) * solution.t.length);
      strokeSeries(ctx, transmittance, solution.t, solution.transmittance, { color: rgba(colors['text-primary']), width: 2.5 }, count);
    }
    drawAxes(ctx, plot, colors['text-muted']);
    const handle = [sigma.x(bump.center), sigma.y(BASE_EXTINCTION + bump.height)];
    ctx.fillStyle = rgba(colors['ink-medium']);
    ctx.beginPath();
    ctx.arc(handle[0], handle[1], 7, 0, 2 * Math.PI);
    ctx.fill();
  }, [canvasRef, colors, geometry, ratio, solution, bump, showTransmittance, buildStep]);

  useAnimation(buildStep, 900, (progress) => {
    progressRef.current = progress;
    draw();
  });
  useLayoutEffect(draw, [draw]);

  const moveBump = (event) => {
    const box = canvasRef.current.getBoundingClientRect();
    const scale = box.width / canvasRef.current.offsetWidth;
    const x = (event.clientX - box.left) / scale;
    const y = (event.clientY - box.top) / scale;
    const { plot } = geometry;
    const center = Math.min(0.9, Math.max(0.1, (x - plot.x) / plot.width));
    const height = Math.min(EXTINCTION_MAX - 1, Math.max(0.3, (1 - (y - plot.y) / plot.height) * EXTINCTION_MAX - BASE_EXTINCTION));
    setBump({ center, height });
  };

  const { strip, plot } = geometry;
  return (
    <div className="slide--integrating-factor">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="integrating-body">
        <div className="integrating-derivation">
          <EquationLines lines={lines} buildStep={buildStep} />
        </div>
        <div className="integrating-figure" ref={figureRef} data-no-swipe>
          <canvas
            ref={canvasRef}
            className="integrating-canvas"
            width={Math.round(geometry.width * ratio)}
            height={Math.round(geometry.height * ratio)}
            style={{ width: geometry.width, height: geometry.height }}
            onPointerDown={(event) => {
              dragRef.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              moveBump(event);
            }}
            onPointerMove={(event) => dragRef.current && moveBump(event)}
            onPointerUp={() => { dragRef.current = false; }}
          />
          {geometry.width > 0 && (
            <>
              <span className="integrating-mark" style={{ left: 0, top: strip.height + 2, width: geometry.gutter - 6 }}>
                <Text>{'$L(0)$'}</Text>
              </span>
              <span className="integrating-mark integrating-mark--end" style={{ left: strip.x + strip.width - 80, top: strip.height + 2, width: 80 }}>
                <Text>{'$L(d)$'}</Text>
              </span>
              <span className="integrating-mark integrating-mark--medium" style={{ left: 0, top: plot.y + 4, width: geometry.gutter - 12 }}>
                <Text>{'$\\sigma_t$'}</Text>
              </span>
              <span className="integrating-mark" style={{ left: 0, top: plot.y + 34, width: geometry.gutter - 12, visibility: showTransmittance ? 'visible' : 'hidden' }}>
                <Text>{'$T$'}</Text>
              </span>
              <span className="integrating-axis" style={{ left: plot.x - 6, top: plot.y + plot.height + 4 }}>
                <Text>{'$0$'}</Text>
              </span>
              <span className="integrating-axis" style={{ left: plot.x + plot.width - 8, top: plot.y + plot.height + 4 }}>
                <Text>{'$d$'}</Text>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
