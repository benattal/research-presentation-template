import { useEffect, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useAnimation } from '../canvas/canvas.js';
import { adjointBytes, formatBytes, tapeBytes, unitBytes } from './memory.js';
import './MemoryMeter.css';

/** The plot, in stage pixels, and its axes: bounces 1–8 against memory on a log scale. */
const PLOT = { width: 690, height: 520, left: 96, right: 560, top: 40, bottom: 462 };

/** Gap between the memory axis and the first bounce, in stage pixels. */
const AXIS_GAP = 22;
const MAX_BOUNCES = 8;
const MEMORY_RANGE = [10 * unitBytes('MB'), 10 * unitBytes('TB')];
const MEMORY_TICKS = [
  [10, 'MB'], [100, 'MB'], [1, 'GB'], [10, 'GB'], [100, 'GB'], [1, 'TB'], [10, 'TB'],
];

/**
 * What each series draws, in the order the build steps add them: NeRF (no
 * secondary samples, one bounce), one-bounce inverse rendering, all
 * bounces, and the adjoint method.
 */
const SERIES = {
  nerf: { label: 'NeRF', tone: 'learned', bytes: (p) => [tapeBytes({ ...p, secondary: 0, bounces: 1 })] },
  oneBounce: { label: 'one bounce', tone: 'light-2', bytes: (p) => [tapeBytes({ ...p, bounces: 1 })] },
  allBounces: {
    label: 'all bounces',
    tone: 'light-3',
    bytes: (p) => Array.from({ length: MAX_BOUNCES }, (_, i) => tapeBytes({ ...p, bounces: i + 1 })),
  },
  adjoint: { label: 'adjoint', tone: 'adjoint', bytes: (p) => Array.from({ length: MAX_BOUNCES }, () => adjointBytes(p)) },
};

function stepState(slide, buildStep) {
  const step = slide.buildSteps?.[buildStep];
  if (typeof step?.secondary !== 'number' || !Array.isArray(step.series) || step.series.some((name) => !SERIES[name])) {
    throw new Error(`memoryMeter: build step ${buildStep} needs "secondary" and "series" from ${Object.keys(SERIES).join(', ')}`);
  }
  return step;
}

/** The parameters a build step starts from: the slide's defaults and the step's secondary samples. */
function stepParameters(slide, step) {
  return {
    rays: slide.rays,
    samples: slide.samples,
    secondary: step.secondary,
    bytesPerSample: slide.bytesPerSampleKB * unitBytes('KB'),
  };
}

function xOf(bounces) {
  return PLOT.left + AXIS_GAP + ((bounces - 1) / (MAX_BOUNCES - 1)) * (PLOT.right - PLOT.left - AXIS_GAP);
}

function yOf(bytes) {
  const [low, high] = MEMORY_RANGE.map(Math.log10);
  const share = (Math.log10(Math.min(Math.max(bytes, MEMORY_RANGE[0]), MEMORY_RANGE[1])) - low) / (high - low);
  return PLOT.bottom - share * (PLOT.bottom - PLOT.top);
}

/** One row of the parameter table: symbol, name, slider over `options`, value. */
function Parameter({ symbol, name, options, value, onChange, format }) {
  const index = Math.max(0, options.indexOf(value));
  return (
    <label className="memory-meter-parameter" data-no-swipe>
      <span className="memory-meter-symbol"><Text>{symbol}</Text></span>
      <span className="memory-meter-name">{name}</span>
      <input type="range" min={0} max={options.length - 1} step={1} value={index} onChange={(event) => onChange(options[Number(event.target.value)])} />
      <span className="memory-meter-value">{format(value)}</span>
    </label>
  );
}

const RAY_OPTIONS = [1024, 2048, 4096, 8192, 16384, 32768, 65536];
const SAMPLE_OPTIONS = [32, 64, 128, 256, 512];
const SECONDARY_OPTIONS = [0, 8, 16, 32, 64, 128];
const BYTE_OPTIONS = [1, 2, 4, 8, 16, 32].map((kilobytes) => kilobytes * unitBytes('KB'));

/**
 * Memory of backpropagating through a volume renderer, as an estimate
 * plotted against bounces with a GPU's memory as a line: the formula and its
 * parameters on the right, with sliders. Build steps (`buildSteps` entries
 * `{ secondary, series }`) add NeRF, one-bounce inverse rendering, all
 * bounces, and the adjoint method's flat line. Slide fields: `formula`,
 * `adjointFormula`, `estimateLabel`, `gpuMemoryGB`, `rays`, `samples`,
 * `bytesPerSampleKB`.
 */
export default function MemoryMeter({ slide, buildStep }) {
  const step = stepState(slide, buildStep);
  const [parameters, setParameters] = useState(() => stepParameters(slide, step));
  const [reveal, setReveal] = useState({ step: buildStep, progress: 1 });
  useEffect(() => setParameters(stepParameters(slide, step)), [slide, step]);
  useAnimation(buildStep, 900, (progress) => setReveal({ step: buildStep, progress }));
  const fade = reveal.step === buildStep ? reveal.progress : 0;
  const set = (key) => (value) => setParameters((current) => ({ ...current, [key]: value }));

  const gpu = slide.gpuMemoryGB * unitBytes('GB');
  const newest = step.series[step.series.length - 1];
  const newestBytes = SERIES[newest].bytes(parameters);
  const shownBytes = newestBytes[newestBytes.length - 1];

  return (
    <div className="slide--memory-meter">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="memory-meter-body">
        <div className="memory-meter-figure">
          <svg className="memory-meter-plot" width={PLOT.width} height={PLOT.height} aria-hidden="true">
            {MEMORY_TICKS.map(([amount, unit]) => {
              const y = yOf(amount * unitBytes(unit));
              return (
                <g key={`${amount}${unit}`}>
                  <line className="memory-meter-grid" x1={PLOT.left} y1={y} x2={PLOT.right} y2={y} />
                  <text className="memory-meter-tick" x={PLOT.left - 12} y={y + 6} textAnchor="end">{`${amount} ${unit}`}</text>
                </g>
              );
            })}
            {Array.from({ length: MAX_BOUNCES }, (_, i) => (
              <text key={i} className="memory-meter-tick" x={xOf(i + 1)} y={PLOT.bottom + 28} textAnchor="middle">{i + 1}</text>
            ))}
            <line className="memory-meter-axis" x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right} y2={PLOT.bottom} />
            <line className="memory-meter-axis" x1={PLOT.left} y1={PLOT.top} x2={PLOT.left} y2={PLOT.bottom} />
            <line className="memory-meter-gpu" x1={PLOT.left} y1={yOf(gpu)} x2={PLOT.right} y2={yOf(gpu)} />
            <text className="memory-meter-gpu-label" x={PLOT.right + 12} y={yOf(gpu) + 6}>{`GPU ${slide.gpuMemoryGB} GB`}</text>

            {step.series.map((name) => {
              const series = SERIES[name];
              const bytes = series.bytes(parameters);
              const opacity = name === newest ? fade : 0.85;
              const color = `var(--ink-${series.tone})`;
              const points = bytes.map((value, i) => [xOf(i + 1), yOf(value)]);
              const end = points[points.length - 1];
              return (
                <g key={name} opacity={opacity}>
                  {points.length > 1 && (
                    <polyline className="memory-meter-line" points={points.map((p) => p.join(',')).join(' ')} style={{ stroke: color }} />
                  )}
                  {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={points.length > 1 ? 4 : 7} style={{ fill: color }} />)}
                  <text className="memory-meter-series-label" x={end[0] + 14} y={end[1] + 6} style={{ fill: color }}>{series.label}</text>
                </g>
              );
            })}
          </svg>
          <span className="memory-meter-axis-label memory-meter-axis-label--x"><Text>{'bounces $B$'}</Text></span>
          <span className="memory-meter-axis-label memory-meter-axis-label--y"><Text>{'$M$'}</Text></span>
        </div>

        <div className="memory-meter-side">
          <div className="memory-meter-formula"><Text>{slide.formula}</Text></div>
          <p className="memory-meter-estimate">{slide.estimateLabel}</p>
          <div className="memory-meter-parameters">
            <Parameter symbol="$R$" name="rays" options={RAY_OPTIONS} value={parameters.rays} onChange={set('rays')} format={(n) => n.toLocaleString('en-US')} />
            <Parameter symbol="$N$" name="samples per ray" options={SAMPLE_OPTIONS} value={parameters.samples} onChange={set('samples')} format={(n) => `${n}`} />
            <Parameter symbol="$S$" name="secondary samples" options={SECONDARY_OPTIONS} value={parameters.secondary} onChange={set('secondary')} format={(n) => `${n}`} />
            <Parameter symbol="$b$" name="bytes per sample" options={BYTE_OPTIONS} value={parameters.bytesPerSample} onChange={set('bytesPerSample')} format={formatBytes} />
          </div>
          {step.series.includes('adjoint') && <div className="memory-meter-formula memory-meter-formula--adjoint"><Text>{slide.adjointFormula}</Text></div>}
          <p className="memory-meter-total" style={{ color: `var(--ink-${SERIES[newest].tone})` }}>
            <span className="memory-meter-total-label">{SERIES[newest].label}</span>
            {formatBytes(shownBytes)}
          </p>
        </div>
      </div>
    </div>
  );
}
