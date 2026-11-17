import Text from '@core/stage/Text.jsx';
import './activeSensing.css';

/**
 * A labelled range input for exploring a figure with the mouse. Build steps
 * reach every state the speaker needs; the slider only adds exploration.
 * `format(value)` renders the value with its unit.
 */
export function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <label className="active-sensing-slider" data-no-swipe>
      <span className="active-sensing-slider-label"><Text>{label}</Text></span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="active-sensing-slider-value">{format(value)}</span>
    </label>
  );
}

/**
 * The figure's check: named quantities side by side, so an estimate can be
 * read against the exact value. `items` are `{ label, value, tone? }`, with
 * math allowed in the label; `tone` colors the value with an ink role.
 * `columns` lays the items out in a grid (estimate beside exact value).
 */
export function Readout({ items, columns = 0 }) {
  return (
    <p
      className={columns ? 'active-sensing-readout active-sensing-readout--grid' : 'active-sensing-readout'}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, auto)` } : undefined}
    >
      {items.map(({ label, value, tone }) => (
        <span key={label} className="active-sensing-readout-item">
          <span className="active-sensing-readout-label"><Text>{label}</Text></span>
          <span className="active-sensing-readout-value" style={tone ? { color: `var(--ink-${tone})` } : undefined}>{value}</span>
        </span>
      ))}
    </p>
  );
}
