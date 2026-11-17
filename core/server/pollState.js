/**
 * The votes of one presentation's polls.
 *
 * Every vote is stored against the voter id the browser sends, so the
 * server alone decides what a browser's current vote is: changing a vote
 * replaces it, a reload cannot vote twice, and a reset is seen by every
 * browser. Counts are derived from the votes, never stored.
 *
 * Choice polls: `{ options: string[], votes: { [voterId]: optionIndex } }`.
 * Numeric polls: `{ values: { [voterId]: number } }`.
 */

function sameOptions(a, b) {
  return a.length === b.length && a.every((option, i) => option === b[i]);
}

function countVotes(poll) {
  const counts = poll.options.map(() => 0);
  for (const optionIndex of Object.values(poll.votes)) counts[optionIndex] += 1;
  return counts;
}

/**
 * @param {object} saved  a previous `snapshot()`, or `{}`
 * @param {() => void} onChange  called after every change, to persist the snapshot
 */
export function createPollState(saved, onChange) {
  const choicePolls = new Map(Object.entries(saved.choicePolls ?? {}));
  const numericPolls = new Map(Object.entries(saved.numericPolls ?? {}));

  function choiceView(pollId, voterId) {
    const poll = choicePolls.get(pollId);
    return { counts: countVotes(poll), myVote: poll.votes[voterId] ?? null };
  }

  function numericView(pollId, voterId) {
    const poll = numericPolls.get(pollId);
    return { values: Object.values(poll.values), myValue: poll.values[voterId] ?? null };
  }

  return {
    /**
     * Create a choice poll, or keep the existing one. A poll whose options
     * changed in the slide content starts over: its votes counted answers
     * that no longer exist.
     */
    initChoicePoll(pollId, options, voterId) {
      const existing = choicePolls.get(pollId);
      if (!existing || !sameOptions(existing.options, options)) {
        choicePolls.set(pollId, { options: [...options], votes: {} });
        onChange();
      }
      return choiceView(pollId, voterId);
    },

    hasChoicePoll: (pollId) => choicePolls.has(pollId),

    /** Record a vote; returns the new view, or null for an invalid option. */
    voteChoicePoll(pollId, voterId, optionIndex) {
      const poll = choicePolls.get(pollId);
      if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) return null;
      poll.votes[voterId] = optionIndex;
      onChange();
      return choiceView(pollId, voterId);
    },

    choicePollCounts: (pollId) => countVotes(choicePolls.get(pollId)),

    choicePollView: choiceView,

    initNumericPoll(pollId, voterId) {
      if (!numericPolls.has(pollId)) {
        numericPolls.set(pollId, { values: {} });
        onChange();
      }
      return numericView(pollId, voterId);
    },

    hasNumericPoll: (pollId) => numericPolls.has(pollId),

    submitNumericPoll(pollId, voterId, value) {
      numericPolls.get(pollId).values[voterId] = value;
      onChange();
      return numericView(pollId, voterId);
    },

    numericPollValues: (pollId) => Object.values(numericPolls.get(pollId).values),

    /** Clear the votes of the poll(s) with this id; returns which kinds were reset. */
    reset(pollId) {
      const reset = { choice: false, numeric: false };
      if (choicePolls.has(pollId)) {
        choicePolls.get(pollId).votes = {};
        reset.choice = true;
      }
      if (numericPolls.has(pollId)) {
        numericPolls.get(pollId).values = {};
        reset.numeric = true;
      }
      if (reset.choice || reset.numeric) onChange();
      return reset;
    },

    snapshot() {
      return {
        choicePolls: Object.fromEntries(choicePolls),
        numericPolls: Object.fromEntries(numericPolls),
      };
    },
  };
}
