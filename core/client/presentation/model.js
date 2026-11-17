/**
 * The presentation model: pure functions that turn a presentation's files
 * into the object every view renders.
 *
 * Nothing here touches Vite, the DOM, or storage, so the Node test runner
 * and the build tooling import this module directly. `load.js` supplies the
 * files through Vite's `import.meta.glob`.
 */

/** Thrown when a presentation's files do not form a valid presentation. */
export class PresentationError extends Error {
  constructor(problems) {
    super(`Presentation is invalid:\n- ${problems.join('\n- ')}`);
    this.name = 'PresentationError';
    this.problems = problems;
  }
}

/**
 * Slide id of a file inside `slides/<slide-id>/`, from any glob key or path
 * that ends in `slides/<slide-id>/<file>`.
 */
export function slideIdFromPath(path) {
  return path.replaceAll('\\', '/').split('/').at(-2);
}

/**
 * Prefix every string that starts with `/slides/` with `baseUrl`.
 *
 * Slide content refers to files in the presentation's `public/slides/`
 * directory as `/slides/<slide-id>/<file>`. The deployed site may live under
 * a sub-path (`/<presentation-id>/` behind the gateway) or a relative base
 * (`./` for static builds), so the prefix is applied once, here, when the
 * presentation is loaded. Code that builds asset paths itself must call
 * this function too.
 */
export function prefixAssetPaths(value, baseUrl) {
  if (typeof value === 'string') {
    return value.startsWith('/slides/') ? baseUrl.replace(/\/$/, '') + value : value;
  }
  if (Array.isArray(value)) return value.map((item) => prefixAssetPaths(item, baseUrl));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, prefixAssetPaths(item, baseUrl)]),
    );
  }
  return value;
}

/**
 * Number of positions a slide occupies in the navigation: the length of its
 * `buildSteps` array, or 1 for a slide without build steps.
 */
export function stepCount(slide) {
  return Array.isArray(slide.buildSteps) && slide.buildSteps.length > 0
    ? slide.buildSteps.length
    : 1;
}

/**
 * Build the runtime presentation.
 *
 * @param {object} args
 * @param {string} args.id            directory name under `presentations/`
 * @param {object} args.manifest      parsed `presentation.json`
 * @param {Object<string, object>} args.slideContents  slide id → parsed `content.json`
 * @param {Object<string, Function>} args.layouts      layout name → React component
 * @param {string} args.baseUrl       Vite's `BASE_URL`
 * @returns {{ id, title, defaultTransition, backLink, sections, slides, layouts, unlistedSlideIds }}
 *   `sections` keep the manifest order and list their slide ids; `slides`
 *   is the flat, ordered list every view navigates, each slide carrying its
 *   `content.json` fields plus `id`, `index`, `sectionId`, `sectionTitle`,
 *   `sectionIndex`, and `indexInSection`.
 * @throws {PresentationError} listing every problem found, not only the first.
 */
export function buildPresentation({ id, manifest, slideContents, layouts, baseUrl }) {
  const problems = [];
  if (typeof manifest.title !== 'string' || manifest.title === '') {
    problems.push('presentation.json needs a non-empty "title".');
  }
  if (!Array.isArray(manifest.sections) || manifest.sections.length === 0) {
    problems.push('presentation.json needs a non-empty "sections" array.');
  }

  const listed = new Set();
  const slides = [];
  const sections = (manifest.sections ?? []).map((section, sectionIndex) => {
    if (!section.id || !Array.isArray(section.slides)) {
      problems.push(`section ${sectionIndex} needs an "id" and a "slides" array.`);
      return { id: section.id ?? `section-${sectionIndex}`, title: section.title ?? '', slideIds: [] };
    }
    section.slides.forEach((slideId, indexInSection) => {
      if (listed.has(slideId)) {
        problems.push(`slide "${slideId}" is listed more than once.`);
        return;
      }
      listed.add(slideId);
      const content = slideContents[slideId];
      if (!content) {
        problems.push(`slide "${slideId}" is listed in section "${section.id}" but slides/${slideId}/content.json does not exist.`);
        return;
      }
      if (!layouts[content.layout]) {
        problems.push(`slide "${slideId}" uses layout "${content.layout}", which is not registered.`);
        return;
      }
      slides.push({
        ...prefixAssetPaths(structuredClone(content), baseUrl),
        id: slideId,
        index: slides.length,
        sectionId: section.id,
        sectionTitle: section.title,
        sectionIndex,
        indexInSection,
      });
    });
    return { id: section.id, title: section.title, slideIds: [...section.slides] };
  });

  if (problems.length > 0) throw new PresentationError(problems);

  return {
    id,
    title: manifest.title,
    defaultTransition: manifest.defaultTransition ?? 'fade',
    backLink: manifest.backLink ?? null,
    sections,
    slides,
    layouts,
    unlistedSlideIds: Object.keys(slideContents).filter((slideId) => !listed.has(slideId)).sort(),
  };
}

/**
 * Merge the framework's layouts with a presentation's own layouts.
 * A presentation may add layouts but not replace a core one: two components
 * answering to one name would make a slide's appearance depend on which
 * registry won.
 */
export function mergeLayouts(coreLayouts, presentationLayouts) {
  const clashes = Object.keys(presentationLayouts).filter((name) => name in coreLayouts);
  if (clashes.length > 0) {
    throw new PresentationError(clashes.map(
      (name) => `layouts/index.js registers "${name}", which is a core layout; give it a different name.`,
    ));
  }
  return { ...coreLayouts, ...presentationLayouts };
}

/**
 * Index presenter notes by slide id and file name.
 * `noteFiles` maps paths ending in `slides/<slide-id>/notes*.md` to their text.
 */
export function indexNotes(noteFiles) {
  const notesBySlide = {};
  for (const [path, text] of Object.entries(noteFiles)) {
    const slideId = slideIdFromPath(path);
    const fileName = path.replaceAll('\\', '/').split('/').at(-1);
    notesBySlide[slideId] ??= {};
    notesBySlide[slideId][fileName] = text;
  }
  return notesBySlide;
}

/**
 * Name of the notes file that holds a slide's notes at `step`.
 *
 * A slide's notes live in `notes.md`, or per build step in `notes-<step>.md`.
 * A per-step file wins for its own step; every other step shows `notes.md`.
 * Reading and writing use this one rule, so an edit made in the presenter
 * window goes to the file that was on screen. Per-step files are created by
 * hand.
 *
 * @param {string[]} existingFiles  notes file names already in the slide directory
 * @param {number} step             0-based build step
 */
export function notesFileName(existingFiles, step) {
  const perStepFile = `notes-${step}.md`;
  return existingFiles.includes(perStepFile) ? perStepFile : 'notes.md';
}
