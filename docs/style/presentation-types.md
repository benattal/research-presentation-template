# Presentation types

A glossary of the kinds of presentation this repository holds. The
framework treats them alike (each is a directory of slides, notes, and
layouts), but they differ in who drives them, what the notes are for, how
long a build step lasts, and how a finished one is checked. Name the type
in a presentation's plan before its storyboard is written: most
disagreements about a slide come from two people assuming different types.

The terms used below: a *build step* is one key press within a slide; the
*notes* are a slide's `notes.md` and `notes-<step>.md`; *local mode* serves
one presentation without a server, and *live mode* adds presenter login,
polls, and follow-the-presenter ([hosting](../implementation/hosting.md)).

## The types at a glance

| Type | Driven by | Length | Notes are | Hosting | Delivered as |
|---|---|---|---|---|---|
| Lecture | a speaker, live | 45 to 90 min | what the speaker says | local | the deck, presented |
| Research talk | a speaker, live | 10 to 25 min | what the speaker says | local | the deck, presented |
| Interactive workshop | a speaker; the audience follows on their own screens | 1 to 3 h | prompts for the speaker | live | the deployed site |
| Explainer video | a recording; nobody presents | 3 to 5 min | the narration, word for word | local | a video file |
| Example | nobody: it documents the framework | — | examples of notes | local | part of the template |

## Lecture

A taught session: a speaker derives or explains a subject for people who
are there to learn it.

- **Structure** follows the derivation or the syllabus, with a recap where
  a section ends. One idea per slide; more slides beat denser ones.
- **Build steps** pace an argument: each press adds the idea the speaker is
  about to talk about, and an equation can be a question before its answer.
  A step lasts as long as the speaker needs.
- **Notes** carry the explanation the slide leaves out: the transition, the
  sentence to remember, the answer to the question the slide invites.
- **Visuals** are often interactive (a slider, a demo computed in the
  browser), because the speaker can dwell on them.
- **Checked by** the [slide review checklist](slide-review.md), a capture,
  and driving every control in a browser.
- **In this repository:** `light-transport-and-neural-rendering` on branch
  `guest-lecture`.

## Research talk

A talk about one piece of work, to an audience of peers, at a venue with a
fixed slot.

- **Structure:** for each section, a title slide, the challenge (the broad
  problem, then the specific one), prior work in the same order, the slides
  that build the approach, then results ([slide style](slides.md), "One
  message per slide"). The main result appears early.
- **Build steps** as in a lecture, but fewer per slide: the slot is short.
- **Notes** are what the speaker says, written to time.
- **Visuals** are the work's own results; borrowed figures are redrawn and
  credited.
- **Checked by** the checklist, a capture, and a timed run-through.

## Interactive workshop

A session in which the audience does something: answers polls, runs a
notebook, follows the presenter's slides on their own devices.

- **Structure** alternates explanation and activity.
- **Build steps** as in a lecture. Poll slides come in pairs (the vote and
  its results) that share a `pollId`.
- **Notes** are prompts for the presenter: what to ask, how long to wait.
- **Hosting** is live mode: the gateway serves several presentations, the
  presenter logs in, and the audience's browsers follow the presenter when
  the server says so. A landing presentation can be served at the root.
- **Checked by** the checklist, a capture, and the browser tests of the
  live features (`npm run test:ui`).
- **In this repository:** the four workshops and their landing page on
  branch `vision-workshop`.

## Explainer video

A short narrated video, recorded from the deck, that stands on its own:
supplemental material for a paper, a project page, a teaser. Nobody
presents it, so the deck is a film's storyboard more than a talk.

- **Structure:** the problem and the result within the first minute, then
  how it works, then the evidence. It shows what a document cannot (motion,
  light propagating, a camera moving through a scene) and does not repeat
  tables.
- **Build steps** are narration beats: one sentence or two per step, and
  every step changes the screen. A step lasts exactly as long as its
  narration, so its motion is timed to the words
  ([slide style](slides.md), "Notes").
- **Notes** are the narration, word for word, one file per build step,
  each a complete sentence or more, since a voice reads each step on its
  own. They follow the source's wording (the paper's terms).
- **Visuals:** looping result videos (one stitched file per slide),
  animations driven by the step clock so a recording reproduces them, and
  no interactive controls, since nobody is there to use them.
- **Also decided up front:** the length in minutes and words; whether it
  must be anonymous (no names, logos, or people; no metadata in the file);
  whether the script is confidential (then narration is synthesized
  locally).
- **Checked by** the checklist; a capture; the animations vetted frame by
  frame; and a recorded run-through, silent first and then with the
  narration, which is the only test of the whole
  ([narrated video workflow](../workflows/narrated-video.md)).
- **In this repository:** `gen-nlos-explainer` on branch
  `gen-nlos-explainer`.

## Example

The template's own presentation, `presentations/example/` on `main`: one
slide per core layout and convention. It is the target of the template's
checks, captures, and browser tests, and is not presented. A project branch
deletes it.

The tutorial, `tutorial/`, is a second deck of this type, made hands-on:
its reader drives it alone, with the development server running, and
completes it by editing it ([its plan](../plans/tutorial.md)). It is
outside `presentations/`, stays on every branch, and is served with
`npm run tutorial`.

## Choosing, and mixing

A deck has one type. A lecture that will also be published as a video is
two presentations that share slides' media and layouts, because their
notes, step timing, and controls differ. When a project needs both, build
the live one first: its slides are the storyboard of the recorded one.
