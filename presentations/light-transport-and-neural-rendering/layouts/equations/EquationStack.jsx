import { motion } from 'framer-motion';
import Text from '@core/stage/Text.jsx';
import './EquationStack.css';

/** A slide text that is one inline formula, `$…$`: its TeX, or null. */
function formulaOf(text) {
  const match = /^\$([^$]+)\$$/.exec(text);
  return match ? match[1] : null;
}

/**
 * The TeX of a line revealed in two parts: `tex`, the relation, and `rhs`
 * in one formula, so KaTeX spaces the relation as in any equation. The
 * question mark over the relation and the right side are wrapped in
 * classes, so the stylesheet shows one or the other.
 */
function splitTex(line) {
  const [left, right] = [formulaOf(line.tex), formulaOf(line.rhs)];
  if (left === null || right === null) throw new Error(`EquationStack: a line with "rhs" needs "tex" and "rhs" each one $…$ formula ("${line.tex}")`);
  const relation = line.relation ?? '=';
  return `$${left} \\overset{\\htmlClass{equation-stack-query}{?}}{${relation}} \\htmlClass{equation-stack-rhs}{${right}}$`;
}

/**
 * Equations built up one per build step: the lecture's one owner of how an
 * equation stack appears.
 *
 * `lines` are `{ tex, label?, step?, continues? }`: `tex` is slide text
 * with `$…$` math, `label` an optional short label above the line, and
 * `step` the build step the line appears at (its index when absent). The
 * newest equation shown is in full color and earlier ones are dimmed
 * (`dimEarlier`). A line with `continues: true` is a further row of the
 * line before it (a long equation split over rows): it dims with that line
 * and carries the class `equation-stack-line--continued`.
 *
 * Two optional fields pace a line for questions to the audience:
 *
 * - `rhs` (with `tex`, each one `$…$` formula) is the line's right side,
 *   shown from `rhsStep` (default: the step after the line's). Before
 *   then the line reads `tex`, then the relation (`relation`, default "=")
 *   with a question mark over it; the right side keeps its space.
 * - `justification` is slide text shown under the line for one build
 *   step, `justificationStep` (default: the step the line is complete),
 *   and faded out on the next. It is drawn over the space below the line,
 *   where later lines appear, so that step must show none of them.
 *
 * By default every line keeps its place from the first step: lines not yet
 * shown are invisible but take their space, so revealing a line never moves
 * the others and the stack sits in the same place on every step
 * (`keepPlaces`, default true). With `keepPlaces={false}` only the lines
 * shown so far are laid out, and the stack reflows as it grows.
 */
export default function EquationStack({
  lines, step, keepPlaces = true, dimEarlier = true, className = '', lineClassName = '',
}) {
  const appearsAt = (line, i) => line.step ?? i;
  const completeAt = (line, i) => (line.rhs ? line.rhsStep ?? appearsAt(line, i) + 1 : appearsAt(line, i));
  // The first row of the equation each line belongs to.
  const equationOf = [];
  lines.forEach((line, i) => equationOf.push(line.continues && i > 0 ? equationOf[i - 1] : i));
  const newest = Math.max(-1, ...lines.map((line, i) => (appearsAt(line, i) <= step ? i : -1)));
  const current = newest >= 0 ? equationOf[newest] : -1;
  const laidOut = keepPlaces ? lines : lines.filter((line, i) => appearsAt(line, i) <= step);
  return (
    <div className={`equation-stack ${className}`}>
      {laidOut.map((line) => {
        const i = lines.indexOf(line);
        const shown = appearsAt(line, i) <= step;
        const opacity = !shown ? 0 : (dimEarlier && equationOf[i] !== current ? 0.4 : 1);
        const asking = Boolean(line.rhs) && step < completeAt(line, i);
        const justified = Boolean(line.justification) && step === (line.justificationStep ?? completeAt(line, i));
        // A line without `continues`, `rhs`, or `justification` has the classes it always had.
        const classes = [
          'equation-stack-line',
          line.continues && 'equation-stack-line--continued',
          line.rhs && 'equation-stack-line--split',
          asking && 'equation-stack-line--asking',
          line.justification && 'equation-stack-line--justified',
          lineClassName,
        ].filter(Boolean).join(' ');
        return (
          <motion.div
            key={line.tex}
            className={classes}
            initial={false}
            animate={{ opacity }}
            transition={{ duration: 0.35 }}
            aria-hidden={!shown}
          >
            {line.label && <div className="equation-stack-label"><Text>{line.label}</Text></div>}
            <Text>{line.rhs ? splitTex(line) : line.tex}</Text>
            {line.justification && (
              <motion.div
                className="equation-stack-justification"
                initial={false}
                animate={{ opacity: justified ? 1 : 0 }}
                transition={{ duration: 0.35 }}
                aria-hidden={!justified}
              >
                <Text>{line.justification}</Text>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
