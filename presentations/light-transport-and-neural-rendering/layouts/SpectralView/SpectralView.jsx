import SlideTitle from '@core/stage/SlideTitle.jsx';
import { ease } from '@core/stage/canvas.js';
import EquationStack from '@core/stage/EquationStack.jsx';
import { seriesTerms, solve } from '../linearAlgebra/linear.js';
import { eigenParts, normalize, spectralMatrix } from '../linearAlgebra/plane.js';
import { useStepProgress } from '../linearAlgebra/useStepProgress.js';
import VectorPlane, {
  Arrow, Dot, PlaneLine, Ring, TermPath, examplePlaneView, labelBeside, labelFits, lineLabel, revealTerms, sideOf, termInk,
} from '../linearAlgebra/VectorPlane.jsx';
import './SpectralView.css';

const SHOWS = ['eigenvectors', 'components', 'series', 'limits'];
/** Powers λ_i^k v_i (k ≥ 1) marked on the first step. */
const POWERS = 8;
/** Terms of each geometric series drawn: later ones are shorter than a stage pixel. */
const SERIES_TERMS = 40;
/** Milliseconds a step plays: the series grow, other marks fade in. */
const SERIES_MS = 1600;
const FADE_MS = 500;
/** Half the length of the tick at each limit, in stage pixels. */
const TICK = 9;
/** Sizes of the labels v_i and c_i / (1 − λ_i) v_i, in stage pixels, for placing them clear of their lines. */
const VECTOR_LABEL = [28, 28];
const LIMIT_LABEL = [96, 56];

/**
 * The Neumann series of a 2 × 2 matrix in its eigenbasis, one equation per
 * build step, each with its counterpart in the picture: the eigenvector
 * lines with v_i and its powers λ_i^k v_i (dots, in the term inks); b
 * and its components c_i v_i (the dashed parallelogram); along each line
 * the geometric series c_i λ_i^j v_i tip to tail in the term inks, beside
 * the 2D path b, Ab, A²b, … of the Neumann series slide (faded); and the
 * limits c_i / (1 − λ_i) v_i (ticks), whose parallelogram closes at
 * (I − A)^{-1} b (the ring). A step's new marks grow or fade in when the
 * slide moves forward to it. The view is the section's
 * (`examplePlaneView`), shared with the fixed-point and Neumann series
 * slides.
 *
 * Slide data: `eigenvectors` [v1, v2], `lambda` [λ1, λ2] (each |λ_i| < 1),
 * `b`; `equations`, the lines of an `EquationStack` with the step each
 * appears at (a line may reveal its right side a step later); build steps
 * `{ show }` with `show` one of eigenvectors, components, series, limits,
 * in that order. A show may repeat on the next step, which keeps the
 * picture while an equation asks its question.
 */
export default function SpectralView({ slide, buildStep }) {
  const steps = slide.buildSteps;
  steps.forEach((s, i) => {
    const index = SHOWS.indexOf(s.show);
    const before = i === 0 ? -1 : SHOWS.indexOf(steps[i - 1].show);
    if (index < 0 || !(index === before + 1 || (i > 0 && index === before))) {
      throw new Error(`spectralView: step ${i + 1} shows "${s.show}"; the steps show ${SHOWS.join(', ')} in order, each once or twice in a row`);
    }
  });
  if (!Array.isArray(slide.equations) || slide.equations.some((line) => !Number.isInteger(line.step))) {
    throw new Error('spectralView: the slide needs "equations", each line with its "step"');
  }
  const shows = steps[buildStep].show;
  const shownBefore = buildStep > 0 ? steps[buildStep - 1].show : null;
  const reached = (name) => SHOWS.indexOf(shows) >= SHOWS.indexOf(name);
  const durations = { eigenvectors: 0, components: FADE_MS, series: SERIES_MS, limits: FADE_MS };
  const progress = useStepProgress(buildStep, shows === shownBefore ? 0 : durations[shows]);
  // The marks a step adds come in with `progress`; earlier steps' marks stay whole.
  const arriving = (name) => (shows === name && shownBefore !== name ? progress : 1);

  const basis = slide.eigenvectors.map(normalize);
  const A = spectralMatrix(basis, slide.lambda);
  const b = slide.b;
  const solution = solve(A, b);
  const { parts, limits } = eigenParts(basis, slide.lambda, b);
  const view = examplePlaneView(basis, slide.lambda, b);
  const series = parts.map((part, i) => Array.from({ length: SERIES_TERMS }, (_, j) => part.map((value) => value * slide.lambda[i] ** j)));
  const shownTerms = 1 + (SERIES_TERMS - 1) * ease(arriving('series'));

  // v_i names its unit arrow on the first step; from the second, c_i v_i names each line.
  const labels = shows === 'eigenvectors'
    ? basis.map((v, i) => lineLabel(view, v, `$v_${i + 1}$`, { side: -sideOf(v, solution), distance: 1, size: VECTOR_LABEL, className: 'la-ink-first' }))
    : [];
  if (reached('components')) {
    labels.push(labelBeside(view, [0, 0], b, '$b$', { side: -1, offset: 16, className: termInk(0) }));
    parts.forEach((part, i) => labels.push(labelBeside(view, [0, 0], part, `$c_${i + 1} v_${i + 1}$`, { side: -sideOf(part, solution), offset: 24, className: termInk(0) })));
  }
  if (reached('series')) labels.push({ at: solution, text: '$(I - A)^{-1} b$', dx: 78, dy: 0 });
  if (reached('limits')) {
    // The first placement that fits in the view: beside the limit, away from the parallelogram; in the
    // corner past the limit; or away from the parallelogram, as far out along the line as fits.
    limits.forEach((limit, i) => {
      const text = `$\\dfrac{c_${i + 1}}{1 - \\lambda_${i + 1}}\\, v_${i + 1}$`;
      const away = -sideOf(basis[i], solution);
      const distance = Math.hypot(...limit);
      const placements = [{ side: away, distance }, { side: -away, distance, beyond: true }, { side: away }]
        .map((placement) => lineLabel(view, basis[i], text, { ...placement, size: LIMIT_LABEL }));
      labels.push(placements.find((label) => labelFits(view, label)) ?? placements.at(-1));
    });
  }

  const ticks = limits.map((limit, i) => {
    const [x, y] = view.toScreen(limit);
    const [nx, ny] = [-basis[i][1], -basis[i][0]];
    return <line key={i} x1={x - nx * TICK} y1={y - ny * TICK} x2={x + nx * TICK} y2={y + ny * TICK} className="spectral-limit" />;
  });
  const construction = (from, to, key) => {
    const [ax, ay] = view.toScreen(from);
    const [bx, by] = view.toScreen(to);
    return <line key={key} x1={ax} y1={ay} x2={bx} y2={by} className="la-construction" />;
  };

  return (
    <div className="slide--spectral">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="la-plane-body">
        <div className="la-plane-equations">
          <EquationStack
            lines={slide.equations}
            step={buildStep}
            className="spectral-stack"
            lineClassName="spectral-equation"
          />
        </div>
        <VectorPlane view={view} labels={labels}>
          {basis.map((v, i) => <PlaneLine key={i} view={view} direction={v} className="la-eigenline" />)}
          {shows === 'eigenvectors' && basis.map((v, i) => (
            <g key={`v${i}`}>
              <Arrow view={view} from={[0, 0]} to={v} className="la-ink-first" width={3} head={14} />
              {Array.from({ length: POWERS }, (_, k) => (
                <Dot key={k} view={view} at={v.map((value) => value * slide.lambda[i] ** (k + 1))} r={4.5} className={`spectral-power ${termInk(k + 1)}`} />
              ))}
            </g>
          ))}
          {reached('series') && (
            <g style={{ opacity: arriving('series') }}>
              <TermPath view={view} terms={seriesTerms(A, b, SERIES_TERMS).slice(1)} start={b} first={1} width={2.5} head={12} className="la-faded" />
            </g>
          )}
          {reached('components') && (
            <g style={{ opacity: arriving('components') }}>
              {shows === 'components' && parts.map((part, i) => construction(part, b, `p${i}`))}
              {series.map((terms, i) => <TermPath key={i} view={view} terms={revealTerms(terms, reached('series') ? shownTerms : 1)} width={3.5} head={15} />)}
              <Arrow view={view} from={[0, 0]} to={b} className={termInk(0)} width={3.5} head={16} />
            </g>
          )}
          {reached('limits') && (
            <g style={{ opacity: arriving('limits') }}>
              {limits.map((limit, i) => construction(limit, solution, `l${i}`))}
              {ticks}
            </g>
          )}
          {reached('series') && <Ring view={view} at={solution} />}
        </VectorPlane>
      </div>
    </div>
  );
}
