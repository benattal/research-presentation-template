/**
 * The bottom bar: previous/next buttons, one dot per slide (a wider gap
 * before each section's first slide), and the slide counter. With
 * `disabled` (the audience follows the presenter) only the indicators show.
 */
export default function Navigation({ slides, position, isFirst, isLast, next, previous, goTo, disabled }) {
  return (
    <div className="navigation">
      <div className="nav-section-label" />
      <div className="nav-controls">
        {!disabled && (
          <button className="nav-btn" onClick={previous} disabled={isFirst} aria-label="Previous slide">
            &#8592;
          </button>
        )}

        <div className="nav-dots">
          {slides.map((slide) => (
            <button
              key={slide.id}
              className={[
                'nav-dot',
                slide.index === position.index && 'nav-dot--active',
                slide.indexInSection === 0 && 'nav-dot--section-start',
              ].filter(Boolean).join(' ')}
              onClick={disabled ? undefined : () => goTo(slide.index)}
              style={disabled ? { cursor: 'default' } : undefined}
              aria-label={`Go to slide ${slide.index + 1}`}
            />
          ))}
        </div>

        {!disabled && (
          <button className="nav-btn" onClick={next} disabled={isLast} aria-label="Next slide">
            &#8594;
          </button>
        )}
      </div>

      <div className="nav-slide-counter">
        {position.index + 1} / {slides.length}
      </div>
    </div>
  );
}
