import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { ease, useAnimation, useStageCanvas, useStepTransition } from '../canvas/canvas.js';
import EquationStack from '../equations/EquationStack.jsx';
import { CLOUD_EXTENT, cloudBlobs, cloudRay, createCloud, renderCloud } from '../volume/cloud.js';
import {
  PIXEL_GAIN, drawCloudPanel, drawPixel, drawRayLine, figureGeometry, worldToPanel,
} from '../volume/cloudFigure.js';
import {
  VOLUME_COLORS, drawAxes, glowDot, linear, plotScale, radianceCss, rgba, themeColors,
} from '../volume/draw.js';
import { useFigureSize } from '../volume/figure.js';
import { densityGradients, luminance } from '../volume/gradient.js';
import { cellsAround, composite, uniformSamples } from '../volume/ray.js';
import './VolumeGradient.css';

/** The ray through the core, as on the quadrature slide: camera pixel 8 of 16. */
const RAY_Y = 1 - 8.5 / 16;
/** How long the second march takes to cross the ray, in ms. */
const MARCH_MS = 2400;
/** The build steps: the forward march, the gradient, and the second march. */
const STEP = { forward: 0, gradient: 1, march: 2 };
/** The top of the terms plot, as a multiple of Ĉ (luminance), so the color behind the first sample fits. */
const TERMS_RANGE = 1.08;

/**
 * The gradient of NeRF's quadrature on one ray, beside its derivation: the
 * glowing cloud and the ray's samples; the terms Tᵢαᵢcᵢ of the forward march
 * as bars in their sample's color; the derivative ∂Ĉ/∂σᵢ of each sample
 * (luminance, signed) from the gradient step on; and in the last step the
 * second march, which moves from the camera to the back and draws the color
 * behind each sample, Ĉ − Ĉ≤ᵢ, the running sum of the terms from the back.
 *
 * Slide fields: `lines` (`{ tex, label? }`, slide text, one per build step,
 * kept in place by EquationStack), `samples` (how many evenly spaced
 * samples), `surfaceWidth` and `coreDensity` (the cloud, see `cloudBlobs`),
 * and three build steps.
 */
export default function VolumeGradient({ slide, buildStep }) {
  if (!(slide.samples > 0 && slide.surfaceWidth > 0 && slide.coreDensity > 0)) {
    throw new Error(`volumeGradient: slide "${slide.id}" needs "samples", "surfaceWidth", and "coreDensity"`);
  }
  if (slide.lines?.length !== 3) throw new Error(`volumeGradient: slide "${slide.id}" needs three "lines"`);
  const [colors, setColors] = useState(null);
  const [figureRef, size] = useFigureSize();
  const [canvasRef, ratio] = useStageCanvas();
  const marchRef = useRef(1);
  const from = useStepTransition(buildStep);
  useLayoutEffect(() => setColors(themeColors(canvasRef.current, [...VOLUME_COLORS, 'ink-adjoint'])), [canvasRef]);

  const geometry = useMemo(() => figureGeometry(size), [size]);

  const scene = useMemo(() => {
    if (!colors) return null;
    const blobs = cloudBlobs({ edge: slide.surfaceWidth, coreDensity: slide.coreDensity });
    const cloud = createCloud(blobs.map((blob) => ({ ...blob, color: linear(colors[`light-${blob.role}`]) })));
    const field = cloudRay(cloud, RAY_Y);
    const result = composite(field, cellsAround(uniformSamples(slide.samples, field.near, field.far), field.near, field.far));
    const marches = densityGradients(result);
    return {
      image: renderCloud(cloud, 400, 100),
      result,
      terms: result.terms.map((term, i) => ({
        ...term,
        value: luminance(term.color) * term.weight,
        behind: luminance(marches[i].behind),
        gradient: luminance(marches[i].gradient),
      })),
      total: luminance(result.color),
    };
  }, [colors, slide.samples, slide.surfaceWidth, slide.coreDensity]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !colors || !scene || geometry.width === 0) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, geometry.width, geometry.height);
    const { panel, upper, lower } = geometry;
    const xRange = [CLOUD_EXTENT.near, CLOUD_EXTENT.far];
    // How far the second march has gone along the ray (world units), when it is shown.
    const march = buildStep >= STEP.march ? xRange[0] + ease(marchRef.current) * (xRange[1] - xRange[0]) : null;

    drawCloudPanel(ctx, geometry, scene.image.seen, scene.image, colors);
    const [, yRay] = worldToPanel(panel, CLOUD_EXTENT.near, RAY_Y);
    drawRayLine(ctx, panel, RAY_Y);
    for (const term of scene.terms) glowDot(ctx, worldToPanel(panel, term.t, RAY_Y), colors['light-0'], 2.4, 0.9);
    if (march !== null && marchRef.current < 1) {
      const [x] = worldToPanel(panel, march, RAY_Y);
      ctx.save();
      ctx.strokeStyle = rgba(colors['light-0']);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, yRay, 8, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }
    drawPixel(ctx, geometry, yRay, 26, scene.result.color, colors['text-primary'], true);

    // The forward march: each term Tᵢαᵢcᵢ as a bar in its sample's color, on the scale of Ĉ.
    const terms = plotScale(upper, xRange, [0, TERMS_RANGE * scene.total]);
    for (const term of scene.terms) {
      if (term.value < 1e-4 * scene.total) continue;
      const left = terms.x(term.start) + 1;
      const width = Math.max(1, terms.x(term.end) - terms.x(term.start) - 2);
      ctx.fillStyle = radianceCss(term.color, PIXEL_GAIN);
      ctx.fillRect(left, terms.y(term.value), width, terms.y(0) - terms.y(term.value));
      ctx.strokeStyle = rgba(colors['text-secondary'], 0.5);
      ctx.lineWidth = 1;
      ctx.strokeRect(left + 0.5, terms.y(term.value) + 0.5, width - 1, terms.y(0) - terms.y(term.value) - 0.5);
    }
    // The second march: the color behind each sample, drawn as far as the march has gone.
    if (march !== null) {
      ctx.save();
      ctx.strokeStyle = rgba(colors['text-primary']);
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      for (const term of scene.terms) {
        if (term.start >= march) break;
        const end = Math.min(term.end, march);
        if (!started) ctx.moveTo(terms.x(term.start), terms.y(term.behind));
        else ctx.lineTo(terms.x(term.start), terms.y(term.behind));
        ctx.lineTo(terms.x(end), terms.y(term.behind));
        started = true;
      }
      ctx.stroke();
      ctx.restore();
    }
    drawAxes(ctx, upper, colors['text-muted']);

    // The gradient: ∂Ĉ/∂σᵢ, signed, about a zero line.
    if (buildStep >= STEP.gradient) {
      const largest = 1.1 * Math.max(...scene.terms.map((term) => Math.abs(term.gradient)));
      const gradient = plotScale(lower, xRange, [-largest, largest]);
      ctx.fillStyle = rgba(colors['ink-adjoint'], 0.85);
      for (const term of scene.terms) {
        const left = gradient.x(term.start) + 1;
        const width = Math.max(1, gradient.x(term.end) - gradient.x(term.start) - 2);
        const top = Math.min(gradient.y(term.gradient), gradient.y(0));
        ctx.fillRect(left, top, width, Math.abs(gradient.y(term.gradient) - gradient.y(0)));
      }
      ctx.strokeStyle = rgba(colors['text-muted'], 0.9);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lower.x, gradient.y(0) + 0.5);
      ctx.lineTo(lower.x + lower.width, gradient.y(0) + 0.5);
      ctx.moveTo(lower.x + 0.5, lower.y);
      ctx.lineTo(lower.x + 0.5, lower.y + lower.height);
      ctx.stroke();
    }
  }, [canvasRef, colors, scene, geometry, ratio, buildStep]);

  // The march runs once when the slide steps forward into it; otherwise it is drawn complete.
  useAnimation(buildStep, buildStep === STEP.march && from === STEP.gradient ? MARCH_MS : 0, (progress) => {
    marchRef.current = progress;
    draw();
  });
  useLayoutEffect(draw, [draw]);

  const { panel, upper, lower } = geometry;
  return (
    <div className="slide--volume-gradient">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="volume-gradient-body">
        <div className="volume-gradient-figure" ref={figureRef}>
          <canvas
            ref={canvasRef}
            className="volume-gradient-canvas"
            width={Math.round(geometry.width * ratio)}
            height={Math.round(geometry.height * ratio)}
            style={{ width: geometry.width, height: geometry.height }}
          />
          {geometry.width > 0 && (
            <>
              <span className="volume-gradient-label" style={{ top: panel.height * (1 - RAY_Y / CLOUD_EXTENT.height) + 20, width: geometry.gutter - 12 }}>
                <Text>{'$\\hat C$'}</Text>
              </span>
              <span className="volume-gradient-label" style={{ top: upper.y + 4, width: geometry.gutter - 12 }}>
                <Text>{'$T_i\\alpha_i c_i$'}</Text>
              </span>
              {scene && (
                <span
                  className="volume-gradient-note"
                  style={{
                    left: upper.x + 10,
                    top: upper.y + upper.height * (1 - scene.terms[0].behind / (TERMS_RANGE * scene.total)) + 8,
                    visibility: buildStep >= STEP.march ? 'visible' : 'hidden',
                  }}
                >
                  <Text>{'$\\hat C - \\hat C_{\\le i}$'}</Text>
                </span>
              )}
              <span
                className="volume-gradient-label volume-gradient-label--adjoint"
                style={{ top: lower.y + 4, width: geometry.gutter - 12, visibility: buildStep >= STEP.gradient ? 'visible' : 'hidden' }}
              >
                <Text>{'$\\dfrac{\\partial \\hat C}{\\partial \\sigma_i}$'}</Text>
              </span>
              <span className="volume-gradient-axis" style={{ left: geometry.width - 16, top: lower.y + lower.height + 2 }}>
                <Text>{'$t$'}</Text>
              </span>
            </>
          )}
        </div>
        <EquationStack lines={slide.lines} step={buildStep} className="volume-gradient-lines" />
      </div>
    </div>
  );
}
