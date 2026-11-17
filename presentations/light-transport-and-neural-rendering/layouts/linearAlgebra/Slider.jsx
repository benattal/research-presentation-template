import Text from '@core/stage/Text.jsx';
import './linearAlgebra.css';

/**
 * A labelled range input for exploring a slide with the mouse. It gives up
 * focus when released, so the clicker's arrow keys keep moving the slides
 * instead of the slider. `label` may hold math; `format` renders the value.
 */
export default function Slider({ label, value, min, max, step, onChange, format = (v) => v.toFixed(2), className }) {
  return (
    <label className={className ? `la-slider ${className}` : 'la-slider'} data-no-swipe>
      <span className="la-slider-label"><Text>{label}</Text></span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerUp={(event) => event.currentTarget.blur()}
      />
      <span className="la-slider-value">{format(value)}</span>
    </label>
  );
}
