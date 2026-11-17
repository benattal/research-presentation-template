import { useState } from 'react';
import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useAnimation } from '../canvas/canvas.js';
import { GRAPH_MATRIX, GRAPH_SOURCE } from '../linearAlgebra/graph.js';
import { matrixPower, pathsBetween } from '../linearAlgebra/linear.js';
import MatrixGraph from '../linearAlgebra/MatrixGraph.jsx';
import './MatrixPaths.css';

const GRAPH = [620, 440];
/** Paths listed before the rest are summed in one line. */
const LISTED = 7;

function formatNumber(value) {
  if (value === 0) return '0';
  return value >= 0.1 ? value.toFixed(2) : value.toPrecision(2);
}

/**
 * Paths in the graph of a small matrix (graph.js): build step `{ hops,
 * equation }` draws every path of `hops` hops from node `source` to node
 * `target` (numbered from 1), lists each path's weight (the product of
 * the entries of A along it), and sets their sum beside the entry of
 * A^hops computed by matrix products. Clicking two nodes picks a new
 * source and target; hovering a listed path draws it alone.
 */
export default function MatrixPaths({ slide, buildStep }) {
  const step = slide.buildSteps[buildStep];
  const hops = step.hops;
  if (!Number.isInteger(hops) || hops < 1) throw new Error('matrixPaths: a step needs "hops" (an integer ≥ 1)');
  const [ends, setEnds] = useState({ from: slide.source - 1, to: slide.target - 1, next: 'from' });
  const [hovered, setHovered] = useState(-1);
  const [progress, setProgress] = useState(0);
  useAnimation(buildStep, 700 + 450 * hops, setProgress);

  const A = GRAPH_MATRIX;
  const paths = pathsBetween(A, ends.from, ends.to, hops);
  const entry = matrixPower(A, hops)[ends.to][ends.from];
  const total = paths.reduce((sum, path) => sum + path.weight, 0);
  const listed = paths.slice(0, paths.length > LISTED + 1 ? LISTED : paths.length);
  const others = paths.slice(listed.length);
  const power = hops === 1 ? 'A' : `(A^{${hops}})`;

  const pick = (node) => {
    setHovered(-1);
    setEnds((current) => (current.next === 'from'
      ? { from: node, to: current.to, next: 'to' }
      : { from: current.from, to: node, next: 'from' }));
  };

  return (
    <div className="slide--matrix-paths">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="matrix-paths-body">
        <div className="matrix-paths-left">
          <MatrixGraph
            width={GRAPH[0]}
            height={GRAPH[1]}
            A={A}
            source={GRAPH_SOURCE.map(() => 0)}
            highlight={[ends.from, ends.to]}
            paths={paths}
            focus={hovered < paths.length ? hovered : -1}
            progress={progress}
            onNode={pick}
          />
          <motion.div key={buildStep} className="matrix-paths-equation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            <Text>{step.equation}</Text>
          </motion.div>
        </div>
        <div className="matrix-paths-list">
          {paths.length === 0 && <div className="matrix-paths-row matrix-paths-row--muted">no path</div>}
          {listed.map((path, index) => (
            <div
              key={path.nodes.join('-')}
              className={`matrix-paths-row${hovered === index ? ' matrix-paths-row--hovered' : ''}`}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(-1)}
            >
              <span><Text>{`$${path.nodes.map((n) => n + 1).join(' \\to ')}$`}</Text></span>
              <span className="matrix-paths-weight">
                <Text>{`$${path.factors.length > 1 ? `${path.factors.map(formatNumber).join(' \\cdot ')} = ` : ''}${formatNumber(path.weight)}$`}</Text>
              </span>
            </div>
          ))}
          {others.length > 0 && (
            <div className="matrix-paths-row matrix-paths-row--muted">
              <span>{`${others.length} more`}</span>
              <span className="matrix-paths-weight"><Text>{`$${formatNumber(others.reduce((sum, path) => sum + path.weight, 0))}$`}</Text></span>
            </div>
          )}
          <div className="matrix-paths-row matrix-paths-row--sum">
            <span><Text>{'$\\textstyle\\sum$'}</Text></span>
            <span className="matrix-paths-weight"><Text>{`$${formatNumber(total)}$`}</Text></span>
          </div>
          <div className="matrix-paths-row">
            <span><Text>{`$${power}_{${ends.to + 1}${ends.from + 1}}$`}</Text></span>
            <span className="matrix-paths-weight"><Text>{`$${formatNumber(entry)}$`}</Text></span>
          </div>
        </div>
      </div>
    </div>
  );
}
