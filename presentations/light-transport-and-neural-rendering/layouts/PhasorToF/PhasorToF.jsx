import { useEffect, useMemo, useRef, useState } from 'react';
import Media from '@core/stage/Media.jsx';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import { Readout, Slider } from '../activeSensing/Controls.jsx';
import PhasorPlane from '../activeSensing/PhasorPlane.jsx';
import {
  clearPanel, dashedLine, drawDevice, drawSurface, glowLine, glowSpot, panelLabel, sceneTransform, themeColors,
} from '../activeSensing/draw.js';
import {
  ambiguityDistance, depthFromPhase, phaseOf, phasor, sumPhasors,
} from '../activeSensing/measurement.js';
import { ease, useAnimation, useStageCanvas } from '../canvas/canvas.js';
import { PHASOR_SCENE, clampMirror, directReturn, mirrorReturn } from './multipath.js';
import './PhasorToF.css';

/** The render panel and the complex plane, in stage pixels. */
const PANEL = { width: 500, height: 262 };
const PLANE = { width: 440, height: 412 };

/** The part of the scene the panel shows, in meters. */
const BOUNDS = { x0: -0.45, x1: 3.3, y0: -1.41, y1: 0.56 };

/** The complex plane's dashed circle, in units of the source's intensity: 1.3× the direct return. */
const PLANE_RADIUS = 1.3 * directReturn(PHASOR_SCENE, 1).amplitude;

/** Grab distance around the mirror, in stage pixels. */
const GRAB_DISTANCE = 16;

const COLORS = ['render-bg', 'bg-elevated', 'text-muted', 'light-0', 'light-1', 'light-3'];

function stepState(slide, buildStep) {
  const step = slide.buildSteps?.[buildStep];
  if (typeof step?.frequencyMHz !== 'number' || typeof step.mirror !== 'boolean') {
    throw new Error(`phasorToF: build step ${buildStep} needs "frequencyMHz" and "mirror"`);
  }
  return step;
}

function formatDepth(meters) {
  return `${meters.toFixed(2)} m`;
}

function formatDegrees(radians) {
  return `${Math.round((radians * 180) / Math.PI)}°`;
}

/**
 * A continuous-wave time-of-flight pixel: `figure` (a media item, usually
 * borrowed and credited through the slide's `credits`) shows the emitted
 * and received modulation above a panel with a camera and source beside
 * each other and a ray to a wall; the returns are drawn as phasors in the
 * complex plane. Each build step (`buildSteps` entries `{ frequencyMHz,
 * mirror }`) sets the modulation frequency and whether a mirror adds a
 * second path; the frequency slider and dragging the mirror explore
 * further. The check reads the depth recovered from the phase against the
 * true depth.
 */
export default function PhasorToF({ slide, buildStep }) {
  const step = stepState(slide, buildStep);
  if (!slide.figure?.src) throw new Error('phasorToF: the slide needs "figure", a media item');
  const [frequency, setFrequency] = useState(step.frequencyMHz * 1e6);
  const [mirrorShown, setMirrorShown] = useState(step.mirror ? 1 : 0);
  const [mirrorCenter, setMirrorCenter] = useState(PHASOR_SCENE.mirror.center);
  const [canvasRef, ratio] = useStageCanvas();
  const drag = useRef(null);

  // Each step animates from what was on screen when it began.
  const current = useRef({ frequency, mirrorShown });
  current.current = { frequency, mirrorShown };
  const start = useMemo(() => ({ ...current.current }), [buildStep]);
  useEffect(() => setMirrorCenter(PHASOR_SCENE.mirror.center), [buildStep]);
  useAnimation(buildStep, 1800, (progress) => {
    const k = ease(progress);
    setFrequency(start.frequency + (step.frequencyMHz * 1e6 - start.frequency) * k);
    setMirrorShown(start.mirrorShown + ((step.mirror ? 1 : 0) - start.mirrorShown) * k);
  });

  const direct = directReturn(PHASOR_SCENE, frequency);
  const bounce = mirrorShown > 0.01 ? mirrorReturn(PHASOR_SCENE, mirrorCenter, frequency) : null;
  const directPhasor = phasor(direct.amplitude, direct.phase);
  const bouncePhasor = bounce ? phasor(bounce.amplitude * mirrorShown, bounce.phase) : [0, 0];
  const measured = sumPhasors([directPhasor, bouncePhasor]);
  const measuredPhase = phaseOf(measured);
  const reportedDepth = depthFromPhase(measuredPhase, frequency);
  const wrapDistance = ambiguityDistance(frequency);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const colors = themeColors(canvas, COLORS);
    const { toCanvas } = sceneTransform(BOUNDS, { x: 0, y: 0, ...PANEL });
    const { depth, bottom, top } = PHASOR_SCENE.wall;
    const camera = [0, 0];
    const wallPoint = [depth, 0];
    clearPanel(ctx, PANEL.width, PANEL.height, colors['render-bg']);

    // Depths that give the same phase as the measurement, every c/2f; the
    // nearest is the one the sensor reports.
    for (let k = -4; k <= 4; k += 1) {
      const candidate = reportedDepth + k * wrapDistance;
      if (candidate < 0.15 || candidate > BOUNDS.x1 - 0.05) continue;
      const a = toCanvas([candidate, -0.42]);
      const b = toCanvas([candidate, 0.42]);
      // Depths read from the phase are measurements: neutral marks, not light.
      if (k === 0) glowLine(ctx, a, b, colors['bg-elevated'], { width: 2, intensity: 0.9, halo: 8 });
      else dashedLine(ctx, a, b, colors['bg-elevated'], { alpha: 0.5 });
      // The label goes right of its mark, or left of it near the panel's right edge, so it stays on the panel.
      const [lx, ly] = toCanvas([candidate, 0.42]);
      const left = lx > PANEL.width - 80;
      panelLabel(ctx, formatDepth(candidate), [left ? lx - 9 : lx + 9, ly + 8], colors['bg-elevated'], {
        alpha: k === 0 ? 0.95 : 0.55, align: left ? 'right' : 'left',
      });
    }

    drawSurface(ctx, toCanvas([depth, bottom]), toCanvas([depth, top]), colors['text-muted'], { alpha: 0.75 });
    panelLabel(ctx, 'wall', toCanvas([depth + 0.08, Math.max(bottom, BOUNDS.y0) + 0.14]), colors['bg-elevated'], { alpha: 0.6 });

    if (mirrorShown > 0) {
      const [mx, my] = mirrorCenter;
      const { halfLength } = PHASOR_SCENE.mirror;
      drawSurface(ctx, toCanvas([mx - halfLength, my]), toCanvas([mx + halfLength, my]), colors['bg-elevated'], { width: 5, alpha: 0.7 * mirrorShown });
      panelLabel(ctx, 'mirror', toCanvas([mx, my - 0.16]), colors['bg-elevated'], { align: 'center', alpha: 0.6 * mirrorShown });
      if (bounce) {
        const q = toCanvas(bounce.point);
        glowLine(ctx, toCanvas(camera), q, colors['light-3'], { width: 2, intensity: 0.75 * mirrorShown });
        glowLine(ctx, q, toCanvas(wallPoint), colors['light-3'], { width: 2, intensity: 0.75 * mirrorShown });
        glowSpot(ctx, q, colors['light-3'], 14, 0.6 * mirrorShown);
      }
    }

    glowLine(ctx, toCanvas(camera), toCanvas(wallPoint), colors['light-1'], { width: 3, intensity: 1 });
    glowSpot(ctx, toCanvas(wallPoint), colors['light-1'], 30, 0.9);
    drawDevice(ctx, toCanvas([-0.03, 0]), 0, colors['bg-elevated']);
    glowSpot(ctx, toCanvas([0.02, 0]), colors['light-0'], 16, 1);
    // Two short lines under the camera, left of the mirror path and the depth marks.
    panelLabel(ctx, 'camera', toCanvas([-0.43, -0.25]), colors['bg-elevated'], { alpha: 0.6 });
    panelLabel(ctx, 'and source', toCanvas([-0.43, -0.42]), colors['bg-elevated'], { alpha: 0.6 });
  }, [canvasRef, ratio, mirrorShown, mirrorCenter, bounce, reportedDepth, wrapDistance]);

  // Dragging the mirror: pointer positions in stage pixels, whatever the stage's scale.
  const toStage = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return [(event.clientX - rect.left) * (canvas.offsetWidth / rect.width), (event.clientY - rect.top) * (canvas.offsetHeight / rect.height)];
  };
  const transform = sceneTransform(BOUNDS, { x: 0, y: 0, ...PANEL });
  const nearMirror = (point) => {
    if (mirrorShown < 0.99) return false;
    const [mx, my] = mirrorCenter;
    const { halfLength } = PHASOR_SCENE.mirror;
    const [ax, ay] = transform.toCanvas([mx - halfLength, my]);
    const [bx] = transform.toCanvas([mx + halfLength, my]);
    return point[0] > ax - GRAB_DISTANCE && point[0] < bx + GRAB_DISTANCE && Math.abs(point[1] - ay) < GRAB_DISTANCE;
  };
  const onPointerDown = (event) => {
    const point = toStage(event);
    if (!nearMirror(point)) return;
    const [sx, sy] = transform.toScene(point);
    drag.current = { offset: [mirrorCenter[0] - sx, mirrorCenter[1] - sy] };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event) => {
    const point = toStage(event);
    if (!drag.current) {
      event.currentTarget.style.cursor = nearMirror(point) ? 'grab' : 'default';
      return;
    }
    const [sx, sy] = transform.toScene(point);
    setMirrorCenter(clampMirror(PHASOR_SCENE, [sx + drag.current.offset[0], sy + drag.current.offset[1]]));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  // Labels go on the outside of the triangle the two returns and their sum make.
  const sumTurnsLeft = directPhasor[0] * measured[1] - directPhasor[1] * measured[0] > 0;
  const arrows = [{
    from: [0, 0], to: directPhasor, tone: 'light-1', width: 3, label: bounce ? 'wall' : 'return', labelAt: bounce ? (sumTurnsLeft ? 'right' : 'left') : 'tip',
  }];
  if (bounce) {
    arrows.push({ from: directPhasor, to: measured, tone: 'light-3', width: 3, label: 'mirror' });
    arrows.push({ from: [0, 0], to: measured, tone: 'text', width: 3.5, label: 'sum', labelAt: sumTurnsLeft ? 'left' : 'right' });
  }

  return (
    <div className="slide--phasor-tof">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="phasor-tof-body">
        <div className="phasor-tof-left" style={{ width: PANEL.width }}>
          <Media item={slide.figure} className="phasor-tof-figure" />
          <canvas
            ref={canvasRef}
            className="phasor-tof-panel"
            width={PANEL.width * ratio}
            height={PANEL.height * ratio}
            style={{ width: PANEL.width, height: PANEL.height }}
            data-no-swipe
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
        <div className="phasor-tof-right">
          <PhasorPlane
            width={PLANE.width}
            height={PLANE.height}
            radius={PLANE_RADIUS}
            arrows={arrows}
            rays={bounce ? [{ angle: direct.phase, tone: 'light-1' }] : []}
            arc={{ angle: measuredPhase, tone: 'text', label: '$\\phi$' }}
          />
          <Readout
            columns={2}
            items={[
              { label: '$\\phi$', value: formatDegrees(measuredPhase) },
              { label: '$\\hat d = c\\phi/4\\pi f$', value: formatDepth(reportedDepth) },
              { label: '$c/2f$', value: formatDepth(wrapDistance) },
              { label: '$d$', value: formatDepth(PHASOR_SCENE.wall.depth) },
            ]}
          />
          <Slider
            label="$f$"
            value={Math.round(frequency / 1e6)}
            min={10}
            max={150}
            step={1}
            onChange={(megahertz) => setFrequency(megahertz * 1e6)}
            format={(megahertz) => `${megahertz} MHz`}
          />
        </div>
      </div>
    </div>
  );
}
