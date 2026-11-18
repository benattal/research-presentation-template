import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { multiply, resolvent, seriesSum } from '../linearAlgebra/linear.js';
import { normalize, spectralMatrix } from '../linearAlgebra/plane.js';
import VectorPlane, { Arrow, PlaneLine, fitView } from '../linearAlgebra/VectorPlane.jsx';
import './NeumannSeries.css';
import EquationStack from '../equations/EquationStack.jsx';

const PLANE = [680, 520];
const EIGEN_INKS = ['la-ink-first', 'la-ink-second'];
const CIRCLE_POINTS = 160;
/** Sizes of a factor label and of an eigenvector's label (stage pixels), for placing them clear of the curves. */
const FACTOR_LABEL = [64, 30];
const EIGEN_LABEL = [132, 30];
/** The box of the step's k over the plane's top left corner (stage pixels). */
const TERMS_BOX = { center: [70, 26], size: [116, 44] };
/** How far a label stays from every curve, line, and other label (stage pixels). */
const CLEAR = 8;

function formatNumber(value) {
  return String(Number(value.toPrecision(3)));
}

/** Points about every `spacing` stage pixels along the polyline `points` (stage pixels). */
function sample(points, spacing = 4) {
  const out = [];
  for (let i = 0; i + 1 < points.length; i += 1) {
    const [a, b] = [points[i], points[i + 1]];
    const count = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / spacing));
    for (let j = 0; j < count; j += 1) out.push([a[0] + (b[0] - a[0]) * j / count, a[1] + (b[1] - a[1]) * j / count]);
  }
  out.push(points[points.length - 1]);
  return out;
}

/** The outline of a box `{ center, size }` as points, so a placed label is an obstacle for the next. */
function boxPoints({ center: [cx, cy], size: [w, h] }) {
  return sample([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2], [cx - w / 2, cy - h / 2]]);
}

/** The smallest distance from any of `points` to the box of `size` centered at `center` (0 inside it). */
function clearance(center, size, points) {
  let best = Infinity;
  for (const [px, py] of points) {
    const dx = Math.max(Math.abs(px - center[0]) - size[0] / 2, 0);
    const dy = Math.max(Math.abs(py - center[1]) - size[1] / 2, 0);
    best = Math.min(best, Math.hypot(dx, dy));
  }
  return best;
}

/**
 * Where a label of `size` goes: the first of `candidates` (box centers,
 * most preferred first) inside the plane and at least CLEAR from every
 * point of `obstacles`, or else the clearest one.
 */
function placeLabel(candidates, size, obstacles) {
  const inside = candidates.filter(([x, y]) => x - size[0] / 2 >= 4 && x + size[0] / 2 <= PLANE[0] - 4
    && y - size[1] / 2 >= 4 && y + size[1] / 2 <= PLANE[1] - 4);
  const scored = inside.map((center) => ({ center, room: clearance(center, size, obstacles) }));
  const clear = scored.find((entry) => entry.room >= CLEAR);
  return (clear ?? scored.reduce((best, entry) => (entry.room > best.room ? entry : best))).center;
}

/** Box centers around `tip` (stage pixels), nearest first and, at each distance, closest to the screen direction `u` first. */
function aroundTip(tip, u) {
  const turns = [0];
  for (let degrees = 15; degrees <= 180; degrees += 15) turns.push(degrees, -degrees);
  return [36, 46, 58, 72, 88].flatMap((radius) => turns.map((degrees) => {
    const a = (degrees * Math.PI) / 180;
    const d = [u[0] * Math.cos(a) - u[1] * Math.sin(a), u[0] * Math.sin(a) + u[1] * Math.cos(a)];
    return [tip[0] + d[0] * radius, tip[1] + d[1] * radius];
  }));
}

/**
 * Box centers beside the line through `origin` along the screen direction
 * `u`, on its far half (−u), from the plane's edge inward, on either side
 * of the line.
 */
function besideLineEnd(origin, u, size) {
  const n = [-u[1], u[0]];
  const across = Math.abs(n[0]) * size[0] / 2 + Math.abs(n[1]) * size[1] / 2 + CLEAR;
  const along = Math.abs(u[0]) * size[0] / 2 + Math.abs(u[1]) * size[1] / 2;
  const reach = Math.min(...[0, 1].map((axis) => (u[axis] === 0 ? Infinity : (u[axis] < 0 ? PLANE[axis] - origin[axis] : origin[axis]) / Math.abs(u[axis]))));
  const out = [];
  for (let t = reach - along - 12; t > along; t -= 10) {
    for (const side of [1, -1]) out.push([origin[0] - u[0] * t + side * n[0] * across, origin[1] - u[1] * t + side * n[1] * across]);
  }
  return out;
}

/**
 * The Neumann series of a 2 × 2 matrix acting on every vector at once:
 * the unit circle and its image under S_k = I + A + … + A^k, an ellipse
 * that grows toward the image under (I − A)^{-1} (dashed). The unit
 * eigenvectors v1, v2 map to (1 + λ + … + λ^k) v_i on their own lines, the
 * scalar geometric series for a = λ_i, labelled with that factor. Beside
 * it, the slide's equations, one more per build step, and a key to the
 * curves; over the plane's top left corner, the step's k. Every label is
 * placed clear of the curves, the lines, and the other labels.
 *
 * Slide data: `eigenvectors` [v1, v2], `lambda` [λ1, λ2]; build steps
 * `{ terms, equation, eigenvalues? }` (`terms` is k, or "all" for the
 * limit; `eigenvalues: true` names each eigenvector line with its λ).
 */
export default function NeumannSeries({ slide, buildStep }) {
  const steps = slide.buildSteps;
  const step = steps[buildStep];
  const k = step.terms === 'all' ? Infinity : step.terms;
  if (!(k === Infinity || (Number.isInteger(k) && k >= 0))) throw new Error('neumannSeries: a step needs "terms" (an integer or "all")');

  const basis = slide.eigenvectors.map(normalize);
  const { A } = spectralMatrix(basis, { lambda: slide.lambda });
  const limit = resolvent(A);
  const S = k === Infinity ? limit : seriesSum(A, k);
  const circle = Array.from({ length: CIRCLE_POINTS }, (_, i) => {
    const t = (2 * Math.PI * i) / CIRCLE_POINTS;
    return [Math.cos(t), Math.sin(t)];
  });
  const image = circle.map((p) => multiply(S, p));
  const final = circle.map((p) => multiply(limit, p));
  const view = fitView([...final, ...circle], ...PLANE, 84);
  const path = (points) => `${points.map((p, i) => `${i === 0 ? 'M' : 'L'}${view.toScreen(p).map((v) => v.toFixed(1)).join(',')}`).join('')}Z`;
  const factors = slide.lambda.map((l) => (k === Infinity ? 1 / (1 - l) : (1 - l ** (k + 1)) / (1 - l)));
  const tips = basis.map((v, i) => [v[0] * factors[i], v[1] * factors[i]]);

  // Labels go where no curve, line, or earlier label is: first the eigenvector names (from the
  // limit's curves only, so they stay put once shown), then the factors at the arrow tips.
  const origin = view.toScreen([0, 0]);
  const directions = basis.map((v) => {
    const [sx, sy] = view.toScreen(v);
    const length = Math.hypot(sx - origin[0], sy - origin[1]);
    return [(sx - origin[0]) / length, (sy - origin[1]) / length];
  });
  const lines = directions.flatMap((u) => sample([[origin[0] - 2000 * u[0], origin[1] - 2000 * u[1]], [origin[0] + 2000 * u[0], origin[1] + 2000 * u[1]]])
    .filter(([x, y]) => x >= -20 && x <= PLANE[0] + 20 && y >= -20 && y <= PLANE[1] + 20));
  const screenCurve = (points) => sample([...points, points[0]].map((p) => view.toScreen(p)));
  const fixed = [...lines, ...screenCurve(final), ...screenCurve(circle), ...boxPoints(TERMS_BOX)];
  const placed = [];
  const eigenLabels = (step.eigenvalues ? basis : []).map((v, i) => {
    const center = placeLabel(besideLineEnd(origin, directions[i], EIGEN_LABEL), EIGEN_LABEL, [...fixed, ...placed]);
    placed.push(...boxPoints({ center, size: EIGEN_LABEL }));
    return { left: center[0], top: center[1], text: `$v_${i + 1}$, $\\lambda_${i + 1} = ${formatNumber(slide.lambda[i])}$`, className: EIGEN_INKS[i] };
  });
  const arrows = tips.flatMap((tip, i) => sample([origin, view.toScreen(tip)]).concat(sample([origin, view.toScreen(basis[i])])));
  const factorLabels = tips.map((tip, i) => {
    const screen = view.toScreen(tip);
    const center = placeLabel(aroundTip(screen, directions[i]), FACTOR_LABEL, [...fixed, ...screenCurve(image), ...arrows, ...placed]);
    placed.push(...boxPoints({ center, size: FACTOR_LABEL }));
    return { left: center[0], top: center[1], text: `$\\times ${formatNumber(factors[i])}$`, className: EIGEN_INKS[i] };
  });

  return (
    <div className="slide--neumann">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="neumann-body">
        <div className="neumann-side">
          <div className="neumann-equations">
            <EquationStack
              lines={steps.map((s) => ({ tex: s.equation }))}
              step={buildStep}
              className="neumann-stack"
              lineClassName="neumann-equation"
            />
          </div>
          <div className="neumann-key">
            <div><svg width="44" height="20"><circle cx="22" cy="10" r="8" className="neumann-circle" /></svg>unit circle</div>
            <div><svg width="44" height="20"><ellipse cx="22" cy="10" rx="18" ry="8" className="neumann-image" /></svg><Text>{'image under $S_k$'}</Text></div>
            <div><svg width="44" height="20"><ellipse cx="22" cy="10" rx="18" ry="8" className="neumann-limit" /></svg><Text>{'image under $(I - A)^{-1}$'}</Text></div>
          </div>
        </div>
        <div className="neumann-plane">
          <VectorPlane view={view}>
            {basis.map((v, i) => <PlaneLine key={i} view={view} direction={v} className={`neumann-eigenline ${EIGEN_INKS[i]}`} />)}
            <path d={path(final)} className="neumann-limit" />
            <motion.path
              key={buildStep}
              d={path(image)}
              className="neumann-image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            <path d={path(circle)} className="neumann-circle" />
            {basis.map((v, i) => (
              <g key={i}>
                <Arrow view={view} from={[0, 0]} to={tips[i]} className={EIGEN_INKS[i]} width={4} head={15} />
                <Arrow view={view} from={[0, 0]} to={v} className="la-ink-emission" width={3} head={12} />
              </g>
            ))}
          </VectorPlane>
          <div className="neumann-terms"><Text>{k === Infinity ? '$k \\to \\infty$' : `$k = ${k}$`}</Text></div>
          {[...eigenLabels, ...factorLabels].map((label) => (
            <div key={label.text} className={`neumann-factor ${label.className}`} style={{ left: label.left, top: label.top }}>
              <Text>{label.text}</Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
