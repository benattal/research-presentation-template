import { useId } from 'react';
import Text from './Text.jsx';
import './Controls.css';

/**
 * A labelled range input for exploring a figure with the mouse. Build steps
 * reach every state the speaker needs; the slider only adds exploration.
 * `label` may hold math; `format(value)` renders the value with its unit
 * (default: two decimals). Only the input responds to the pointer (its
 * label is text, not a click target), and the input lets go of keyboard
 * focus when the pointer is released, so the clicker's arrow keys keep
 * moving the slides. Swipes on it do not change slides (`data-no-swipe`).
 */
export function Slider({ label, value, min, max, step, onChange, format = (v) => v.toFixed(2), className = '' }) {
  const labelId = useId();
  return (
    <div className={className ? `slider ${className}` : 'slider'} data-no-swipe>
      <span id={labelId} className="slider-label"><Text>{label}</Text></span>
      <input
        type="range"
        aria-labelledby={labelId}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerUp={(event) => event.currentTarget.blur()}
      />
      <span className="slider-value">{format(value)}</span>
    </div>
  );
}

/**
 * Named quantities side by side, so an estimate can be read against the
 * exact value. `items` are `{ label, value }`, with math allowed in the
 * label. `columns` lays the items out in a grid (estimate beside exact
 * value): a count of columns sized by their content, or a CSS track list
 * for columns of fixed width, so values never move when others change.
 */
export function Readout({ items, columns = 0, className = '' }) {
  const tracks = typeof columns === 'string' ? columns : `repeat(${columns}, auto)`;
  const classes = ['readout', columns && 'readout--grid', className].filter(Boolean).join(' ');
  return (
    <p className={classes} style={columns ? { gridTemplateColumns: tracks } : undefined}>
      {items.map(({ label, value }) => (
        <span key={label} className="readout-item">
          <span className="readout-label"><Text>{label}</Text></span>
          <span className="readout-value">{value}</span>
        </span>
      ))}
    </p>
  );
}
