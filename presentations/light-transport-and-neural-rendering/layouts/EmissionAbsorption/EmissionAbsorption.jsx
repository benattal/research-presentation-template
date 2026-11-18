import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { ease, useAnimation, useStageCanvas } from '@core/stage/canvas.js';
import { CLOUD_EXTENT, cloudBlobs, cloudRay, createCloud, renderCloud } from '../volume/cloud.js';
import {
  PIXEL_GAIN, drawCloudPanel, drawPixel, drawRayLine, figureGeometry,
} from '../volume/cloudFigure.js';
import {
  drawAxes, fillSeries, linear, plotScale, radianceCss, rgba, strokeSeries, themeColors,
} from '../volume/draw.js';
import { useFigureSize } from '../volume/figure.js';
import { rayProfile, referenceIntegral } from '../volume/ray.js';
import './EmissionAbsorption.css';

/** The camera's pixels, one ray each, top to bottom. */
const PIXELS = 16;
const CURVES = ['density', 'transmittance', 'contribution'];

function pixelY(pixel) {
  return CLOUD_EXTENT.height * (1 - (pixel + 0.5) / PIXELS);
}

/**
 * The glowing cloud rendered with the emission–absorption model: every
 * camera pixel is one ray, C = ∫ T σ c dt along it. One ray is highlighted
 * with its σ(t), T(t), and T(t)σ(t) filled with its color c(t), on plots
 * aligned under it. Once the contribution is shown, the panel shows Tσc,
 * the light of each point that reaches the camera, instead of σc.
 *
 * Each build step is `{ curves: [...] }`, a subset of 'density',
 * 'transmittance', 'contribution'; the Tσc plot's axes appear with the
 * contribution. Slide fields: `surfaceWidth` and `coreDensity` (the core's,
 * see `cloudBlobs`), `pixel` (the highlighted pixel, 0–15 from the top),
 * `equations` (display math beside the figure), and the optional short
 * labels `assumptions` (above the equations) and `remarks` (below them).
 * Drag up and down on the figure to pick a ray.
 */
export default function EmissionAbsorption({ slide, buildStep }) {
  const step = slide.buildSteps?.[buildStep];
  if (!step?.curves?.every((curve) => CURVES.includes(curve))) {
    throw new Error(`emissionAbsorption: build step ${buildStep} of "${slide.id}" needs "curves" from ${CURVES.join(', ')}`);
  }
  if (!(slide.surfaceWidth > 0 && slide.coreDensity > 0)) {
    throw new Error(`emissionAbsorption: slide "${slide.id}" needs "surfaceWidth" and "coreDensity"`);
  }
  if (!Number.isInteger(slide.pixel)) throw new Error(`emissionAbsorption: slide "${slide.id}" needs "pixel"`);

  const [pixel, setPixel] = useState(slide.pixel);
  const [colors, setColors] = useState(null);
  const [figureRef, size] = useFigureSize();
  const [canvasRef, ratio] = useStageCanvas();
  const progressRef = useRef(1);
  const dragRef = useRef(false);
  const previousCurvesRef = useRef(step.curves);
  const stepRef = useRef(buildStep);
  if (stepRef.current !== buildStep) {
    // A new step starts its reveal from nothing, also in the draw before its animation's first frame.
    stepRef.current = buildStep;
    progressRef.current = 0;
  }
  const shown = new Set(step.curves);

  useLayoutEffect(() => setColors(themeColors(canvasRef.current)), [canvasRef]);

  const geometry = useMemo(() => figureGeometry(size), [size]);

  const cloud = useMemo(() => {
    if (!colors) return null;
    const blobs = cloudBlobs({ edge: slide.surfaceWidth, coreDensity: slide.coreDensity });
    return createCloud(blobs.map((blob) => ({ ...blob, color: linear(colors[`light-${blob.role}`]) })));
  }, [colors, slide.surfaceWidth, slide.coreDensity]);

  const image = useMemo(() => cloud && renderCloud(cloud, 400, 100), [cloud]);

  const pixels = useMemo(() => cloud && Array.from({ length: PIXELS }, (_, i) => (
    referenceIntegral(cloudRay(cloud, pixelY(i)), 6000)
  )), [cloud]);

  const ray = useMemo(() => {
    if (!cloud) return null;
    return { profile: rayProfile(cloudRay(cloud, pixelY(pixel)), 900) };
  }, [cloud, pixel]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ray || geometry.width === 0) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, geometry.width, geometry.height);
    const previous = new Set(previousCurvesRef.current);
    const progress = ease(progressRef.current);
    // A curve added by this step draws in from the camera outward; the others are settled.
    const reveal = (curve) => (previous.has(curve) ? 1 : progress);
    const { panel, upper, lower } = geometry;

    if (shown.has('contribution')) {
      const blend = reveal('contribution');
      drawCloudPanel(ctx, geometry, image.emitted, image, colors, 1 - blend);
      ctx.save();
      ctx.globalAlpha = blend;
      drawCloudPanel(ctx, geometry, image.seen, image, colors);
      ctx.restore();
    } else {
      drawCloudPanel(ctx, geometry, image.emitted, image, colors);
    }
    drawRayLine(ctx, panel, pixelY(pixel), 0.7);
    const pixelSize = panel.height / PIXELS;
    pixels.forEach((result, i) => {
      const centerY = panel.y + (i + 0.5) * pixelSize;
      drawPixel(ctx, geometry, centerY, pixelSize - 1, result.color, colors['text-primary'], i === pixel);
    });

    const xRange = [CLOUD_EXTENT.near, CLOUD_EXTENT.far];
    const { profile } = ray;
    const count = (curve) => Math.round(reveal(curve) * profile.t.length);

    const sigma = plotScale(upper, xRange, [0, 1.08 * Math.max(...profile.density, 1e-6)]);
    const transmittance = plotScale(upper, xRange, [0, 1.08]);
    if (shown.has('density')) {
      const visible = count('density');
      fillSeries(ctx, sigma, profile.t, profile.density, rgba(colors['ink-medium'], 0.16), visible);
      strokeSeries(ctx, sigma, profile.t, profile.density, { color: rgba(colors['ink-medium']), width: 2 }, visible);
    }
    if (shown.has('transmittance')) {
      const style = { color: rgba(colors['text-primary']), width: 2.5 };
      strokeSeries(ctx, transmittance, profile.t, profile.transmittance, style, count('transmittance'));
    }
    drawAxes(ctx, upper, colors['text-muted']);

    if (shown.has('contribution')) {
      const weight = plotScale(lower, xRange, [0, 1.08 * Math.max(...profile.weight, 1e-6)]);
      const visible = count('contribution');
      for (let i = 1; i < visible; i += 1) {
        // Each slice of the area under Tσ takes the color c(t) of its point, as the pixel shows it.
        ctx.fillStyle = radianceCss(profile.color[i], PIXEL_GAIN);
        const left = weight.x(profile.t[i - 1]);
        const right = weight.x(profile.t[i]);
        const top = weight.y(profile.weight[i]);
        ctx.fillRect(left, top, right - left + 0.6, weight.y(0) - top);
      }
      strokeSeries(ctx, weight, profile.t, profile.weight, { color: rgba(colors['text-primary'], 0.7), width: 1.2 }, visible);
      drawAxes(ctx, lower, colors['text-muted']);
    }
  }, [canvasRef, colors, ray, image, pixels, pixel, geometry, ratio, step]);

  useAnimation(buildStep, 900, (progress) => {
    progressRef.current = progress;
    draw();
    if (progress >= 1) previousCurvesRef.current = step.curves;
  });
  useLayoutEffect(draw, [draw]);

  // The pixel under the pointer, from its height on the cloud panel (the element the handlers sit on).
  const pickRay = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.floor(((event.clientY - box.top) / box.height) * PIXELS);
    if (index >= 0 && index < PIXELS) setPixel(index);
  };

  const label = (curve, math, className, top) => (
    <span className={`emission-label ${className}`} style={{ top, width: geometry.gutter - 12, visibility: shown.has(curve) ? 'visible' : 'hidden' }}>
      <Text>{math}</Text>
    </span>
  );

  return (
    <div className="slide--emission">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="emission-body">
        <div className="emission-figure" ref={figureRef} data-no-swipe>
          <canvas
            ref={canvasRef}
            className="emission-canvas"
            width={Math.round(geometry.width * ratio)}
            height={Math.round(geometry.height * ratio)}
            style={{ width: geometry.width, height: geometry.height }}
          />
          {geometry.width > 0 && (
            <>
              <div
                className="emission-pick"
                style={{ left: 0, top: geometry.panel.y, width: geometry.panel.x + geometry.panel.width, height: geometry.panel.height }}
                onPointerDown={(event) => {
                  dragRef.current = true;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  pickRay(event);
                }}
                onPointerMove={(event) => dragRef.current && pickRay(event)}
                onPointerUp={() => { dragRef.current = false; }}
              />
              {label('density', '$\\sigma$', 'emission-label--density', geometry.upper.y + 4)}
              {label('transmittance', '$T$', '', geometry.upper.y + 34)}
              {label('contribution', '$T\\sigma c$', '', geometry.lower.y + 4)}
              <span className="emission-axis" style={{ left: geometry.width - 16, top: (shown.has('contribution') ? geometry.lower : geometry.upper).y + geometry.upper.height + 2 }}>
                <Text>{'$t$'}</Text>
              </span>
            </>
          )}
        </div>
        <div className="emission-side">
          {slide.assumptions?.map((label) => (
            <div key={label} className="emission-side-label"><Text>{label}</Text></div>
          ))}
          {slide.equations.map((equation) => (
            <div key={equation} className="emission-equation"><Text>{equation}</Text></div>
          ))}
          {slide.remarks?.map((label) => (
            <div key={label} className="emission-side-label"><Text>{label}</Text></div>
          ))}
        </div>
      </div>
    </div>
  );
}
