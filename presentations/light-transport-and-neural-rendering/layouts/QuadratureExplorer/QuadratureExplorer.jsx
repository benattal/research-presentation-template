import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { ease, useAnimation, useStageCanvas } from '../canvas/canvas.js';
import { CLOUD_EXTENT, CORE_X, cloudBlobs, cloudRay, createCloud, renderCloud } from '../volume/cloud.js';
import {
  PIXEL_GAIN, drawCloudPanel, drawPixel, drawRayLine, figureGeometry, panelToT, worldToPanel,
} from '../volume/cloudFigure.js';
import {
  VOLUME_COLORS, drawAxes, fillSeries, glowDot, linear, plotScale, radianceCss, rgba, strokeSeries, themeColors,
} from '../volume/draw.js';
import { useFigureSize } from '../volume/figure.js';
import { createRandom } from '../volume/random.js';
import {
  estimate, hierarchicalSamples, randomSamples, rayProfile, referenceIntegral, relativeError, stratifiedSamples, uniformSamples,
} from '../volume/ray.js';
import './QuadratureExplorer.css';

/** Height of the highlighted ray: the center of camera pixel 8 of 16, through the core. */
const RAY_Y = 1 - 8.5 / 16;
/** The sharpness slider spans surface widths from soft to sharp (world units), on a log scale. */
const EDGE_RANGE = [0.2, 0.004];
/** Rays the sampler comparison averages over: rows across the cloud. */
const COMPARISON_RAYS = Array.from({ length: 64 }, (_, i) => 0.2 + (0.55 * (i + 0.5)) / 64);
/** The σ plot's range: the core's surface layer fits, its denser inside is clipped. */
const DENSITY_MAX = 40;
/**
 * Samplers by the name build steps use: each takes the ray's field, the
 * step, and a seeded random source, and returns `{ samples, coarse?, gaps? }`.
 * 'uniform' is evenly spaced midpoints (deterministic); 'random' is
 * independent uniform samples; 'stratified' is one random sample per equal
 * interval; 'hierarchical' is NeRF's coarse-then-fine sampling.
 */
const SAMPLERS = {
  uniform: (field, step) => ({ samples: uniformSamples(step.samples, field.near, field.far) }),
  random: (field, step, random) => ({ samples: randomSamples(step.samples, field.near, field.far, random) }),
  stratified: (field, step, random) => ({ samples: stratifiedSamples(step.samples, field.near, field.far, random) }),
  hierarchical: (field, step, random) => {
    if (!(step.coarse > 0 && step.coarse < step.samples)) throw new Error('A hierarchical step needs "coarse" < "samples"');
    return hierarchicalSamples(field, step.coarse, step.samples - step.coarse, random);
  },
};

function edgeFromSlider(value) {
  const [soft, sharp] = EDGE_RANGE;
  return soft * (sharp / soft) ** value;
}

function sliderFromEdge(edge) {
  const [soft, sharp] = EDGE_RANGE;
  return Math.log(edge / soft) / Math.log(sharp / soft);
}

/**
 * Break marks on a plot's top edge over each stretch where `values` exceed
 * the plotted range `max`: a gap between two short slanted strokes, as on
 * an axis that skips values.
 */
function drawBreaks(ctx, scale, ts, values, max, colors) {
  const runs = [];
  values.forEach((value, i) => {
    if (value <= max) return;
    if (runs.length && runs.at(-1).end === i - 1) runs.at(-1).end = i;
    else runs.push({ start: i, end: i });
  });
  const y = scale.y(max);
  for (const run of runs) {
    const x = (scale.x(ts[run.start]) + scale.x(ts[run.end])) / 2;
    ctx.save();
    ctx.fillStyle = rgba(colors['bg-slide']);
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 7);
    ctx.lineTo(x - 1, y - 7);
    ctx.lineTo(x + 9, y - 7);
    ctx.lineTo(x + 1, y + 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(colors['ink-medium']);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 7);
    ctx.lineTo(x - 1, y - 7);
    ctx.moveTo(x + 1, y + 7);
    ctx.lineTo(x + 9, y - 7);
    ctx.stroke();
    ctx.restore();
  }
}

/** The samples a build step asks for, with the same seed every time. */
function drawSamples(field, step, seed) {
  const sampler = SAMPLERS[step.sampler];
  if (!sampler) throw new Error(`Unknown sampler "${step.sampler}"`);
  if (!(step.samples > 0)) throw new Error('A quadrature step needs "samples"');
  return sampler(field, step, createRandom(seed));
}

/**
 * One ray through the glowing cloud and the piecewise-constant quadrature
 * of its emission–absorption integral: the samples on the ray, σ and its
 * piecewise-constant stand-in, the weights Tᵢαᵢ as bars against the exact
 * weight density Tσ, and the estimate Ĉ against the fine reference C.
 *
 * Each build step is `{ sampler: 'uniform' | 'random' | 'stratified' | 'hierarchical',
 * samples, coarse? }`. Slide fields: `surfaceWidth` (the core's surface
 * width in world units at first), `coreDensity` (see `cloudBlobs`),
 * `equations` (display math beside the figure), and `compareSamplers`
 * (show the error of every sampler in the steps, as the RMS over rays
 * across the cloud). Drag the figure to move the surface; the slider sets
 * its sharpness.
 */
export default function QuadratureExplorer({ slide, buildStep }) {
  const step = slide.buildSteps?.[buildStep];
  if (!step) throw new Error(`quadratureExplorer: slide "${slide.id}" has no build step ${buildStep}`);
  if (!(slide.surfaceWidth > 0 && slide.coreDensity > 0)) {
    throw new Error(`quadratureExplorer: slide "${slide.id}" needs "surfaceWidth" and "coreDensity"`);
  }

  const [edge, setEdge] = useState(slide.surfaceWidth);
  const [coreX, setCoreX] = useState(CORE_X);
  const [colors, setColors] = useState(null);
  const [figureRef, size] = useFigureSize();
  const [canvasRef, ratio] = useStageCanvas();
  const progressRef = useRef(1);
  const dragRef = useRef(false);
  const stepRef = useRef(buildStep);
  if (stepRef.current !== buildStep) {
    // A new step grows its samples and bars from nothing, also in the draw before its animation's first frame.
    stepRef.current = buildStep;
    progressRef.current = 0;
  }

  useLayoutEffect(() => setColors(themeColors(canvasRef.current, [...VOLUME_COLORS, 'bg-slide'])), [canvasRef]);

  const geometry = useMemo(() => figureGeometry(size), [size]);

  const cloud = useMemo(() => {
    if (!colors) return null;
    const blobs = cloudBlobs({ edge, coreDensity: slide.coreDensity, coreX });
    return createCloud(blobs.map((blob) => ({ ...blob, color: linear(colors[`light-${blob.role}`]) })));
  }, [colors, edge, coreX, slide.coreDensity]);

  const image = useMemo(() => cloud && renderCloud(cloud, 400, 100), [cloud]);

  const ray = useMemo(() => {
    if (!cloud) return null;
    const field = cloudRay(cloud, RAY_Y);
    const reference = referenceIntegral(field, 20000);
    const drawn = drawSamples(field, step, 7 + buildStep);
    const result = estimate(field, drawn.samples);
    return {
      drawn,
      reference,
      result,
      error: relativeError(result.color, reference.color),
      profile: rayProfile(field, 900),
    };
  }, [cloud, step, buildStep]);

  const comparison = useMemo(() => {
    if (!cloud || !slide.compareSamplers) return null;
    const rays = COMPARISON_RAYS.map((y) => {
      const field = cloudRay(cloud, y);
      return { field, reference: referenceIntegral(field, 4000).color };
    });
    return slide.buildSteps.map((s, index) => {
      let squared = 0;
      rays.forEach(({ field, reference }, i) => {
        const { samples } = drawSamples(field, s, 1000 * index + i);
        squared += relativeError(estimate(field, samples).color, reference) ** 2;
      });
      return { sampler: s.sampler, error: Math.sqrt(squared / rays.length) };
    });
  }, [cloud, slide.compareSamplers, slide.buildSteps]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !colors || !ray || geometry.width === 0) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, geometry.width, geometry.height);
    const grow = ease(progressRef.current);
    const { panel, upper: density, lower: weights } = geometry;

    drawCloudPanel(ctx, geometry, image.seen, image, colors);

    // The ray, its samples, and the pixel it ends in.
    const [, yRay] = worldToPanel(panel, CLOUD_EXTENT.near, RAY_Y);
    drawRayLine(ctx, panel, RAY_Y);
    const coarse = new Set(ray.drawn.coarse ?? []);
    ray.drawn.samples.forEach((t, i) => {
      const appear = Math.min(1, Math.max(0, grow * 1.6 - (i / ray.drawn.samples.length) * 0.6));
      if (appear <= 0) return;
      const [x] = worldToPanel(panel, t, RAY_Y);
      if (coarse.has(t)) {
        ctx.save();
        ctx.strokeStyle = rgba(colors['light-0'], appear);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, yRay, 4.5, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
      } else {
        glowDot(ctx, [x, yRay], colors['light-0'], 2.6, appear);
      }
    });
    drawPixel(ctx, geometry, yRay, 26, ray.result.color, colors['text-primary'], true);

    const xRange = [CLOUD_EXTENT.near, CLOUD_EXTENT.far];
    const { profile } = ray;

    // σ(t) and its piecewise-constant stand-in σᵢ on each cell.
    const sigma = plotScale(density, xRange, [0, DENSITY_MAX]);
    ctx.save();
    ctx.beginPath();
    ctx.rect(density.x, density.y - 2, density.width, density.height + 2);
    ctx.clip();
    fillSeries(ctx, sigma, profile.t, profile.density, rgba(colors['ink-medium'], 0.14));
    strokeSeries(ctx, sigma, profile.t, profile.density, { color: rgba(colors['ink-medium'], 0.55), width: 1.5 });
    ctx.globalAlpha = grow;
    ctx.strokeStyle = rgba(colors['ink-medium']);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ray.result.terms.forEach((term, i) => {
      const y = sigma.y(term.density);
      if (i === 0) ctx.moveTo(sigma.x(term.start), y);
      else ctx.lineTo(sigma.x(term.start), y);
      ctx.lineTo(sigma.x(term.end), y);
    });
    ctx.stroke();
    ctx.restore();
    drawAxes(ctx, density, colors['text-muted']);
    drawBreaks(ctx, sigma, profile.t, profile.density, DENSITY_MAX, colors);

    // Weights: bars of area Tᵢαᵢ against the exact weight density Tσ.
    const barHeights = ray.result.terms.map((term) => term.weight / Math.max(term.delta, 1e-9));
    const gapHeights = (ray.drawn.gaps ?? []).map((gap) => gap.weight / (gap.end - gap.start));
    const top = 1.08 * Math.max(...profile.weight, ...barHeights, ...gapHeights, 1e-6);
    const w = plotScale(weights, xRange, [0, top]);
    ray.result.terms.forEach((term, i) => {
      const height = barHeights[i] * grow;
      if (term.weight < 1e-5) return;
      // Bars take the color cᵢ of their sample, as the pixel shows it.
      const left = w.x(term.start);
      const right = w.x(term.end);
      const barWidth = Math.max(1, right - left - 1);
      ctx.fillStyle = radianceCss(term.color, PIXEL_GAIN);
      ctx.fillRect(left + 0.5, w.y(height), barWidth, w.y(0) - w.y(height));
      ctx.strokeStyle = rgba(colors['text-secondary'], 0.5);
      ctx.lineWidth = 1;
      ctx.strokeRect(left + 1, w.y(height) + 0.5, barWidth - 1, w.y(0) - w.y(height) - 0.5);
    });
    if (ray.drawn.gaps) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = rgba(colors['text-secondary'], 0.8);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ray.drawn.gaps.forEach((gap, i) => {
        const y = w.y(gap.weight / (gap.end - gap.start));
        if (i === 0) ctx.moveTo(w.x(gap.start), y);
        else ctx.lineTo(w.x(gap.start), y);
        ctx.lineTo(w.x(gap.end), y);
      });
      ctx.stroke();
      ctx.restore();
    }
    strokeSeries(ctx, w, profile.t, profile.weight, { color: rgba(colors['text-primary'], 0.85), width: 1.5 });
    drawAxes(ctx, weights, colors['text-muted']);
  }, [canvasRef, colors, ray, image, geometry, ratio]);

  useAnimation(buildStep, 700, (progress) => {
    progressRef.current = progress;
    draw();
  });
  useLayoutEffect(draw, [draw]);

  const moveSurface = (event) => {
    const box = canvasRef.current.getBoundingClientRect();
    const t = panelToT(geometry.panel, (event.clientX - box.left) / (box.width / canvasRef.current.offsetWidth));
    // The core's front surface follows the pointer; its center sits one radius behind.
    setCoreX(Math.min(3.35, Math.max(1.6, t + 0.56)));
  };

  const errorLabel = ray ? `${(100 * ray.error).toFixed(1)}%` : '';
  const maxComparison = comparison ? Math.max(...comparison.map((c) => c.error)) : 1;

  return (
    <div className="slide--quadrature">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="quadrature-body">
        <div className="quadrature-figure" ref={figureRef} data-no-swipe>
          <canvas
            ref={canvasRef}
            className="quadrature-canvas"
            width={Math.round(geometry.width * ratio)}
            height={Math.round(geometry.height * ratio)}
            style={{ width: geometry.width, height: geometry.height }}
            onPointerDown={(event) => {
              dragRef.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              moveSurface(event);
            }}
            onPointerMove={(event) => dragRef.current && moveSurface(event)}
            onPointerUp={() => { dragRef.current = false; }}
          />
          {geometry.width > 0 && (
            <>
              <span className="quadrature-label" style={{ left: 0, top: geometry.panel.height * (1 - RAY_Y / CLOUD_EXTENT.height) + 20, width: geometry.gutter - 12 }}>
                <Text>{'$\\hat C$'}</Text>
              </span>
              <span className="quadrature-label" style={{ left: 0, top: geometry.upper.y + 4, width: geometry.gutter - 12 }}>
                <Text>{'$\\sigma$'}</Text>
              </span>
              <span className="quadrature-label" style={{ left: 0, top: geometry.lower.y + 4, width: geometry.gutter - 12 }}>
                <Text>{'$T_i\\alpha_i$'}</Text>
              </span>
              <span className="quadrature-label" style={{ left: 0, top: geometry.lower.y + 34, width: geometry.gutter - 12 }}>
                <Text>{'$T\\sigma$'}</Text>
              </span>
              <span className="quadrature-axis" style={{ left: geometry.width - 16, top: geometry.lower.y + geometry.lower.height + 2 }}>
                <Text>{'$t$'}</Text>
              </span>
            </>
          )}
        </div>
        <div className="quadrature-side">
          {slide.equations?.map((equation) => (
            <div key={equation} className="quadrature-equation"><Text>{equation}</Text></div>
          ))}
          <div className="quadrature-count">
            <Text>{`$N = ${step.samples}$`}</Text>
            {slide.compareSamplers && <span className="quadrature-sampler">{step.sampler}</span>}
          </div>
          {ray && !slide.compareSamplers && (
            <div className="quadrature-check">
              <div className="quadrature-pixel">
                <span className="quadrature-swatch" style={{ background: radianceCss(ray.result.color, PIXEL_GAIN) }} />
                <Text>{'$\\hat C$'}</Text>
              </div>
              <div className="quadrature-pixel">
                <span className="quadrature-swatch" style={{ background: radianceCss(ray.reference.color, PIXEL_GAIN) }} />
                <Text>{'$C$'}</Text>
              </div>
              <div className="quadrature-error">
                <span className="quadrature-error-label">error</span>
                <span className="quadrature-error-value">{errorLabel}</span>
              </div>
            </div>
          )}
          {comparison && (
            <div className="quadrature-comparison">
              <div className="quadrature-comparison-title">{`RMS error, ${COMPARISON_RAYS.length} rays`}</div>
              {comparison.map((entry, index) => (
                <div
                  key={entry.sampler}
                  className={`quadrature-bar-row${index === buildStep ? ' quadrature-bar-row--current' : ''}`}
                  style={{ visibility: index <= buildStep ? 'visible' : 'hidden' }}
                >
                  <span className="quadrature-bar-name">{entry.sampler}</span>
                  <span className="quadrature-bar-track">
                    <span className="quadrature-bar" style={{ width: `${(100 * entry.error) / maxComparison}%` }} />
                  </span>
                  <span className="quadrature-bar-value">{`${(100 * entry.error).toFixed(1)}%`}</span>
                </div>
              ))}
            </div>
          )}
          <label className="quadrature-slider">
            <span>sharpness</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={sliderFromEdge(edge)}
              onChange={(event) => setEdge(edgeFromSlider(Number(event.target.value)))}
              // The clicker sends arrow and page keys; a focused slider would take them.
              onPointerUp={(event) => event.currentTarget.blur()}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
