/**
 * The adjoint method's derivation beside the count it is about: on the
 * right, the forward route (one solve with I − A per parameter, N thick
 * arrows) above the adjoint route (one solve with I − Aᵀ, then a cheap dot
 * product per parameter). Thick arrows are solves; thin arrows are dot
 * products.
 *
 * Slide fields: `lines`, each `{ tex, label? }`, one per build step (the
 * newest in full color, earlier ones muted, as in the `derivation` layout),
 * and `diagram`: `{ adjointStep, dotStep }`, the build steps at which the
 * adjoint solve and the dot products appear. The forward route shows from
 * the first step.
 */
import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { renderMath } from '@core/stage/math.js';
import './AdjointSolves.css';

/** The diagram's size and columns, in stage pixels. */
const WIDTH = 500;
const HEIGHT = 500;
const SOURCE_RIGHT = 132;
const ARROW_START = 146;
const ARROW_END = 360;
const OUTPUT_LEFT = 374;

/** Rows of the forward route (parameters 1, 2, 3, then N after a gap), and its label row. */
const FORWARD_ROWS = [{ y: 52, k: '1' }, { y: 100, k: '2' }, { y: 148, k: '3' }, { y: 220, k: 'N' }];
const FORWARD_LABEL_Y = 18;
const FORWARD_COUNT_Y = 254;

/** The adjoint route: one solve from q to y, then a fan of dot products. */
const ADJOINT_Y = 400;
const ADJOINT_LABEL_Y = 366;
const Y_NODE = 262;
const FAN_ROWS = [{ y: 318, k: '1' }, { y: 362, k: '2' }, { y: 406, k: '3' }, { y: 470, k: 'N' }];
const ADJOINT_COUNT_Y = 486;

const fade = (visible) => ({ initial: false, animate: { opacity: visible ? 1 : 0 }, transition: { duration: 0.35 } });

/** An arrow from (x1, y1) to (x2, y2), its head drawn as a filled triangle in the same color. */
function Arrow({ x1, y1, x2, y2, className, width, head }) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const [ux, uy] = [(x2 - x1) / length, (y2 - y1) / length];
  const base = [x2 - ux * head, y2 - uy * head];
  const side = head * 0.5;
  const points = [[x2, y2], [base[0] - uy * side, base[1] + ux * side], [base[0] + uy * side, base[1] - ux * side]];
  return (
    <g className={className}>
      <line x1={x1} y1={y1} x2={base[0] + ux} y2={base[1] + uy} strokeWidth={width} strokeLinecap="round" />
      <polygon points={points.map((p) => p.join(',')).join(' ')} />
    </g>
  );
}

/** A math label centered on (x, y), or anchored by its left or right edge. */
function Label({ x, y, align = 'center', children, className = '' }) {
  return (
    <span className={`adjoint-solves-label adjoint-solves-label--${align} ${className}`} style={{ left: x, top: y }}>
      <Text>{children}</Text>
    </span>
  );
}

function Diagram({ buildStep, diagram }) {
  const showAdjoint = buildStep >= diagram.adjointStep;
  const showDots = buildStep >= diagram.dotStep;
  const fanFrom = Y_NODE + 22;
  return (
    <div className="adjoint-solves-diagram" style={{ width: WIDTH, height: HEIGHT }}>
      <svg width={WIDTH} height={HEIGHT} aria-hidden="true">
        {FORWARD_ROWS.map(({ y, k }) => (
          <Arrow key={k} x1={ARROW_START} y1={y} x2={ARROW_END} y2={y} className="adjoint-solves-solve" width={6} head={16} />
        ))}
        <motion.g {...fade(showAdjoint)}>
          <Arrow x1={ARROW_START} y1={ADJOINT_Y} x2={Y_NODE - 18} y2={ADJOINT_Y} className="adjoint-solves-solve adjoint-solves-solve--adjoint" width={6} head={16} />
        </motion.g>
        <motion.g {...fade(showDots)}>
          {FAN_ROWS.map(({ y, k }) => (
            <Arrow key={k} x1={fanFrom} y1={ADJOINT_Y} x2={ARROW_END} y2={y} className="adjoint-solves-dot" width={1.6} head={9} />
          ))}
        </motion.g>
      </svg>

      <Label x={(ARROW_START + ARROW_END) / 2} y={FORWARD_LABEL_Y}>{'$(I - A)^{-1}$'}</Label>
      {FORWARD_ROWS.map(({ y, k }) => (
        <span key={k}>
          <Label x={SOURCE_RIGHT} y={y} align="right">{`$(\\partial_{\\theta_${k}} A)\\,x$`}</Label>
          <Label x={OUTPUT_LEFT} y={y} align="left">{`$\\partial_{\\theta_${k}} m$`}</Label>
        </span>
      ))}
      <Label x={SOURCE_RIGHT - 40} y={(FORWARD_ROWS[2].y + FORWARD_ROWS[3].y) / 2}>{'$\\vdots$'}</Label>
      <Label x={OUTPUT_LEFT + 20} y={(FORWARD_ROWS[2].y + FORWARD_ROWS[3].y) / 2}>{'$\\vdots$'}</Label>
      <Label x={(ARROW_START + ARROW_END) / 2} y={FORWARD_COUNT_Y} className="adjoint-solves-count">{'$N$ solves'}</Label>

      <motion.div className="adjoint-solves-layer" {...fade(showAdjoint)}>
        <Label x={(ARROW_START + Y_NODE) / 2} y={ADJOINT_LABEL_Y} className="adjoint-solves-label--adjoint">{'$(I - A^\\top)^{-1}$'}</Label>
        <Label x={SOURCE_RIGHT} y={ADJOINT_Y} align="right" className="adjoint-solves-label--adjoint">{'$q$'}</Label>
        <Label x={Y_NODE} y={ADJOINT_Y} className="adjoint-solves-label--adjoint">{'$y$'}</Label>
        <Label x={(ARROW_START + Y_NODE) / 2} y={ADJOINT_COUNT_Y} className="adjoint-solves-count">{'$1$ solve'}</Label>
      </motion.div>
      <motion.div className="adjoint-solves-layer" {...fade(showDots)}>
        {FAN_ROWS.map(({ y, k }) => (
          <Label key={k} x={OUTPUT_LEFT} y={y} align="left">{`$\\partial_{\\theta_${k}} m$`}</Label>
        ))}
        <Label x={OUTPUT_LEFT + 20} y={(FAN_ROWS[2].y + FAN_ROWS[3].y) / 2}>{'$\\vdots$'}</Label>
      </motion.div>
    </div>
  );
}

export default function AdjointSolves({ slide, buildStep }) {
  const lines = slide.lines ?? [];
  if (lines.length === 0 || !lines.every((line) => typeof line.tex === 'string')) {
    throw new Error(`adjointSolves: slide "${slide.id}" needs "lines", each with "tex"`);
  }
  if (!Number.isInteger(slide.diagram?.adjointStep) || !Number.isInteger(slide.diagram?.dotStep)) {
    throw new Error(`adjointSolves: slide "${slide.id}" needs "diagram": { adjointStep, dotStep }`);
  }
  const current = Math.min(buildStep, lines.length - 1);
  return (
    <div className="slide--adjoint-solves">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="adjoint-solves-body">
        <ol className="adjoint-solves-lines">
          {lines.map((line, i) => (
            <motion.li
              key={line.tex}
              className={i === current ? 'adjoint-solves-line--current' : ''}
              {...fade(i <= buildStep)}
            >
              <span className="adjoint-solves-math" dangerouslySetInnerHTML={{ __html: renderMath(line.tex, true) }} />
              {line.label && <span className="adjoint-solves-line-label"><Text>{line.label}</Text></span>}
            </motion.li>
          ))}
        </ol>
        <Diagram buildStep={buildStep} diagram={slide.diagram} />
      </div>
    </div>
  );
}
