/* global __PRESENTATION_ID__ */
/**
 * Load the presentation this build was configured for.
 *
 * `@presentation` is an alias for the presentation's directory, set by
 * `core/tooling/viteConfig.js`; this module is the only place the client
 * reads a presentation's manifest, slides, sources, and theme. Presenter
 * notes load separately (`notes.js`) so that editing a note never reloads
 * the audience view.
 *
 * The JSON files are imported as text and parsed here. Imported as JSON,
 * a file with a typing mistake fails as a module: the page stays blank,
 * and the development server's error overlay does not show for it. Parsed
 * here, the mistake is one more problem on the load-error screen, with
 * the file's name and the position.
 */
import manifestText from '@presentation/presentation.json?raw';
import presentationLayouts from '@presentation/layouts/index.js';
import coreLayouts from '../layouts/index.js';
import { PresentationError, buildPresentation, mergeLayouts, parseJsonFile, slideIdFromPath } from './model.js';

const contentTexts = import.meta.glob('@presentation/slides/*/content.json', { eager: true, query: '?raw', import: 'default' });

// Citations of borrowed material, by key; optional (see docs/implementation/presentations.md).
const sourceTexts = import.meta.glob('@presentation/sources.json', { eager: true, query: '?raw', import: 'default' });

// A presentation may restyle the framework by overriding the CSS custom
// properties of `core/client/index.css` in an optional `theme.css`.
import.meta.glob('@presentation/theme.css', { eager: true });

/** @throws {PresentationError} listing every file that is not valid JSON, or every problem of the presentation they describe. */
export function loadPresentation() {
  const unreadable = [];
  const manifest = parseJsonFile('presentation.json', manifestText, unreadable);
  const slideContents = Object.fromEntries(
    Object.entries(contentTexts).map(([path, text]) => {
      const slideId = slideIdFromPath(path);
      return [slideId, parseJsonFile(`slides/${slideId}/content.json`, text, unreadable)];
    }),
  );
  const [sourcesText] = Object.values(sourceTexts);
  const sources = sourcesText === undefined ? {} : parseJsonFile('sources.json', sourcesText, unreadable);
  if (unreadable.length > 0) throw new PresentationError(unreadable);

  return buildPresentation({
    id: __PRESENTATION_ID__,
    manifest,
    slideContents,
    layouts: mergeLayouts(coreLayouts, presentationLayouts),
    baseUrl: import.meta.env.BASE_URL,
    sources,
  });
}
