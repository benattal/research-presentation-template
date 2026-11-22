import { useLayoutEffect, useRef } from 'react';
import { stepCount } from '../presentation/model.js';

/**
 * Keep the current slide's dot in view. The dots shrink to share the space
 * between the buttons; a row too long even at their smallest scrolls, and
 * this centers it on the current dot, again whenever the row resizes. It
 * sets the row's own `scrollLeft`, so no other box scrolls (`scrollIntoView`
 * would also scroll the window's overflow-hidden containers).
 */
function useActiveDotInView(rowRef, activeIndex) {
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return undefined;
    const reveal = () => {
      const dot = row.children[activeIndex];
      row.scrollLeft = dot.offsetLeft + dot.offsetWidth / 2 - row.clientWidth / 2;
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(row);
    return () => observer.disconnect();
  }, [rowRef, activeIndex]);
}

/**
 * The bar under the stage: `toolbar` at its start; the previous and next
 * buttons around one dot per slide (a wider gap before each section's first
 * slide) in its middle; the slide counter at its end. The middle stays
 * centered in the window because both ends reserve the same width
 * (`--nav-side-width` in index.css) and the dots shrink, then scroll, to fit
 * between them. With `disabled` (the audience follows the presenter) only
 * the indicators show; with a single slide, only the toolbar.
 *
 * The end of the bar is a button when `openOverview` is given: a touch
 * screen has no **O** key, and the slide number is where one looks for the
 * other slides. With `review`, it also names the slide's id and build step,
 * so that a screenshot of the page says what it shows.
 */
export default function Navigation({
  slides, position, isFirst, isLast, next, previous, goTo, openOverview, disabled, review, toolbar,
}) {
  const dotsRef = useRef(null);
  useActiveDotInView(dotsRef, position.index);
  const navigable = slides.length > 1;
  const slide = slides[position.index];
  const End = navigable && openOverview ? 'button' : 'div';

  return (
    <nav className="navigation" aria-label="Slides">
      <div className="nav-start">{toolbar}</div>

      {navigable && (
        <div className="nav-controls">
          {!disabled && (
            <button className="nav-btn" onClick={previous} disabled={isFirst} aria-label="Previous slide">
              &#8592;
            </button>
          )}

          <div className="nav-dots" ref={dotsRef}>
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
      )}

      <End
        className="nav-end"
        {...(End === 'button' && {
          onClick: openOverview,
          title: 'Slide overview (O)',
          'aria-label': `Slide ${position.index + 1} of ${slides.length}; open the slide overview`,
        })}
      >
        {review && <span className="nav-review-id">{slide.id}</span>}
        <span className="nav-position">
          {review && <span className="nav-review-step">step {position.step + 1}/{stepCount(slide)}</span>}
          {navigable && <span className="nav-slide-counter">{position.index + 1} / {slides.length}</span>}
        </span>
      </End>
    </nav>
  );
}
