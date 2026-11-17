/* global __PRESENTATION_ID__ */
/**
 * Load the presentation this build was configured for.
 *
 * `@presentation` is an alias for `presentations/<id>/`, set by
 * `core/tooling/viteConfig.js`; this module is the only place the client
 * reads a presentation's files. Presenter notes load separately
 * (`notes.js`) so that editing a note never reloads the audience view.
 */
import manifest from '@presentation/presentation.json';
import presentationLayouts from '@presentation/layouts/index.js';
import coreLayouts from '../layouts/index.js';
import { buildPresentation, mergeLayouts, slideIdFromPath } from './model.js';

const contentFiles = import.meta.glob('@presentation/slides/*/content.json', { eager: true, import: 'default' });

// Citations of borrowed material, by key; optional (see docs/implementation/presentations.md).
const sourceFiles = import.meta.glob('@presentation/sources.json', { eager: true, import: 'default' });

// A presentation may restyle the framework by overriding the CSS custom
// properties of `core/client/index.css` in an optional `theme.css`.
import.meta.glob('@presentation/theme.css', { eager: true });

export function loadPresentation() {
  const slideContents = Object.fromEntries(
    Object.entries(contentFiles).map(([path, content]) => [slideIdFromPath(path), content]),
  );
  return buildPresentation({
    id: __PRESENTATION_ID__,
    manifest,
    slideContents,
    layouts: mergeLayouts(coreLayouts, presentationLayouts),
    baseUrl: import.meta.env.BASE_URL,
    sources: Object.values(sourceFiles)[0] ?? {},
  });
}
