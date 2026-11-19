/**
 * What a slide needs before it can be shown at once, got ready ahead of
 * time: its media, and whatever its layout builds.
 *
 * Media are loaded and kept in memory. A fetch alone does not do this: a
 * server that answers `Cache-Control: no-cache` (Vite's development server
 * does) makes the browser request each file again when an element asks for
 * it. So each file is kept as a Blob, and elements are given its object URL
 * (`mediaUrl`).
 *
 * A layout that builds something slow before its first frame (a WebGL
 * scene and its shaders, a solved model) gives its component a
 * `prepare(slide)` function that builds it and keeps it for the page, and
 * uses what was kept when it mounts. The work then happens while the page
 * is idle instead of on the key press that arrives at the slide.
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
 * once `preloadSlides` has loaded it, otherwise `url` itself. Resolve it once
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
 * Resolves when the browser next has time to spare: after the frame and the
 * input it is busy with. `prepare` functions wait for it between the parts
 * of their work, so that no part delays a key press by more than its own
 * length.
 */
export function whenIdle() {
  return new Promise((resolve) => {
    // Safari has no requestIdleCallback; a timer runs after pending input there.
    if (window.requestIdleCallback) window.requestIdleCallback(() => resolve(), { timeout: 1000 });
    else setTimeout(resolve, 50);
  });
}

/**
 * Get `slides` ready, in the order given: load their media into memory,
 * one file at a time, and decode the images; then call `prepare(slide)` of
 * each slide whose layout (in `layouts`, by name) has one, one slide at a
 * time, each when the page is idle. Returns a function that stops it; what
 * is already loaded and prepared stays.
 *
 * A file that fails to load is skipped here: the slide that shows it
 * reports it. A `prepare` that fails is reported on the console, and the
 * slide does that work itself when it is shown.
 */
export function preloadSlides(slides, layouts) {
  const controller = new AbortController();
  const { signal } = controller;
  (async () => {
    for (const url of mediaUrls(slides)) {
      if (signal.aborted) return;
      if (loaded.has(url)) continue;
      try {
        await load(url, signal);
      } catch {
        // Skipped: see the docstring.
      }
    }
    for (const slide of slides) {
      const { prepare } = layouts[slide.layout];
      if (!prepare) continue;
      await whenIdle();
      if (signal.aborted) return;
      try {
        await prepare(slide);
      } catch (error) {
        console.error(`Slide "${slide.id}": its layout's prepare failed`, error);
      }
    }
  })();
  return () => controller.abort();
}
