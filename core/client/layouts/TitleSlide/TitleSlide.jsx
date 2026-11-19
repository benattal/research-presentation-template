import './TitleSlide.css';
import Text from '../../stage/Text.jsx';

export default function TitleSlide({ slide, renderBackground }) {
  return (
    <div className="slide--title">
      {renderBackground ? renderBackground(slide) : (
        slide.background ? (
          <div
            className="title-bg"
            style={{ backgroundImage: `url(${slide.background})` }}
          />
        ) : null
      )}
      <h1><Text>{slide.title}</Text></h1>
      {slide.subtitle && (
        <p className="subtitle"><Text>{slide.subtitle}</Text></p>
      )}
    </div>
  );
}
