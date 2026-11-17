import { useCallback, useEffect, useState } from 'react';
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
 * A live multiple-choice poll.
 *
 * Returns `{ counts, totalVotes, myVote, connected, votingOpen, vote }`.
 * `counts[i]` is the number of votes for `options[i]`; `myVote` is this
 * browser's choice or `null`; `vote(i)` records or changes it and resolves
 * to whether the server accepted it. Without a live server, or while voting
 * is closed, the counts stay at zero and `vote` resolves to false.
 *
 * The server owns every vote. A reset by the presenter clears `myVote` in
 * every browser through the event stream, whether or not the poll slide is
 * on screen at the time.
 */
export function useChoicePoll(pollId, options) {
  const settings = useLiveSettings();
  const [counts, setCounts] = useState(() => options.map(() => 0));
  const [myVote, setMyVote] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!LIVE_SERVER) return undefined;
    let cancelled = false;
    postJson(`poll/${pollId}/init`, { options, voterId: voterId() })
      .then((state) => {
        if (cancelled) return;
        setCounts(state.counts);
        setMyVote(state.myVote);
        setReady(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // `options` comes from slide content and is a new array on every render;
    // keying on `pollId` initializes each poll once per mount.
  }, [pollId]);

  const connected = useEventStream(`poll/${pollId}/stream`, (message) => {
    setCounts(message.counts);
    if (message.event === 'reset') setMyVote(null);
  }, ready);

  const votingOpen = settings?.votingOpen ?? false;

  const vote = useCallback(async (optionIndex) => {
    if (!LIVE_SERVER || !votingOpen) return false;
    try {
      const state = await postJson(`poll/${pollId}/vote`, { optionIndex, voterId: voterId() });
      setCounts(state.counts);
      setMyVote(state.myVote);
      return true;
    } catch {
      return false;
    }
  }, [pollId, votingOpen]);

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
 * number. Without a live server, `values` stays empty and `submit`
 * resolves to false.
 */
export function useNumericPoll(pollId) {
  const settings = useLiveSettings();
  const [values, setValues] = useState([]);
  const [myValue, setMyValue] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!LIVE_SERVER) return undefined;
    let cancelled = false;
    postJson(`numeric-poll/${pollId}/init`, { voterId: voterId() })
      .then((state) => {
        if (cancelled) return;
        setValues(state.values);
        setMyValue(state.myValue);
        setReady(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pollId]);

  const connected = useEventStream(`numeric-poll/${pollId}/stream`, (message) => {
    setValues(message.values);
    if (message.event === 'reset') setMyValue(null);
  }, ready);

  const votingOpen = settings?.votingOpen ?? false;

  const submit = useCallback(async (value) => {
    if (!LIVE_SERVER || !votingOpen) return false;
    try {
      const state = await postJson(`numeric-poll/${pollId}/submit`, { value, voterId: voterId() });
      setValues(state.values);
      setMyValue(state.myValue);
      return true;
    } catch {
      return false;
    }
  }, [pollId, votingOpen]);

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
