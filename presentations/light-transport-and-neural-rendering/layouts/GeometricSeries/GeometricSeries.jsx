import { useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { Slider } from '@core/stage/Controls.jsx';
import { Plot } from '../linearAlgebra/plots.jsx';
import './GeometricSeries.css';

const PANEL = [560, 440];
/** Terms of the partial-sum plot, k = 0 … TERMS. */
const TERMS = 30;
/** Partial sums beyond this size leave the partial-sum plot, with their terms. */
const CAP = 40;
/** The a axis of the Taylor plot, and its value axis. */
const A_RANGE = [-1.5, 1.5];
const F_RANGE = [-2, 12];
/** Degrees of the Taylor polynomials drawn. */
const DEGREES = [1, 2, 3, 4, 5, 6, 8, 10, 14, 20];
const SAMPLES = 241;

function niceStep(span) {
  const raw = span / 5;
  const power = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * power).find((v) => v >= raw);
}

function formatNumber(value) {
  return Math.abs(value) >= 10 ? value.toFixed(1) : value.toFixed(2);
}

/** S_k(a) = 1 + a + … + a^k. */
function partialSum(a, k) {
  let sum = 0;
  for (let j = 0; j <= k; j += 1) sum += a ** j;
  return sum;
}

/**
 * The geometric series 1 + a + a² + … as the Taylor series of 1/(1 − a)
 * at 0. Left: 1/(1 − a) against a, with its Taylor polynomials S_k(a),
 * which agree with it for |a| < 1 and leave it outside; the marker is the
 * chosen a, with the values S_k(a) on it. Right: those values against k,
 * each term a^k drawn as the step from S_{k−1} to S_k (in the ink of term
 * k), and the limit 1/(1 − a) when |a| < 1. Build steps `{ a }` set a; a
 * slider changes it.
 */
export default function GeometricSeries({ slide, buildStep }) {
  const step = slide.buildSteps[buildStep];
  if (typeof step.a !== 'number') throw new Error('geometricSeries: a step needs "a"');
  return (
    <div className="slide--geometric">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <SeriesPanels key={buildStep} initial={step.a} />
    </div>
  );
}

function SeriesPanels({ initial }) {
  const [a, setA] = useState(initial);
  const converges = Math.abs(a) < 1;
  const limit = converges ? 1 / (1 - a) : null;
  const ks = Array.from({ length: TERMS + 1 }, (_, k) => k);
  const sums = ks.map((k) => partialSum(a, k));

  // A term is drawn with its partial sum only while both of its ends lie inside the plot.
  const inside = (value) => Math.abs(value) <= CAP;
  const shown = ks.filter((k) => inside(sums[k]) && (k === 0 || inside(sums[k - 1])));
  const visible = [...shown.map((k) => sums[k]), ...(converges ? [limit] : [])];
  const lo = Math.min(0, ...visible);
  const hi = Math.max(1, ...visible) * 1.08;
  const step = niceStep(hi - lo);
  const ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push({ value: v, label: String(Number(v.toFixed(2))) });

  const grid = Array.from({ length: SAMPLES }, (_, i) => A_RANGE[0] + (A_RANGE[1] - A_RANGE[0]) * i / (SAMPLES - 1));
  // 1/(1 − a) on the side of the pole the series describes; for a > 1 it is negative and off the plot.
  const curve = grid.filter((v) => v < 0.995).map((v) => [v, 1 / (1 - v)]);

  return (
    <div className="geometric-body">
      <div className="geometric-controls">
        <div className="geometric-identity"><Text>{'$\\frac{1}{1-a} = 1 + a + a^2 + a^3 + \\cdots$'}</Text></div>
        <Slider label="$a$" value={a} min={-1.2} max={1.2} step={0.01} onChange={setA} />
        <div className="geometric-limit">
          <Text>{converges ? `$\\frac{1}{1-a} = ${formatNumber(limit)}$` : '$|a| \\ge 1{:}\\;\\text{no limit}$'}</Text>
        </div>
      </div>
      <div className="geometric-panels">
        <Plot
          width={PANEL[0]}
          height={PANEL[1]}
          x={{ min: A_RANGE[0], max: A_RANGE[1], ticks: [-1.5, -1, -0.5, 0, 0.5, 1, 1.5].map((v) => ({ value: v, label: String(v) })), label: '$a$' }}
          y={{ min: F_RANGE[0], max: F_RANGE[1], ticks: [0, 4, 8, 12].map((v) => ({ value: v, label: String(v) })) }}
          series={[
            ...[-1, 1].map((edge) => ({ points: [[edge, F_RANGE[0]], [edge, F_RANGE[1]]], kind: 'line', className: 'geometric-edge', dashed: true })),
            ...DEGREES.map((k) => ({ points: grid.map((v) => [v, partialSum(v, k)]), kind: 'line', className: 'geometric-polynomial' })),
            { points: curve, kind: 'line', className: 'geometric-function' },
            { points: [[a, F_RANGE[0]], [a, F_RANGE[1]]], kind: 'line', className: 'geometric-marker' },
            { points: shown.map((k) => [a, sums[k]]), kind: 'dots', className: 'geometric-sums', radius: 4 },
          ]}
          notes={[
            { x: 0.62, y: 1 / (1 - 0.62), text: '$\\frac{1}{1-a}$', dx: -16, dy: -26, align: 'right', className: 'geometric-note-function' },
            { x: -1.42, y: 5.2, text: '$S_k(a)$', className: 'geometric-note-polynomial' },
          ]}
        />
        <Plot
          width={PANEL[0]}
          height={PANEL[1]}
          x={{ min: -0.5, max: TERMS + 0.5, ticks: [0, 5, 10, 15, 20, 25, 30].map((v) => ({ value: v, label: String(v) })), label: '$k$' }}
          y={{ min: lo, max: hi, ticks, label: '$S_k = 1 + a + \\cdots + a^k$' }}
          series={[
            ...(converges ? [{ points: [[-0.5, limit], [TERMS + 0.5, limit]], kind: 'line', className: 'geometric-limit-line', dashed: true }] : []),
            { points: shown.map((k) => [k, k === 0 ? 0 : sums[k - 1], sums[k]]), kind: 'stems', className: 'geometric-terms', style: (k) => ({ stroke: `var(--ink-light-${Math.min(k, 4)})` }) },
            { points: shown.map((k) => [k, sums[k]]), kind: 'dots', className: 'geometric-sums', radius: 4 },
          ]}
        />
      </div>
    </div>
  );
}
