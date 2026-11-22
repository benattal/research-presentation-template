/**
 * The asset store: where a presentation's `public/` (slide media the deck
 * serves) and `assets/` (source decks and raw material) are kept outside
 * git, and the rclone commands that move them. `scripts/assets.mjs` is the
 * command line; DATA.md is the description.
 *
 * A store is anything rclone can address as `remote:path` or as a plain
 * directory: a Cloudflare R2 bucket, a Dropbox folder, a folder a sync
 * client keeps. Each asset directory maps to the same relative path in it:
 *
 *   presentations/<id>/public/  ↔  <root>/presentations/<id>/public/
 *
 * Copies only: nothing here runs `rclone sync`, which deletes files in the
 * store that are missing locally.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** The store used when `ASSETS_REMOTE` is not set: this repository's own bucket. */
export const DEFAULT_ASSETS_REMOTE = 'tcig:tcig-projects/research-presentation-template';

/** A presentation's directories that are assets, in a checkout and in the store. */
export const ASSET_DIRS = ['public', 'assets'];

/** rclone's exit status for a directory that does not exist. */
const DIRECTORY_NOT_FOUND = 3;

/**
 * The name of the rclone remote in `root` (`tcig` in `tcig:bucket/path`), or
 * null when `root` is a directory of this machine. A single letter before
 * the colon is a Windows drive.
 */
export function remoteName(root) {
  return /^([\w .+@-]{2,}):/.exec(root)?.[1] ?? null;
}

/**
 * The store at `root`, driven through the rclone binary `rclone`. With
 * `dryRun`, copies show what they would do. Every method that runs a
 * command prints it first, and returns whether it succeeded.
 */
export function createAssetStore({ root, rclone = 'rclone', dryRun = false, log = console }) {
  const storePath = (id, dir) => `${root}/presentations/${id}/${dir}`;

  function capture(args) {
    const result = spawnSync(rclone, args, { encoding: 'utf-8' });
    if (result.error) throw new Error(`Could not run "${rclone}": ${result.error.message}. Install rclone (DATA.md, "Setup").`);
    return result;
  }

  function run(args) {
    const all = dryRun ? [...args, '--dry-run'] : args;
    log.log(`$ rclone ${all.join(' ')}`);
    const result = spawnSync(rclone, all, { stdio: 'inherit' });
    if (result.error) throw new Error(`Could not run "${rclone}": ${result.error.message}. Install rclone (DATA.md, "Setup").`);
    return result.status === 0;
  }

  /**
   * The directory names directly under `path` in the store, or null when
   * the listing failed. A path that is not there has none: an object store
   * (R2) lists it as empty, a store of real directories (a folder, Dropbox)
   * reports it as not found.
   */
  function directoriesUnder(path) {
    const result = capture(['lsf', '--dirs-only', path]);
    if (result.status === DIRECTORY_NOT_FOUND) return [];
    if (result.status !== 0) {
      log.error(result.stderr.trim() || `Could not list ${path}`);
      return null;
    }
    return result.stdout.split('\n').map((line) => line.replace(/\/$/, '')).filter(Boolean);
  }

  return {
    /**
     * Why this machine cannot reach the store, as a message for the user,
     * or null when rclone knows the store's remote. It does not contact
     * the store.
     */
    problem() {
      const name = remoteName(root);
      if (name === null) return null;
      const remotes = capture(['listremotes']).stdout.split('\n').map((line) => line.replace(/:$/, ''));
      if (remotes.includes(name)) return null;
      return [
        `The asset store is not set up on this machine: rclone has no remote named "${name}".`,
        `  store: ${root}${root === DEFAULT_ASSETS_REMOTE ? '   (the default; ASSETS_REMOTE is not set)' : '   (ASSETS_REMOTE)'}`,
        'README.md, "Large assets", says how to get access to this store or set up one of your own.',
      ].join('\n');
    },

    /** The ids of the presentations the store holds, or null when it could not be listed. */
    presentationIds() {
      return directoriesUnder(`${root}/presentations/`);
    },

    /** Store → checkout, for the asset directories the store has. */
    pull(presentation) {
      const stored = directoriesUnder(`${root}/presentations/${presentation.id}/`);
      if (stored === null) return false;
      const dirs = ASSET_DIRS.filter((dir) => stored.includes(dir));
      if (dirs.length === 0) {
        log.log(`${presentation.id}: nothing in the store yet (${root}/presentations/${presentation.id}/)`);
        return true;
      }
      return dirs.every((dir) => run([
        'copy', storePath(presentation.id, dir), join(presentation.dir, dir), '--progress', '--transfers=16',
      ]));
    },

    /** Checkout → store, then a comparison of every local file with the store. */
    push(presentation) {
      const present = ASSET_DIRS.filter((dir) => existsSync(join(presentation.dir, dir)));
      if (present.length === 0) {
        log.log(`${presentation.id}: no public/ or assets/ to push`);
        return true;
      }
      return present.every((dir) => run([
        'copy', join(presentation.dir, dir), storePath(presentation.id, dir), '--progress', '--transfers=16',
      ]) && (dryRun || run(['check', join(presentation.dir, dir), storePath(presentation.id, dir), '--one-way'])));
    },

    /** Is every local file in the store, unchanged? */
    check(presentation) {
      return ASSET_DIRS
        .filter((dir) => existsSync(join(presentation.dir, dir)))
        .every((dir) => run(['check', join(presentation.dir, dir), storePath(presentation.id, dir), '--one-way']));
    },

    /** Bytes and objects the store holds for the presentation. */
    size(presentation) {
      return run(['size', `${root}/presentations/${presentation.id}`]);
    },
  };
}
