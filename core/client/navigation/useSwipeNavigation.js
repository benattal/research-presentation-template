import { useEffect, useRef } from 'react';

/** Horizontal travel, in CSS pixels, that counts as a swipe. */
const SWIPE_THRESHOLD_PX = 50;

/** Touches that start on these elements belong to the element (dragging a slider, drawing on a canvas). */
const INTERACTIVE_SELECTOR = 'input, textarea, select, button, a, canvas, svg, video, [data-no-swipe]';

/**
 * Swipe left for `next`, right for `previous`. Pass `enabled: false` to
 * ignore swipes (for example while the audience follows the presenter).
 * A layout marks any other draggable region with `data-no-swipe`.
 */
export default function useSwipeNavigation({ next, previous, enabled = true }) {
  const touchStartX = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    function handleTouchStart(event) {
      touchStartX.current = event.target.closest?.(INTERACTIVE_SELECTOR) ? null : event.touches[0].clientX;
    }

    function handleTouchEnd(event) {
      if (touchStartX.current === null) return;
      const travel = touchStartX.current - event.changedTouches[0].clientX;
      touchStartX.current = null;
      if (travel > SWIPE_THRESHOLD_PX) next();
      else if (travel < -SWIPE_THRESHOLD_PX) previous();
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [next, previous, enabled]);
}
