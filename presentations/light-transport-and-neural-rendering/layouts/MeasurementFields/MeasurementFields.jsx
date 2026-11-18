import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useStageCanvas } from '@core/stage/canvas.js';
import { rgba, sceneTransform, themeColors } from '../activeSensing/draw.js';
import {
  SPEED_OF_LIGHT, collocatedWeights, roundTripTime, transientHistogram,
} from '../activeSensing/measurement.js';
import { RAY_PANEL_COLORS, drawRayPanel } from '../activeSensing/rayPanel.js';
import { RAY_SCENE, raySamples } from '../activeSensing/rayScene.js';
import './MeasurementFields.css';

/**
 * Each column's render panel and plot, in stage pixels; they share the
 * horizontal axis (depth t above the round-trip time 2t/c), as on the
 * transient quadrature slide, whose ray and scene they draw.
 */
const PANEL = { width: 560, height: 140 };
const PLOT = { width: 560, height: 190, top: 16, bottom: 34 };
const BOUNDS = { x0: -0.42, x1: 3.3, y0: -0.465, y1: 0.465 };

const BIN_WIDTH = 0.2e-9;
const BIN_COUNT = Math.ceil(roundTripTime(BOUNDS.x1) / BIN_WIDTH);
/** The laser pulse's full width at half maximum, in seconds. */
const PULSE_WIDTH = 1e-9;

/**
 * The light each sample sends toward the camera after more than one
 * bounce, as an illustration: a share LATER_SHARE of its single-bounce
 * return, arriving after it with an exponential delay of mean LATER_DELAY
 * seconds. A measurement field can hold this light; a scene field's
 * single-bounce model cannot.
 */
const LATER_SHARE = 0.5;
const LATER_DELAY = 2.5e-9;

/** Samples (by depth, m) whose own transient hᵢ is drawn on the measurement field's panel. */
const GLYPH_DEPTHS = [1.2, 1.5, 1.8, 2.6];
const GLYPH = { width: 46, height: 26, gap: 18 };

const FIELDS = ['scene', 'measurement'];

/**
 * The transient of the camera ray, binned: the single-bounce returns wᵢ
 * spread by the pulse (the transient quadrature), and for a measurement
 * field also the later light of each sample, starting at its round-trip
 * time. Bins hold weight per bin.
 */
function binnedTransient(samples) {
  const single = transientHistogram(samples, { binWidth: BIN_WIDTH, binCount: BIN_COUNT, pulseWidth: PULSE_WIDTH });
  const weights = collocatedWeights(samples);
  const later = new Float64Array(BIN_COUNT);
  samples.forEach(({ t }, i) => {
    const arrival = roundTripTime(t);
    for (let k = Math.floor(arrival / BIN_WIDTH); k < BIN_COUNT; k += 1) {
      const a = Math.max(arrival, k * BIN_WIDTH) - arrival;
      const b = (k + 1) * BIN_WIDTH - arrival;
      later[k] += LATER_SHARE * weights[i] * (Math.exp(-a / LATER_DELAY) - Math.exp(-b / LATER_DELAY));
    }
  });
  return { single, later };
}

/** One sample's own transient, as a small curve on the panel: its single-bounce peak, then its later light. */
function drawGlyph(ctx, colors, [x, y]) {
  const { width, height } = GLYPH;
  const peakAt = 0.18;
  const pulse = 0.05;
  const curve = (s) => {
    const peak = Math.exp(-(((s - peakAt) / pulse) ** 2) / 2);
    const later = s > peakAt ? 0.32 * Math.exp(-(s - peakAt) / 0.3) : 0;
    return { peak, later };
  };
  const points = Array.from({ length: 61 }, (_, k) => k / 60);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';
  // The axis of the glyph's own time, then the curve: the peak in the first bounce's color, the later light in the next.
  ctx.strokeStyle = rgba(colors['bg-elevated'], 0.35);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();
  for (const [part, color, from, to] of [['peak', 'light-1', 0, peakAt + 2.5 * pulse], ['later', 'light-2', peakAt, 1]]) {
    ctx.strokeStyle = rgba(colors[color], 0.95);
    ctx.beginPath();
    points.filter((s) => s >= from && s <= to).forEach((s, k) => {
      const { peak, later } = curve(s);
      const value = part === 'peak' ? peak + later : later;
      const p = [x + s * width, y - value * height];
      if (k === 0) ctx.moveTo(...p);
      else ctx.lineTo(...p);
    });
    ctx.stroke();
  }
  ctx.restore();
}

/** One column: a field's panel, its network outputs, its transient, and its equation. */
function FieldColumn({ column, samples, transient, scale, shown }) {
  const [canvasRef, ratio] = useStageCanvas();
  const measurement = column.field === 'measurement';
  const returns = useMemo(() => collocatedWeights(samples), [samples]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const colors = themeColors(canvas, [...RAY_PANEL_COLORS, 'light-2']);
    const { toCanvas } = drawRayPanel(ctx, colors, PANEL, {
      scene: RAY_SCENE, samples, returns, fog: 1, bounds: BOUNDS,
    });
    if (measurement) {
      for (const depth of GLYPH_DEPTHS) {
        const [x, y] = toCanvas([depth, 0]);
        drawGlyph(ctx, colors, [x, y + GLYPH.gap + GLYPH.height]);
      }
    }
  });

  const { toCanvas } = sceneTransform(BOUNDS, { x: 0, y: 0, ...PANEL });
  const xOfTime = (time) => toCanvas([(time * SPEED_OF_LIGHT) / 2, 0])[0];
  const baseline = PLOT.height - PLOT.bottom;
  const height = baseline - PLOT.top;
  const y = (value) => baseline - (value / scale) * height;
  const laterShown = measurement;
  // The later light's label ends just before the wall's return, over the fog's later light.
  const labelEnd = xOfTime(roundTripTime(RAY_SCENE.wall.depth)) - 16;

  return (
    <motion.div
      className="measurement-fields-column"
      initial={false}
      animate={{ opacity: shown ? 1 : 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="measurement-fields-title"><Text>{column.title}</Text></div>
      <canvas
        ref={canvasRef}
        className="measurement-fields-panel"
        width={PANEL.width * ratio}
        height={PANEL.height * ratio}
        style={{ width: PANEL.width, height: PANEL.height }}
      />
      <div className="measurement-fields-outputs"><Text>{column.outputs}</Text></div>
      <div className="measurement-fields-plot" style={{ width: PLOT.width, height: PLOT.height }}>
        <svg width={PLOT.width} height={PLOT.height} aria-hidden="true">
          {[...transient.single].map((single, bin) => {
            const later = laterShown ? transient.later[bin] : 0;
            if (single + later <= 0) return null;
            const x0 = xOfTime(bin * BIN_WIDTH);
            const x1 = xOfTime((bin + 1) * BIN_WIDTH);
            const width = Math.max(0.5, x1 - x0 - 0.6);
            return (
              <g key={bin}>
                <rect className="measurement-fields-bar" x={x0} y={y(single)} width={width} height={baseline - y(single)} />
                {later > 0 && <rect className="measurement-fields-bar measurement-fields-bar--later" x={x0} y={y(single + later)} width={width} height={y(single) - y(single + later)} />}
              </g>
            );
          })}
          <line className="measurement-fields-axis" x1={xOfTime(0)} y1={baseline} x2={PLOT.width - 4} y2={baseline} />
          <line className="measurement-fields-axis" x1={xOfTime(0)} y1={PLOT.top - 8} x2={xOfTime(0)} y2={baseline} />
        </svg>
        <span className="measurement-fields-label" style={{ left: xOfTime(0) + 10, top: PLOT.top - 4 }}><Text>{'$h(\\tau)$'}</Text></span>
        {laterShown && column.laterLabel && (
          <span className="measurement-fields-label measurement-fields-label--later" style={{ left: labelEnd, top: PLOT.top + 0.4 * height }}>
            <Text>{column.laterLabel}</Text>
          </span>
        )}
        <span className="measurement-fields-label measurement-fields-label--axis" style={{ left: PLOT.width - 4, top: baseline + 22 }}>
          <Text>{'$\\tau$'}</Text>
        </span>
      </div>
      <div className="measurement-fields-equation">
        <div className="measurement-fields-equation-label"><Text>{column.equationLabel}</Text></div>
        <Text>{column.equation}</Text>
      </div>
    </motion.div>
  );
}

/**
 * Two ways a network can represent a scene for a time-resolved sensor,
 * side by side, after Fig. 2 of Transient NeRF and of Flying with Photons
 * (Malik et al., 2023 and 2024): a scene field, whose network gives
 * physical quantities per sample and whose transient comes from a
 * measurement model (the single-bounce transient quadrature), and a
 * measurement field, whose network gives each sample's own transient hᵢ,
 * delayed to the camera and composited. Both columns draw the transient
 * quadrature slide's camera ray through fog to a wall, with the
 * transient below on the same horizontal axis and one vertical scale; the
 * measurement field's transient adds the later light of every sample (an
 * illustration, LATER_SHARE and LATER_DELAY), drawn in the next bounce's
 * color, and its panel shows a few samples' own transients.
 *
 * Slide fields: `columns`, two of `{ field, title, outputs, equationLabel,
 * equation, laterLabel? }` with field 'scene' or 'measurement' (`outputs`
 * names the network's outputs per sample; `laterLabel` labels the later
 * light), and `buildSteps`, each `{ columns: n }`, showing the first n
 * columns (their space is kept from the first step).
 */
export default function MeasurementFields({ slide, buildStep }) {
  const columns = slide.columns ?? [];
  if (columns.length !== 2 || columns.some((column) => !FIELDS.includes(column.field)
    || ['title', 'outputs', 'equationLabel', 'equation'].some((key) => typeof column[key] !== 'string'))) {
    throw new Error(`measurementFields: slide "${slide.id}" needs two "columns", each with "field" (${FIELDS.join(' or ')}), "title", "outputs", "equationLabel", and "equation"`);
  }
  const step = slide.buildSteps?.[buildStep];
  if (!Number.isInteger(step?.columns)) {
    throw new Error(`measurementFields: build step ${buildStep} of "${slide.id}" needs "columns"`);
  }

  const samples = useMemo(() => raySamples(RAY_SCENE, { fog: true }), []);
  const transient = useMemo(() => binnedTransient(samples), [samples]);
  // One vertical scale for both columns: the measurement field's tallest bin, with room above it.
  const scale = useMemo(() => 1.12 * Math.max(...transient.single.map((single, bin) => single + transient.later[bin])), [transient]);

  return (
    <div className="slide--measurement-fields">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="measurement-fields-body">
        {columns.map((column, i) => (
          <FieldColumn
            key={column.field}
            column={column}
            samples={samples}
            transient={transient}
            scale={scale}
            shown={i < step.columns}
          />
        ))}
      </div>
    </div>
  );
}
