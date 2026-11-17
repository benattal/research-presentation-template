/**
 * Where things are, and which presentations exist.
 *
 * A presentation is a directory `presentations/<id>/` with a
 * `presentation.json`. The directory name is its id, its URL segment behind
 * the gateway, and its prefix in the asset bucket.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
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

/**
 * The presentations named on the command line, or every presentation when
 * none is named. Throws on an unknown id, listing the known ones.
 */
export function selectPresentations(ids) {
  const all = listPresentations();
  if (ids.length === 0) return all;
  return ids.map((id) => {
    const found = all.find((presentation) => presentation.id === id);
    if (!found) {
      throw new Error(`No presentation "${id}". Known: ${all.map((p) => p.id).join(', ') || '(none)'}.`);
    }
    return found;
  });
}

/**
 * The one presentation a single-presentation command works on: the id given,
 * or the only presentation when there is exactly one.
 */
export function selectOnePresentation(id) {
  if (id) return selectPresentations([id])[0];
  const all = listPresentations();
  if (all.length === 1) return all[0];
  throw new Error(
    `Name a presentation: ${all.map((p) => p.id).join(', ') || '(none; create one with npm run new -- <id>)'}.`,
  );
}
