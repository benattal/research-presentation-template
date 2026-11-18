import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { fixedPointIterates, seriesTerms, solve } from '../linearAlgebra/linear.js';
import { normalize, spectralMatrix } from '../linearAlgebra/plane.js';
import { useStepProgress } from '../linearAlgebra/useStepProgress.js';
import VectorPlane, {
  Arrow, Dot, FixedPointUpdates, Ring, TermPath, fitView, labelBeside, revealTerms, termInk, updateProgress,
} from '../linearAlgebra/VectorPlane.jsx';
import './IterationSeries.css';

const PLANE = [560, 420];
/** Updates drawn for the last step ("all"): later ones move an iterate by less than a stage pixel. */
const ALL_UPDATES = 24;
/** Milliseconds one update plays, and the whole of the last step. */
const UPDATE_MS = 700;
const ALL_MS = 3000;
/** The labels of the terms Ab, A²b, A³b on the right plane (b is labelled on both). */
const TERM_LABELS = ['Ab', 'A^2 b', 'A^3 b'];
/** Iterates x_1 … x_3 are labelled. */
const LABELLED_ITERATES = 3;
/**
 * Offsets of an iterate's label from its dot, in stage pixels, on the side
 * clear of each plane's arrows: above left on the left plane (its arrows
 * A x_k fan out below right of the iterates), below right on the right
 * plane (inside the path's bend; the term labels are outside it).
 */
const ITERATE_LABEL = { update: { dx: -22, dy: -16 }, series: { dx: 24, dy: 14 } };

/**
 * The fixed-point iteration x_{k+1} = b + A x_k from x_0 = 0 beside its
 * expansion x_{k+1} = b + Ab + … + A^k b, on two planes with one view:
 * left, each update drawn as on the fixed-point slide (A x_k from the tip
 * of b, ending at x_{k+1}); right, the terms b, Ab, A²b, … tip to tail as
 * on the Neumann series slide. Both show the same iterates (dots) reaching
 * the same solution (the ring), and draw each update in step. Under both,
 * `takeaway` appears with the last step.
 *
 * Slide data: `eigenvectors`, `lambda` (A, as on the other plane slides),
 * `b`, `update` and `series` (the equation over each plane), `takeaway`;
 * build steps `{ k }`: the updates through x_{k+1} (k an integer ≥ 0, or
 * "all"). A step's new updates play when the slide moves forward to it.
 */
export default function IterationSeries({ slide, buildStep }) {
  const steps = slide.buildSteps;
  steps.forEach((s) => {
    if (!(s.k === 'all' || (Number.isInteger(s.k) && s.k >= 0))) throw new Error('iterationSeries: a step needs "k" (an integer or "all")');
  });
  ['update', 'series', 'takeaway'].forEach((field) => {
    if (!slide[field]) throw new Error(`iterationSeries: the slide needs "${field}"`);
  });
  const count = (s) => (s.k === 'all' ? ALL_UPDATES : s.k + 1);
  const step = steps[buildStep];
  const previous = steps[Math.max(0, buildStep - 1)];
  const added = count(step) - count(previous);
  const last = buildStep === steps.length - 1;
  // In the top component, which stays mounted across steps, so the updates play on the step change.
  const progress = useStepProgress(buildStep, added <= 0 ? 0 : (step.k === 'all' ? ALL_MS : added * UPDATE_MS));
  const shown = count(previous) + added * progress;
  const { newest, growth, reached } = updateProgress(shown);

  const A = spectralMatrix(slide.eigenvectors.map(normalize), slide.lambda);
  const b = slide.b;
  const solution = solve(A, b);
  const iterates = fixedPointIterates(A, b, [0, 0], ALL_UPDATES);
  const terms = seriesTerms(A, b, ALL_UPDATES);
  const view = fitView([[0, 0], b, solution], ...PLANE, 52);

  const iterateLabels = (plane) => iterates.slice(1, Math.min(reached, LABELLED_ITERATES) + 1)
    .map((x, j) => ({ at: x, text: `$x_${j + 1}$`, ...ITERATE_LABEL[plane] }));
  const bLabel = labelBeside(view, [0, 0], b, '$b$', { side: 1, offset: 20, className: termInk(0) });
  // b is labelled as on the left plane; the later terms once whole (term j ends at x_{j+1}).
  const termLabels = TERM_LABELS.map((name, j) => ({ name, j: j + 1 })).filter(({ j }) => j < reached).map(({ name, j }) => (
    labelBeside(view, iterates[j], iterates[j + 1], `$${name}$`, { side: 1, offset: 26, className: termInk(j) })
  ));

  return (
    <div className="slide--iteration-series">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="iteration-series-planes">
        <div className="iteration-series-panel">
          <div className="iteration-series-equation"><Text>{slide.update}</Text></div>
          <VectorPlane view={view} labels={[bLabel, ...iterateLabels('update')]}>
            <FixedPointUpdates view={view} b={b} iterates={iterates} shown={shown} />
            <Arrow view={view} from={[0, 0]} to={b} className={termInk(0)} width={3.5} head={16} />
            <Ring view={view} at={solution} />
          </VectorPlane>
        </div>
        <div className="iteration-series-panel">
          <div className="iteration-series-equation"><Text>{slide.series}</Text></div>
          <VectorPlane view={view} labels={[bLabel, ...termLabels, ...iterateLabels('series')]}>
            <TermPath view={view} terms={revealTerms(terms, newest + growth)} />
            {iterates.slice(0, reached + 1).map((x, j) => <Dot key={j} view={view} at={x} />)}
            <Ring view={view} at={solution} />
          </VectorPlane>
        </div>
      </div>
      <div className="iteration-series-takeaway" style={{ opacity: last ? progress : 0 }} aria-hidden={!last}>
        <Text>{slide.takeaway}</Text>
      </div>
    </div>
  );
}
