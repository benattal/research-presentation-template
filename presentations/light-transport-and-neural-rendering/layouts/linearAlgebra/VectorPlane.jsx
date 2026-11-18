/**
 * The plane figure of the linear algebra slides: vectors as arrows on a
 * faint grid, in SVG on white. `fitView` maps plane coordinates to stage
 * pixels with equal scales on both axes; `VectorPlane` draws the grid and
 * axes and its children (`Arrow`, `PlaneLine`, any SVG) on top, with
 * `labels` (math allowed) placed at plane points as HTML.
 */
import Text from '@core/stage/Text.jsx';
import './linearAlgebra.css';

function niceStep(span) {
  const raw = span / 8;
  const power = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((m) => m * power).find((v) => v >= raw);
}

/**
 * The view that fits `points` into `width` × `height` stage pixels with
 * `pad` pixels to spare, the same scale on both axes. `toScreen` and
 * `toPlane` convert between plane coordinates (y up) and stage pixels.
 */
export function fitView(points, width, height, pad = 48) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  let [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  if (x1 - x0 < 1e-9) [x0, x1] = [x0 - 1, x1 + 1];
  if (y1 - y0 < 1e-9) [y0, y1] = [y0 - 1, y1 + 1];
  const scale = Math.min((width - 2 * pad) / (x1 - x0), (height - 2 * pad) / (y1 - y0));
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const toScreen = ([x, y]) => [width / 2 + (x - cx) * scale, height / 2 - (y - cy) * scale];
  const toPlane = ([sx, sy]) => [cx + (sx - width / 2) / scale, cy - (sy - height / 2) / scale];
  const bounds = [toPlane([0, height]), toPlane([width, 0])];
  return { width, height, scale, toScreen, toPlane, bounds };
}

/** An arrow from `from` to `to` (plane points), drawn without a head when shorter than the head. */
export function Arrow({ view, from, to, className, width = 2.5, head = 13 }) {
  const [ax, ay] = view.toScreen(from);
  const [bx, by] = view.toScreen(to);
  const length = Math.hypot(bx - ax, by - ay);
  if (length < 0.5) return null;
  const ux = (bx - ax) / length;
  const uy = (by - ay) / length;
  const size = Math.min(head, length * 0.6);
  const base = [bx - ux * size, by - uy * size];
  const half = size * 0.42;
  return (
    <g className={className}>
      <line x1={ax} y1={ay} x2={base[0] + ux * 1} y2={base[1] + uy * 1} strokeWidth={width} className="la-arrow-shaft" />
      <polygon points={`${bx},${by} ${base[0] - uy * half},${base[1] + ux * half} ${base[0] + uy * half},${base[1] - ux * half}`} className="la-arrow-head" />
    </g>
  );
}

/** Inks of the series terms b, Ab, A²b, …: the deck's colors of light by bounce, the last for every later term. */
const TERM_INKS = ['la-ink-emission', 'la-ink-1', 'la-ink-2', 'la-ink-3', 'la-ink-4'];

/** The ink class of the term A^j b. */
export function termInk(j) {
  return TERM_INKS[Math.min(j, TERM_INKS.length - 1)];
}

/**
 * The plane vectors `terms` drawn tip to tail from `start`, the j-th in the
 * ink of term `first + j`. With `dashed`, the arrows are dashed (a term not
 * yet added).
 */
export function TermPath({ view, terms, start = [0, 0], first = 0, width = 3.5, head = 16, dashed = false }) {
  let tip = start;
  return terms.map((term, j) => {
    const from = tip;
    tip = [tip[0] + term[0], tip[1] + term[1]];
    const ink = termInk(first + j);
    return <Arrow key={j} view={view} from={from} to={tip} className={dashed ? `${ink} la-arrow--dashed` : ink} width={width} head={head} />;
  });
}

/** A ring at plane point `at`: the solution (I − A)^{-1} b on every slide of the section. */
export function Ring({ view, at, className = 'la-ring', r = 10 }) {
  const [x, y] = view.toScreen(at);
  return <circle cx={x} cy={y} r={r} className={className} />;
}

/** A dot at plane point `at`: an iterate or a partial sum. */
export function Dot({ view, at, className = 'la-dot', r = 5 }) {
  const [x, y] = view.toScreen(at);
  return <circle cx={x} cy={y} r={r} className={className} />;
}

/** The line through `through` along `direction`, across the whole view. */
export function PlaneLine({ view, through = [0, 0], direction, className }) {
  const reach = 4 * Math.hypot(view.width, view.height) / view.scale;
  const [dx, dy] = direction;
  const length = Math.hypot(dx, dy);
  const a = view.toScreen([through[0] - dx / length * reach, through[1] - dy / length * reach]);
  const b = view.toScreen([through[0] + dx / length * reach, through[1] + dy / length * reach]);
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={className} />;
}

/**
 * The plane: grid, axes through the origin, `children` on top, and
 * `labels` (`{ at, text, className?, dx?, dy? }`, `at` a plane point,
 * centered there plus the offset in stage pixels). Pointer handlers go to
 * the SVG element.
 */
export default function VectorPlane({ view, children, labels = [], className, ...handlers }) {
  const [[x0, y0], [x1, y1]] = view.bounds;
  const step = niceStep(Math.max(x1 - x0, y1 - y0));
  const lines = [];
  for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) lines.push({ key: `x${x.toFixed(6)}`, a: [x, y0], b: [x, y1], axis: Math.abs(x) < step / 2 });
  for (let y = Math.ceil(y0 / step) * step; y <= y1; y += step) lines.push({ key: `y${y.toFixed(6)}`, a: [x0, y], b: [x1, y], axis: Math.abs(y) < step / 2 });
  return (
    <div className={className ? `la-plane ${className}` : 'la-plane'} style={{ width: view.width, height: view.height }}>
      <svg width={view.width} height={view.height} className="la-plane-svg" {...handlers}>
        {lines.map((line) => {
          const [ax, ay] = view.toScreen(line.a);
          const [bx, by] = view.toScreen(line.b);
          return <line key={line.key} x1={ax} y1={ay} x2={bx} y2={by} className={line.axis ? 'la-plane-axis' : 'la-plane-grid'} />;
        })}
        {children}
      </svg>
      {labels.map((label, index) => {
        const [sx, sy] = view.toScreen(label.at);
        return (
          <div
            key={`${index}-${label.text}`}
            className={`la-plane-label ${label.className ?? ''}`}
            style={{ left: sx + (label.dx ?? 0), top: sy + (label.dy ?? 0) }}
          >
            <Text>{label.text}</Text>
          </div>
        );
      })}
    </div>
  );
}
