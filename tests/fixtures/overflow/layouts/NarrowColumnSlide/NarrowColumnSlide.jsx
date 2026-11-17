import Text from '@core/stage/Text.jsx';
import './NarrowColumnSlide.css';

/**
 * An 800px figure and a column that takes the rest of the row, on the
 * `column` side ("left" or "right"). The column's `text` does not wrap, so
 * text wider than the column runs out of it: past the figure's edge on the
 * left, past the stage's edge on the right.
 */
export default function NarrowColumnSlide({ slide }) {
  return (
    <div className={`narrow-column narrow-column--${slide.column}`}>
      <div className="narrow-column-figure" />
      <div className="narrow-column-text"><Text>{slide.text}</Text></div>
    </div>
  );
}
