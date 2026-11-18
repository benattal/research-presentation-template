import { useId } from 'react';
import Text from '@core/stage/Text.jsx';
import './activeSensing.css';

/**
 * A labelled range input for exploring a figure with the mouse. Build steps
 * reach every state the speaker needs; the slider only adds exploration.
 * `format(value)` renders the value with its unit. Only the input responds
 * to the pointer (its label is text, not a click target), and the input
 * lets go of keyboard focus when the pointer is released, so the clicker's
 * arrow keys keep moving the slides.
 */
export function Slider({ label, value, min, max, step, onChange, format }) {
  const labelId = useId();
  return (
    <div className="active-sensing-slider" data-no-swipe>
      <span id={labelId} className="active-sensing-slider-label"><Text>{label}</Text></span>
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
      <span className="active-sensing-slider-value">{format(value)}</span>
    </div>
  );
}

/**
 * The figure's check: named quantities side by side, so an estimate can be
 * read against the exact value. `items` are `{ label, value, key?, tone?,
 * hidden? }`, with math allowed in the label; `key` identifies an item
 * whose label changes between steps (default: the label); `tone` colors
 * the value with an ink role, and a `hidden` item keeps its place without
 * showing (for a quantity a later build step introduces). `columns` lays
 * the items out in a grid (estimate beside exact value): a count of
 * columns sized by their content, or a CSS track list for columns of fixed
 * width, so values never move when others appear.
 */
export function Readout({ items, columns = 0, className = '' }) {
  const tracks = typeof columns === 'string' ? columns : `repeat(${columns}, auto)`;
  return (
    <p
      className={`${columns ? 'active-sensing-readout active-sensing-readout--grid' : 'active-sensing-readout'} ${className}`}
      style={columns ? { gridTemplateColumns: tracks } : undefined}
    >
      {items.map(({ key, label, value, tone, hidden }) => (
        <span key={key ?? label} className="active-sensing-readout-item" style={hidden ? { visibility: 'hidden' } : undefined}>
          <span className="active-sensing-readout-label"><Text>{label}</Text></span>
          <span className="active-sensing-readout-value" style={tone ? { color: `var(--ink-${tone})` } : undefined}>{value}</span>
        </span>
      ))}
    </p>
  );
}
