import { useEffect, useMemo, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { Readout, Slider } from '../activeSensing/Controls.jsx';
import { sceneTransform, themeColors } from '../activeSensing/draw.js';
import {
  SPEED_OF_LIGHT, collocatedWeights, intensityQuadrature, roundTripTime, transientHistogram,
} from '../activeSensing/measurement.js';
import { RAY_PANEL_COLORS, drawRayPanel } from '../activeSensing/rayPanel.js';
import { RAY_SCENE, raySamples } from '../activeSensing/rayScene.js';
import { useAnimation, useStageCanvas } from '../canvas/canvas.js';
import './TransientQuadrature.css';

/** The render panel and the histogram below it, in stage pixels; they share the horizontal axis. */
const PANEL = { width: 860, height: 250 };
const PLOT = { width: 860, height: 220, top: 24, bottom: 40 };

/** The part of the scene the panel shows, in meters: a strip around the camera ray. */
const BOUNDS = { x0: -0.42, x1: 3.3, y0: -0.56, y1: 0.56 };

/**
 * Histogram bins, in seconds, from 0 past the round trip of the panel's far
 * edge, so the widest pulse stays inside the histogram; the plot shows the
 * bins under the panel.
 */
const BIN_WIDTH = 0.2e-9;
const BIN_COUNT = Math.ceil(roundTripTime(BOUNDS.x1 + 1.5) / BIN_WIDTH);
const SHOWN_TIME = roundTripTime(BOUNDS.x1);

const NANOSECOND = 1e-9;

function stepState(slide, buildStep) {
  const step = slide.buildSteps?.[buildStep];
  if (typeof step?.fog !== 'boolean' || typeof step.pulseWidthNs !== 'number') {
    throw new Error(`transientQuadrature: build step ${buildStep} needs "fog" and "pulseWidthNs"`);
  }
  return step;
}

/**
 * A pulsed lidar pixel as a quadrature: the camera ray's samples on a render
 * panel, and below it, on the same horizontal axis (depth t above round-trip
 * time 2t/c), the transient histogram their weights fill. Build steps
 * (`buildSteps` entries `{ fog, pulseWidthNs }`) add the fog and widen the
 * laser pulse; the slider sets the pulse width. The check reads the
 * histogram's integral against the intensity quadrature.
 */
export default function TransientQuadrature({ slide, buildStep }) {
  const step = stepState(slide, buildStep);
  const [pulseWidth, setPulseWidth] = useState(step.pulseWidthNs * NANOSECOND);
  const [animation, setAnimation] = useState({ step: buildStep, progress: 1 });
  const [canvasRef, ratio] = useStageCanvas();

  useEffect(() => setPulseWidth(step.pulseWidthNs * NANOSECOND), [step]);
  // Each step replays the measurement: the histogram fills in arrival order.
  useAnimation(buildStep, 1800, (progress) => setAnimation({ step: buildStep, progress }));
  const progress = animation.step === buildStep ? animation.progress : 0;
  const revealed = progress >= 1 ? Infinity : progress * SHOWN_TIME;

  const samples = useMemo(() => raySamples(RAY_SCENE, { fog: step.fog }), [step]);
  const weights = useMemo(() => collocatedWeights(samples), [samples]);
  const histogram = useMemo(
    () => transientHistogram(samples, { binWidth: BIN_WIDTH, binCount: BIN_COUNT, pulseWidth }),
    [samples, pulseWidth],
  );
  const integral = histogram.reduce((sum, bin) => sum + bin, 0);
  const intensity = intensityQuadrature(samples);
  const sweeping = revealed !== Infinity;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawRayPanel(ctx, themeColors(canvas, RAY_PANEL_COLORS), PANEL, {
      scene: RAY_SCENE,
      samples,
      returns: weights.map((weight, i) => (roundTripTime(samples[i].t) <= revealed ? weight : 0)),
      fog: step.fog ? 1 : 0,
      marker: sweeping ? (revealed * SPEED_OF_LIGHT) / 2 : null,
      bounds: BOUNDS,
    });
  });

  // Time τ sits under the depth cτ/2 it comes from.
  const { toCanvas } = sceneTransform(BOUNDS, { x: 0, y: 0, ...PANEL });
  const xOfTime = (time) => toCanvas([(time * SPEED_OF_LIGHT) / 2, 0])[0];
  const baseline = PLOT.height - PLOT.bottom;
  const peak = Math.max(...histogram) * 1.12 || 1;
  const yOfBin = (value) => baseline - (value / peak) * (baseline - PLOT.top);
  const ticks = [0, 5, 10, 15, 20];
  const wallTime = roundTripTime(RAY_SCENE.wall.depth);

  return (
    <div className="slide--transient-quadrature">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="transient-quadrature-equation-row">
        <div className="transient-quadrature-equation"><Text>{slide.equation}</Text></div>
      </div>
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
              <line className="transient-quadrature-guide" x1={xOfTime(wallTime)} y1={PLOT.top - 8} x2={xOfTime(wallTime)} y2={baseline} />
              {[...histogram].map((value, k) => {
                if (k * BIN_WIDTH > Math.min(revealed, SHOWN_TIME) || value <= 0) return null;
                const x0 = xOfTime(k * BIN_WIDTH);
                const x1 = xOfTime((k + 1) * BIN_WIDTH);
                const y = yOfBin(value);
                return <rect key={k} className="transient-quadrature-bar" x={x0} y={y} width={Math.max(0.5, x1 - x0 - 0.6)} height={baseline - y} />;
              })}
              <line className="transient-quadrature-axis" x1={xOfTime(0)} y1={baseline} x2={PLOT.width - 4} y2={baseline} />
              <line className="transient-quadrature-axis" x1={xOfTime(0)} y1={PLOT.top - 8} x2={xOfTime(0)} y2={baseline} />
              {ticks.map((ns) => (
                <g key={ns}>
                  <line className="transient-quadrature-axis" x1={xOfTime(ns * NANOSECOND)} y1={baseline} x2={xOfTime(ns * NANOSECOND)} y2={baseline + 6} />
                  <text className="transient-quadrature-tick" x={xOfTime(ns * NANOSECOND)} y={baseline + 26} textAnchor="middle">{ns}</text>
                </g>
              ))}
            </svg>
            <span className="transient-quadrature-label" style={{ left: xOfTime(wallTime) + 8, top: PLOT.top - 2 }}><Text>{'$2d/c$'}</Text></span>
            <span className="transient-quadrature-label" style={{ left: xOfTime(0) + 10, top: PLOT.top - 2 }}><Text>{'$h(\\tau)$'}</Text></span>
            <span className="transient-quadrature-label transient-quadrature-label--axis" style={{ left: PLOT.width - 4, top: baseline + 26 }}><Text>{'$\\tau$ (ns)'}</Text></span>
          </div>
        </div>
        <div className="transient-quadrature-side">
          <Readout
            columns={1}
            items={[
              { label: '$\\int h\\,d\\tau$', value: integral.toFixed(4) },
              { label: '$I$', value: intensity.toFixed(4) },
            ]}
          />
          <Slider
            label="pulse"
            value={Math.round((pulseWidth / NANOSECOND) * 10) / 10}
            min={0.1}
            max={4}
            step={0.1}
            onChange={(ns) => setPulseWidth(ns * NANOSECOND)}
            format={(ns) => `${ns.toFixed(1)} ns`}
          />
        </div>
      </div>
    </div>
  );
}
