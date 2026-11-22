# The second tutorial: building a deck with an agent

[Latest status and resume point](../tracking/tutorial-agents.md) ·
[The first tutorial's plan](tutorial.md) ·
[The skills](../guides/skills.md)

A second hands-on deck, for the reader who has taken the first tutorial and
now wants to work the way the template is meant to be used: by asking a
coding agent. Each task slide gives a prompt; the reader says it to an
agent working in the repository; the agent changes this deck; the page
reloads and the slide marks its task done from the deck's own data. Done
means: a reader finishes it having used the skills, had an agent write a
WebGL layout, added a poll and seen two browsers stay in step through the
live server, and knowing what a good prompt for this repository contains.

Nothing is built. The storyboard below is for the user to read first.

## Immediate todos

### Done

- **Type, storyboard.** Below, awaiting the user's read.

### Open

1. **The user reads the storyboard** and the three decisions under it.
   Gate: a yes, or corrections, quoted in the tracker.
2. **The `task` layout in core.** Two decks will use it, so it moves from
   `tutorial/layouts/TaskSlide/` to `core/client/layouts/`, with a slide in
   the test fixture and a row in the layouts document, and gains the two
   checks this deck needs (a section that is listed; a slide that uses a
   named layout). Gate: `npm run test:ui`; the first tutorial unchanged in
   a capture.
3. **Sections 1 to 3** (how it works, skills, a new layout by prompt), built
   and taken for real: each prompt given to an agent in a clean clone, the
   slide's state before and after. Gate: every task of these sections is
   done by its prompt alone, on two different models.
4. **Sections 4 to 6** (the live server, reviewing and media, prompts that
   work), the same way. The live tasks are checked with two browsers.
5. **Documentation**: the README's tutorial section (two decks, in order),
   getting started, the skills guide's pointers.
6. **A person takes it** with nothing but the README and an agent.

## Rules

- As for the first tutorial: outside `presentations/`, on every branch, no
  media in git, a reader's changes thrown away with `git restore` and
  `git clean -fdx`.
- A task is a prompt, written out in full on the slide, that works when it
  is pasted as it stands. It names this deck and the slide or section it
  concerns, and says what "done" looks like.
- A task is checked from the deck's data, or says that it cannot tick
  itself. What an agent *said* is never the check.
- The deck asks an agent only for changes inside the deck's own directory.
  It never has an agent push, deploy, upload, or touch another
  presentation.
- Every prompt is tried on a clean clone before it is put on a slide, and
  again whenever the skills or the agent files change. A prompt that works
  only for the session that wrote it is not a tutorial.
- The live-server tasks use the example presentation, which the gateway
  serves; this deck is not under `presentations/` and is not served by it.

## Type

An **example**, hands-on, like the first tutorial: the reader drives it
alone, with the development server and an agent's session open side by
side. About forty minutes. Its notes hold a hint for each task and what to
say if the agent's first attempt misses.

## Storyboard

The deck goes: how the two windows work together; the skills, used on this
deck; something the template does not have, asked for in a sentence; a deck
that several browsers share; review and media; what makes a prompt work.

| # | Slide (title) | Steps: what appears | Source | Status |
|---|---|---|---|---|
|   | **Two windows** | | | |
| 1 | Build a deck by asking | the title | `title` layout | planned |
| 2 | An agent reads the same files you edited | (1) this deck's folder; (2) the agent's instructions, `CLAUDE.md`, and what they hold; (3) the loop: you say, it edits, the page reloads, the slide ticks | `progressiveBuild` | planned |
| 3 | Say this first | task: "What is this repository, and which skills does it give you?"; cannot tick itself; what a good answer contains | `task`, no check | planned |
|   | **The skills, on this deck** | | | |
| 4 | (outline) | the sections | `outline` | planned |
| 5 | A plan before slides | task: the `start-presentation` prompt for a three-slide section on a topic of the reader's; ticks when a section `mine` is listed | `task`, check on the sections | planned |
| 6 | Read the storyboard, then say yes | (1) where the agent put the plan and what a storyboard row holds; (2) how to correct it in words; task: "build it"; ticks when section `mine` has three slides | `task`, check on the section's length | planned |
| 7 | This title is far too long to fit on one line of a slide and the capture will say so | task: "Validate the slides of this deck and fix what you find"; the capture reports `title-wraps`; ticks when the title has changed | `task`, check on `title`; a flaw planted on purpose | planned |
| 8 | What the agent brought back | (1) the run's folder and its contact sheet; (2) which findings it fixed and which it brought to you, and why wording is yours | `progressiveBuild` | planned |
|   | **Something new, by prompt** | | | |
| 9 | (outline) | the sections | `outline` | planned |
| 10 | A layout the template does not have | (1) a layout is a React component; (2) the widgets a layout can use: a canvas at the stage's scale, a step clock, `three` for WebGL; (3) the rules the agent already follows for one (clean up, one still frame for the capture) | `progressiveBuild` | planned |
| 11 | Ask for a WebGL scene | task: the prompt for a layout `spinningShape` that draws a lit, rotating shape with `three`, on a new slide `webgl`; ticks when a slide `webgl` is listed and uses that layout | `task`, check on a slide's layout | planned |
| 12 | Make it yours in one more sentence | task: "make the second step stop the rotation and show a label"; ticks when the slide `webgl` has two build steps | `task`, check on another slide's `buildSteps` | planned |
| 13 | What to ask for when it is wrong | three prompts that fix the usual misses: it animates in the capture; it leaks when you leave the slide; it is blurry on a large screen | `content` | planned |
|   | **One deck, many browsers** | | | |
| 14 | (outline) | the sections | `outline` | planned |
| 15 | Local mode, and the live server | (1) what local mode cannot do; (2) the gateway: every presentation at its own address, a presenter login, votes kept on the server | `progressiveBuild` | planned |
| 16 | Start the live server | task: the prompt that has the agent make `.env` from the example with a password it tells you, and start `npm run serve`; then open the example's address in two windows; cannot tick itself | `task`, no check | planned |
| 17 | Vote in one window, watch the other | the two windows side by side: the poll slide and its results; what the server keeps, and why a reload cannot vote twice | `content`, with a screenshot made for it | planned |
| 18 | Everyone on your slide | task: the prompt that sets `PRESENTER_CONTROLLED` and restarts; log in as presenter in one window and move; the other follows; cannot tick itself | `task`, no check | planned |
| 19 | Add a poll to this deck | task: the prompt for a poll slide `my-poll` and its results slide, sharing an id and options; ticks when both are listed | `task`, check on the sections | planned |
| 20 | Putting it on the internet | what a deployment needs (a build command, a start command, a password, a disk for votes), and the prompt that prepares one; said, not done: a deployment is yours to start | `content` | planned |
|   | **Review, media, video** | | | |
| 21 | (outline) | the sections | `outline` | planned |
| 22 | Watch it change on a tablet | task: "I'll watch on my iPad"; what the agent does; a marked-up screenshot as feedback; cannot tick itself | `task`, no check | planned |
| 23 | Media that are not in git | (1) the asset store in one picture; (2) the prompt that sets up a folder store and pushes this deck's picture; (3) what the agent will not do: look for your tokens | `progressiveBuild` | planned |
| 24 | A video of the deck | task: "Record a run-through of this deck"; where the file is; the narrated version in one line; cannot tick itself | `task`, no check | planned |
|   | **Prompts that work** | | | |
| 25 | What a good prompt names | the deck and the slide by id; what each key press shows; what must not change; the check you want run | `content` | planned |
| 26 | What the agent keeps for you | (1) your directions, quoted and dated, in the tracker; (2) the storyboard, kept in step with the slides; (3) why a new session picks up where the last one stopped | `progressiveBuild` | planned |
| 27 | Now build your talk | the prompt that starts a real project | `title` | planned |

## Decisions for the user

1. **Where it lives and what it is called.** Proposed: `tutorial-agents/`,
   opened with `npm run tutorial:agents`, beside `tutorial/`. The
   alternative is to gather both under `tutorials/` (`tutorials/basics`,
   `tutorials/agents`), which renames the first deck's folder and command.
2. **A flaw planted on purpose** (row 7). The deck would ship with a title
   that wraps, so that the validation task finds something real; its
   capture then reports one warning by design. The alternative is a task
   that validates a clean deck and has nothing to find.
3. **The live server's tasks use the example deck** (rows 16 to 18),
   because the gateway serves only `presentations/`. That holds on `main`
   and on any branch that kept the example; on a project branch the reader
   uses one of the project's own presentations, and the slides say so.

## Completion criteria

- From a fresh clone, with an agent's session open in it, every task of the
  deck is done by pasting its prompt, on two models, and is marked done by
  the deck.
- `npm run test:ui` loads every slide and step; the task checks have unit
  tests.
- The README lists the two tutorials in order and says how to open each.
- A person new to the template has taken it and finished.
