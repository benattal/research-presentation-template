/** A grid of every slide; click one to jump to it, click outside to close. */
export default function SlideOverview({ slides, currentIndex, onSelect, onClose }) {
  return (
    <div className="slide-overview" onClick={onClose}>
      <h2>Slide Overview</h2>
      <div className="overview-grid" onClick={(event) => event.stopPropagation()}>
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={`overview-card${slide.index === currentIndex ? ' overview-card--active' : ''}`}
            onClick={() => onSelect(slide.index)}
          >
            <div className="overview-card-number">Slide {slide.index + 1}</div>
            <div className="overview-card-title">{slide.title || slide.layout}</div>
            <div className="overview-card-section">{slide.sectionTitle}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
