/**
 * Fetching every slide's media ahead of time, so a slide shows its images
 * and videos at once when it is reached instead of loading them on arrival.
 */

/** A string in slide content that names a file under `slides/` (already prefixed by `prefixAssetPaths`). */
const MEDIA_PATH = /\/slides\/[^?#]+\.[a-z0-9]+$/i;

const IMAGE_FILE = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

function collectMediaUrls(value, found) {
  if (typeof value === 'string') {
    if (MEDIA_PATH.test(value)) found.add(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectMediaUrls(item, found));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectMediaUrls(item, found));
  }
  return found;
}

/** Every media URL the slides name, in the order of `slides`, each once. */
export function mediaUrls(slides) {
  return [...slides.reduce((found, slide) => collectMediaUrls(slide, found), new Set())];
}

/**
 * Load the media of `slides` into the browser's cache, one file at a time
 * and in the order given, and decode the images. Returns a function that
 * stops it. A file that fails to load is skipped here: the slide that shows
 * it reports it.
 */
export function preloadMedia(slides) {
  const controller = new AbortController();
  (async () => {
    for (const url of mediaUrls(slides)) {
      if (controller.signal.aborted) return;
      try {
        if (IMAGE_FILE.test(url)) {
          const image = new Image();
          image.src = url;
          await image.decode();
        } else {
          const response = await fetch(url, { signal: controller.signal });
          await response.blob();
        }
      } catch {
        // Skipped: see the docstring.
      }
    }
  })();
  return () => controller.abort();
}
