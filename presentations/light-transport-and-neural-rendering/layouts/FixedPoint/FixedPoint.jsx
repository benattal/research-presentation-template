import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { multiply, solve } from '../linearAlgebra/linear.js';
import { normalize, spectralMatrix } from '../linearAlgebra/plane.js';
import VectorPlane, { Arrow, fitView } from '../linearAlgebra/VectorPlane.jsx';
import './FixedPoint.css';

const PLANE = [600, 520];
/** Stage pixels from the tip of x within which a press starts dragging it. */
const GRAB = 24;
const SHOWS = ['source', 'trial', 'solution'];

function formatEntry(value) {
  return String(Number(value.toFixed(2)));
}

function texMatrix(rows) {
  return `\\begin{pmatrix} ${rows.map((row) => row.map(formatEntry).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
}

/**
 * A linear system (I − A) x = b for a 2 × 2 matrix, read as the fixed
 * point x = b + Ax. The plane shows b from the origin, a vector x, and
 * Ax drawn from b's tip, so it ends at b + Ax: for a trial x the two tips
 * differ (dashed), and for the solution (I − A)^{-1} b they coincide and
 * the three arrows close a triangle. Beside it, A and b, then the slide's
 * equations, one more per build step. In the trial and solution steps,
 * dragging the tip of x moves it.
 *
 * Slide data: `eigenvectors` and `lambda` define A (as in spectralView),
 * `b` is in plain coordinates; build steps are `{ show, equation }` with
 * `show` one of source, trial (with the trial `x`), or solution.
 */
export default function FixedPoint({ slide, buildStep }) {
  const steps = slide.buildSteps;
  steps.forEach((s) => {
    if (!SHOWS.includes(s.show)) throw new Error(`fixedPoint: unknown show "${s.show}"`);
    if (s.show === 'trial' && !s.x) throw new Error('fixedPoint: a trial step needs "x"');
  });

  const basis = slide.eigenvectors.map(normalize);
  const { A } = spectralMatrix(basis, { lambda: slide.lambda });
  const b = slide.b;
  const solution = solve(A, b);
  const image = (x) => {
    const Ax = multiply(A, x);
    return [b[0] + Ax[0], b[1] + Ax[1]];
  };
  // One view for every step, so the picture does not jump between clicks.
  const trials = steps.filter((s) => s.x).map((s) => s.x);
  const view = fitView([[0, 0], b, solution, ...trials, ...trials.map(image)], ...PLANE, 64);

  return (
    <div className="slide--fixed-point">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="fixed-point-body">
        <div className="fixed-point-equations">
          <div className="fixed-point-data">
            <Text>{`$A = ${texMatrix(A)} \\qquad \\htmlClass{term-emission}{b} = ${texMatrix(b.map((v) => [v]))}$`}</Text>
          </div>
          {steps.slice(0, buildStep + 1).map((s, i) => (
            <motion.div
              key={i}
              className="fixed-point-equation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: i === buildStep ? 1 : 0.4, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Text>{s.equation}</Text>
            </motion.div>
          ))}
        </div>
        <FixedPointPlane
          key={buildStep}
          view={view}
          b={b}
          image={image}
          step={steps[buildStep]}
          initial={steps[buildStep].show === 'trial' ? steps[buildStep].x : solution}
        />
      </div>
    </div>
  );
}

function FixedPointPlane({ view, b, image, step, initial }) {
  const [x, setX] = useState(initial);
  const dragging = useRef(false);
  const shown = step.show !== 'source';
  const y = image(x);
  const closes = Math.hypot(y[0] - x[0], y[1] - x[1]) * view.scale < 4;

  const stagePoint = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = rect.width / view.width;
    return [(event.clientX - rect.left) / scale, (event.clientY - rect.top) / scale];
  };
  const handlers = shown ? {
    onPointerDown: (event) => {
      const [px, py] = stagePoint(event);
      const [tx, ty] = view.toScreen(x);
      if (Math.hypot(px - tx, py - ty) > GRAB) return;
      dragging.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event) => {
      if (dragging.current) setX(view.toPlane(stagePoint(event)));
    },
    onPointerUp: () => {
      dragging.current = false;
    },
  } : {};

  const labels = [{ at: [b[0] / 2, b[1] / 2], text: '$\\htmlClass{term-emission}{b}$', dx: -20, dy: 0 }];
  if (shown) {
    labels.push({ at: [(b[0] + y[0]) / 2, (b[1] + y[1]) / 2], text: '$\\htmlClass{term-bounce-1}{Ax}$', dx: -14, dy: -24 });
    labels.push({ at: [x[0] / 2, x[1] / 2], text: '$x$', dx: 20, dy: 16 });
    if (!closes) labels.push({ at: y, text: '$b + Ax$', dx: -2, dy: -30 });
  }

  const [yx, yy] = view.toScreen(y);
  const [xx, xy] = view.toScreen(x);
  return (
    <VectorPlane view={view} labels={labels} className="fixed-point-plane" {...handlers} data-no-swipe>
      {shown && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          {!closes && <line x1={xx} y1={xy} x2={yx} y2={yy} className="fixed-point-gap" />}
          <Arrow view={view} from={[0, 0]} to={x} className="la-ink-solution" width={3.5} head={16} />
          <Arrow view={view} from={b} to={y} className="la-ink-1" width={3.5} head={16} />
          <circle cx={xx} cy={xy} r={10} className={closes ? 'fixed-point-solution' : 'fixed-point-handle'} />
        </motion.g>
      )}
      <Arrow view={view} from={[0, 0]} to={b} className="la-ink-emission" width={3.5} head={16} />
    </VectorPlane>
  );
}
