import SlideTitle from '@core/stage/SlideTitle.jsx';
import { ease } from '../canvas/canvas.js';
import EquationStack from '../equations/EquationStack.jsx';
import { seriesTerms, solve } from '../linearAlgebra/linear.js';
import { normalize, spectralMatrix } from '../linearAlgebra/plane.js';
import { useStepProgress } from '../linearAlgebra/useStepProgress.js';
import VectorPlane, {
  Dot, PlaneLine, Ring, TermPath, eigenPlaneView, labelBeside, lineLabel, pathEnd, revealTerms, sideOf, termInk,
} from '../linearAlgebra/VectorPlane.jsx';
import './NeumannSeries.css';

/** Terms drawn for the limit ("all"): later ones are shorter than a stage pixel. */
const ALL_TERMS = 40;
/** The labels of the first terms, b, Ab, A²b. */
const TERM_LABELS = ['b', 'Ab', 'A^2 b'];
/** Size of an eigenvalue's label ("λ1 = 0.8"), in stage pixels, for placing it clear of its line. */
const EIGENVALUE_LABEL = [84, 28];
/** Milliseconds per term a step adds, and the shortest and longest a step plays. */
const TERM_MS = 300;
const SHORTEST_MS = 600;
const LONGEST_MS = 1800;

/**
 * The Neumann series of a 2 × 2 matrix applied to b: the terms b, Ab,
 * A²b, … tip to tail in the term inks, so the tip after k + 1 terms is the
 * partial sum S_k b (a dot), and the path reaches (I − A)^{-1} b (the
 * ring). Beside it, the slide's equations, each with its counterpart in
 * the picture: S_k b; the next term A^{k+1} b dashed from S_k b's tip (the
 * residual b − (I − A) S_k b); more terms, shrinking, with the eigenvector
 * lines and their eigenvalues; and the path reaching the ring. A step's new
 * terms grow in when the slide moves forward to it. The view is the
 * spectral slide's (`eigenPlaneView`).
 *
 * Slide data: `eigenvectors` [v1, v2], `lambda` [λ1, λ2], `b`; `equations`,
 * the lines of an `EquationStack` with the step each appears at (a line
 * may reveal its right side a step later, with a justification under it);
 * build steps `{ k, next?, eigenvalues? }`: `k` is the last power drawn (an
 * integer, or "all" for the limit), `next: true` adds A^{k+1} b dashed,
 * `eigenvalues: true` draws the eigenvector lines labelled with λ_i.
 */
export default function NeumannSeries({ slide, buildStep }) {
  const steps = slide.buildSteps;
  steps.forEach((s) => {
    if (!(s.k === 'all' || (Number.isInteger(s.k) && s.k >= 0))) throw new Error('neumannSeries: a step needs "k" (an integer or "all")');
    if (s.next && s.k === 'all') throw new Error('neumannSeries: the limit has no next term');
  });
  if (!Array.isArray(slide.equations) || slide.equations.some((line) => !Number.isInteger(line.step))) {
    throw new Error('neumannSeries: the slide needs "equations", each line with its "step"');
  }
  const count = (s) => (s.k === 'all' ? ALL_TERMS : s.k + 1);
  const step = steps[buildStep];
  const previous = steps[Math.max(0, buildStep - 1)];
  const added = count(step) - count(previous);
  const appears = (step.next && !previous.next) || (step.eigenvalues && !previous.eigenvalues);
  const duration = added > 0 ? Math.min(LONGEST_MS, Math.max(SHORTEST_MS, added * TERM_MS)) : (appears ? SHORTEST_MS : 0);
  // In the top component, which stays mounted across steps, so new terms grow on the step change.
  const progress = useStepProgress(buildStep, duration);

  const basis = slide.eigenvectors.map(normalize);
  const A = spectralMatrix(basis, slide.lambda);
  const b = slide.b;
  const solution = solve(A, b);
  const view = eigenPlaneView(basis, slide.lambda, b);
  const terms = seriesTerms(A, b, ALL_TERMS + 1);
  const shown = count(previous) + added * ease(progress);
  const drawn = revealTerms(terms, shown);
  const end = pathEnd(drawn);
  const next = step.next ? (previous.next ? 1 : ease(progress)) : 0;
  const nextTerm = step.next ? terms[step.k + 1] : null;

  // The first terms are labelled once whole.
  const labels = TERM_LABELS.slice(0, Math.floor(shown)).map((name, j) => (
    labelBeside(view, pathEnd(terms.slice(0, j)), pathEnd(terms.slice(0, j + 1)), `$${name}$`, { side: 1, offset: 26, className: termInk(j) })
  ));
  if (step.k !== 'all') labels.push({ at: end, text: '$S_k b$', dx: 30, dy: 22 });
  if (step.next && next === 1) {
    const reach = [end[0] + nextTerm[0], end[1] + nextTerm[1]];
    labels.push(labelBeside(view, end, reach, '$A^{k+1} b$', { side: 1, offset: 28, className: termInk(step.k + 1) }));
  }
  if (step.eigenvalues) {
    basis.forEach((v, i) => labels.push(lineLabel(view, v, `$\\lambda_${i + 1} = ${slide.lambda[i]}$`, {
      side: sideOf(v, solution), size: EIGENVALUE_LABEL, className: 'la-ink-first',
    })));
  }
  labels.push({ at: solution, text: '$(I - A)^{-1} b$', dx: 78, dy: 0 });

  return (
    <div className="slide--neumann">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="neumann-body">
        <div className="neumann-equations">
          <EquationStack
            lines={slide.equations}
            step={buildStep}
            className="neumann-stack"
            lineClassName="neumann-equation"
          />
        </div>
        <VectorPlane view={view} labels={labels}>
          {step.eigenvalues && (
            <g style={{ opacity: previous.eigenvalues ? 1 : progress }}>
              {basis.map((v, i) => <PlaneLine key={i} view={view} direction={v} className="la-eigenline" />)}
            </g>
          )}
          <TermPath view={view} terms={drawn} />
          {next > 0 && <TermPath view={view} terms={[nextTerm.map((value) => value * next)]} start={end} first={step.k + 1} dashed />}
          <Ring view={view} at={solution} />
          <Dot view={view} at={end} />
        </VectorPlane>
      </div>
    </div>
  );
}
