import Media from '@core/stage/Media.jsx';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import './Summary.css';

/**
 * The closing summary: one result (a square picture or looping video) with
 * the takeaway lines beside it, one appearing per build step.
 *
 * Fields:
 *   title    the slide's title.
 *   media    the result shown at the left, with `label` under it.
 *   label    a short label for the media.
 *   points   each { heading?, text }: a line, with an optional short
 *            heading before it ("Limitation"); point k appears at step k.
 */
export default function Summary({ slide, buildStep }) {
  return (
    <div className="slide--summary">
      <SlideTitle title={slide.title} />
      <div className="summary-body">
        <figure className="summary-figure">
          <Media item={slide.media} className="summary-media" />
          <figcaption className="summary-label"><Text>{slide.label}</Text></figcaption>
        </figure>
        <ul className="summary-points">
          {slide.points.map((point, index) => (
            <li key={point.text} className="summary-point" style={{ opacity: buildStep >= index ? 1 : 0 }}>
              {point.heading && <span className="summary-heading">{point.heading}</span>}
              <Text>{point.text}</Text>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
