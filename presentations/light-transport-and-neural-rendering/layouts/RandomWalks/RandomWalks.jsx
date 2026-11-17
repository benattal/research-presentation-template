import { useMemo, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useAnimation } from '../canvas/canvas.js';
import { GRAPH_MATRIX, GRAPH_SOURCE } from '../linearAlgebra/graph.js';
import { solve } from '../linearAlgebra/linear.js';
import MatrixGraph from '../linearAlgebra/MatrixGraph.jsx';
import { Bars, INKS, Plot, decadeTicks, niceCeiling } from '../linearAlgebra/plots.jsx';
import { estimate, runWalks, walkVariance } from '../linearAlgebra/walks.js';
import './RandomWalks.css';

const GRAPH = [620, 440];
const BARS = [500, 262];
const PLOT = [500, 262];
/** Walks run per node; build steps use the first n of them. */
const MAX_WALKS = 10000;
/** Walks per node kept for drawing. */
const DRAWN = 60;
/** Seed of the walks, so every showing draws the same walks. */
const SEED = 7;

/** Opacity of one walk when `count` walks per node are drawn. */
function walkOpacity(count) {
  return Math.min(0.9, 1.4 / count ** 0.55);
}

function formatNumber(value) {
  return value >= 1 ? value.toFixed(2) : value.toPrecision(2);
}

/** The root mean square over the entries of an estimate's error. */
function rmsError(estimates, x) {
  return Math.sqrt(estimates.reduce((sum, s, i) => sum + (s.mean - x[i]) ** 2, 0) / x.length);
}

/** Log-spaced walk counts from 1 to `max`. */
function logCounts(max, perDecade = 16) {
  const counts = new Set([1, max]);
  for (let p = 0; p <= Math.log10(max) * perDecade; p += 1) counts.add(Math.min(max, Math.round(10 ** (p / perDecade))));
  return [...counts].sort((a, b) => a - b);
}

/**
 * Random walks on the graph of a small matrix (graph.js) estimate
 * x = (I − A)^{-1}e (walks.js). Build step `{ walks }` uses the first
 * n = `walks` walks from every node (at most 10 000). The graph shows the
 * walks (at most 60 per node); the bars show each node's estimate by
 * bounce order with ± one standard error and the exact value marked; the
 * plot shows the root mean square error against σ/√n, σ² being the mean
 * variance of one walk. Clicking a node shows only the walks from it.
 */
export default function RandomWalks({ slide, buildStep }) {
  const n = slide.buildSteps[buildStep].walks;
  if (!Number.isInteger(n) || n < 1 || n > MAX_WALKS) throw new Error(`randomWalks: "walks" must be an integer from 1 to ${MAX_WALKS}`);
  const [only, setOnly] = useState(-1);
  const [progress, setProgress] = useState(0);
  useAnimation(buildStep, n === 1 ? 2400 : 1400, setProgress);

  const system = useMemo(() => {
    const A = GRAPH_MATRIX;
    const e = GRAPH_SOURCE;
    const x = solve(A, e);
    const variances = walkVariance(A, e, x, solve);
    const sigma = Math.sqrt(variances.reduce((sum, v) => sum + v, 0) / variances.length);
    const run = runWalks(A, e, MAX_WALKS, SEED, { keep: DRAWN, orders: INKS });
    const curve = logCounts(MAX_WALKS).map((count) => [count, rmsError(estimate(run.samples, count), x)]);
    const top = niceCeiling(1.05 * Math.max(...x, ...slide.buildSteps.flatMap((s) => estimate(run.samples, s.walks)
      .map((est) => est.mean + (Number.isFinite(est.standardError) ? est.standardError : 0)))));
    return { A, e, x, sigma, run, curve, top };
  }, [slide.buildSteps]);

  const totals = estimate(system.run.samples, n);
  const stacks = system.run.byOrder.map((orders) => estimate(orders, n).map((s) => s.mean));
  const error = rmsError(totals, system.x);
  const shown = Math.min(n, DRAWN);
  const walks = system.run.kept.flatMap((list, i) => (only < 0 || only === i ? list.slice(0, shown) : []));

  return (
    <div className="slide--random-walks">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="random-walks-body">
        <div className="random-walks-left">
          <MatrixGraph
            width={GRAPH[0]}
            height={GRAPH[1]}
            A={system.A}
            source={system.e}
            highlight={only < 0 ? [] : [only]}
            walks={walks}
            walkOpacity={walkOpacity(shown)}
            progress={progress}
            onNode={(i) => setOnly((current) => (current === i ? -1 : i))}
          />
          <div className="random-walks-equation">
            <span className="random-walks-count"><Text>{`$n = ${n.toLocaleString('en-US').replace(',', '\\,')}$`}</Text></span>
            <Text>{slide.estimator}</Text>
          </div>
        </div>
        <div className="random-walks-right">
          <Bars width={BARS[0]} height={BARS[1]} stacks={stacks} exact={system.x} errors={totals.map((s) => s.standardError)} top={system.top} label={'$\\hat{x}$'} />
          <Plot
            width={PLOT[0]}
            height={PLOT[1]}
            x={{ min: 1, max: MAX_WALKS, log: true, ticks: decadeTicks(0, 4), label: '$n$' }}
            y={{ min: 1e-3, max: 10, log: true, ticks: decadeTicks(-3, 1), label: 'rms error' }}
            series={[
              { points: [[1, system.sigma], [MAX_WALKS, system.sigma / Math.sqrt(MAX_WALKS)]], kind: 'line', className: 'random-walks-reference', dashed: true },
              { points: system.curve.filter(([count]) => count <= n), kind: 'line', className: 'random-walks-error' },
              { points: [[n, Math.max(error, 1e-4)]], kind: 'dots', className: 'random-walks-current', radius: 7 },
            ]}
            notes={[
              { x: 300, y: system.sigma / Math.sqrt(300), text: '$\\sigma/\\sqrt{n}$', dy: -24, className: 'random-walks-note-reference' },
              { x: n, y: Math.max(error, 1e-4), text: formatNumber(error), dx: n > 1000 ? -14 : 14, dy: n > 1000 ? 18 : -18, align: n > 1000 ? 'right' : 'left', className: 'random-walks-note-error' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
