import { useState, useEffect } from 'react';

/** Whether this browser can show a page fullscreen. Safari on an iPhone cannot. */
const FULLSCREEN_AVAILABLE = Boolean(document.fullscreenEnabled);

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

/**
 * Fullscreen for the whole page: `isFullscreen`, and `toggleFullscreen`,
 * which is `null` where the browser has no fullscreen for pages, so that a
 * view offers neither a button nor a key for it there.
 */
export default function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  return { isFullscreen, toggleFullscreen: FULLSCREEN_AVAILABLE ? toggleFullscreen : null };
}
