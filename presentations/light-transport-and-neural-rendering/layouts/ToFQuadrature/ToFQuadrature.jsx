import { useEffect, useMemo, useRef, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import { Readout } from '../activeSensing/Controls.jsx';
import PhasorPlane from '../activeSensing/PhasorPlane.jsx';
import { themeColors } from '../activeSensing/draw.js';
import {
  amplitudeOf, collocatedWeights, phaseOf, phasor, roundTripPhase,
} from '../activeSensing/measurement.js';
import {
  RAY_PANEL, RAY_PANEL_BOUNDS, RAY_PANEL_COLORS, drawRayPanel,
} from '../activeSensing/rayPanel.js';
import { RAY_SCENE, raySamples } from '../activeSensing/rayScene.js';
import { ease, useAnimation, useStageCanvas } from '../canvas/canvas.js';
import EquationStack from '../equations/EquationStack.jsx';
import './ToFQuadrature.css';

/** The render panel (the transient slide's, in the same place) and the complex plane, in stage pixels. */
const PANEL = RAY_PANEL;
const PLANE = { width: 420, height: 440 };

function stepState(slide, buildStep) {
  const step = slide.buildSteps?.[buildStep];
  if (typeof step?.phase !== 'boolean' || typeof step.fog !== 'boolean') {
    throw new Error(`tofQuadrature: build step ${buildStep} needs "phase" and "fog"`);
  }
  return step;
}

/**
 * The arrows of one build step, one per sample: the transient's weight
 * wᵢ = Tᵢ²αᵢρᵢ/tᵢ² of each sample as its length, and its angle (the
 * round-trip phase, or 0 before the phase is introduced).
 */
function stepFrame(step, frequency) {
  const samples = raySamples(RAY_SCENE, { fog: step.fog });
  const lengths = collocatedWeights(samples);
  const angles = samples.map(({ t }) => (step.phase ? roundTripPhase(t, frequency) : 0));
  // The plot's circle is sized so the chain of arrows reaches 85% of it.
  let tip = [0, 0];
  let reach = 0;
  lengths.forEach((length, i) => {
    const [re, im] = phasor(length, angles[i]);
    tip = [tip[0] + re, tip[1] + im];
    reach = Math.max(reach, amplitudeOf(tip));
  });
  return { samples, lengths, angles, fog: step.fog ? 1 : 0, sum: step.phase ? 1 : 0, radius: reach / 0.85 };
}

function mix(a, b, k) {
  return a + (b - a) * k;
}

/**
 * The time-of-flight quadrature: samples along a camera ray through fog to
 * a wall, each sample's weight wᵢ (the transient's, from the previous
 * slide) drawn as an arrow in the complex plane, tip to tail. The
 * equations build up beside them (`lines`, an EquationStack): the phasor as
 * the transient's Fourier coefficient, and the same weights with a phase
 * each. Build steps (`buildSteps` entries `{ phase, fog }`) rotate each
 * arrow by its round-trip phase, so the chain sums to the measured phasor,
 * and remove the fog for the check against a single opaque surface. Moving
 * between steps animates from the arrows on screen. The model is credited
 * through the slide's `credits`.
 */
export default function ToFQuadrature({ slide, buildStep }) {
  const step = stepState(slide, buildStep);
  const frequency = slide.frequencyMHz * 1e6;
  const target = useMemo(() => stepFrame(step, frequency), [step, frequency]);
  const [animation, setAnimation] = useState({ step: buildStep, progress: 1 });
  const [canvasRef, ratio] = useStageCanvas();

  // Each step animates from the arrows on screen when it began; until its
  // animation reports progress, the step shows where it starts.
  const shown = useRef(target);
  const start = useMemo(() => shown.current, [buildStep]);
  useAnimation(buildStep, 1400, (progress) => setAnimation({ step: buildStep, progress }));
  const k = animation.step === buildStep ? ease(animation.progress) : 0;
  const frame = {
    lengths: target.lengths.map((length, i) => mix(start.lengths[i], length, k)),
    angles: target.angles.map((angle, i) => mix(start.angles[i], angle, k)),
    fog: mix(start.fog, target.fog, k),
    sum: mix(start.sum, target.sum, k),
    radius: mix(start.radius, target.radius, k),
  };
  shown.current = { ...target, ...frame };

  const returns = frame.lengths.map((length, i) => phasor(length, frame.angles[i]));
  const ends = [];
  returns.reduce((tip, [re, im]) => {
    const next = [tip[0] + re, tip[1] + im];
    ends.push(next);
    return next;
  }, [0, 0]);
  const measured = ends[ends.length - 1];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawRayPanel(ctx, themeColors(canvas, RAY_PANEL_COLORS), PANEL, {
      scene: RAY_SCENE, samples: target.samples, returns: frame.lengths, fog: frame.fog, bounds: RAY_PANEL_BOUNDS,
    });
  });

  const visible = Math.max(...frame.lengths) * 0.01;
  const arrows = [];
  returns.forEach((_, i) => {
    if (frame.lengths[i] < visible) return;
    const kind = target.samples[i].kind;
    arrows.push({ from: i === 0 ? [0, 0] : ends[i - 1], to: ends[i], tone: kind === 'wall' ? 'light-1' : 'medium', width: kind === 'wall' ? 3 : 2.6 });
  });
  if (frame.sum > 0.02) {
    arrows.push({ from: [0, 0], to: measured, tone: 'text', width: 3.5, opacity: frame.sum, label: '$m_f$', labelAt: 'right' });
  }

  // One 2 × 2 grid on every step: amplitude and phase on the left, a single surface's exact values beside them.
  const opaque = !step.fog && step.phase;
  const { depth, albedo } = RAY_SCENE.wall;
  const checks = [
    { key: 'amplitude', label: step.phase ? '$|m_f|$' : '$\\int h\\,d\\tau$', value: amplitudeOf(measured).toFixed(4) },
    { key: 'amplitude-exact', label: '$\\rho/d^2$', value: (albedo / depth ** 2).toFixed(4), hidden: !opaque },
    { key: 'phase', label: '$\\arg m_f$', value: `${((phaseOf(measured) * 180) / Math.PI).toFixed(1)}°`, hidden: !step.phase },
    { key: 'phase-exact', label: '$4\\pi f d/c$', value: `${((roundTripPhase(depth, frequency) * 180) / Math.PI).toFixed(1)}°`, hidden: !opaque },
  ];

  return (
    <div className="slide--tof-quadrature">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="tof-quadrature-body">
        <div className="tof-quadrature-left">
          <canvas
            ref={canvasRef}
            className="tof-quadrature-panel"
            width={PANEL.width * ratio}
            height={PANEL.height * ratio}
            style={{ width: PANEL.width, height: PANEL.height }}
          />
          <EquationStack lines={slide.lines} step={buildStep} className="tof-quadrature-stack" />
        </div>
        <div className="tof-quadrature-right">
          <PhasorPlane
            width={PLANE.width}
            height={PLANE.height}
            radius={frame.radius}
            arrows={arrows}
            arc={frame.sum > 0.5 ? { angle: phaseOf(measured), tone: 'text', label: '$\\phi$' } : null}
          />
          <Readout items={checks} columns="repeat(2, 166px)" className="tof-quadrature-readout" />
        </div>
      </div>
    </div>
  );
}
