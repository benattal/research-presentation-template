import { useEffect, useMemo, useRef, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { Slider } from '@core/stage/Controls.jsx';
import { useAnimation, useStageCanvas } from '@core/stage/canvas.js';
import {
  clearPanel, dashedLine, drawDevice, drawSurface, glowLine, panelLabel, rgba, sceneTransform, themeColors,
} from '../activeSensing/draw.js';
import {
  PROJECTOR_SCENE, cameraSamples, projectorIrradiance, projectorLightImage, structuredLightQuadrature,
} from './projection.js';
import './ProjectorQuadrature.css';

/** The render panel, in stage pixels, and the part of the scene it shows, in meters. */
const PANEL = { width: 850, height: 456 };
const BOUNDS = { x0: -0.05, x1: 4.45, y0: -0.18, y1: 2.6 };

/** The scene-to-panel mapping, and the part of the scene the whole panel covers (wider than BOUNDS). */
const TRANSFORM = sceneTransform(BOUNDS, { x: 0, y: 0, ...PANEL });
const [VIEW_X0, VIEW_Y1] = TRANSFORM.toScene([0, 0]);
const [VIEW_X1, VIEW_Y0] = TRANSFORM.toScene([PANEL.width, PANEL.height]);
const VIEW = { x0: VIEW_X0, x1: VIEW_X1, y0: VIEW_Y0, y1: VIEW_Y1 };

/** Stage pixels per cell of the projector-light image; the stripes are antialiased within each cell. */
const CELL = 2;

/** Samples along the camera ray. */
const SAMPLE_COUNT = 40;

/** Faint scattering by the air (1/m), so the projector's beams show. */
const AIR_SCATTERING = 0.01;

/** The plot of the quadrature's terms beside the panel, in stage pixels. */
const TERMS_PLOT = { width: 280, height: 190, top: 34, bottom: 30, left: 6 };

const PROJECTIONS = ['none', 'one', 'all'];
const COLORS = ['render-bg', 'bg-elevated', 'text-muted', 'light-0', 'adjoint', 'medium'];

function stepState(slide, buildStep) {
  const step = slide.buildSteps?.[buildStep];
  if (typeof step?.cameraRay !== 'boolean' || !PROJECTIONS.includes(step.projection)) {
    throw new Error(`projectorQuadrature: build step ${buildStep} needs "cameraRay" and "projection" (${PROJECTIONS.join(', ')})`);
  }
  return step;
}

/** Display brightness of linear light: exposure, soft shoulder, gamma. */
function toneMap(value, gain) {
  return (1 - Math.exp(-Math.max(0, value) * gain)) ** (1 / 2.2);
}

/** Draw the projector's light image (cell values) as a glow: a sharp pass and a soft bloom. */
function drawLight(ctx, scratch, values, columns, rows, color, gain) {
  const image = scratch.getContext('2d').createImageData(columns, rows);
  for (let cell = 0; cell < values.length; cell += 1) {
    const v = toneMap(values[cell], gain);
    image.data[cell * 4] = color[0] * v;
    image.data[cell * 4 + 1] = color[1] * v;
    image.data[cell * 4 + 2] = color[2] * v;
    image.data[cell * 4 + 3] = 255;
  }
  scratch.getContext('2d').putImageData(image, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.filter = 'blur(1.2px)';
  ctx.drawImage(scratch, 0, 0, PANEL.width, PANEL.height);
  ctx.globalAlpha = 0.4;
  ctx.filter = 'blur(12px)';
  ctx.drawImage(scratch, 0, 0, PANEL.width, PANEL.height);
  ctx.restore();
}

/**
 * Structured light as a quadrature: a projector casts stripes on a scene
 * with an opaque box and a translucent blob; each sample of a camera ray
 * is lit by the projector pixel it projects to, P(xᵢ), with the 1/r²
 * falloff and the transmittance Tᵖᵢ toward the projector, so the terms
 * have the shadows the picture of the light has (Shandilya et al. set
 * Tᵖᵢ = 1). Build steps (`buildSteps` entries `{ cameraRay, projection }`)
 * show the pattern, one sample's projection to the projector, then every
 * sample's term: each sample's dot is sized by its term, and a bar plot
 * beside the panel shows the terms in order along the ray, which sum to
 * the pixel m. The slide's `equation` is shown over the panel, with
 * optional short `equationLabels` beside it, one per line.
 * Sliders set the stripe count and the camera pixel. The light image
 * covers the whole panel with the scene's own mapping, so the beams start
 * at the projector. Steps fade in when the slide moves between them, not
 * when it is entered.
 */
export default function ProjectorQuadrature({ slide, buildStep }) {
  const step = stepState(slide, buildStep);
  const [stripes, setStripes] = useState(slide.stripes);
  const [floorX, setFloorX] = useState(slide.pixelFloorX);
  const [reveal, setReveal] = useState({ step: buildStep, progress: 1 });
  const [canvasRef, ratio] = useStageCanvas();
  const scratch = useRef(null);
  // The step the slide was entered at shows settled; moving between steps fades the new one in.
  const enteredAt = useRef(buildStep);
  const moved = useRef(false);
  if (buildStep !== enteredAt.current) moved.current = true;

  useAnimation(buildStep, moved.current ? 900 : 0, (progress) => setReveal({ step: buildStep, progress }));
  const fade = reveal.step === buildStep ? reveal.progress : 0;

  const columns = Math.round(PANEL.width / CELL);
  const rows = Math.round(PANEL.height / CELL);
  const light = useMemo(
    () => projectorLightImage(PROJECTOR_SCENE, stripes, VIEW, columns, rows, AIR_SCATTERING),
    [stripes, columns, rows],
  );
  const samples = useMemo(() => cameraSamples(PROJECTOR_SCENE, floorX, SAMPLE_COUNT), [floorX]);
  const quadrature = useMemo(() => structuredLightQuadrature(PROJECTOR_SCENE, samples, stripes), [samples, stripes]);
  const highlighted = quadrature.terms.reduce((best, term, i) => (term.weight > quadrature.terms[best].weight ? i : best), 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const colors = themeColors(canvas, COLORS);
    const { toCanvas } = TRANSFORM;
    const { blob, box, floor, projector, camera } = PROJECTOR_SCENE;
    const gain = 9;
    clearPanel(ctx, PANEL.width, PANEL.height, colors['render-bg']);

    if (!scratch.current) scratch.current = document.createElement('canvas');
    scratch.current.width = columns;
    scratch.current.height = rows;
    drawLight(ctx, scratch.current, light, columns, rows, colors['light-0'], gain);

    // The blob: a faint haze where the medium is; the light it scatters is in the image above.
    const blobAt = toCanvas(blob.center);
    const blobRadius = blob.radius * (toCanvas([1, 0])[0] - toCanvas([0, 0])[0]);
    const haze = ctx.createRadialGradient(...blobAt, 0, ...blobAt, blobRadius);
    haze.addColorStop(0, rgba(colors.medium, 0.3));
    haze.addColorStop(0.55, rgba(colors.medium, 0.13));
    haze.addColorStop(1, rgba(colors.medium, 0));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = haze;
    ctx.beginPath();
    ctx.arc(...blobAt, blobRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Surfaces: the box as a dark solid, and every surface lit by the stripes that reach it.
    ctx.save();
    ctx.fillStyle = rgba(colors['render-bg']);
    const [bx0, by1] = toCanvas([box.x0, box.y1]);
    const [bx1, by0] = toCanvas([box.x1, box.y0]);
    ctx.fillRect(bx0, by1, bx1 - bx0, by0 - by1);
    ctx.restore();
    const surfaces = [
      { a: [floor.x0, 0], b: [box.x0, 0], normal: [0, 1], albedo: floor.albedo },
      { a: [box.x1, 0], b: [floor.x1, 0], normal: [0, 1], albedo: floor.albedo },
      { a: [box.x0, 0], b: [box.x0, box.y1], normal: [-1, 0], albedo: box.albedo },
      { a: [box.x0, box.y1], b: [box.x1, box.y1], normal: [0, 1], albedo: box.albedo },
      { a: [box.x1, box.y1], b: [box.x1, 0], normal: [1, 0], albedo: box.albedo },
    ];
    for (const { a, b, normal, albedo } of surfaces) {
      drawSurface(ctx, toCanvas(a), toCanvas(b), colors['text-muted'], { width: 3, alpha: 0.5 });
      const pieces = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.012);
      for (let k = 0; k < pieces; k += 1) {
        const p0 = [a[0] + ((b[0] - a[0]) * k) / pieces, a[1] + ((b[1] - a[1]) * k) / pieces];
        const p1 = [a[0] + ((b[0] - a[0]) * (k + 1)) / pieces, a[1] + ((b[1] - a[1]) * (k + 1)) / pieces];
        const mid = [(p0[0] + p1[0]) / 2 + normal[0] * 0.01, (p0[1] + p1[1]) / 2 + normal[1] * 0.01];
        const toLight = [projector.position[0] - mid[0], projector.position[1] - mid[1]];
        const cosine = Math.max(0, (toLight[0] * normal[0] + toLight[1] * normal[1]) / Math.hypot(...toLight));
        const value = toneMap(albedo * cosine * projectorIrradiance(PROJECTOR_SCENE, mid, stripes), gain);
        if (value < 0.02) continue;
        glowLine(ctx, toCanvas(p0), toCanvas(p1), colors['light-0'], { width: 4, intensity: value, halo: 10 });
      }
    }

    const projectorAt = toCanvas(projector.position);
    const axis = [projector.target[0] - projector.position[0], projector.target[1] - projector.position[1]];
    drawDevice(ctx, projectorAt, Math.atan2(-axis[1], axis[0]), colors['bg-elevated']);
    panelLabel(ctx, 'projector', [projectorAt[0] + 26, projectorAt[1] - 8], colors['bg-elevated'], { alpha: 0.7 });

    const cameraAt = toCanvas(camera.position);
    const look = [floorX - camera.position[0], -camera.position[1]];
    drawDevice(ctx, cameraAt, Math.atan2(-look[1], look[0]), colors['bg-elevated']);
    panelLabel(ctx, 'camera', [cameraAt[0] - 26, cameraAt[1] - 8], colors['bg-elevated'], { align: 'right', alpha: 0.7 });

    if (!step.cameraRay) return;
    const rayFade = step.projection === 'none' ? fade : 1;
    const last = samples[samples.length - 1].point;
    glowLine(ctx, cameraAt, toCanvas(last), colors.adjoint, { width: 1.5, intensity: 0.55 * rayFade, halo: 6 });

    // One sample's projection: the line to the projector's center of projection, through the pixel P(xᵢ) that lights it.
    if (step.projection === 'one') {
      dashedLine(ctx, projectorAt, toCanvas(samples[highlighted].point), colors['bg-elevated'], { alpha: 0.75 * fade, width: 1.2, dash: [5, 5] });
    }

    // Each sample is a dot on the camera ray; with every term shown, its area grows with its term.
    const brightest = Math.max(...quadrature.terms.map((term) => term.contribution), 1e-12);
    samples.forEach(({ point }, i) => {
      const p = toCanvas(point);
      const term = quadrature.terms[i];
      const share = step.projection === 'all' ? term.contribution / brightest : 0;
      const radius = 2 + fade * 7 * Math.sqrt(share);
      ctx.save();
      if (share > 0.02) {
        ctx.fillStyle = rgba(colors['render-bg'], 0.7 * rayFade);
        ctx.beginPath();
        ctx.arc(...p, radius + 1.5, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.fillStyle = rgba(colors.adjoint, (share > 0.02 ? 0.95 : 0.6) * rayFade);
      ctx.beginPath();
      ctx.arc(...p, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
      if (step.projection === 'one' && i === highlighted) {
        ctx.save();
        ctx.strokeStyle = rgba(colors['bg-elevated'], 0.9 * fade);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(...p, 9, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
      }
    });
  });

  const largestTerm = Math.max(...quadrature.terms.map((entry) => entry.contribution), 1e-12);
  const barPitch = (TERMS_PLOT.width - TERMS_PLOT.left) / samples.length;
  const barBase = TERMS_PLOT.height - TERMS_PLOT.bottom;

  return (
    <div className="slide--projector-quadrature">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="projector-quadrature-equation">
        <Text>{slide.equation}</Text>
        {slide.equationLabels && (
          <span className="projector-quadrature-equation-labels">
            {slide.equationLabels.map((label) => <span key={label} className="projector-quadrature-equation-label"><Text>{label}</Text></span>)}
          </span>
        )}
      </div>
      <div className="projector-quadrature-body">
        <canvas
          ref={canvasRef}
          className="projector-quadrature-panel"
          width={PANEL.width * ratio}
          height={PANEL.height * ratio}
          style={{ width: PANEL.width, height: PANEL.height }}
        />
        <div className="projector-quadrature-side">
          <div
            className="projector-quadrature-terms"
            style={{ width: TERMS_PLOT.width, height: TERMS_PLOT.height, opacity: step.projection === 'all' ? fade : 0 }}
            aria-hidden={step.projection !== 'all'}
          >
            <svg width={TERMS_PLOT.width} height={TERMS_PLOT.height}>
              {quadrature.terms.map((entry, i) => {
                const top = barBase - (entry.contribution / largestTerm) * (barBase - TERMS_PLOT.top);
                return (
                  <rect
                    key={samples[i].t}
                    className="projector-quadrature-term"
                    x={TERMS_PLOT.left + i * barPitch + 0.75}
                    y={top}
                    width={Math.max(1, barPitch - 1.5)}
                    height={barBase - top}
                  />
                );
              })}
              <line className="projector-quadrature-axis" x1={TERMS_PLOT.left} y1={barBase} x2={TERMS_PLOT.width} y2={barBase} />
              <line className="projector-quadrature-axis" x1={TERMS_PLOT.left} y1={TERMS_PLOT.top - 10} x2={TERMS_PLOT.left} y2={barBase} />
            </svg>
            <span className="projector-quadrature-terms-label" style={{ left: TERMS_PLOT.left + 10, top: TERMS_PLOT.top - 22 }}>terms</span>
            <span className="projector-quadrature-terms-label projector-quadrature-terms-label--axis" style={{ left: TERMS_PLOT.width, top: barBase + 16 }}><Text>{'$t$'}</Text></span>
          </div>
          <div className="projector-quadrature-sliders">
            <Slider label="stripes" value={stripes} min={4} max={20} step={2} onChange={setStripes} format={(count) => `${count}`} />
            <Slider label="camera ray" value={floorX} min={0.9} max={3.7} step={0.05} onChange={setFloorX} format={() => ''} />
          </div>
        </div>
      </div>
    </div>
  );
}
