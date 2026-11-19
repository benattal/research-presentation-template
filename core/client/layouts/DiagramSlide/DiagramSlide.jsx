import Media from '../../stage/Media.jsx';
import './DiagramSlide.css';
import Text from '../../stage/Text.jsx';

/**
 * A title, a `description`, `media` items with optional `caption`s, and an
 * optional prompt `example` (`{ positive, negative }`).
 */
export default function DiagramSlide({ slide }) {
  return (
    <div className="slide--diagram">
      <h2><Text>{slide.title}</Text></h2>

      {slide.description && (
        <p className="diagram-description"><Text>{slide.description}</Text></p>
      )}

      {slide.media && slide.media.length > 0 && (
        <div className="diagram-media">
          {slide.media.map((m, i) => (
            <div key={i} className="diagram-media-item">
              <Media item={m} controls />
              {m.caption && <span className="diagram-caption"><Text>{m.caption}</Text></span>}
            </div>
          ))}
        </div>
      )}

      {slide.example && (
        <div className="prompt-example">
          <div className="prompt-box prompt-box--positive">
            <div className="prompt-box-label">Positive Prompt</div>
            <div className="prompt-box-text">"{slide.example.positive}"</div>
          </div>
          <div className="prompt-box prompt-box--negative">
            <div className="prompt-box-label">Negative Prompt</div>
            <div className="prompt-box-text">"{slide.example.negative}"</div>
          </div>
        </div>
      )}
    </div>
  );
}
