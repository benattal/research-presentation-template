# Making a presentation

The procedure for taking a presentation from a request to a finished deck.
It applies to every [presentation type](../style/presentation-types.md);
a narrated video continues with the
[narrated video workflow](narrated-video.md). The procedure exists because
of what went wrong without it: a deck was once started as a skeleton of
placeholder slides, with narration and recording tools built before any
slide was good, and a day's work had to be thrown away.

## 1. Before any slide

1. **Name the type** and what follows from it: who drives the deck, its
   length, what the notes are, how it is hosted, what is delivered.
2. **Read everything the user gave** (reference decks, papers, result
   folders, websites) and write down, in the plan, what each is for. A
   reference deck sets structure and look; a results folder sets what can
   be shown. Do not substitute your own structure for a reference the user
   named.
3. **Open a plan and a tracker** (`docs/plans/<stem>.md`,
   `docs/tracking/<stem>.md`), on the project's own branch, in the main
   checkout. Quote every direction the user gives, dated, under "Standing
   directions" at the top of the tracker, when it is given.
4. **Write the storyboard** in the plan
   ([slide style](../style/slides.md#storyboard)): one row per slide with
   its title, what each key press shows, the source of each visual, and its
   status. The user reads it before slides are built.

## 2. A first draft of the whole deck

Build to the storyboard, one section at a time, each to a good draft before
it is shown. A slide enters `presentation.json` only when it loads; the
served deck is never a skeleton.

- Compose slides from result media and visuals drawn for them. A paper's
  figure is a source, not a slide.
- Keep each slide's media build reproducible: a script per slide or section
  under the presentation's `media/` directory
  ([presentation format](../implementation/presentations.md)).
- After each section: `npm run check`, `npm run capture -- <id>`, and every
  frame read against its storyboard row. Update the row in the same commit.
- Commit often. Once the user has said that this work is pushed, push git
  and the media together (`npm run assets -- push <id>`): a pushed slide
  whose media stayed on one machine shows a gap everywhere else.

Refinement waits until the whole deck is drafted, unless the user says
otherwise: a polished first section beside missing ones cannot be judged
as a deck.

## 3. Refinement cycles

Three or four times:

1. **Pass.** Fix what the last cycle found.
2. **Look.** Check, capture, read the frames.
3. **Vet the animations.** A capture shows one still per step. For every
   animated step, every looping video, and every pair of consecutive
   slides, look at a series of frames from the key press to the settled
   state, in a browser with the GPU, forward, backward, and with rapid
   presses ([slide review](../style/slide-review.md), "Process").
4. **Vet with reviewers who did not build it**, each with one question:
   content and clarity (would the audience follow; does each step show what
   is said); layout and consistency (type scale, grids, colors, labels);
   motion. Reviewers edit the presentation; they do not reword the source.
5. **Consolidate.** Merge the findings, check each against the user's
   directions (a direction outranks a reviewer), fix causes, and record in
   the tracker what was fixed, what was declined and why, and what is the
   user's to decide.
6. **Publish.** Commit; push git and media together, when the user has
   asked for pushes.

A cycle ends when its reviewers report nothing above cosmetic.

## Working with agents

- **A builder gets a written brief** and one layout or one slide: the goal,
  the user's words that bear on it, the files it owns, the sources, the
  checks to run, and what to report. Keep a shared brief of the deck's
  rules (look, steps, media, words) in a file and point every builder at
  it; update it when the rules change.
- **A builder works in a temporary git worktree** made for the task, with
  its own copy of the media (never a link), commits there, and reports; the
  lead reads the frames, merges, and removes the worktree
  ([working together](working-together.md)).
- **Reviewers are read-only** and see the deck fresh. Give them the user's
  directions and the storyboard, not your conclusions.
- **Do the small things yourself.** A text change, a constant, a token: an
  agent costs more than it saves.
- **Measure before arguing.** A report that a key is slow, a video is late,
  or two slides shift is settled by a probe in the browser (key press to
  painted frame, element positions, video times), not by reading code.

## What to tell the user, and when

Report at every decision point: what was found, what changed, what is
next. Say plainly what was not verified. When a collaborator's change
conflicts with something the user asked for, say so and leave both
decisions visible; do not pick one silently.

When work on a deck starts or resumes, ask once whether the user wants to
watch it while it is edited and send marked-up screenshots from a tablet
or phone ([reviewing a deck while it is edited](reviewing-on-a-tablet.md);
the `live-feedback` and `feedback-inbox` skills).
