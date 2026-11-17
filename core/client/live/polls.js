import { useCallback, useEffect, useRef, useState } from 'react';
import { LIVE_SERVER, postJson, useEventStream, useLiveSettings } from './liveApi.js';

const VOTER_ID_KEY = 'voter-id';

/**
 * A random id for this browser, kept in `localStorage`. The server records
 * one vote per voter id, so changing a vote replaces it and a reload cannot
 * vote twice. It identifies a browser, not a person.
 */
function voterId() {
  try {
    let id = localStorage.getItem(VOTER_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VOTER_ID_KEY, id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
}

/**
 * This browser's own answer to a poll: shown as soon as it is sent, then
 * set to what the server recorded. When answers change quickly the
 * responses can arrive out of order, so only the response to the latest
 * request is applied; a failed request restores the last recorded answer.
 *
 * Returns `{ answer, confirm, send }`: `confirm(value)` records an answer
 * the server reported (on load, or `null` after a reset); `send(value,
 * request)` shows `value` and runs `request()`, which resolves to the
 * recorded answer.
 */
function useOwnAnswer() {
  const [answer, setAnswer] = useState(null);
  const recorded = useRef(null);
  const latestRequest = useRef(0);

  const confirm = useCallback((value) => {
    recorded.current = value;
    setAnswer(value);
  }, []);

  const send = useCallback(async (value, request) => {
    const requestNumber = ++latestRequest.current;
    setAnswer(value);
    try {
      const answerOnServer = await request();
      if (requestNumber === latestRequest.current) confirm(answerOnServer);
      return true;
    } catch {
      if (requestNumber === latestRequest.current) setAnswer(recorded.current);
      return false;
    }
  }, [confirm]);

  return { answer, confirm, send };
}

/**
 * A live multiple-choice poll.
 *
 * Returns `{ counts, totalVotes, myVote, connected, votingOpen, vote }`.
 * `counts[i]` is the number of votes for `options[i]`; `myVote` is this
 * browser's choice or `null`; `vote(i)` records or changes it and resolves
 * to whether the server accepted it. Without a live server, or while voting
 * is closed, the counts stay at zero and `vote` resolves to false.
 *
 * The server owns every vote. Counts come only from the server (on load and
 * through the event stream, which also reports this browser's own votes). A
 * reset by the presenter clears `myVote` in every browser, whether or not
 * the poll slide is on screen at the time.
 */
export function useChoicePoll(pollId, options) {
  const settings = useLiveSettings();
  const [counts, setCounts] = useState(() => options.map(() => 0));
  const { answer: myVote, confirm: confirmVote, send: sendVote } = useOwnAnswer();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!LIVE_SERVER) return undefined;
    let cancelled = false;
    postJson(`poll/${pollId}/init`, { options, voterId: voterId() })
      .then((state) => {
        if (cancelled) return;
        setCounts(state.counts);
        confirmVote(state.myVote);
        setReady(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // `options` comes from slide content and is a new array on every render;
    // keying on `pollId` initializes each poll once per mount.
  }, [pollId, confirmVote]);

  const connected = useEventStream(`poll/${pollId}/stream`, (message) => {
    setCounts(message.counts);
    if (message.event === 'reset') confirmVote(null);
  }, ready);

  const votingOpen = settings?.votingOpen ?? false;

  const vote = useCallback((optionIndex) => {
    if (!LIVE_SERVER || !votingOpen) return Promise.resolve(false);
    return sendVote(optionIndex, async () => {
      const state = await postJson(`poll/${pollId}/vote`, { optionIndex, voterId: voterId() });
      return state.myVote;
    });
  }, [pollId, votingOpen, sendVote]);

  return {
    counts,
    totalVotes: counts.reduce((sum, count) => sum + count, 0),
    myVote,
    connected,
    votingOpen,
    vote,
  };
}

/**
 * A live poll where each browser submits one number.
 *
 * Returns `{ values, myValue, connected, votingOpen, submit }`. `values`
 * holds one number per voter; submitting again replaces this browser's
 * number. Values come only from the server, as in `useChoicePoll`. Without
 * a live server, `values` stays empty and `submit` resolves to false.
 */
export function useNumericPoll(pollId) {
  const settings = useLiveSettings();
  const [values, setValues] = useState([]);
  const { answer: myValue, confirm: confirmValue, send: sendValue } = useOwnAnswer();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!LIVE_SERVER) return undefined;
    let cancelled = false;
    postJson(`numeric-poll/${pollId}/init`, { voterId: voterId() })
      .then((state) => {
        if (cancelled) return;
        setValues(state.values);
        confirmValue(state.myValue);
        setReady(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pollId, confirmValue]);

  const connected = useEventStream(`numeric-poll/${pollId}/stream`, (message) => {
    setValues(message.values);
    if (message.event === 'reset') confirmValue(null);
  }, ready);

  const votingOpen = settings?.votingOpen ?? false;

  const submit = useCallback((value) => {
    if (!LIVE_SERVER || !votingOpen) return Promise.resolve(false);
    return sendValue(value, async () => {
      const state = await postJson(`numeric-poll/${pollId}/submit`, { value, voterId: voterId() });
      return state.myValue;
    });
  }, [pollId, votingOpen, sendValue]);

  return { values, myValue, connected, votingOpen, submit };
}

/**
 * Clear the votes of the poll with `pollId` (choice or numeric). Presenter
 * only; resolves to whether the server reset anything.
 */
export async function resetPoll(pollId, token) {
  if (!LIVE_SERVER) return false;
  try {
    await postJson(`polls/${pollId}/reset`, {}, token);
    return true;
  } catch {
    return false;
  }
}
