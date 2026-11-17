import Text from '@core/stage/Text.jsx';
import './activeSensing.css';

/**
 * A labelled range input for exploring a figure with the mouse. Build steps
 * reach every state the speaker needs; the slider only adds exploration.
 * `format(value)` renders the value with its unit. The input lets go of
 * keyboard focus when the pointer is released, so the clicker's arrow keys
 * keep moving the slides.
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
        onPointerUp={(event) => event.currentTarget.blur()}
      />
      <span className="active-sensing-slider-value">{format(value)}</span>
    </label>
  );
}

/**
 * The figure's check: named quantities side by side, so an estimate can be
 * read against the exact value. `items` are `{ label, value, tone?, hidden? }`,
 * with math allowed in the label; `tone` colors the value with an ink role,
 * and a `hidden` item keeps its place without showing (for a quantity a
 * later build step introduces). `columns` lays the items out in a grid
 * (estimate beside exact value).
 */
export function Readout({ items, columns = 0 }) {
  return (
    <p
      className={columns ? 'active-sensing-readout active-sensing-readout--grid' : 'active-sensing-readout'}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, auto)` } : undefined}
    >
      {items.map(({ label, value, tone, hidden }) => (
        <span key={label} className="active-sensing-readout-item" style={hidden ? { visibility: 'hidden' } : undefined}>
          <span className="active-sensing-readout-label"><Text>{label}</Text></span>
          <span className="active-sensing-readout-value" style={tone ? { color: `var(--ink-${tone})` } : undefined}>{value}</span>
        </span>
      ))}
    </p>
  );
}
