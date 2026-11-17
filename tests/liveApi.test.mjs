import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import express from 'express';
import { createLiveApi } from '../core/server/liveApi.js';
import { createPollState } from '../core/server/pollState.js';
import { createPresenterAuth } from '../core/server/presenterAuth.js';

describe('poll state', () => {
  it('keeps one vote per voter and derives counts', () => {
    const polls = createPollState({}, () => {});
    polls.initChoicePoll('q', ['a', 'b', 'c'], 'v1');
    polls.voteChoicePoll('q', 'v1', 0);
    polls.voteChoicePoll('q', 'v1', 2);
    const view = polls.voteChoicePoll('q', 'v2', 2);
    assert.deepEqual(view, { counts: [0, 0, 2], myVote: 2 });
    assert.equal(polls.voteChoicePoll('q', 'v1', 3), null);
  });

  it('starts a poll over when its options change', () => {
    const polls = createPollState({}, () => {});
    polls.initChoicePoll('q', ['a', 'b'], 'v1');
    polls.voteChoicePoll('q', 'v1', 1);
    assert.deepEqual(polls.initChoicePoll('q', ['a', 'b'], 'v1'), { counts: [0, 1], myVote: 1 });
    assert.deepEqual(polls.initChoicePoll('q', ['a', 'b', 'c'], 'v1'), { counts: [0, 0, 0], myVote: null });
  });

  it('resets choice and numeric polls and survives a snapshot round trip', () => {
    const polls = createPollState({}, () => {});
    polls.initChoicePoll('q', ['a'], 'v');
    polls.voteChoicePoll('q', 'v', 0);
    polls.initNumericPoll('n', 'v');
    polls.submitNumericPoll('n', 'v', 4);
    polls.submitNumericPoll('n', 'v', 5);
    const restored = createPollState(JSON.parse(JSON.stringify(polls.snapshot())), () => {});
    assert.deepEqual(restored.numericPollValues('n'), [5]);
    assert.deepEqual(restored.reset('q'), { choice: true, numeric: false });
    assert.deepEqual(restored.choicePollCounts('q'), [0]);
    assert.deepEqual(restored.reset('missing'), { choice: false, numeric: false });
  });
});

describe('live API', () => {
  const statePath = join(mkdtempSync(join(tmpdir(), 'live-api-')), 'demo.json');
  const settings = { votingOpen: true, presenterControlled: true };
  let server;
  let base;

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use('/demo/api', createLiveApi({ settings, auth: createPresenterAuth('secret'), statePath }));
    await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${server.address().port}/demo/api`;
  });

  after(() => server.close());

  async function post(path, body, token) {
    const response = await fetch(`${base}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  }

  it('exchanges the password for a token and guards presenter routes', async () => {
    assert.equal((await post('auth/verify', { password: 'wrong' })).status, 401);
    const { body } = await post('auth/verify', { password: 'secret' });
    assert.equal(typeof body.token, 'string');
    assert.equal((await post('polls/q/reset', {})).status, 401);
    assert.equal((await post('slide-sync/position', { index: 1, step: 0 }, body.token)).status, 200);
  });

  it('records votes, closes voting on demand, and persists the votes', async () => {
    assert.deepEqual((await post('poll/q/init', { options: ['a', 'b'], voterId: 'v1' })).body, { counts: [0, 0], myVote: null });
    assert.deepEqual((await post('poll/q/vote', { optionIndex: 1, voterId: 'v1' })).body, { counts: [0, 1], myVote: 1 });
    assert.equal((await post('poll/q/vote', { optionIndex: 1 })).status, 400);
    assert.equal((await post('poll/a.b/vote', { optionIndex: 1, voterId: 'v1' })).status, 400);

    settings.votingOpen = false;
    assert.equal((await post('poll/q/vote', { optionIndex: 0, voterId: 'v1' })).status, 403);
    settings.votingOpen = true;

    await new Promise((resolve) => setTimeout(resolve, 700));
    const saved = JSON.parse(readFileSync(statePath, 'utf-8'));
    assert.deepEqual(saved.choicePolls.q.votes, { v1: 1 });
  });
});
