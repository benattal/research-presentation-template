import { useMemo, useRef, useState } from 'react';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { useAnimation } from '../canvas/canvas.js';
import EquationStack from '../equations/EquationStack.jsx';
import { partialSums, solve } from '../linearAlgebra/linear.js';
import { amplification, combine, components, normalize, spectralMatrix } from '../linearAlgebra/plane.js';
import { Plot, decadeTicks } from '../linearAlgebra/plots.jsx';
import Slider from '../linearAlgebra/Slider.jsx';
import VectorPlane, { Arrow, PlaneLine, fitView } from '../linearAlgebra/VectorPlane.jsx';
import './SpectralView.css';

const PLANE = [680, 456];
const PLOT = [440, 250];
/** Terms of the error plot, and the most terms the slider allows. */
const MAX_TERMS = 60;
const EIGEN_INKS = ['la-ink-first', 'la-ink-second'];
/** The derivation, in one row over the plane and the plot: its second line appears with the first general b. */
const DERIVATION = [
  { tex: '$A^k v_i = \\lambda_i^k\\, v_i$', step: 0 },
  {
    tex: '$x = \\sum_k A^k \\htmlClass{term-emission}{b} = \\sum_i c_i \\left(1 + \\lambda_i + \\lambda_i^2 + \\cdots\\right) v_i = \\sum_i \\dfrac{c_i}{1 - \\lambda_i}\\, v_i$',
    step: 2,
  },
];
/** Size of a "×factor" label (stage pixels), for placing it clear of its segment. */
const FACTOR_LABEL = [60, 28];

function inkOfTerm(j) {
  return j === 0 ? 'la-ink-emission' : `la-ink-${Math.min(j, 4)}`;
}

function formatNumber(value) {
  if (value >= 100) return value.toFixed(0);
  if (value >= 0.01) return String(Number(value.toPrecision(3)));
  return value.toExponential(0).replace(/e-(\d+)/, '\\cdot 10^{-$1}');
}

/** Where the ray from the origin along `direction` leaves the view, pulled in by `inset` stage pixels. */
function edgePoint(view, direction, inset = 26) {
  const [[x0, y0], [x1, y1]] = view.bounds;
  const [dx, dy] = normalize(direction);
  const limits = [dx > 0 ? x1 / dx : dx < 0 ? x0 / dx : Infinity, dy > 0 ? y1 / dy : dy < 0 ? y0 / dy : Infinity];
  const t = Math.min(...limits) - inset / view.scale;
  return [dx * t, dy * t];
}

/** A step's spectrum, as a key: steps with the same spectrum share one view of the plane. */
function spectrumKey(step) {
  return step.complex ? `complex:${step.complex.modulus}:${step.complex.angle}` : `real:${step.lambda.join(',')}`;
}

function stepSpec(step) {
  return step.complex ? { modulus: step.complex.modulus, angle: step.complex.angle } : { lambda: step.lambda };
}

/**
 * For each eigenvector, which end of its line (+1 or −1) carries its name:
 * the end farther from the origin, b, x, and x_k of every scripted step
 * with this spectrum, so the names stay put while those steps change b.
 */
function labelEnds(basis, view, steps) {
  const occupied = steps.flatMap((other) => {
    const { A } = spectralMatrix(basis, stepSpec(other));
    const b = combine(basis, other.b);
    return [[0, 0], b, solve(A, b), partialSums(A, b, other.terms + 1)[other.terms]].map((p) => view.toScreen(p));
  });
  const clearance = (p) => {
    const [sx, sy] = view.toScreen(p);
    return Math.min(...occupied.map(([ox, oy]) => Math.hypot(sx - ox, sy - oy)));
  };
  return basis.map((v) => (clearance(edgePoint(view, v)) >= clearance(edgePoint(view, [-v[0], -v[1]])) ? 1 : -1));
}

/**
 * Where the "×factor" label of a component goes, in stage pixels: beside
 * the end `tip` of its thick segment from `origin`, on the side away from
 * the points `away` (b, then x: the first one off the line decides).
 * When all of them lie on the line, the side away from `fallback`, a
 * screen offset to keep clear (x's own label).
 */
function factorLabelAt(origin, tip, away, fallback) {
  const length = Math.hypot(tip[0] - origin[0], tip[1] - origin[1]);
  const u = [(tip[0] - origin[0]) / length, (tip[1] - origin[1]) / length];
  const n = [-u[1], u[0]];
  const offside = (d) => d[0] * n[0] + d[1] * n[1];
  const decisive = away.map((p) => offside([p[0] - origin[0], p[1] - origin[1]])).find((d) => Math.abs(d) > 4);
  const side = -Math.sign(decisive ?? offside(fallback)) || 1;
  const across = Math.abs(n[0]) * FACTOR_LABEL[0] / 2 + Math.abs(n[1]) * FACTOR_LABEL[1] / 2 + 10;
  const back = Math.min(28, length / 2);
  return [tip[0] - u[0] * back + side * n[0] * across, tip[1] - u[1] * back + side * n[1] * across];
}

/**
 * The plane points a state draws (origin, b, x, the partial sums shown,
 * and, for a real spectrum, both components of b and of x), for fitting
 * the view to them.
 */
function statePoints(basis, spec, b, terms) {
  const { A, eigenvalues } = spectralMatrix(basis, spec);
  const x = solve(A, b);
  const sums = partialSums(A, b, terms + 1);
  const points = [[0, 0], b, x, ...sums.slice(0, terms + 1)];
  if (spec.lambda) {
    const coefficients = components(basis, b);
    const factors = eigenvalues.map(amplification);
    coefficients.forEach((c, i) => {
      const unit = i === 0 ? [1, 0] : [0, 1];
      points.push(combine(basis, unit.map((u) => u * c)), combine(basis, unit.map((u) => u * c * factors[i])));
    });
  }
  return points;
}

/** True when every point lies inside `view`, at least `inset` stage pixels from its edges. */
function fits(view, points, inset = 24) {
  return points.every((p) => {
    const [sx, sy] = view.toScreen(p);
    return sx >= inset && sx <= view.width - inset && sy >= inset && sy <= view.height - inset;
  });
}

/**
 * The Neumann series of a 2 × 2 matrix, seen through its spectrum. The
 * plane shows the eigenvector lines of A, a source b (draggable), and the
 * partial sums b + Ab + … + A^k b as a chain of arrows, tip to tail, toward
 * x = (I − A)^{-1}b (the direct solve, marked). Along each eigenvector the
 * component of b is scaled by 1/(1 − λ): the thin segment is b's
 * component, the thick one x's, labelled "×factor" on the side away from
 * b. Over both, the derivation (its second line from the third step on);
 * beside the plane, sliders for the spectrum and k, the factors 1/(1 − λ_i) (or |1/(1 − λ)|
 * for a complex pair, in the same row), and the error ‖x − x_k‖ after k
 * terms, with each eigencomponent's share.
 *
 * The view of the plane, and the end of each eigenvector line that carries
 * its name, are chosen once for every build step with the same spectrum,
 * so the axes and names stay put between those steps and while the
 * sliders move; the view is refitted only when an exploration ends
 * (pointer released) with something outside it.
 *
 * Slide data: `eigenvectors` [v1, v2]; each build step `{ lambda: [λ1,
 * λ2] }` or `{ complex: { modulus, angle } }` (angle in degrees; v1, v2
 * are then the basis A rotates in), `b` as coordinates in that basis, and
 * `terms` (k).
 */
export default function SpectralView({ slide, buildStep }) {
  return (
    <div className="slide--spectral">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <SpectralState key={buildStep} slide={slide} step={slide.buildSteps[buildStep]} stepIndex={buildStep} />
    </div>
  );
}

function SpectralState({ slide, step, stepIndex }) {
  const basis = slide.eigenvectors.map(normalize);
  const complex = Boolean(step.complex);
  if (!complex && !step.lambda) throw new Error('spectralView: a step needs "lambda" or "complex"');
  if (!step.b) throw new Error('spectralView: a step needs "b"');
  const [first, setFirst] = useState(complex ? step.complex.modulus : step.lambda[0]);
  const [second, setSecond] = useState(complex ? step.complex.angle : step.lambda[1]);
  const [b, setB] = useState(() => combine(basis, step.b));
  const [terms, setTerms] = useState(step.terms);
  const [reveal, setReveal] = useState(0);
  const dragging = useRef(false);
  useAnimation('chain', Math.min(2600, 500 + 110 * step.terms), setReveal);
  const { scriptedView, ends } = useMemo(() => {
    const sameSpectrum = slide.buildSteps.filter((other) => spectrumKey(other) === spectrumKey(step));
    const points = sameSpectrum.flatMap((other) => statePoints(basis, stepSpec(other), combine(basis, other.b), other.terms));
    const fitted = fitView(points, ...PLANE, 56);
    return { scriptedView: fitted, ends: complex ? null : labelEnds(basis, fitted, sameSpectrum) };
  }, [slide, step]);
  const [view, setView] = useState(scriptedView);

  const spec = complex ? { modulus: first, angle: second } : { lambda: [first, second] };
  const { A, eigenvalues } = spectralMatrix(basis, spec);
  const x = solve(A, b);
  const sums = partialSums(A, b, MAX_TERMS + 1);
  const coefficients = components(basis, b);
  const factors = eigenvalues.map(amplification);
  const scaled = coefficients.map((c, i) => combine(basis, i === 0 ? [c * factors[0], 0] : [0, c * factors[1]]));
  const parts = coefficients.map((c, i) => combine(basis, i === 0 ? [c, 0] : [0, c]));
  const error = (k) => Math.hypot(x[0] - sums[k][0], x[1] - sums[k][1]);

  const shownPoints = [[0, 0], b, x, ...sums.slice(0, terms + 1), ...(complex ? [] : [...scaled, ...parts])];
  /** At the end of an exploration, refit the view if what it shows no longer fits. */
  const refit = () => {
    if (!fits(view, shownPoints)) setView(fitView(shownPoints, ...PLANE, 56));
  };

  const shown = reveal * terms;
  const chain = [];
  for (let j = 1; j <= terms && j - 1 < shown; j += 1) {
    const fraction = Math.min(1, shown - (j - 1));
    const from = sums[j - 1];
    const to = [from[0] + (sums[j][0] - from[0]) * fraction, from[1] + (sums[j][1] - from[1]) * fraction];
    chain.push(<Arrow key={j} view={view} from={from} to={to} className={inkOfTerm(j)} width={2.5} />);
  }

  const planePoint = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = rect.width / PLANE[0];
    return view.toPlane([(event.clientX - rect.left) / scale, (event.clientY - rect.top) / scale]);
  };
  const handlers = {
    onPointerDown: (event) => {
      const [hx, hy] = view.toScreen(b);
      const rect = event.currentTarget.getBoundingClientRect();
      const scale = rect.width / PLANE[0];
      const distance = Math.hypot((event.clientX - rect.left) / scale - hx, (event.clientY - rect.top) / scale - hy);
      if (distance > 22) return;
      dragging.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event) => {
      if (dragging.current) setB(planePoint(event));
    },
    onPointerUp: () => {
      if (!dragging.current) return;
      dragging.current = false;
      setReveal(1);
      refit();
    },
  };

  const xLabelOffset = [18, -18];
  const labels = [
    { at: b, text: '$\\htmlClass{term-emission}{b}$', dx: b[0] >= 0 ? -18 : 18, dy: 18 },
    { at: x, text: '$x$', dx: xLabelOffset[0], dy: xLabelOffset[1] },
  ];
  if (!complex) {
    const origin = view.toScreen([0, 0]);
    basis.forEach((v, i) => {
      labels.push({ at: edgePoint(view, [ends[i] * v[0], ends[i] * v[1]]), text: `$v_${i + 1}$`, className: EIGEN_INKS[i], dx: 18 });
      if (Math.abs(coefficients[i] * factors[i]) * view.scale > 30) {
        const at = factorLabelAt(origin, view.toScreen(scaled[i]), [b, x].map((p) => view.toScreen(p)), xLabelOffset);
        labels.push({ at: view.toPlane(at), text: `$\\times ${formatNumber(factors[i])}$`, className: EIGEN_INKS[i] });
      }
    });
  }

  const ks = Array.from({ length: MAX_TERMS + 1 }, (_, k) => k);
  const componentErrors = complex ? [] : coefficients.map((c, i) => ks.map((k) => [k, Math.abs(c) * Math.abs(eigenvalues[i][0]) ** (k + 1) * factors[i]]));

  return (
    <>
      <EquationStack lines={DERIVATION} step={stepIndex} className="spectral-derivation" />
      <div className="spectral-body">
        <VectorPlane view={view} labels={labels} className="spectral-plane" {...handlers} data-no-swipe>
          {!complex && basis.map((v, i) => <PlaneLine key={i} view={view} direction={v} className={`spectral-eigenline ${EIGEN_INKS[i]}`} />)}
          {!complex && scaled.map((p, i) => <Arrow key={`x${i}`} view={view} from={[0, 0]} to={p} className={`spectral-scaled ${EIGEN_INKS[i]}`} width={7} head={0} />)}
          {!complex && parts.map((p, i) => <Arrow key={`b${i}`} view={view} from={[0, 0]} to={p} className={EIGEN_INKS[i]} width={3} head={0} />)}
          {!complex && scaled.map((p, i) => {
            const [ax, ay] = view.toScreen(p);
            const [bx, by] = view.toScreen(x);
            return <line key={`d${i}`} x1={ax} y1={ay} x2={bx} y2={by} className="spectral-parallelogram" />;
          })}
          {chain}
          <Arrow view={view} from={[0, 0]} to={b} className="la-ink-emission" width={4} head={16} />
          <circle cx={view.toScreen(b)[0]} cy={view.toScreen(b)[1]} r={9} className="spectral-handle" />
          <circle cx={view.toScreen(x)[0]} cy={view.toScreen(x)[1]} r={9} className="spectral-solution" />
        </VectorPlane>
        <div className="spectral-side">
          <div className="spectral-controls" onPointerUp={refit}>
            {complex ? (
              <>
                <Slider label="$|\lambda|$" value={first} min={0} max={0.98} step={0.01} onChange={setFirst} />
                <Slider label="$\arg\lambda$" value={second} min={0} max={180} step={1} onChange={setSecond} format={(v) => `${v.toFixed(0)}°`} />
              </>
            ) : (
              <>
                <Slider label="$\lambda_1$" value={first} min={-0.95} max={0.99} step={0.01} onChange={setFirst} className="la-ink-first" />
                <Slider label="$\lambda_2$" value={second} min={-0.95} max={0.99} step={0.01} onChange={setSecond} className="la-ink-second" />
              </>
            )}
            <Slider label="$k$" value={terms} min={0} max={MAX_TERMS} step={1} onChange={(v) => { setTerms(v); setReveal(1); }} format={(v) => v.toFixed(0)} />
          </div>
          {/* One row on every step, so the plot under it never moves. */}
          <div className="spectral-factors">
            {complex
              ? <div><Text>{`$\\left|\\frac{1}{1-\\lambda}\\right| = ${formatNumber(factors[0])}$`}</Text></div>
              : factors.map((f, i) => (
                <div key={i} className={EIGEN_INKS[i]}><Text>{`$\\frac{1}{1-\\lambda_${i + 1}} = ${formatNumber(f)}$`}</Text></div>
              ))}
          </div>
          <Plot
            width={PLOT[0]}
            height={PLOT[1]}
            x={{ min: 0, max: MAX_TERMS, ticks: [0, 20, 40, 60].map((v) => ({ value: v, label: String(v) })), label: '$k$' }}
            y={{ min: 1e-3, max: 1e2, log: true, ticks: decadeTicks(-3, 2), label: '$\\|x - x_k\\|$' }}
            series={[
              ...componentErrors.map((points, i) => ({ points, kind: 'line', className: `spectral-component ${EIGEN_INKS[i]}`, dashed: true })),
              { points: ks.map((k) => [k, error(k)]), kind: 'line', className: 'spectral-error' },
              { points: [[terms, error(terms)]], kind: 'dots', className: 'spectral-current', radius: 7 },
            ]}
            notes={[
              { x: terms, y: error(terms), text: formatNumber(error(terms)), dx: terms > 40 ? -14 : 14, dy: -18, align: terms > 40 ? 'right' : 'left', className: 'spectral-note' },
            ]}
          />
        </div>
      </div>
    </>
  );
}
