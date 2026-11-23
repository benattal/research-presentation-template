# The second tutorial: building a deck with an agent

[Latest status and resume point](../tracking/tutorial-agents.md) ·
[The first tutorial's plan](tutorial.md) ·
[The skills](../guides/skills.md)

A second hands-on deck, `presentations/tutorial-agents/`, for the reader
who has taken the first tutorial and now wants to work the way the
template is meant to be used: by asking a coding agent. Each task slide
gives a prompt; the reader says it to an agent working in the repository;
the agent changes this deck; the page reloads and the slide marks its task
done from the deck's own data. Done means: a reader finishes it having
used the skills, had an agent write a WebGL layout, added a poll and seen
two browsers stay in step through the live server, and knowing what a good
prompt for this repository contains.

## Immediate todos

### Done

- **Type, storyboard**, read by the user, who settled its three decisions
  (below).
- **The `task` layout in core** (`core/client/layouts/TaskSlide/`): two
  decks use it. It gained `prompt` (the words to say, with a button that
  copies them), checks on another slide and on a section, and the deck's
  directory from a build constant. Layouts are also given `slides`.
- **Both tutorials under `presentations/`**, at the user's direction; the
  first moved from `tutorial/`.
- **The deck**, 27 slides in six sections, built to the storyboard, with
  notes that hold a hint for each task.
- **Tests**: unit tests of every kind of check and that each task's check
  is satisfied by the change it asks for; a browser test that every slide
  and step of both decks loads, and that the gateway serves this one.
- **Documentation**: the README's "The tutorials", getting started, the
  agent files, the layouts and testing documents, each deck's README.

### Open

1. **The prompts, tried for real.** Each prompt that changes the deck is
   given as it stands to a fresh agent session in a clean clone, and the
   slide's check is run afterwards. Gate: every such prompt ticks its
   slide on two models. The tracker has the runs so far.
2. **The live tasks, taken by hand**: the server started by the prompt on
   the slide, two browser windows, a vote in each, follow-the-presenter.
3. **A person takes it** with nothing but the README and an agent.
4. **The user's review** of the slides as built.

## Rules

- As for the first tutorial: on every branch, no media in git, a reader's
  changes thrown away with `git restore` and `git clean -fdx`.
- A task is a prompt, written out in full on the slide, that works when it
  is pasted as it stands. It names this deck and the slide or section it
  concerns, and says what "done" looks like.
- A task is checked from the deck's data, or says that it cannot tick
  itself. What an agent *said* is never the check.
- The deck asks an agent only for changes inside the deck's own directory,
  and for `.env` in the live section. It never has an agent push, deploy,
  upload, or touch another presentation.
- No password is asked of the agent or left to it to choose: the prompt
  gives a throwaway one, and the notes say to type a real one into `.env`
  by hand.
- Every prompt is tried on a clean clone before it is put on a slide, and
  again whenever the skills or the agent files change. A prompt that works
  only for the session that wrote it is not a tutorial.
- The deck ships with one flaw on purpose, the title that wraps on
  `task-validate`: its capture reports that one warning and no other.

## Type

An **example**, hands-on, like the first tutorial: the reader drives it
alone, with the development server and an agent's session open side by
side. About forty minutes. Its notes hold a hint for each task and what to
say if the agent's first attempt misses.

## Storyboard

The deck goes: how the two windows work together; the skills, used on this
deck; something the template does not have, asked for in a sentence; a deck
that several browsers share; review and media; what makes a prompt work.

| # | Slide (id: title) | Steps: what appears | Source | Status |
|---|---|---|---|---|
|   | **Two windows** | | | |
| 1 | `welcome`: Build a deck by asking | the title | `title` layout | drafted |
| 2 | `how-it-works`: An agent reads the same files you edited | (1) this deck's folder; (2) the agent's instructions and skills; (3) the loop: you say, it edits, the page reloads, the slide ticks; (4) the two windows | `progressiveBuild` | drafted |
| 3 | `task-first`: Say this first | task: "What is this repository for, and which skills does it give you?"; what a good answer contains; cannot tick itself | `task`, no check | drafted |
|   | **The skills, on this deck** | | | |
| 4 | `outline-skills` | the sections | `outline` | drafted |
| 5 | `task-plan`: A plan before slides | task: ask for a section `mine` of three slides, storyboard first; cannot tick itself, because a storyboard is not in the deck | `task`, no check | drafted |
| 6 | `task-build`: Read the storyboard, then say yes | task: "build it", placed after this section; ticks when a section `mine` lists three slides | `task`, check on a section's length | drafted |
| 7 | `task-validate`: This title is far too long... | task: validate and fix, with leave to shorten a title; the capture reports `title-wraps`; ticks when the title has changed | `task`, check on `title`; the planted flaw | drafted |
| 8 | `what-came-back`: What the agent brought back | (1) the run's folder and contact sheet; (2) what it fixed without asking; (3) what it asked: wording; (4) your part: look | `progressiveBuild` | drafted |
|   | **Something new, by prompt** | | | |
| 9 | `outline-new` | the sections | `outline` | drafted |
| 10 | `a-layout`: A layout the template does not have | (1) a layout is a component; (2) what it can draw, three.js included; (3) the rules; (4) so you ask | `progressiveBuild` | drafted |
| 11 | `task-webgl`: Ask for a WebGL scene | task: a layout `spinningShape` and a slide `webgl` after this one; ticks when `webgl` uses that layout | `task`, check on another slide's layout | drafted |
| 12 | `task-webgl-step`: Change it with one more sentence | task: a second build step that stops the rotation and shows a label; ticks when `webgl` has two build steps | `task`, check on another slide's `buildSteps` | drafted |
| 13 | `when-wrong`: What to say when it is not right | the sentence for each usual miss: moves in the capture, keeps running, blurry, simply wrong (a marked-up screenshot) | `content` | drafted |
|   | **One deck, many browsers** | | | |
| 14 | `outline-live` | the sections | `outline` | drafted |
| 15 | `two-modes`: Local mode, and the live server | (1) local mode; (2) what it cannot do; (3) the gateway; (4) `.env` | `progressiveBuild` | drafted |
| 16 | `task-serve`: Start the live server | task: `.env` from the example with a throwaway password, `npm run serve`, the deck's address in two windows; cannot tick itself | `task`, no check | drafted |
| 17 | `task-poll`: Add a poll to this deck | task: a poll slide `my-poll` and its results slide after this one; ticks when both are listed; then vote in both windows | `task`, check on two listed slides | drafted |
| 18 | `votes`: What the server keeps | one vote per browser, live results, saved votes, C to clear | `content` | drafted |
| 19 | `task-follow`: Everyone on your slide | task: `PRESENTER_CONTROLLED` and a restart; log in as presenter in one window, the other follows; cannot tick itself | `task`, no check | drafted |
| 20 | `deploy`: Putting it on the internet | what a deployment needs; what an agent prepares; publishing is the reader's | `content` | drafted |
|   | **Review, media, video** | | | |
| 21 | `outline-review` | the sections | `outline` | drafted |
| 22 | `task-tablet`: Watch it change on a tablet | task: "I'll watch on my iPad"; `?review`; a marked-up screenshot; cannot tick itself | `task`, no check | drafted |
| 23 | `media`: Pictures and videos are not in git | (1) why a store; (2) in a deck; (3) what to ask; (4) what the agent will not do with tokens | `progressiveBuild` | drafted |
| 24 | `task-video`: A video of the deck | task: a silent run-through; the narrated version in a line; cannot tick itself | `task`, no check | drafted |
|   | **Prompts that work** | | | |
| 25 | `good-prompt`: What a good prompt names | the deck and slide by id; each key press; what must not change; the check; what done looks like | `content` | drafted |
| 26 | `what-it-keeps`: What the agent keeps for you | (1) your directions in the tracker; (2) the storyboard; (3) a new session continues | `progressiveBuild` | drafted |
| 27 | `closing`: Now build your talk | the sentence that starts a real project | `title` | drafted |

Changes from the storyboard the user read: the plan task (5) cannot tick
itself, since a storyboard is not in the deck and the repository forbids a
placeholder section; the poll is added before the votes are explained, so
that there is something to vote on (17, 18); the live tasks use this deck
itself, which the gateway serves now that the deck is under
`presentations/`.

## Decisions, settled by the user (2026-11-22)

1. **Its name**: `tutorial-agents`, opened with `npm run tutorial:agents`.
2. **A flaw planted on purpose** (row 7): yes.
3. **Where the tutorials live**: under `presentations/`, both of them, so
   that the gateway serves them.

## A reader's section in this plan

The task `task-plan` has an agent write a storyboard for the reader's own
section. An agent following the repository's rules puts it in this file,
and an entry in the tracker. That is the exercise working, in the reader's
checkout: it is thrown away with `git restore docs/plans docs/tracking`,
and is not committed.

## Completion criteria

- From a fresh clone, with an agent's session open in it, every task of the
  deck is done by pasting its prompt, on two models, and is marked done by
  the deck.
- `npm run test:ui` loads every slide and step; the task checks have unit
  tests.
- The README lists the two tutorials in order and says how to open each.
- A person new to the template has taken it and finished.
