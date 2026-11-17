import Text from '@core/stage/Text.jsx';
import './EquationLines.css';

/**
 * A column of equations revealed by build step, each with an optional short
 * label above it: `lines` are `{ label?, equation, step? }`, and a line
 * shows from build step `step` (its index when absent). Hidden lines keep
 * their space, so revealing one does not move the others.
 */
export default function EquationLines({ lines, buildStep, className = '' }) {
  return (
    <div className={`equation-lines ${className}`}>
      {lines.map((line, i) => (
        <div
          key={line.equation}
          className="equation-lines-line"
          style={{ visibility: buildStep >= (line.step ?? i) ? 'visible' : 'hidden' }}
        >
          {line.label && <div className="equation-lines-label"><Text>{line.label}</Text></div>}
          <div className="equation-lines-equation"><Text>{line.equation}</Text></div>
        </div>
      ))}
    </div>
  );
}
