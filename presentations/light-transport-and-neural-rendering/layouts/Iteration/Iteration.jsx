import { useMemo, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { chainErrors, chainSolution, chainTerms, errorBound } from '../linearAlgebra/chain.js';
import { Bars, INKS, Plot, decadeTicks, niceCeiling } from '../linearAlgebra/plots.jsx';
import Slider from '../linearAlgebra/Slider.jsx';
import './Iteration.css';

const BARS = [640, 430];
const PLOT = [470, 250];
/** The most updates the slider allows, and the error plot's k axis. */
const MAX_UPDATES = 60;
/** Bar names: every fifth index. */
const NAMED = 5;

function texNumber(value) {
  return value >= 1e4 ? `10^{${Math.round(Math.log10(value))}}` : String(value);
}

/**
 * The iteration x_{k+1} = b + A x_k from x_0 = 0, whose iterate x_k is the
 * partial sum b + Ab + … + A^{k−1} b of the Neumann series, for a large
 * sparse A applied as a function and never stored: the chain of chain.js,
 * (Av)_i = w (v_{i−1} + v_{i+1}), with b a single 1 in the middle. Left:
 * the entries of x_k near the middle, each bar split into the terms A^j b
 * (in the ink of term j), with the solution x marked. Right: the operator,
 * the iteration, and the error bound as equations, a slider for k, and
 * the error ‖x − x_k‖_∞ (a dot at the current k) against the bound
 * ‖A‖^k ‖b‖/(1 − ‖A‖) with ‖A‖_∞ = 2w and ‖b‖_∞ = 1.
 *
 * Slide data: `size` (N), `weight` (w, below 1/2), `window` (the bars
 * show indices −window … window); build steps `{ k }`, the updates made.
 */
export default function Iteration({ slide, buildStep }) {
  const { size, weight, window } = slide;
  if (!(weight > 0 && weight < 0.5)) throw new Error('iteration: "weight" must lie in (0, 1/2)');
  if (!(size > 2 * MAX_UPDATES + 2)) throw new Error(`iteration: "size" must exceed ${2 * MAX_UPDATES + 2}`);
  if (!(Number.isInteger(window) && window > 0 && window <= MAX_UPDATES)) throw new Error('iteration: "window" must be an integer from 1 to 60');
  const k = slide.buildSteps[buildStep].k;
  if (!(Number.isInteger(k) && k >= 0 && k <= MAX_UPDATES)) throw new Error(`iteration: a step needs "k" from 0 to ${MAX_UPDATES}`);

  const system = useMemo(() => {
    // x_k uses the terms A^0 b … A^{k−1} b.
    const terms = chainTerms(weight, MAX_UPDATES);
    const errors = chainErrors(terms, weight);
    const offsets = Array.from({ length: 2 * window + 1 }, (_, i) => i - window);
    const x = chainSolution(weight, offsets);
    return { terms, errors, offsets, x, top: niceCeiling(1.05 * Math.max(...x)) };
  }, [weight, window]);

  return (
    <div className="slide--iteration">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <IterationState key={buildStep} system={system} size={size} weight={weight} initial={k} />
    </div>
  );
}

function IterationState({ system, size, weight, initial }) {
  const [k, setK] = useState(initial);
  const { terms, errors, offsets, x, top } = system;
  const center = (terms[0].length - 1) / 2;
  const stacks = offsets.map((i) => {
    const stack = new Array(INKS).fill(0);
    for (let j = 0; j < k; j += 1) stack[Math.min(j, INKS - 1)] += terms[j][center + i];
    return stack;
  });
  const norm = 2 * weight;
  const ks = Array.from({ length: MAX_UPDATES + 1 }, (_, j) => j);
  const bound = (j) => errorBound(norm, 1, j);
  const names = offsets.map((i) => (i % NAMED === 0 ? String(i).replace('-', '−') : ''));
  const key = ['b', 'Ab', 'A^2 b', 'A^3 b', 'A^{4+} b'];

  return (
    <div className="iteration-body">
      <div className="iteration-left">
        <Bars width={BARS[0]} height={BARS[1]} stacks={stacks} exact={x} top={top} label={'$(x_k)_i$'} names={names} xLabel="$i$" />
        <div className="iteration-key">
          {key.map((term, j) => (
            <span key={term} className="iteration-key-item">
              <svg width="16" height="16"><rect width="16" height="16" style={{ fill: `var(--ink-light-${j})` }} /></svg>
              <Text>{`$${term}$`}</Text>
            </span>
          ))}
          <span className="iteration-key-item">
            <svg width="26" height="16"><line x1="0" x2="26" y1="8" y2="8" className="la-plot-exact" /></svg>
            <Text>{'$x$'}</Text>
          </span>
        </div>
      </div>
      <div className="iteration-right">
        <div className="iteration-equations">
          <div><Text>{`$A \\in \\mathbb{R}^{${texNumber(size)} \\times ${texNumber(size)}}$`}</Text></div>
          <div><Text>{`$(Av)_i = ${weight}\\,(v_{i-1} + v_{i+1})$`}</Text></div>
          <div><Text>{'$x_0 = 0, \\quad x_{k+1} = b + A\\,x_k$'}</Text></div>
          <div><Text>{`$\\|x - x_k\\| \\le \\frac{\\|A\\|^{k}}{1 - \\|A\\|}\\, \\|b\\|, \\quad \\|A\\|_\\infty = ${norm}$`}</Text></div>
        </div>
        <Slider label="$k$" value={k} min={0} max={MAX_UPDATES} step={1} onChange={setK} format={(v) => v.toFixed(0)} />
        <Plot
          width={PLOT[0]}
          height={PLOT[1]}
          x={{ min: 0, max: MAX_UPDATES, ticks: [0, 20, 40, 60].map((v) => ({ value: v, label: String(v) })), label: '$k$' }}
          y={{ min: 1e-3, max: 100, log: true, ticks: decadeTicks(-3, 2), label: '$\\|x - x_k\\|_\\infty$' }}
          series={[
            { points: ks.map((j) => [j, bound(j)]), kind: 'line', className: 'iteration-bound', dashed: true },
            { points: ks.map((j) => [j, errors[j]]), kind: 'line', className: 'iteration-error' },
            { points: [[k, errors[k]]], kind: 'dots', className: 'iteration-current', radius: 7 },
          ]}
          notes={[
            { x: 44, y: bound(44), text: `$${Number((1 / (1 - norm)).toPrecision(3))} \\cdot ${norm}^{k}$`, dx: 4, dy: -22, className: 'iteration-note-bound' },
          ]}
        />
      </div>
    </div>
  );
}
