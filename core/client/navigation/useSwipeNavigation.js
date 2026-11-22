import { useEffect, useRef } from 'react';

/** Horizontal travel, in CSS pixels, that counts as a swipe. */
const SWIPE_THRESHOLD_PX = 50;

/**
 * Touches that start on these elements belong to the element: a form
 * control, a link, a video with the browser's controls (its scrubber), and
 * whatever a layout marks `data-no-swipe`.
 */
const INTERACTIVE_SELECTOR = 'input, textarea, select, button, a, video[controls], [data-no-swipe]';

/**
 * Swipe left for `next`, right for `previous`: one finger, travelling
 * farther sideways than up or down. Pass `enabled: false` to ignore swipes
 * (for example while the audience follows the presenter).
 *
 * Media that only show something (an image, a video without controls, a
 * drawing on a canvas or in an SVG) let the swipe through. An element that
 * takes drags (a point to move, a plot to scrub) declares it with
 * `data-no-swipe`, on itself or on a box around it.
 */
export default function useSwipeNavigation({ next, previous, enabled = true }) {
  const touchStart = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    function handleTouchStart(event) {
      const ownedByElement = event.target.closest?.(INTERACTIVE_SELECTOR);
      const [touch] = event.touches;
      // A second finger makes it a pinch, which is not a swipe either.
      touchStart.current = ownedByElement || event.touches.length > 1 ? null : { x: touch.clientX, y: touch.clientY };
    }

    function handleTouchEnd(event) {
      if (touchStart.current === null) return;
      const [touch] = event.changedTouches;
      const travelX = touchStart.current.x - touch.clientX;
      const travelY = touchStart.current.y - touch.clientY;
      touchStart.current = null;
      if (Math.abs(travelX) <= SWIPE_THRESHOLD_PX || Math.abs(travelX) <= Math.abs(travelY)) return;
      if (travelX > 0) next();
      else previous();
    }

    function handleTouchCancel() {
      touchStart.current = null;
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [next, previous, enabled]);
}
