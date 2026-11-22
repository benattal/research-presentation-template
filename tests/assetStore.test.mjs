/**
 * The asset store, against a store that is a plain directory (what a
 * Dropbox folder or a synced folder is to rclone). The copies need rclone;
 * without it those tests are skipped and say so.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { DEFAULT_ASSETS_REMOTE, createAssetStore, remoteName } from '../core/tooling/assetStore.js';

const RCLONE = process.env.RCLONE ?? 'rclone';
const hasRclone = spawnSync(RCLONE, ['version'], { encoding: 'utf-8' }).status === 0;
const needsRclone = { skip: hasRclone ? false : `"${RCLONE}" is not installed` };

/** A store in a new temporary directory, and a checkout's presentation beside it. */
function sandbox() {
  const base = mkdtempSync(join(tmpdir(), 'asset-store-'));
  const root = join(base, 'store').replaceAll('\\', '/');
  const presentation = { id: 'deck', dir: join(base, 'checkout', 'presentations', 'deck') };
  mkdirSync(presentation.dir, { recursive: true });
  const lines = [];
  const log = { log: (line) => lines.push(line), error: (line) => lines.push(line) };
  return { root, presentation, lines, store: createAssetStore({ root, rclone: RCLONE, log }) };
}

function writeMedia(presentation, text = 'a figure') {
  const path = join(presentation.dir, 'public', 'slides', 'intro', 'figure.txt');
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, text);
  return path;
}

describe('asset store', () => {
  it('tells a remote from a directory of this machine', () => {
    assert.equal(remoteName('tcig:tcig-projects/research-presentation-template'), 'tcig');
    assert.equal(remoteName('dropbox:Decks/assets'), 'dropbox');
    assert.equal(remoteName(DEFAULT_ASSETS_REMOTE), 'tcig');
    assert.equal(remoteName('C:/Users/someone/Dropbox/decks'), null, 'a Windows drive');
    assert.equal(remoteName('/home/someone/Dropbox/decks'), null);
  });

  it('says what to do when rclone has no remote of that name', needsRclone, () => {
    const missing = createAssetStore({ root: 'no-such-remote-for-this-test:bucket/prefix', rclone: RCLONE }).problem();
    assert.match(missing, /no remote named "no-such-remote-for-this-test"/);
    assert.match(missing, /README\.md, "Large assets"/);
    assert.equal(sandbox().store.problem(), null, 'a directory needs no remote');
  });

  it('pushes, then pulls into an empty checkout, a presentation that has only public/', needsRclone, () => {
    const { store, presentation, root } = sandbox();
    const media = writeMedia(presentation);
    assert.ok(store.push(presentation), 'push, with its check');
    assert.ok(existsSync(join(root, 'presentations/deck/public/slides/intro/figure.txt')));
    assert.deepEqual(store.presentationIds(), ['deck']);

    rmSync(media);
    // The store has no assets/ for this presentation: a store of real
    // directories reports that as an error, and the pull must not.
    assert.ok(store.pull(presentation));
    assert.equal(readFileSync(media, 'utf-8'), 'a figure');
    assert.ok(!existsSync(join(presentation.dir, 'assets')));
  });

  it('pulls nothing, and says so, for a presentation the store does not have', needsRclone, () => {
    const { store, presentation, lines } = sandbox();
    assert.deepEqual(store.presentationIds(), []);
    assert.ok(store.pull(presentation));
    assert.match(lines.join('\n'), /deck: nothing in the store yet/);
    assert.ok(!existsSync(join(presentation.dir, 'public')));
  });

  it('fails the check for a local file the store lacks or holds differently', needsRclone, () => {
    const { store, presentation } = sandbox();
    writeMedia(presentation);
    assert.ok(!store.check(presentation), 'nothing pushed yet');
    assert.ok(store.push(presentation));
    assert.ok(store.check(presentation));
    writeMedia(presentation, 'a changed figure, longer than before');
    assert.ok(!store.check(presentation), 'changed locally since the push');
  });

  it('shows what a push would copy with dryRun, and copies nothing', needsRclone, () => {
    const { presentation, root } = sandbox();
    writeMedia(presentation);
    assert.ok(createAssetStore({ root, rclone: RCLONE, dryRun: true, log: { log() {}, error() {} } }).push(presentation));
    assert.ok(!existsSync(join(root, 'presentations')));
  });
});
