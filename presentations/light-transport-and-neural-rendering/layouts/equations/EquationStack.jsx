import { motion } from 'framer-motion';
import Text from '@core/stage/Text.jsx';
import './EquationStack.css';

/**
 * Equations built up one per build step: the lecture's one owner of how an
 * equation stack appears.
 *
 * `lines` are `{ tex, label?, step? }`: `tex` is slide text with `$…$`
 * math, `label` an optional short label above the line, and `step` the
 * build step the line appears at (its index when absent). The newest line
 * shown is in full color and earlier ones are dimmed (`dimEarlier`).
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
  const newest = Math.max(-1, ...lines.map((line, i) => (appearsAt(line, i) <= step ? i : -1)));
  const laidOut = keepPlaces ? lines : lines.filter((line, i) => appearsAt(line, i) <= step);
  return (
    <div className={`equation-stack ${className}`}>
      {laidOut.map((line) => {
        const i = lines.indexOf(line);
        const shown = appearsAt(line, i) <= step;
        const opacity = !shown ? 0 : (dimEarlier && i !== newest ? 0.4 : 1);
        return (
          <motion.div
            key={line.tex}
            className={`equation-stack-line ${lineClassName}`}
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
