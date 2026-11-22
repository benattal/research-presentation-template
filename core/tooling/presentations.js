/**
 * Where things are, and which presentations exist.
 *
 * A presentation is a directory `presentations/<id>/` with a
 * `presentation.json`. The directory name is its id, its URL segment behind
 * the gateway, and its prefix in the asset store.
 *
 * A command can also be given a presentation by its directory
 * (`./tutorial`): a deck that is not a project's, which the listing, the
 * gateway, and a command without arguments leave out.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const CLIENT_DIR = join(REPO_ROOT, 'core/client');
export const PRESENTATIONS_DIR = join(REPO_ROOT, 'presentations');

/** Static builds (`npm run build`): `dist/<id>/`, relative base, no live server. */
export const STATIC_BUILD_DIR = join(REPO_ROOT, 'dist');
/** Gateway builds (`npm run build:live`): `dist/live/<id>/`, served by `npm start`. */
export const LIVE_BUILD_DIR = join(REPO_ROOT, 'dist/live');

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

function readManifest(dir) {
  const path = join(dir, 'presentation.json');
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

/** Every presentation, sorted by id: `[{ id, dir, manifest }]`. */
export function listPresentations() {
  if (!existsSync(PRESENTATIONS_DIR)) return [];
  return readdirSync(PRESENTATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(PRESENTATIONS_DIR, entry.name, 'presentation.json')))
    .map((entry) => {
      if (!ID_PATTERN.test(entry.name)) {
        throw new Error(`presentations/${entry.name}: ids use lowercase letters, digits, and hyphens.`);
      }
      const dir = join(PRESENTATIONS_DIR, entry.name);
      return { id: entry.name, dir, manifest: readManifest(dir) };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Whether a command-line argument names a directory (`./tutorial`, `C:\decks\talk`) and not an id. */
function isDirectoryArgument(argument) {
  return argument.startsWith('.') || /[\\/]/.test(argument);
}

/** The presentation in the directory `path`, relative to where the command runs. Its id is the directory's name. */
function presentationAt(path) {
  const dir = resolve(path);
  if (!existsSync(join(dir, 'presentation.json'))) {
    throw new Error(`${path} is not a presentation: it has no presentation.json.`);
  }
  const id = basename(dir);
  if (!ID_PATTERN.test(id)) throw new Error(`${path}: a presentation's directory name uses lowercase letters, digits, and hyphens.`);
  return { id, dir, manifest: readManifest(dir) };
}

/**
 * The presentations named on the command line, each by its id or by its
 * directory, or every presentation under `presentations/` when none is
 * named. Throws on an unknown id, listing the known ones.
 */
export function selectPresentations(ids) {
  const all = listPresentations();
  if (ids.length === 0) return all;
  return ids.map((id) => {
    if (isDirectoryArgument(id)) return presentationAt(id);
    const found = all.find((presentation) => presentation.id === id);
    if (!found) {
      throw new Error(`No presentation "${id}". Known: ${all.map((p) => p.id).join(', ') || '(none)'}.`);
    }
    return found;
  });
}

/**
 * The one presentation a single-presentation command works on: the id or
 * directory given, or the only presentation when there is exactly one.
 */
export function selectOnePresentation(id) {
  if (id) return selectPresentations([id])[0];
  const all = listPresentations();
  if (all.length === 1) return all[0];
  throw new Error(
    `Name a presentation: ${all.map((p) => p.id).join(', ') || '(none; create one with npm run new -- <id>)'}.`,
  );
}
