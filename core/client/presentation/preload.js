/**
 * Loading every slide's media ahead of time and keeping it in memory, so a
 * slide shows its images and videos at once when it is reached. A fetch
 * alone does not do this: a server that answers `Cache-Control: no-cache`
 * (Vite's development server does) makes the browser request each file
 * again when an element asks for it. So each file is kept as a Blob, and
 * elements are given its object URL (`mediaUrl`).
 */

/** A string in slide content that names a file under `slides/` (already prefixed by `prefixAssetPaths`). */
const MEDIA_PATH = /\/slides\/[^?#]+\.[a-z0-9]+$/i;

const IMAGE_FILE = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

/** Files larger than this are left to the element that shows them, in bytes. */
const MAX_FILE_BYTES = 64 * 1024 * 1024;

/**
 * The files in memory, by the URL slides name them with: each value is the
 * object URL of its Blob and, for an image, the decoded image, kept so the
 * decode is not thrown away. They live as long as the page.
 */
const loaded = new Map();

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
 * The URL to give an element for the media file `url`: the copy in memory
 * once `preloadMedia` has loaded it, otherwise `url` itself. Resolve it once
 * per mounted element (`Media` does): changing a playing video's `src` when
 * its copy arrives would restart it.
 */
export function mediaUrl(url) {
  return loaded.get(url)?.objectUrl ?? url;
}

async function load(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) return;
  if (Number(response.headers.get('content-length')) > MAX_FILE_BYTES) return;
  const objectUrl = URL.createObjectURL(await response.blob());
  const entry = { objectUrl };
  if (IMAGE_FILE.test(url)) {
    entry.image = new Image();
    entry.image.src = objectUrl;
    await entry.image.decode();
  }
  loaded.set(url, entry);
}

/**
 * Load the media of `slides` into memory, one file at a time and in the
 * order given, and decode the images. Returns a function that stops it;
 * what is already loaded stays. A file that fails to load is skipped here:
 * the slide that shows it reports it.
 */
export function preloadMedia(slides) {
  const controller = new AbortController();
  (async () => {
    for (const url of mediaUrls(slides)) {
      if (controller.signal.aborted) return;
      if (loaded.has(url)) continue;
      try {
        await load(url, controller.signal);
      } catch {
        // Skipped: see the docstring.
      }
    }
  })();
  return () => controller.abort();
}
