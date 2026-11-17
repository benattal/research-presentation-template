import Media from '../../stage/Media.jsx';
import './MediaSlide.css';
import Text from '../../stage/Text.jsx';

/** A title over a grid of up to four `media` items. */
export default function MediaSlide({ slide }) {
  return (
    <div className="slide--media">
      <h2><Text>{slide.title}</Text></h2>

      <div className="media-grid">
        {slide.media.map((m, i) => (
          <div key={i} className="media-grid-item">
            <Media item={m} controls />
          </div>
        ))}
      </div>
    </div>
  );
}
