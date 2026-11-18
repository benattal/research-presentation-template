import { motion } from 'framer-motion';
import Text from '@core/stage/Text.jsx';
import './EquationStack.css';

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
        return (
          <motion.div
            key={line.tex}
            className={`equation-stack-line${line.continues ? ' equation-stack-line--continued' : ''} ${lineClassName}`}
            initial={false}
            animate={{ opacity }}
            transition={{ duration: 0.35 }}
            aria-hidden={!shown}
          >
            {line.label && <div className="equation-stack-label"><Text>{line.label}</Text></div>}
            <Text>{line.tex}</Text>
          </motion.div>
        );
      })}
    </div>
  );
}
