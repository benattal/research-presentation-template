/**
 * A grid of every slide; click one to jump to it. The close button or a
 * click outside the grid closes it (a touch screen has no Escape key, and
 * Safari on iOS sends no click for a tap on a plain box).
 */
export default function SlideOverview({ slides, currentIndex, onSelect, onClose }) {
  return (
    <div className="slide-overview" onClick={onClose}>
      <div className="overview-header">
        <h2>Slide Overview</h2>
        <button className="overview-close" aria-label="Close the overview" title="Close (Escape)">&#215;</button>
      </div>
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
