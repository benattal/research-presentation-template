import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useStageCanvas } from '../canvas/canvas.js';
import EquationLines from '../volume/EquationLines.jsx';
import { drawAxes, fillSeries, glowDot, plotScale, rgba, strokeSeries, themeColors } from '../volume/draw.js';
import { useFigureSize } from '../volume/figure.js';
import { createRandom, gaussian } from '../volume/random.js';
import { applyTransport, solveTransfer } from '../volume/ray.js';
import { drawRayStrip } from '../volume/rayStrip.js';
import './InverseOperator.css';

/** Samples along the ray, from the camera (t = 0) to t = d = 1. */
const SAMPLES = 400;
/** The medium's extinction: a base value and a denser stretch (per unit length). */
const extinction = (t) => 0.8 + 2.2 * Math.exp(-(((t - 0.62) / 0.12) ** 2) / 2);
const EXTINCTION_MAX = 3.2;
/** The sources Q: narrow glowing bumps at these t, with these peak values and one width. */
const SOURCES = [{ t: 0.2, peak: 6 }, { t: 0.47, peak: 9 }, { t: 0.8, peak: 7 }];
const SOURCE_WIDTH = 0.018;
const NOISE_MAX = 0.03;
const STRIP_GAIN = 3;

const source = (t) => SOURCES.reduce((sum, s) => sum + s.peak * Math.exp(-(((t - s.t) / SOURCE_WIDTH) ** 2) / 2), 0);

function figureGeometry({ width, height }) {
  const gutter = 64;
  const strip = { x: gutter, y: 0, width: Math.max(0, width - gutter - 8), height: Math.min(110, height * 0.22) };
  const gap = 20;
  const axis = 30;
  const plotHeight = Math.max(0, (height - strip.height - 2 * gap - axis) / 2);
  const upper = { x: gutter, y: strip.height + gap, width: strip.width, height: plotHeight };
  const lower = { x: gutter, y: upper.y + plotHeight + gap, width: strip.width, height: plotHeight };
  return { gutter, strip, upper, lower, width, height };
}

/**
 * The differential form of transport inverted locally: sources Q along one
 * ray, the radiance L = D⁻¹Q they produce (an integral along the ray, from
 * stepping the ODE), and Q recovered from L by applying D = −d/dt + σₜ with
 * finite differences, which needs only neighbouring samples of L. Noise in
 * L, scaled by the slider, shows what the derivative does to it.
 *
 * Slide fields: `equations` (EquationLines lines) and build steps
 * `{ recovered, noise }`: whether the recovered sources are drawn, and the
 * noise in L as a fraction of its maximum (the slider starts there).
 */
export default function InverseOperator({ slide, buildStep }) {
  const step = slide.buildSteps?.[buildStep];
  if (typeof step?.recovered !== 'boolean' || !(step.noise >= 0)) {
    throw new Error(`inverseOperator: build step ${buildStep} of "${slide.id}" needs "recovered" and "noise"`);
  }
  const [noise, setNoise] = useState(step.noise);
  const [noiseStep, setNoiseStep] = useState(buildStep);
  if (noiseStep !== buildStep) {
    // Each build step starts from its own noise level; the slider explores from there.
    setNoiseStep(buildStep);
    setNoise(step.noise);
  }
  const [colors, setColors] = useState(null);
  const [figureRef, size] = useFigureSize();
  const [canvasRef, ratio] = useStageCanvas();
  useLayoutEffect(() => setColors(themeColors(canvasRef.current)), [canvasRef]);
  const geometry = useMemo(() => figureGeometry(size), [size]);

  const ray = useMemo(() => {
    const solved = solveTransfer({ near: 0, far: 1, density: extinction, source, background: 0 }, SAMPLES - 1);
    const t = Array.from(solved.t);
    const random = createRandom(29);
    return {
      t,
      radiance: Array.from(solved.radiance),
      density: t.map(extinction),
      sources: t.map(source),
      unitNoise: t.map(() => gaussian(random)),
    };
  }, []);

  const measured = useMemo(() => {
    const scale = noise * Math.max(...ray.radiance);
    const radiance = ray.radiance.map((value, k) => value + scale * ray.unitNoise[k]);
    const recovered = applyTransport({ t: ray.t, radiance, density: ray.density });
    const error = Math.hypot(...recovered.map((q, k) => q - ray.sources[k])) / Math.hypot(...ray.sources);
    return { radiance, recovered, error };
  }, [ray, noise]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !colors || geometry.width === 0) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, geometry.width, geometry.height);
    const { strip, upper, lower } = geometry;

    const medium = { radiance: ray.radiance, density: ray.density, densityMax: EXTINCTION_MAX };
    drawRayStrip(ctx, strip, medium, colors, STRIP_GAIN);
    for (const s of SOURCES) {
      glowDot(ctx, [strip.x + s.t * strip.width, strip.y + strip.height / 2], colors['light-0'], 2 + s.peak / 3, 0.9);
    }

    const radianceScale = plotScale(upper, [0, 1], [0, 1.15 * Math.max(...ray.radiance)]);
    if (noise > 0) {
      strokeSeries(ctx, radianceScale, ray.t, measured.radiance, { color: rgba(colors['text-muted'], 0.9), width: 1 });
    }
    strokeSeries(ctx, radianceScale, ray.t, ray.radiance, { color: rgba(colors['text-primary']), width: 2.5 });
    drawAxes(ctx, upper, colors['text-muted']);

    const peak = Math.max(...ray.sources);
    const sourceScale = plotScale(lower, [0, 1], [-0.25 * peak, 1.25 * peak]);
    ctx.save();
    ctx.beginPath();
    ctx.rect(lower.x, lower.y, lower.width, lower.height);
    ctx.clip();
    fillSeries(ctx, sourceScale, ray.t, ray.sources, rgba(colors['ink-light-0'], 0.3));
    strokeSeries(ctx, sourceScale, ray.t, ray.sources, { color: rgba(colors['ink-light-0']), width: 2 });
    if (step.recovered) {
      strokeSeries(ctx, sourceScale, ray.t, measured.recovered, { color: rgba(colors['text-primary']), width: 1.5 });
    }
    ctx.restore();
    ctx.strokeStyle = rgba(colors['text-muted']);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lower.x, sourceScale.y(0) + 0.5);
    ctx.lineTo(lower.x + lower.width, sourceScale.y(0) + 0.5);
    ctx.moveTo(lower.x + 0.5, lower.y);
    ctx.lineTo(lower.x + 0.5, lower.y + lower.height);
    ctx.stroke();
  }, [canvasRef, colors, geometry, ratio, ray, measured, noise, step.recovered]);
  useLayoutEffect(draw, [draw]);

  const { upper, lower } = geometry;
  return (
    <div className="slide--inverse-operator">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="inverse-body">
        <div className="inverse-figure" ref={figureRef} data-no-swipe>
          <canvas
            ref={canvasRef}
            className="inverse-canvas"
            width={Math.round(geometry.width * ratio)}
            height={Math.round(geometry.height * ratio)}
            style={{ width: geometry.width, height: geometry.height }}
          />
          {geometry.width > 0 && (
            <>
              <span className="inverse-label" style={{ top: upper.y + 4, width: geometry.gutter - 12 }}>
                <Text>{'$L$'}</Text>
              </span>
              <span className="inverse-label inverse-label--source" style={{ top: lower.y + 4, width: geometry.gutter - 12 }}>
                <Text>{'$Q$'}</Text>
              </span>
              <span className="inverse-label" style={{ top: lower.y + 34, width: geometry.gutter - 12, visibility: step.recovered ? 'visible' : 'hidden' }}>
                <Text>{'$DL$'}</Text>
              </span>
              <span className="inverse-axis" style={{ left: lower.x - 6, top: lower.y + lower.height + 4 }}>
                <Text>{'$0$'}</Text>
              </span>
              <span className="inverse-axis" style={{ left: lower.x + lower.width - 8, top: lower.y + lower.height + 4 }}>
                <Text>{'$d$'}</Text>
              </span>
            </>
          )}
        </div>
        <div className="inverse-side">
          <EquationLines lines={slide.equations} buildStep={buildStep} className="inverse-lines" />
          <div className="inverse-check" style={{ visibility: step.recovered ? 'visible' : 'hidden' }}>
            <span className="inverse-check-label">error</span>
            <span className="inverse-check-value">{`${(100 * measured.error).toFixed(1)}%`}</span>
          </div>
          <label className="inverse-slider" style={{ visibility: step.recovered ? 'visible' : 'hidden' }}>
            <span className="inverse-slider-head">
              <span>{'noise in '}<Text>{'$L$'}</Text></span>
              <span className="inverse-slider-value">{`${(100 * noise).toFixed(1)}%`}</span>
            </span>
            <input
              type="range"
              min={0}
              max={NOISE_MAX}
              step={0.0005}
              value={noise}
              onChange={(event) => setNoise(Number(event.target.value))}
              // The clicker sends arrow and page keys; a focused slider would take them.
              onPointerUp={(event) => event.currentTarget.blur()}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
