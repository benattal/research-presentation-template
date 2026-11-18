import { useEffect, useMemo, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { Slider } from '@core/stage/Controls.jsx';
import { ease, useAnimation, useStageCanvas, useStepTransition } from '@core/stage/canvas.js';
import EquationStack from '@core/stage/EquationStack.jsx';
import { sceneTransform, themeColors } from '../activeSensing/draw.js';
import {
  SPEED_OF_LIGHT, collocatedWeights, compositingWeights, roundTripTime, transientHistogram,
} from '../activeSensing/measurement.js';
import {
  RAY_PANEL, RAY_PANEL_BOUNDS, RAY_PANEL_COLORS, drawRayPanel,
} from '../activeSensing/rayPanel.js';
import { RAY_SCENE, raySamples } from '../activeSensing/rayScene.js';
import './TransientQuadrature.css';

/** The render panel and the plot below it, in stage pixels; they share the horizontal axis. */
const PANEL = RAY_PANEL;
const PLOT = { width: RAY_PANEL.width, height: 236, top: 30, bottom: 40 };
const BOUNDS = RAY_PANEL_BOUNDS;

/**
 * Histogram bins, in seconds, from 0 past the round trip of the panel's far
 * edge, so the widest pulse stays inside the histogram; the plot shows the
 * bins under the panel.
 */
const BIN_WIDTH = 0.2e-9;
const BIN_COUNT = Math.ceil(roundTripTime(BOUNDS.x1 + 1.5) / BIN_WIDTH);
const SHOWN_TIME = roundTripTime(BOUNDS.x1);

const NANOSECOND = 1e-9;

/** Width of a sample's bar, in stage pixels (samples are 5 cm, about 10 px, apart). */
const SAMPLE_BAR = 6;

/**
 * The top of the plot, in the units of the terms with a source of unit
 * intensity at the camera (Tᵢαᵢ has no unit; wᵢ = Tᵢαᵢ · ρᵢTᵢ/tᵢ², t in
 * meters). Every step draws on this one scale, so the heights compare
 * from step to step: the wᵢ are NeRF's weights times Lᵢ, and the
 * histogram, as weight per sample interval, keeps the area of the bars it
 * replaces. The fog's NeRF weights and the wall's wᵢ fit under it; the
 * wall's NeRF weight (0.59) runs past the top, drawn with a break mark.
 */
const TERM_MAX = 0.043;

/** Histogram bins per sample interval: a bin's weight times this is the weight per interval of the sample bars. */
const BINS_PER_INTERVAL = roundTripTime(RAY_SCENE.step) / BIN_WIDTH;

/** Durations of the step transitions, in ms: bars changing height, and the histogram filling in arrival order. */
const MORPH_MS = 900;
const SWEEP_MS = 1800;

const TERMS = ['nerf', 'collocated'];

/**
 * A build step is either the quadrature's terms per sample, `{ terms,
 * label }` with terms 'nerf' (Tᵢαᵢ) or 'collocated' (wᵢ = Tᵢ²αᵢρᵢ/tᵢ²), or
 * the transient, `{ histogram: true, pulseWidthNs, label }`. `label` names the plotted
 * quantity.
 */
function stepState(slide, buildStep) {
  const step = slide.buildSteps?.[buildStep];
  const valid = typeof step?.label === 'string'
    && (step.histogram === true ? typeof step.pulseWidthNs === 'number' : TERMS.includes(step?.terms));
  if (!valid) {
    throw new Error(`transientQuadrature: build step ${buildStep} needs "label" and either "terms" (${TERMS.join(' or ')}) or "histogram": true with "pulseWidthNs"`);
  }
  return step;
}

const mix = (a, b, k) => a + (b - a) * k;

/** Each sample's term at a step, as a fraction of the plot's height (TERM_MAX): NeRF's weights Tᵢαᵢ or the collocated wᵢ. */
function plottedTerms(step, terms) {
  const values = step.terms === 'nerf' ? terms.nerf : terms.collocated;
  return values.map((value) => value / TERM_MAX);
}

/**
 * A break mark near the plot's top at `x`, across a bar that runs past
 * the top: a gap between two short slanted strokes, as on an axis that
 * skips values (the same mark as the quadrature slides' σ plot), below
 * the plot's labels.
 */
function BreakMark({ x, y }) {
  return (
    <g className="transient-quadrature-break">
      <path className="transient-quadrature-break-gap" d={`M${x - 9},${y + 7} L${x - 1},${y - 7} L${x + 9},${y - 7} L${x + 1},${y + 7} Z`} />
      <path className="transient-quadrature-break-stroke" d={`M${x - 9},${y + 7} L${x - 1},${y - 7} M${x + 1},${y + 7} L${x + 9},${y - 7}`} />
    </g>
  );
}

/** Runs of consecutive indices whose value exceeds 1 (the top of the plot), as `[first, last]`. */
function runsAboveTop(values, shown) {
  const runs = [];
  values.forEach((value, i) => {
    if (!(value > 1) || !shown(i)) return;
    if (runs.length && runs.at(-1)[1] === i - 1) runs.at(-1)[1] = i;
    else runs.push([i, i]);
  });
  return runs;
}

/**
 * A pulsed lidar pixel as a quadrature: the camera ray's samples on a render
 * panel, and below it, on the same horizontal axis (depth t above
 * round-trip time 2t/c), a plot. The equations build up beside them
 * (`lines`, an EquationStack): NeRF's quadrature, a source at the camera,
 * the intensity m, and the transient h(τ). The first build steps plot each
 * sample's term at its depth (NeRF's Tᵢαᵢ, then wᵢ = Tᵢ²αᵢρᵢ/tᵢ²); the
 * transient steps bin the same weights by round-trip time, spread by the
 * laser pulse. Moving forward animates from the previous step: the bars
 * change height, the histogram fills in arrival order, the pulse widens.
 * The slider sets the pulse width on the transient steps.
 */
export default function TransientQuadrature({ slide, buildStep }) {
  const step = stepState(slide, buildStep);
  const fromStep = useStepTransition(buildStep);
  const from = fromStep === null ? null : stepState(slide, fromStep);
  const sweeping = from !== null && step.histogram && !from.histogram;
  const [progress, setProgress] = useState({ step: buildStep, value: 1 });
  const [dragged, setDragged] = useState({ step: buildStep, pulseWidth: null });
  const [canvasRef, ratio] = useStageCanvas();

  useAnimation(buildStep, from === null ? 0 : (sweeping ? SWEEP_MS : MORPH_MS), (value) => setProgress({ step: buildStep, value }));
  const k = progress.step === buildStep ? progress.value : (from === null ? 1 : 0);
  const blend = ease(k);

  const samples = useMemo(() => raySamples(RAY_SCENE, { fog: true }), []);
  const terms = useMemo(() => ({
    nerf: compositingWeights(samples).map(({ weight }) => weight),
    collocated: collocatedWeights(samples),
  }), [samples]);

  const settledPulse = step.histogram ? step.pulseWidthNs * NANOSECOND : 0;
  const animatedPulse = from?.histogram && step.histogram
    ? mix(from.pulseWidthNs * NANOSECOND, settledPulse, blend)
    : settledPulse;
  const pulseWidth = dragged.step === buildStep && dragged.pulseWidth !== null ? dragged.pulseWidth : animatedPulse;
  // The histogram as a fraction of the plot's height: each bin's weight per sample interval, on the terms' scale.
  const histogram = useMemo(() => {
    if (!step.histogram) return null;
    const bins = transientHistogram(samples, { binWidth: BIN_WIDTH, binCount: BIN_COUNT, pulseWidth });
    return Array.from(bins, (value) => (value * BINS_PER_INTERVAL) / TERM_MAX);
  }, [step.histogram, samples, pulseWidth]);

  // The bars of the sample terms: blended from the previous step's, or the previous step's while the histogram fills.
  const sampleBars = useMemo(() => {
    if (step.histogram) return sweeping && k < 1 ? plottedTerms(from, terms) : null;
    const target = plottedTerms(step, terms);
    if (!from || from.histogram) return target;
    const start = plottedTerms(from, terms);
    return target.map((value, i) => mix(start[i], value, blend));
  }, [step, from, sweeping, k, terms, blend]);
  const revealed = sweeping && k < 1 ? k * SHOWN_TIME : Infinity;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawRayPanel(ctx, themeColors(canvas, RAY_PANEL_COLORS), PANEL, {
      scene: RAY_SCENE,
      samples,
      returns: step.histogram ? terms.collocated : sampleBars,
      fog: 1,
      marker: revealed === Infinity ? null : (revealed * SPEED_OF_LIGHT) / 2,
      bounds: BOUNDS,
    });
  });

  // Time τ sits under the depth cτ/2 it comes from.
  const { toCanvas } = sceneTransform(BOUNDS, { x: 0, y: 0, ...PANEL });
  const xOfDepth = (t) => toCanvas([t, 0])[0];
  const xOfTime = (time) => xOfDepth((time * SPEED_OF_LIGHT) / 2);
  const baseline = PLOT.height - PLOT.bottom;
  const height = baseline - PLOT.top;
  const barTop = (fraction) => baseline - Math.min(1, fraction) * height;
  const wallDepth = RAY_SCENE.wall.depth;

  // Which bins and sample bars are drawn now, and break marks over those that run past the top.
  const binShown = (bin) => bin * BIN_WIDTH <= Math.min(revealed, SHOWN_TIME) && histogram[bin] > 0;
  const sampleShown = (i) => {
    const { t } = samples[i];
    // While the histogram fills, a sample's bar is replaced by the bins once its light has arrived.
    if (step.histogram && roundTripTime(t) <= revealed) return false;
    return sampleBars[i] > 0.002 && t <= BOUNDS.x1;
  };
  const breaks = [
    ...(histogram ? runsAboveTop(histogram, binShown).map(([first, last]) => (xOfTime(first * BIN_WIDTH) + xOfTime((last + 1) * BIN_WIDTH)) / 2) : []),
    ...(sampleBars ? runsAboveTop(sampleBars, sampleShown).map(([first, last]) => (xOfDepth(samples[first].t) + xOfDepth(samples[last].t)) / 2) : []),
  ];
  const ticks = step.histogram
    ? [0, 5, 10, 15].map((ns) => ({ x: xOfTime(ns * NANOSECOND), label: String(ns) }))
    : [0, 1, 2].map((m) => ({ x: xOfDepth(m), label: String(m) }));

  return (
    <div className="slide--transient-quadrature">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="transient-quadrature-body">
        <div className="transient-quadrature-figures">
          <canvas
            ref={canvasRef}
            className="transient-quadrature-panel"
            width={PANEL.width * ratio}
            height={PANEL.height * ratio}
            style={{ width: PANEL.width, height: PANEL.height }}
          />
          <div className="transient-quadrature-plot" style={{ width: PLOT.width, height: PLOT.height }}>
            <svg width={PLOT.width} height={PLOT.height} aria-hidden="true">
              <line className="transient-quadrature-guide" x1={xOfDepth(wallDepth)} y1={PLOT.top - 8} x2={xOfDepth(wallDepth)} y2={baseline} />
              {histogram && histogram.map((value, bin) => {
                if (!binShown(bin)) return null;
                const x0 = xOfTime(bin * BIN_WIDTH);
                const x1 = xOfTime((bin + 1) * BIN_WIDTH);
                const top = barTop(value);
                return <rect key={bin} className="transient-quadrature-bar" x={x0} y={top} width={Math.max(0.5, x1 - x0 - 0.6)} height={baseline - top} />;
              })}
              {sampleBars && samples.map(({ t }, i) => {
                if (!sampleShown(i)) return null;
                const top = barTop(sampleBars[i]);
                return <rect key={t} className="transient-quadrature-bar" x={xOfDepth(t) - SAMPLE_BAR / 2} y={top} width={SAMPLE_BAR} height={baseline - top} />;
              })}
              {breaks.map((x) => <BreakMark key={x} x={x} y={PLOT.top + 30} />)}
              <line className="transient-quadrature-axis" x1={xOfDepth(0)} y1={baseline} x2={PLOT.width - 4} y2={baseline} />
              <line className="transient-quadrature-axis" x1={xOfDepth(0)} y1={PLOT.top - 8} x2={xOfDepth(0)} y2={baseline} />
              {ticks.map(({ x, label }) => (
                <g key={label}>
                  <line className="transient-quadrature-axis" x1={x} y1={baseline} x2={x} y2={baseline + 6} />
                  <text className="transient-quadrature-tick" x={x} y={baseline + 26} textAnchor="middle">{label}</text>
                </g>
              ))}
            </svg>
            <span className="transient-quadrature-label" style={{ left: xOfDepth(wallDepth) + 8, top: PLOT.top - 4 }}>
              <Text>{step.histogram ? '$2d/c$' : '$d$'}</Text>
            </span>
            <span className="transient-quadrature-label" style={{ left: xOfDepth(0) + 10, top: PLOT.top - 4 }}><Text>{step.label}</Text></span>
            <span className="transient-quadrature-label transient-quadrature-label--axis" style={{ left: PLOT.width - 4, top: baseline + 26 }}>
              <Text>{step.histogram ? '$\\tau$ (ns)' : '$t$ (m)'}</Text>
            </span>
          </div>
        </div>
        <div className="transient-quadrature-side">
          <EquationStack lines={slide.lines} step={buildStep} className="transient-quadrature-stack" />
          <div className="transient-quadrature-control" style={{ visibility: step.histogram ? 'visible' : 'hidden' }}>
            <Slider
              label="pulse"
              value={Math.round((pulseWidth / NANOSECOND) * 10) / 10}
              min={0.1}
              max={4}
              step={0.1}
              onChange={(ns) => setDragged({ step: buildStep, pulseWidth: ns * NANOSECOND })}
              format={(ns) => `${ns.toFixed(1)} ns`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
