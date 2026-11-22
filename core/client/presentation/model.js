/**
 * The presentation model: pure functions that turn a presentation's files
 * into the object every view renders.
 *
 * Nothing here touches Vite, the DOM, or storage, so the Node test runner
 * and the build tooling import this module directly. `load.js` supplies the
 * files through Vite's `import.meta.glob`, as text that `parseJsonFile` reads.
 */

import { mathProblems } from '../stage/math.js';

/** Thrown when a presentation's files do not form a valid presentation. */
export class PresentationError extends Error {
  constructor(problems) {
    super(`Presentation is invalid:\n- ${problems.join('\n- ')}`);
    this.name = 'PresentationError';
    this.problems = problems;
  }
}

/**
 * One JSON file of a presentation, given as its text. Returns the parsed
 * value, or `undefined` after adding to `problems` that `name` is not valid
 * JSON, with the parser's message (which gives the line and column of the
 * mistake). A missing comma in a slide's file is the commonest way for a
 * presentation not to load, and it must be named like any other problem.
 */
export function parseJsonFile(name, text, problems) {
  try {
    return JSON.parse(text);
  } catch (error) {
    problems.push(`${name} is not valid JSON: ${error.message}`);
    return undefined;
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
 * @param {Object<string, object>} [args.sources]  parsed `sources.json`: source key → citation
 * @returns {{ id, title, defaultTransition, backLink, progressBar, sections, slides, layouts, citations, unlistedSlideIds }}
 *   `sections` keep the manifest order and list their slide ids; `slides`
 *   is the flat, ordered list every view navigates, each slide carrying its
 *   `content.json` fields plus `id`, `index`, `sectionId`, `sectionTitle`,
 *   `sectionIndex`, and `indexInSection`, and `creditLine` when it has
 *   `credits`. `citations` lists every cited source once, in the order
 *   slides first cite it, with the ids of the slides that cite it.
 * @throws {PresentationError} listing every problem found, not only the first.
 */
export function buildPresentation({ id, manifest, slideContents, layouts, baseUrl, sources = {} }) {
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
      problems.push(...mathProblems(content, `slide "${slideId}"`));
      const credits = (content.credits ?? []).map(normalizeCredit);
      const unknown = credits.filter((credit) => !sources[credit.source]);
      if (unknown.length > 0) {
        problems.push(...unknown.map((credit) => `slide "${slideId}" credits "${credit.source}", which is not in sources.json.`));
        return;
      }
      slides.push({
        ...prefixAssetPaths(structuredClone(content), baseUrl),
        ...(credits.length > 0 ? { creditLine: credits.map((credit) => formatCredit(sources[credit.source], credit.what)).join(' · ') } : {}),
        id: slideId,
        index: slides.length,
        sectionId: section.id,
        sectionTitle: section.title,
        sectionIndex,
        indexInSection,
      });
    });
    problems.push(...mathProblems(section.title ?? '', `section "${section.id}"`));
    return { id: section.id, title: section.title, slideIds: [...section.slides] };
  });

  if (problems.length > 0) throw new PresentationError(problems);

  return {
    id,
    title: manifest.title,
    defaultTransition: manifest.defaultTransition ?? 'fade',
    backLink: manifest.backLink ?? null,
    progressBar: manifest.progressBar ?? true,
    sections,
    slides,
    layouts,
    citations: collectCitations(slides, sources),
    unlistedSlideIds: Object.keys(slideContents).filter((slideId) => !listed.has(slideId)).sort(),
  };
}

/** A slide's credit entry, written as a source key or as `{ source, what }`. */
function normalizeCredit(credit) {
  return typeof credit === 'string' ? { source: credit, what: null } : { source: credit.source, what: credit.what ?? null };
}

/**
 * The credit line for one source, as slides show it: "Authors, Venue
 * Year", then what was taken ("Fig. 3"), if given. `sources.json` is the
 * only place citation text lives; slides name sources by key.
 */
export function formatCredit(source, what = null) {
  const venue = [source.venue, source.year].filter(Boolean).join(' ');
  return [source.authors, venue, what].filter(Boolean).join(', ');
}

function collectCitations(slides, sources) {
  const byKey = new Map();
  for (const slide of slides) {
    for (const credit of (slide.credits ?? []).map(normalizeCredit)) {
      if (!byKey.has(credit.source)) byKey.set(credit.source, { key: credit.source, ...sources[credit.source], slideIds: [] });
      const citation = byKey.get(credit.source);
      if (!citation.slideIds.includes(slide.id)) citation.slideIds.push(slide.id);
    }
  }
  return [...byKey.values()];
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
