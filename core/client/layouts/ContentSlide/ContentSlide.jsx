import Media from '../../stage/Media.jsx';
import './ContentSlide.css';
import Text from '../../stage/Text.jsx';
import SlideTitle from '../../stage/SlideTitle.jsx';

/** A title, an optional `subtitle` line, a bullet list (`bullets`), and an optional row of `media`. */
export default function ContentSlide({ slide }) {
  return (
    <div className="slide--content">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />

      {slide.bullets && (
        <ul className="bullet-list">
          {slide.bullets.map((bullet, i) => (
            <li key={i} className="bullet-item">
              <span className="bullet-icon">&#9656;</span>
              <Text>{bullet}</Text>
            </li>
          ))}
        </ul>
      )}

      {slide.media && slide.media.length > 0 && (
        <div className="slide-media-row">
          {slide.media.map((item) => <Media key={item.src} item={item} />)}
        </div>
      )}
    </div>
  );
}
