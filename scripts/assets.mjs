#!/usr/bin/env node
/**
 * Move a presentation's assets between this checkout and the bucket.
 * DATA.md is the full description; this script fixes the paths so they are
 * never typed by hand.
 *
 *   npm run assets -- pull  <id>... | --all   bucket → checkout
 *   npm run assets -- push  <id>...           checkout → bucket, then verify
 *   npm run assets -- check <id>...           is every local file in the bucket?
 *   npm run assets -- size  <id>... | --all   bytes and objects in the bucket
 *
 * Options: --dry-run (show what would be copied).
 *
 * Assets are a presentation's `public/` (slide media the deck serves) and
 * `assets/` (source decks and raw material). Both are ignored by git. Each
 * maps to the same relative path under the bucket prefix:
 *
 *   presentations/<id>/public/  ↔  <ASSETS_REMOTE>/presentations/<id>/public/
 *
 * ASSETS_REMOTE defaults to tcig:tcig-projects/research-presentation-template.
 * RCLONE names the rclone binary if it is not on PATH. Copies only: this
 * script never runs `rclone sync`, which deletes remote files that are
 * missing locally.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { listPresentations, selectPresentations } from '../core/tooling/presentations.js';

const REMOTE_ROOT = process.env.ASSETS_REMOTE ?? 'tcig:tcig-projects/research-presentation-template';
const RCLONE = process.env.RCLONE ?? 'rclone';
const ASSET_DIRS = ['public', 'assets'];

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    all: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
  },
});
const [command, ...ids] = positionals;

function rclone(args) {
  const extra = values['dry-run'] ? ['--dry-run'] : [];
  console.log(`$ rclone ${[...args, ...extra].join(' ')}`);
  const result = spawnSync(RCLONE, [...args, ...extra], { stdio: 'inherit' });
  if (result.error) {
    console.error(`Could not run "${RCLONE}": ${result.error.message}. Install rclone (DATA.md, "Setup").`);
    process.exit(1);
  }
  return result.status === 0;
}

function remotePath(id, dir) {
  return `${REMOTE_ROOT}/presentations/${id}/${dir}`;
}

/** Remote ids, for `pull --all`: every presentation prefix in the bucket. */
function remotePresentationIds() {
  const result = spawnSync(RCLONE, ['lsf', '--dirs-only', `${REMOTE_ROOT}/presentations/`], { encoding: 'utf-8' });
  if (result.status !== 0) {
    console.error(result.stderr || `Could not list ${REMOTE_ROOT}/presentations/`);
    process.exit(1);
  }
  const local = new Set(listPresentations().map((p) => p.id));
  return result.stdout.split('\n').map((line) => line.replace(/\/$/, '')).filter((id) => local.has(id));
}

const COMMANDS = {
  pull(presentation) {
    return ASSET_DIRS.every((dir) => rclone([
      'copy', remotePath(presentation.id, dir), join(presentation.dir, dir), '--progress', '--transfers=16',
    ]));
  },

  push(presentation) {
    const present = ASSET_DIRS.filter((dir) => existsSync(join(presentation.dir, dir)));
    if (present.length === 0) {
      console.log(`${presentation.id}: no public/ or assets/ to push`);
      return true;
    }
    return present.every((dir) => rclone([
      'copy', join(presentation.dir, dir), remotePath(presentation.id, dir), '--progress', '--transfers=16',
    ]) && (values['dry-run'] || rclone(['check', join(presentation.dir, dir), remotePath(presentation.id, dir), '--one-way'])));
  },

  check(presentation) {
    return ASSET_DIRS
      .filter((dir) => existsSync(join(presentation.dir, dir)))
      .every((dir) => rclone(['check', join(presentation.dir, dir), remotePath(presentation.id, dir), '--one-way']));
  },

  size(presentation) {
    return rclone(['size', `${REMOTE_ROOT}/presentations/${presentation.id}`]);
  },
};

if (!COMMANDS[command] || (ids.length === 0 && !values.all)) {
  console.error('Usage: npm run assets -- <pull | push | check | size> <id>... | --all   [--dry-run]');
  process.exit(1);
}
if (values.all && command === 'push') {
  console.error('push takes explicit ids, so an upload is always a deliberate choice.');
  process.exit(1);
}

const targets = values.all
  ? selectPresentations(command === 'pull' ? remotePresentationIds() : [])
  : selectPresentations(ids);
const failed = targets.filter((presentation) => !COMMANDS[command](presentation));
if (failed.length > 0) {
  console.error(`\n${command} failed for: ${failed.map((p) => p.id).join(', ')}`);
  process.exit(1);
}
