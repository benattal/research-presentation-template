# The second tutorial: build a deck by asking an agent

A deck you complete without editing anything yourself. Each task slide
gives words to say to a coding agent that is working in this repository
(Claude Code, or any agent that reads `AGENTS.md`); the agent changes this
deck, the page reloads, and the slide marks its task done from the deck's
own files. About forty minutes. Take [the first tutorial](../tutorial/README.md)
before it.

```bash
npm install
npm run tutorial:agents   # then open the address it prints
```

Open the agent's session at the top folder of the repository, beside the
browser. The deck covers: what the agent knows about the repository; a
section built from a storyboard you approve; a validation that finds a
flaw; a WebGL layout written from one request; a poll, the live server,
and two browsers kept in step; review on a tablet; the asset store; a
recorded video; and what a prompt that works contains.

Its capture reports one warning on purpose: the title that wraps on the
slide `task-validate`, which one of its tasks has the agent find and fix.

The section on the live server uses `npm run serve`. On a branch whose
instructions say not to use the live server, take that section on `main`.

## Assets

It has no media of its own and needs no asset store. A deck with media
fetches them from the store ([DATA.md](../../DATA.md)); for this one,
`npm run assets -- pull tutorial-agents` has nothing to fetch.

## Starting over

```bash
git restore presentations/tutorial-agents       # what the agent changed
git clean -fdx presentations/tutorial-agents    # the slides and layouts it added
git status                                      # what it wrote elsewhere: docs/plans, docs/tracking
```

The live-server task makes a file `.env` at the top of the repository,
which git ignores: delete it yourself when you are done.
