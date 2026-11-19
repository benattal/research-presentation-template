#!/usr/bin/env node
/**
 * Static checks of presentations, without a browser.
 *
 *   npm run check [-- <id>...]
 *
 * For each presentation (every one when no id is given):
 *   - load it the way the browser does, through Vite, and report every
 *     problem `buildPresentation` finds (unknown layouts, missing slides,
 *     malformed presentation.json);
 *   - render every formula of the presenter notes, as the presenter window
 *     does (a formula of a draft slide's notes that does not render is a
 *     warning);
 *   - check that `pronunciation.json`, if the presentation has one, maps
 *     terms to spoken spellings (docs/implementation/narration.md);
 *   - check that every `/slides/...` path in slide content or layout source
 *     exists in the presentation's `public/` directory (pull assets first:
 *     npm run assets -- pull <id>); a missing asset of a draft slide (one
 *     presentation.json does not list) is a warning, not an error;
 *   - validate its recording.json, if it has one (the holds of
 *     npm run record);
 *   - list the draft slides.
 *
 * Exits with status 1 when any presentation has an error. Rendering
 * problems (overflow, console errors) need the browser: npm run capture.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createServer } from 'vite';
import { slideIdFromPath } from '../core/client/presentation/model.js';
import { notesMathProblems } from '../core/client/presentation/notesMath.js';
import { readPronunciationMap } from '../core/tooling/narration.js';
import { REPO_ROOT, selectPresentations } from '../core/tooling/presentations.js';
import { recordingFileProblems } from '../core/tooling/recording.js';
import { createViteConfig } from '../core/tooling/viteConfig.js';

const ASSET_PATH_PATTERN = /\/slides\/[A-Za-z0-9_\-./ ]+\.[A-Za-z0-9]+/g;
const SOURCE_EXTENSIONS = /\.(js|jsx|json)$/;

/** A slide's notes file: `notes.md` or `notes-<step>.md`. */
const NOTES_FILE = /[\\/]notes(-\d+)?\.md$/;

function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true })
    .map((name) => join(dir, name))
    .filter((path) => statSync(path).isFile());
}

/**
 * Every `/slides/...` asset path written in the presentation's slides or
 * code: path → `{ source, slideId }`, where `slideId` is set for paths that
 * appear in a slide's content.json.
 */
function referencedAssets(presentation) {
  const references = new Map();
  const sources = [
    ...filesUnder(join(presentation.dir, 'slides')).filter((path) => path.endsWith('content.json')),
    ...filesUnder(join(presentation.dir, 'layouts')).filter((path) => SOURCE_EXTENSIONS.test(path)),
    ...filesUnder(join(presentation.dir, 'components')).filter((path) => SOURCE_EXTENSIONS.test(path)),
  ];
  for (const source of sources) {
    const slideId = source.endsWith('content.json') ? slideIdFromPath(source) : null;
    for (const [assetPath] of readFileSync(source, 'utf-8').matchAll(ASSET_PATH_PATTERN)) {
      if (!references.has(assetPath)) references.set(assetPath, { source: relative(presentation.dir, source), slideId });
    }
  }
  return references;
}

async function loadThroughVite(presentation) {
  const server = await createServer({
    ...createViteConfig({ presentation, base: '/', live: false, server: { middlewareMode: true, hmr: false } }),
    logLevel: 'error',
  });
  try {
    const { loadPresentation } = await server.ssrLoadModule('/presentation/load.js');
    return { loaded: loadPresentation(), problems: [] };
  } catch (error) {
    return { loaded: null, problems: error.problems ?? [String(error.message ?? error)] };
  } finally {
    await server.close();
  }
}

let failed = false;
for (const presentation of selectPresentations(process.argv.slice(2))) {
  const errors = [];
  const warnings = [];

  const { loaded, problems } = await loadThroughVite(presentation);
  errors.push(...problems);
  const drafts = new Set(loaded?.unlistedSlideIds ?? []);
  if (drafts.size > 0) warnings.push(`${drafts.size} draft slides (not in presentation.json): ${[...drafts].join(', ')}`);

  for (const path of filesUnder(join(presentation.dir, 'slides')).filter((file) => NOTES_FILE.test(file))) {
    const where = relative(presentation.dir, path).replaceAll('\\', '/');
    (drafts.has(slideIdFromPath(path)) ? warnings : errors).push(...notesMathProblems(readFileSync(path, 'utf-8'), where));
  }

  errors.push(...readPronunciationMap(presentation).problems);
  if (loaded) errors.push(...recordingFileProblems(presentation.dir, loaded.slides));

  const assets = referencedAssets(presentation);
  const publicDir = join(presentation.dir, 'public');
  if (assets.size > 0 && !existsSync(publicDir)) {
    errors.push(`${assets.size} assets are referenced but public/ is missing; run: npm run assets -- pull ${presentation.id}`);
  } else {
    for (const [assetPath, { source, slideId }] of assets) {
      if (existsSync(join(publicDir, assetPath))) continue;
      const message = `missing asset public${assetPath} (used in ${source})`;
      if (drafts.has(slideId)) warnings.push(`${message}, a draft slide`);
      else errors.push(message);
    }
  }

  const slideCount = loaded ? loaded.slides.length : '?';
  console.log(`${errors.length ? 'FAIL' : 'ok  '} ${presentation.id}: ${slideCount} slides, ${assets.size} assets referenced`);
  for (const error of errors) console.log(`       error: ${error}`);
  for (const warning of warnings) console.log(`       warning: ${warning}`);
  failed ||= errors.length > 0;
}

if (failed) console.log(`\nSee ${relative(process.cwd(), join(REPO_ROOT, 'docs/implementation/presentations.md'))} for the presentation format.`);
process.exit(failed ? 1 : 0);
