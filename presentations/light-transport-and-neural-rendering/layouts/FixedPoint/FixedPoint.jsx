import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import EquationStack from '../equations/EquationStack.jsx';
import { fixedPointIterates, multiply, solve } from '../linearAlgebra/linear.js';
import { normalize, spectralMatrix } from '../linearAlgebra/plane.js';
import { useStepProgress } from '../linearAlgebra/useStepProgress.js';
import VectorPlane, {
  Arrow, Dot, FixedPointUpdates, Ring, fitView, updateProgress,
} from '../linearAlgebra/VectorPlane.jsx';
import './FixedPoint.css';

const PLANE = [600, 520];
/** Stage pixels from the tip of x within which a press starts dragging it. */
const GRAB = 24;
const SHOWS = ['source', 'trial', 'solution', 'prompt', 'iterate'];
/** Seconds per update when the iterate step plays. */
const UPDATE_SECONDS = 0.45;
/** Iterates x_0 … x_2 are labelled (later ones crowd at the ring), to the right of their dots. */
const LABELLED_ITERATES = 2;
const ITERATE_LABEL = { dx: 24, dy: 6 };

/**
 * A linear system (I − A) x = b for a 2 × 2 matrix, read as the fixed
 * point x = b + Ax, then solved by iterating it. The plane shows b from the
 * origin, a vector x, and Ax drawn from b's tip, so it ends at b + Ax: for
 * the trial x the two tips differ (the dashed gap), and for the solution
 * (I − A)^{-1} b (the ring) they coincide and the three arrows close a
 * triangle. The prompt step shows the trial x as the start x_0 and the
 * ring; the iterate step plays the updates x_{k+1} = b + A x_k from x_0,
 * each drawn as the trial's construction, and the iterates (dots) reach
 * the ring. Beside the plane, `given` (the line naming A and b), then the
 * slide's equations, one more per build step. From the trial step on,
 * dragging the tip of x (x_0) moves it; the iterates follow at once.
 *
 * Slide data: `eigenvectors` and `lambda` define A (as on the Neumann
 * series slides), `b` is in plain coordinates, `trial` is the trial x and
 * x_0, `given` is slide text. Build steps are `{ show, equation }` with
 * `show` one of source, trial, solution, prompt, or iterate (with
 * `updates`, how many it plays).
 */
export default function FixedPoint({ slide, buildStep }) {
  const steps = slide.buildSteps;
  steps.forEach((s) => {
    if (!SHOWS.includes(s.show)) throw new Error(`fixedPoint: unknown show "${s.show}"`);
    if (s.show === 'iterate' && !(Number.isInteger(s.updates) && s.updates >= 1)) throw new Error('fixedPoint: an iterate step needs "updates" (a positive integer)');
  });
  ['trial', 'given'].forEach((field) => {
    if (!slide[field]) throw new Error(`fixedPoint: the slide needs "${field}"`);
  });
  const step = steps[buildStep];
  // In the top component, which stays mounted across steps, so the updates play on the step change.
  const progress = useStepProgress(buildStep, step.show === 'iterate' ? step.updates * UPDATE_SECONDS * 1000 : 0);

  const A = spectralMatrix(slide.eigenvectors.map(normalize), slide.lambda);
  const b = slide.b;
  const solution = solve(A, b);
  const image = (x) => {
    const Ax = multiply(A, x);
    return [b[0] + Ax[0], b[1] + Ax[1]];
  };
  // One view for every step, so the picture does not jump between clicks.
  const updates = Math.max(1, ...steps.map((s) => s.updates ?? 0));
  const view = fitView([[0, 0], b, solution, image(slide.trial), ...fixedPointIterates(A, b, slide.trial, updates)], ...PLANE, 64);

  return (
    <div className="slide--fixed-point">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="fixed-point-body">
        <div className="fixed-point-equations">
          <div className="fixed-point-data">
            <Text>{slide.given}</Text>
          </div>
          <EquationStack
            lines={steps.map((s) => ({ tex: s.equation }))}
            step={buildStep}
            className="fixed-point-stack"
            lineClassName="fixed-point-equation"
          />
        </div>
        <FixedPointPlane
          key={buildStep}
          view={view}
          A={A}
          b={b}
          solution={solution}
          step={step}
          initial={step.show === 'solution' ? solution : slide.trial}
          progress={progress}
        />
      </div>
    </div>
  );
}

/** The plane of one build step: keyed by the step, so a dragged x returns to its place on the next click. */
function FixedPointPlane({ view, A, b, solution, step, initial, progress }) {
  const [x, setX] = useState(initial);
  const [dragged, setDragged] = useState(false);
  const dragging = useRef(false);
  const { show } = step;
  const draggable = show !== 'source';
  const Ax = multiply(A, x);
  const y = [b[0] + Ax[0], b[1] + Ax[1]];
  const closes = Math.hypot(y[0] - x[0], y[1] - x[1]) * view.scale < 4;

  const stagePoint = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = rect.width / view.width;
    return [(event.clientX - rect.left) / scale, (event.clientY - rect.top) / scale];
  };
  const handlers = draggable ? {
    onPointerDown: (event) => {
      const [px, py] = stagePoint(event);
      const [tx, ty] = view.toScreen(x);
      if (Math.hypot(px - tx, py - ty) > GRAB) return;
      dragging.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event) => {
      if (!dragging.current) return;
      setX(view.toPlane(stagePoint(event)));
      setDragged(true);
    },
    onPointerUp: () => {
      dragging.current = false;
    },
  } : {};

  const labels = [{ at: [b[0] / 2, b[1] / 2], text: '$\\htmlClass{term-emission}{b}$', dx: -20, dy: 0 }];
  let figure = null;
  if (show === 'trial' || show === 'solution') {
    labels.push({ at: [(b[0] + y[0]) / 2, (b[1] + y[1]) / 2], text: '$\\htmlClass{term-bounce-1}{Ax}$', dx: -14, dy: -24 });
    labels.push({ at: [x[0] / 2, x[1] / 2], text: '$x$', dx: 20, dy: 16 });
    if (!closes) labels.push({ at: y, text: '$b + Ax$', dx: -2, dy: -30 });
    const [xx, xy] = view.toScreen(x);
    const [yx, yy] = view.toScreen(y);
    figure = (
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        {!closes && <line x1={xx} y1={xy} x2={yx} y2={yy} className="la-gap" />}
        <Arrow view={view} from={[0, 0]} to={x} className="la-ink-solution" width={3.5} head={16} />
        <Arrow view={view} from={b} to={y} className="la-ink-1" width={3.5} head={16} />
      </motion.g>
    );
  } else if (show === 'prompt' || show === 'iterate') {
    // After a drag the iterates follow the new x_0 at once.
    const shown = show === 'iterate' ? (dragged ? step.updates : progress * step.updates) : 0;
    const iterates = fixedPointIterates(A, b, x, step.updates ?? 1);
    const { reached } = updateProgress(shown);
    iterates.slice(0, Math.min(reached, LABELLED_ITERATES) + 1).forEach((iterate, k) => {
      labels.push({ at: iterate, text: `$x_${k}$`, ...ITERATE_LABEL });
    });
    figure = <FixedPointUpdates view={view} b={b} iterates={iterates} shown={shown} />;
  }

  return (
    <VectorPlane view={view} labels={labels} className="fixed-point-plane" {...handlers} data-no-swipe>
      {figure}
      {show !== 'source' && show !== 'trial' && <Ring view={view} at={solution} />}
      <Arrow view={view} from={[0, 0]} to={b} className="la-ink-emission" width={3.5} head={16} />
      {draggable && <Dot view={view} at={x} r={6} className="la-dot fixed-point-handle" />}
    </VectorPlane>
  );
}
