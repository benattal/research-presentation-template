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
/** Size of a factor label (stage pixels), for placing it clear of the ellipse and the eigenvector line. */
const LABEL = [64, 30];

function formatNumber(value) {
  return String(Number(value.toPrecision(3)));
}

/**
 * Where a label of size LABEL goes beside the tip `tip` (stage pixels) of
 * an arrow along the screen direction `u`: past the tip along u, so it
 * lies beyond the ellipse's tangent there, and to the side `n`, so the
 * eigenvector line does not cross it.
 */
function besideTip(tip, u, gap = 8) {
  const n = [u[1], -u[0]];
  const extent = (d) => Math.abs(d[0]) * LABEL[0] / 2 + Math.abs(d[1]) * LABEL[1] / 2 + gap;
  const forward = extent(u);
  const side = extent(n);
  return [tip[0] + u[0] * forward + n[0] * side, tip[1] + u[1] * forward + n[1] * side];
}

/**
 * The Neumann series of a 2 × 2 matrix acting on every vector at once:
 * the unit circle and its image under S_k = I + A + … + A^k, an ellipse
 * that grows toward the image under (I − A)^{-1} (dashed). The unit
 * eigenvectors v1, v2 map to (1 + λ + … + λ^k) v_i on their own lines, the
 * scalar geometric series for a = λ_i, labelled with that factor. Beside
 * it, the slide's equations, one more per build step, and a key to the
 * curves.
 *
 * Slide data: `eigenvectors` [v1, v2], `lambda` [λ1, λ2]; build steps
 * `{ terms, equation }` (`terms` is k, or "all" for the limit).
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

  const origin = view.toScreen([0, 0]);
  const factorLabels = tips.map((tip, i) => {
    const screen = view.toScreen(tip);
    const length = Math.hypot(screen[0] - origin[0], screen[1] - origin[1]);
    const u = [(screen[0] - origin[0]) / length, (screen[1] - origin[1]) / length];
    const [left, top] = besideTip(screen, u);
    return { left, top, text: `$\\times ${formatNumber(factors[i])}$`, className: EIGEN_INKS[i] };
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
          {factorLabels.map((label, i) => (
            <div key={i} className={`neumann-factor ${label.className}`} style={{ left: label.left, top: label.top }}>
              <Text>{label.text}</Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
