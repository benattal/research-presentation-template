/**
 * A small matrix drawn as a graph on white (graph.js): a node per entry of
 * x, an arrow from node j to node i for every A[i][j] > 0, its width
 * growing with the weight. Paths (from `pathsBetween`, linear.js) and
 * random walks (from `randomWalk`, walks.js) are drawn over the edges.
 */
import { seededRandom } from './walks.js';
import { nodePositions } from './graph.js';
import './linearAlgebra.css';

const NODE_RADIUS = 25;
const CURVE = 0.14;

/** The curve of the edge from node `from` to node `to`, bent by `bend` (default CURVE) of its length. */
function edgeCurve(points, from, to, bend = CURVE, trim = NODE_RADIUS + 6) {
  const [ax, ay] = points[from];
  const [bx, by] = points[to];
  const length = Math.hypot(bx - ax, by - ay);
  const ux = (bx - ax) / length;
  const uy = (by - ay) / length;
  const control = [(ax + bx) / 2 - uy * bend * length, (ay + by) / 2 + ux * bend * length];
  const toward = ([px, py], [qx, qy], distance) => {
    const d = Math.hypot(qx - px, qy - py);
    return [px + (qx - px) / d * distance, py + (qy - py) / d * distance];
  };
  return { start: toward([ax, ay], control, trim), control, end: toward([bx, by], control, trim) };
}

function curvePath({ start, control, end }, reveal = 1) {
  if (reveal >= 1) return `M${start[0]},${start[1]}Q${control[0]},${control[1]} ${end[0]},${end[1]}`;
  // The first `reveal` of a quadratic Bézier is itself a quadratic Bézier (de Casteljau).
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const c = lerp(start, control, reveal);
  const e = lerp(c, lerp(control, end, reveal), reveal);
  return `M${start[0]},${start[1]}Q${c[0]},${c[1]} ${e[0]},${e[1]}`;
}

function arrowHead({ control, end }, size) {
  const dx = end[0] - control[0];
  const dy = end[1] - control[1];
  const d = Math.hypot(dx, dy);
  const ux = dx / d;
  const uy = dy / d;
  const base = [end[0] - ux * size, end[1] - uy * size];
  const half = size * 0.45;
  return `${end[0]},${end[1]} ${base[0] - uy * half},${base[1] + ux * half} ${base[0] + uy * half},${base[1] - ux * half}`;
}

function inkClass(order) {
  return order === 0 ? 'la-ink-emission' : `la-ink-${Math.min(order, 4)}`;
}

/**
 * The graph of `A` in `width` × `height` stage pixels. `source[i] ≠ 0`
 * marks the nodes that emit; `highlight` lists nodes drawn darker.
 * Overlays, both optional:
 *
 * - `paths`: light paths, hop h in the ink of bounce order h, width and
 *   opacity growing with the path's weight; `focus` (an index, or -1)
 *   dims the others; `progress` in [0, 1] reveals hops in order.
 * - `walks`: random walks; a hop that carries light back toward the
 *   walk's start is drawn in the ink of the bounce it delivers, a hop that
 *   carries none in faint grey; `walkOpacity` is one lit hop's opacity.
 *
 * `onNode(i)` is called when node i is clicked.
 */
export default function MatrixGraph({
  width, height, A, source, highlight = [], paths, focus = -1, walks, walkOpacity = 0.6, progress = 1, onNode,
}) {
  const points = nodePositions(A.length).map(([u, v]) => [u * width, v * height]);
  const edges = [];
  A.forEach((row, i) => row.forEach((weight, j) => {
    if (weight > 0) edges.push({ from: j, to: i, weight });
  }));

  const pathLines = [];
  if (paths && paths.length) {
    const heaviest = Math.max(...paths.map((path) => path.weight));
    const hops = paths[0].nodes.length - 1;
    const shown = progress * hops;
    paths.forEach((path, p) => {
      const strength = Math.sqrt(path.weight / heaviest) * (focus < 0 || focus === p ? 1 : 0.15);
      const offset = paths.length > 1 ? (p / (paths.length - 1) - 0.5) * 0.16 : 0;
      for (let h = 0; h < hops; h += 1) {
        const reveal = Math.max(0, Math.min(1, shown - h));
        if (reveal <= 0) break;
        const curve = edgeCurve(points, path.nodes[h], path.nodes[h + 1], CURVE + offset, NODE_RADIUS + 2);
        pathLines.push(
          <path
            key={`${p}-${h}`}
            d={curvePath(curve, reveal)}
            className={`la-graph-path ${inkClass(h)}`}
            strokeWidth={1.5 + 5 * strength}
            opacity={0.25 + 0.75 * strength}
          />,
        );
      }
    });
  }

  const walkLines = [];
  if (walks) {
    const longest = Math.max(1, ...walks.map((walk) => walk.visits.length - 1));
    const shown = progress * longest;
    walks.forEach((walk, w) => {
      const random = seededRandom(9973 * (w + 1));
      const lamp = walk.contributions.map((c) => c.hops);
      for (let t = 0; t + 1 < walk.visits.length; t += 1) {
        const reveal = Math.max(0, Math.min(1, shown - t));
        if (reveal <= 0) break;
        const delivered = lamp.find((h) => h > t);
        // The hop runs along the edge light takes the other way, from visits[t + 1] to visits[t].
        const edge = edgeCurve(points, walk.visits[t + 1], walk.visits[t], CURVE + (random() - 0.5) * 0.3, NODE_RADIUS + 2);
        const curve = { start: edge.end, control: edge.control, end: edge.start };
        walkLines.push(
          <path
            key={`${w}-${t}`}
            d={curvePath(curve, reveal)}
            className={delivered === undefined ? 'la-graph-walk la-graph-walk--dark' : `la-graph-walk ${inkClass(delivered - t)}`}
            opacity={delivered === undefined ? walkOpacity * 0.5 : walkOpacity}
          />,
        );
      }
    });
  }

  return (
    <svg width={width} height={height} className="la-graph" data-no-swipe>
      {edges.map((edge) => {
        const curve = edgeCurve(points, edge.from, edge.to);
        return (
          <g key={`${edge.from}-${edge.to}`} className="la-graph-edge">
            <path d={curvePath(curve)} strokeWidth={1 + 8 * edge.weight} />
            <polygon points={arrowHead(curve, 9 + 10 * edge.weight)} />
          </g>
        );
      })}
      {walkLines}
      {pathLines}
      {points.map(([px, py], i) => (
        <g
          key={i}
          className={`la-graph-node${source[i] ? ' la-graph-node--source' : ''}${highlight.includes(i) ? ' la-graph-node--highlight' : ''}`}
          onClick={onNode ? () => onNode(i) : undefined}
        >
          <circle cx={px} cy={py} r={NODE_RADIUS} />
          <text x={px} y={py} textAnchor="middle" dominantBaseline="central">{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}
