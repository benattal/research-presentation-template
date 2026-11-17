import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { Router } from 'express';
import { createEventStreams } from './eventStreams.js';
import { createPollState } from './pollState.js';

const ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

/** Milliseconds to wait after a vote before writing the state file, so a burst of votes is one write. */
const SAVE_DELAY_MS = 500;

function readState(statePath) {
  try {
    return JSON.parse(readFileSync(statePath, 'utf-8'));
  } catch {
    return {};
  }
}

function validId(value) {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

/**
 * The live API of one presentation, mounted by the gateway at
 * `/<presentation-id>/api`:
 *
 *   GET  settings                       { votingOpen, presenterControlled }
 *   POST auth/verify                    { password } → { token }
 *   POST poll/:pollId/init              { options, voterId } → { counts, myVote }
 *   POST poll/:pollId/vote              { optionIndex, voterId } → { counts, myVote }
 *   GET  poll/:pollId/stream            events { counts, event }
 *   POST numeric-poll/:pollId/init      { voterId } → { values, myValue }
 *   POST numeric-poll/:pollId/submit    { value, voterId } → { values, myValue }
 *   GET  numeric-poll/:pollId/stream    events { values, event }
 *   POST polls/:pollId/reset            presenter only
 *   GET  slide-sync/stream              events { index, step }   (when presenter-controlled)
 *   POST slide-sync/position            { index, step }, presenter only
 *
 * Poll votes persist to `statePath` (JSON), so a restart keeps them.
 *
 * @param {object} args
 * @param {{ votingOpen: boolean, presenterControlled: boolean }} args.settings
 * @param {ReturnType<import('./presenterAuth.js').createPresenterAuth>} args.auth
 * @param {string} args.statePath
 */
export function createLiveApi({ settings, auth, statePath }) {
  const router = Router();
  const streams = createEventStreams();

  let saveTimer = null;
  const polls = createPollState(readState(statePath), () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      mkdirSync(dirname(statePath), { recursive: true });
      writeFileSync(statePath, JSON.stringify(polls.snapshot(), null, 2));
    }, SAVE_DELAY_MS);
  });
  let presenterPosition = { index: 0, step: 0 };

  router.get('/settings', (req, res) => res.json(settings));
  router.post('/auth/verify', auth.verify);

  // Every route below names a poll; reject malformed ids and voter ids once, here.
  router.param('pollId', (req, res, next, pollId) => {
    if (!validId(pollId)) return res.status(400).json({ error: 'invalid poll id' });
    return next();
  });
  function requireVoter(req, res, next) {
    if (!validId(req.body?.voterId)) return res.status(400).json({ error: 'voterId required' });
    return next();
  }
  function requireVotingOpen(req, res, next) {
    if (!settings.votingOpen) return res.status(403).json({ error: 'Voting is closed' });
    return next();
  }

  // ── Choice polls ────────────────────────────────────────────────
  router.post('/poll/:pollId/init', requireVoter, (req, res) => {
    const { options, voterId } = req.body;
    const validOptions = Array.isArray(options) && options.length > 0 && options.length <= 26
      && options.every((option) => typeof option === 'string');
    if (!validOptions) return res.status(400).json({ error: 'options must be 1 to 26 strings' });
    return res.json(polls.initChoicePoll(req.params.pollId, options, voterId));
  });

  router.post('/poll/:pollId/vote', requireVotingOpen, requireVoter, (req, res) => {
    const { pollId } = req.params;
    if (!polls.hasChoicePoll(pollId)) return res.status(404).json({ error: 'Unknown poll' });
    const view = polls.voteChoicePoll(pollId, req.body.voterId, req.body.optionIndex);
    if (!view) return res.status(400).json({ error: 'invalid optionIndex' });
    streams.publish(`poll:${pollId}`, { counts: view.counts, event: 'update' });
    return res.json(view);
  });

  router.get('/poll/:pollId/stream', (req, res) => {
    const { pollId } = req.params;
    const initial = polls.hasChoicePoll(pollId) ? { counts: polls.choicePollCounts(pollId), event: 'update' } : undefined;
    streams.subscribe(`poll:${pollId}`, req, res, initial);
  });

  // ── Numeric polls ───────────────────────────────────────────────
  router.post('/numeric-poll/:pollId/init', requireVoter, (req, res) => {
    res.json(polls.initNumericPoll(req.params.pollId, req.body.voterId));
  });

  router.post('/numeric-poll/:pollId/submit', requireVotingOpen, requireVoter, (req, res) => {
    const { pollId } = req.params;
    const { value, voterId } = req.body;
    if (!polls.hasNumericPoll(pollId)) return res.status(404).json({ error: 'Unknown poll' });
    if (typeof value !== 'number' || !Number.isFinite(value)) return res.status(400).json({ error: 'value must be a number' });
    const view = polls.submitNumericPoll(pollId, voterId, value);
    streams.publish(`numeric-poll:${pollId}`, { values: view.values, event: 'update' });
    return res.json(view);
  });

  router.get('/numeric-poll/:pollId/stream', (req, res) => {
    const { pollId } = req.params;
    const initial = polls.hasNumericPoll(pollId) ? { values: polls.numericPollValues(pollId), event: 'update' } : undefined;
    streams.subscribe(`numeric-poll:${pollId}`, req, res, initial);
  });

  router.post('/polls/:pollId/reset', auth.requirePresenter, (req, res) => {
    const { pollId } = req.params;
    const reset = polls.reset(pollId);
    if (reset.choice) streams.publish(`poll:${pollId}`, { counts: polls.choicePollCounts(pollId), event: 'reset' });
    if (reset.numeric) streams.publish(`numeric-poll:${pollId}`, { values: [], event: 'reset' });
    if (!reset.choice && !reset.numeric) return res.status(404).json({ error: 'Unknown poll' });
    return res.json(reset);
  });

  // ── Follow the presenter ────────────────────────────────────────
  function requirePresenterControlled(req, res, next) {
    if (!settings.presenterControlled) return res.status(404).json({ error: 'Presenter-controlled mode is off' });
    return next();
  }

  router.get('/slide-sync/stream', requirePresenterControlled, (req, res) => {
    streams.subscribe('slide-sync', req, res, presenterPosition);
  });

  router.post('/slide-sync/position', requirePresenterControlled, auth.requirePresenter, (req, res) => {
    const { index, step } = req.body ?? {};
    if (!Number.isInteger(index) || !Number.isInteger(step)) {
      return res.status(400).json({ error: 'index and step must be integers' });
    }
    presenterPosition = { index, step };
    streams.publish('slide-sync', presenterPosition);
    return res.json({ ok: true });
  });

  return router;
}
