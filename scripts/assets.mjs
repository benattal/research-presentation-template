#!/usr/bin/env node
/**
 * Move a presentation's assets between this checkout and the asset store.
 * DATA.md is the full description; `core/tooling/assetStore.js` fixes the
 * paths so they are never typed by hand.
 *
 *   npm run assets -- pull  <id>... | --all   store → checkout
 *   npm run assets -- push  <id>...           checkout → store, then verify
 *   npm run assets -- check <id>...           is every local file in the store?
 *   npm run assets -- size  <id>... | --all   bytes and objects in the store
 *
 * Options: --dry-run (show what would be copied).
 *
 * ASSETS_REMOTE names the store, as rclone addresses it: `remote:path`, or
 * a directory of this machine. It defaults to this repository's own bucket
 * (`DEFAULT_ASSETS_REMOTE`), which needs that bucket's access tokens. RCLONE
 * names the rclone binary if it is not on PATH.
 */
import { parseArgs } from 'node:util';
import { DEFAULT_ASSETS_REMOTE, createAssetStore } from '../core/tooling/assetStore.js';
import { listPresentations, selectPresentations } from '../core/tooling/presentations.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    all: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
  },
});
const [command, ...ids] = positionals;
const COMMANDS = ['pull', 'push', 'check', 'size'];

if (!COMMANDS.includes(command) || (ids.length === 0 && !values.all)) {
  console.error('Usage: npm run assets -- <pull | push | check | size> <id>... | --all   [--dry-run]');
  process.exit(1);
}
if (values.all && command === 'push') {
  console.error('push takes explicit ids, so an upload is always a deliberate choice.');
  process.exit(1);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

try {
  const store = createAssetStore({
    root: process.env.ASSETS_REMOTE ?? DEFAULT_ASSETS_REMOTE,
    rclone: process.env.RCLONE ?? 'rclone',
    dryRun: values['dry-run'],
  });
  const problem = store.problem();
  if (problem) fail(problem);

  // `pull --all` takes the presentations the store holds that this branch has.
  let targetIds = ids;
  if (values.all && command === 'pull') {
    const stored = store.presentationIds();
    if (stored === null) fail('Could not list the presentations in the store.');
    const local = new Set(listPresentations().map((presentation) => presentation.id));
    targetIds = stored.filter((id) => local.has(id));
    if (targetIds.length === 0) {
      console.log('The store holds nothing for the presentations of this branch.');
      process.exit(0);
    }
  }

  const failed = selectPresentations(values.all && command !== 'pull' ? [] : targetIds)
    .filter((presentation) => !store[command](presentation));
  if (failed.length > 0) fail(`\n${command} failed for: ${failed.map((presentation) => presentation.id).join(', ')}`);
} catch (error) {
  fail(error.message);
}
