/**
 * The plane figure of the linear algebra slides: vectors as arrows on a
 * faint grid, in SVG on white. `fitView` maps plane coordinates to stage
 * pixels with equal scales on both axes; `VectorPlane` draws the grid and
 * axes and its children (`Arrow`, `PlaneLine`, `TermPath`, `Ring`, `Dot`,
 * `FixedPointUpdates`, any SVG) on top, with `labels` (math allowed)
 * placed at plane points as HTML (`labelBeside`, `lineLabel`).
 */
import Text from '@core/stage/Text.jsx';
import { solve } from './linear.js';
import { eigenParts, spectralMatrix } from './plane.js';
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

/**
 * Size of the plane on the fixed-point, Neumann series, and spectral
 * slides, in stage pixels. With the equation column beside it
 * (`.la-plane-equations` in linearAlgebra.css, 480 px) it fits the deck's
 * 1168 px content width, at its right edge, so the plane sits in the same
 * place on the three slides.
 */
const EXAMPLE_PLANE = [640, 520];

/**
 * The one view of the section's example on the fixed-point, Neumann
 * series, and spectral slides, so their picture stays in place between
 * them: it fits the origin, `b`, (I − A)^{-1} b, and b's components along
 * the eigenvectors `basis` before and after (I − A)^{-1}, for the matrix
 * with eigenvalues `lambda`. A slide that draws other points checks them
 * with `assertInView`.
 */
export function examplePlaneView(basis, lambda, b) {
  const { parts, limits } = eigenParts(basis, lambda, b);
  return fitView([[0, 0], b, solve(spectralMatrix(basis, lambda), b), ...parts, ...limits], ...EXAMPLE_PLANE, 56);
}

/** Throws unless every plane point of `points` lies in `view`, at least `margin` stage pixels from its edges; `what` names them in the error. */
export function assertInView(view, points, what, margin = 24) {
  points.forEach((point) => {
    const [x, y] = view.toScreen(point);
    if (x < margin || x > view.width - margin || y < margin || y > view.height - margin) {
      throw new Error(`${what}: the point (${point.map((v) => v.toFixed(2)).join(', ')}) leaves the plane`);
    }
  });
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
 * yet added); `className` is added to every arrow.
 */
export function TermPath({ view, terms, start = [0, 0], first = 0, width = 3.5, head = 16, dashed = false, className }) {
  let tip = start;
  return terms.map((term, j) => {
    const from = tip;
    tip = [tip[0] + term[0], tip[1] + term[1]];
    const classes = [termInk(first + j), dashed && 'la-arrow--dashed', className].filter(Boolean).join(' ');
    return <Arrow key={j} view={view} from={from} to={tip} className={classes} width={width} head={head} />;
  });
}

/**
 * The first `shown` of the vectors `terms` (0 ≤ shown ≤ terms.length): the
 * first ⌊shown⌋ whole and the next cut to the fraction left over, so a
 * path drawn from them grows term by term as `shown` rises.
 */
export function revealTerms(terms, shown) {
  const whole = Math.min(terms.length, Math.floor(shown));
  const revealed = terms.slice(0, whole);
  const fraction = shown - whole;
  if (whole < terms.length && fraction > 0) revealed.push(terms[whole].map((value) => value * fraction));
  return revealed;
}

/** The tip of `terms` drawn tip to tail from `start`. */
export function pathEnd(terms, start = [0, 0]) {
  return terms.reduce((tip, term) => [tip[0] + term[0], tip[1] + term[1]], start);
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

/** Of each update's time, the share spent drawing its arrow; its iterate then appears. */
const UPDATE_ARROW_SHARE = 0.65;

/**
 * Where `shown` updates of an iteration stand (`shown` ≥ 0, fractional
 * while an update is drawn): `newest`, the index k of the update x_k →
 * x_{k+1} drawn last; `growth`, the fraction of its arrow drawn; and
 * `reached`, the index of the last iterate reached. Every figure of the
 * updates uses it, so they reach each iterate together.
 */
export function updateProgress(shown) {
  const newest = Math.max(0, Math.ceil(shown) - 1);
  const fraction = Math.min(1, Math.max(0, shown - newest));
  return { newest, growth: Math.min(1, fraction / UPDATE_ARROW_SHARE), reached: fraction >= UPDATE_ARROW_SHARE ? newest + 1 : newest };
}

/**
 * The updates x_{k+1} = b + A x_k drawn as on the fixed-point slide, for
 * the iterates `iterates` x_0 … x_n (n ≥ 1): an update is the arrow A x_k
 * from the tip of b, ending at x_{k+1}. `shown` (0 … n, fractional while an
 * update is drawn) counts the updates drawn. The newest is drawn in full,
 * with x_k from the origin and the gap from x_k to x_{k+1} dashed; earlier
 * arrows are faded; every iterate reached is a dot. At `shown` 0 only x_0
 * and its arrow are drawn. b itself is the caller's to draw. `width`,
 * `head`, and `dot` (stage pixels) size the arrows and dots of the newest
 * update; a thumbnail draws them smaller.
 */
export function FixedPointUpdates({ view, b, iterates, shown, width = 3.5, head = 16, dot = 5 }) {
  if (iterates.length < 2) throw new Error('FixedPointUpdates: needs x_0 and at least one update');
  const { newest, growth, reached } = updateProgress(Math.min(shown, iterates.length - 1));
  const settled = reached > newest;
  const update = (k, scale = 1) => [b[0] + (iterates[k + 1][0] - b[0]) * scale, b[1] + (iterates[k + 1][1] - b[1]) * scale];
  const [gx, gy] = view.toScreen(iterates[newest]);
  const [hx, hy] = view.toScreen(iterates[newest + 1]);
  return (
    <g>
      {Array.from({ length: newest }, (_, k) => {
        const [ax, ay] = view.toScreen(iterates[k]);
        const [cx, cy] = view.toScreen(iterates[k + 1]);
        return (
          <g key={`faded${k}`}>
            <line x1={ax} y1={ay} x2={cx} y2={cy} className="la-gap la-faded" />
            <Arrow view={view} from={b} to={update(k)} className="la-ink-1 la-faded" width={width * 0.7} head={head * 0.8} />
          </g>
        );
      })}
      {settled && <line x1={gx} y1={gy} x2={hx} y2={hy} className="la-gap" />}
      <Arrow view={view} from={[0, 0]} to={iterates[newest]} className="la-ink-solution" width={width} head={head} />
      <Arrow view={view} from={b} to={update(newest, growth)} className="la-ink-1" width={width} head={head} />
      {iterates.slice(0, reached + 1).map((x, k) => <Dot key={`x${k}`} view={view} at={x} r={dot} />)}
    </g>
  );
}

/**
 * A `VectorPlane` label beside the segment from `from` to `to` (plane
 * points): at its middle, `offset` stage pixels off it, on the left of the
 * direction of travel (`side` 1) or on its right (`side` −1).
 */
export function labelBeside(view, from, to, text, { side = 1, offset = 22, className } = {}) {
  const [ax, ay] = view.toScreen(from);
  const [bx, by] = view.toScreen(to);
  const length = Math.hypot(bx - ax, by - ay) || 1;
  // Stage y points down: the left of the screen direction (ux, uy) is (uy, −ux).
  const left = [(by - ay) / length, -(bx - ax) / length];
  return {
    at: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2],
    text,
    className,
    dx: side * left[0] * offset,
    dy: side * left[1] * offset,
  };
}

/** 1 when the plane point `point` lies on the left of the line through the origin along `direction`, −1 on its right. */
export function sideOf(direction, point) {
  return direction[0] * point[1] - direction[1] * point[0] > 0 ? 1 : -1;
}

/** Stage pixels a label keeps from the edges of the view. */
const LABEL_MARGIN = 10;

/** True when the label (`{ at, size }`, from `lineLabel`) lies inside the view, LABEL_MARGIN from its edges. */
export function labelFits(view, { at, size }) {
  const [x, y] = view.toScreen(at);
  return x - size[0] / 2 >= LABEL_MARGIN && x + size[0] / 2 <= view.width - LABEL_MARGIN
    && y - size[1] / 2 >= LABEL_MARGIN && y + size[1] / 2 <= view.height - LABEL_MARGIN;
}

/**
 * A `VectorPlane` label of `size` ([width, height], stage pixels) beside
 * the line through the origin along `direction`, its box `gap` stage
 * pixels clear of the line, on the line's left (`side` 1, see `sideOf`)
 * or right (−1). Along the line, its middle is `distance` plane units from
 * the origin, or just past that point with `beyond`; without a `distance`,
 * the label sits as far out along the line as fits in the view. The label
 * keeps its `size`, for `labelFits`.
 */
export function lineLabel(view, direction, text, { side, distance, beyond = false, size, gap = 8, className }) {
  const length = Math.hypot(direction[0], direction[1]);
  // Stage directions (y down): along the line, and across it to the chosen side.
  const u = [direction[0] / length, -direction[1] / length];
  const n = [side * u[1], side * -u[0]];
  const across = gap + Math.abs(n[0]) * size[0] / 2 + Math.abs(n[1]) * size[1] / 2;
  const along = gap + Math.abs(u[0]) * size[0] / 2 + Math.abs(u[1]) * size[1] / 2;
  const [ox, oy] = view.toScreen([0, 0]);
  const labelAt = (t) => ({
    at: view.toPlane([ox + u[0] * t + n[0] * across, oy + u[1] * t + n[1] * across]), text, className, size,
  });
  if (distance !== undefined) return labelAt(distance * view.scale + (beyond ? along : 0));
  let farthest = 0;
  for (let t = 0; t < view.width + view.height; t += 2) if (labelFits(view, labelAt(t))) farthest = t;
  return labelAt(farthest);
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
