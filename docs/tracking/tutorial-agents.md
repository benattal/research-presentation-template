# The second tutorial: tracking

[Plan](../plans/tutorial-agents.md)

Current state: the deck is built, 27 slides in `presentations/tutorial-agents/`,
and served with `npm run tutorial:agents`. Every prompt that changes the
deck was given once to a fresh agent in a clean clone and ticked its slide.
Open: a second model, the live tasks by hand, a person, the user's review
of the slides. Resume from the newest entry below.

## Standing directions

Every direction the user gives about this work, quoted and dated.

2026-11-22:

- "tutorial-agents sounds good. Can you host it so that I can look at it?"
- "Yes a planted flaw sounds good. You can put the tutorial presentations
  under presentations/ as well"
- "The tutorial deck is nice. It would be nice if you added a new tutorial
  deck with more depth on agentic features, such as skills to use,
  prompting to add web-gl, hosting a deck on a server/syncing content
  between clients, other cool features"

## 2026-11-22 19:35 — built, hosted for the user, its prompts tried on a fresh agent

User directions (2026-11-22): the two quoted first above. Read as: the name
and the planted flaw are approved, the deck is to be built and served for
the user to look at, and both tutorials live under `presentations/`.

- Built: 27 slides in six sections, to the storyboard, with notes that hold
  a hint for each task. Nine task slides; five tick from the deck's data
  and four say that they cannot.
- Three changes from the storyboard the user read, each in the plan:
  the storyboard task cannot tick itself (a storyboard is not in the deck);
  the poll is added before the votes are explained; the live tasks use
  this deck, which the gateway now serves.
- Framework: the `task` layout is a core layout
  (`core/client/layouts/TaskSlide/`), with `prompt` and a copy button,
  checks on another slide and on a section, and the deck's directory from
  a build constant (`directoryOf`, `__PRESENTATION_DIR__`). Layouts are
  given `slides`. A path in a task's text may break after a slash: with
  the deck's longer directory, one line of the first tutorial ran 67 px
  past its box.
- Moved: `tutorial/` to `presentations/tutorial/`; `npm run tutorial`
  names it by its id; `npm run tutorial:agents` serves this deck. The
  documents, the agent files, and the first tutorial's slides that named
  the old place were changed with it.
- The prompts, tried: a clean clone of the branch, `npm ci`, and for each
  task that changes the deck a headless session (`claude -p`, the model
  `haiku`, edits accepted, `npm run` and `node` allowed) given the prompt
  exactly as its slide has it; the build and the second-step prompts in
  the session of the prompt before them. After each, the slide's own
  check on the clone's files, and `npm run check`:

  | Slide | Before | After | Minutes | `npm run check` |
  |---|---|---|---|---|
  | `task-plan` | manual | manual | 0.6 | ok |
  | `task-build` | todo | done | 1.8 | ok |
  | `task-validate` | todo | done | 1.7 | ok |
  | `task-webgl` | todo | done | 4.4 | ok |
  | `task-webgl-step` | todo | done | 2.4 | ok |
  | `task-poll` | todo | done | 1.9 | ok |

  The clone's capture after the last prompt: 58 frames, 0 errors, 0 warnings (the planted title had been shortened by then).
  One prompt changed after its run: the build prompt now names the deck
  ("in the deck tutorial-agents"); it is to be tried again with the
  second model.

  What the sessions did that the slides now say: the storyboard went into
  this deck's plan, with an entry in this tracker (the plan has a section
  on it); the validation shortened the title because the prompt gave
  leave, and proposed rewording the subtitle, which is why the slide's
  texts no longer call the flaw present; the WebGL layout was written in
  the deck's `layouts/`, registered, captured, and its frame read.
- Checked: `npm run check` (three decks); `npm test`, 107; `npm run test:ui`,
  50 of 50, with both tutorials and the gateway serving this one; captures
  of both tutorials: the first clean, this one with its one planted
  warning; the frames of thirteen slides read.
- Served for the user at port 5175 with `--host`.
- Broken by the merge, and mended: merging `main` into `gen-nlos-explainer`
  in the main checkout left the explainer's page blank for about three
  minutes. Its development server, started before the merge, did not have
  the new build constant `__PRESENTATION_DIR__`, which the task layout
  reads when the layouts load. Found by opening the page in a headless
  browser after the merge ("__PRESENTATION_DIR__ is not defined");
  restarting the server on the same port fixed it, and the page was
  opened again to confirm. The hosting document and the agent files now
  say to restart a running server after merging framework changes. The
  same merge had one conflict, in the comment of
  `core/client/stage/SlideFrame.jsx`, which that branch had changed for
  its credit lines; both sides' sentences were kept.
- Not done: a second model for the prompts (the plan's gate asks for two);
  the three live tasks and the tablet and video tasks, which need a person
  at two browser windows or a device; a person taking the deck.
- A consequence to decide on: with the tutorials under `presentations/`, a
  branch's live gateway lists them beside its own decks. `vision-workshop`
  is deployed; it has not been merged, so its site is unchanged.
- Next: the user's review of the slides; then the plan's open todos.

## 2026-11-22 18:30 — storyboard written, for the user to read

- Done: `docs/plans/tutorial-agents.md`: the type, the rules, a storyboard
  in six sections, and three decisions (the deck's place and command; a
  flaw planted for the validation task; the live tasks on the example
  deck).
- Not started, by the repository's rule that the user reads a storyboard
  before slides are built.
- Next: the user's read.
