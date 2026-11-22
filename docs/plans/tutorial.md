# The tutorial: a deck you learn by editing

[Latest status and resume point](../tracking/tutorial.md) ·
[Getting started](../guides/getting-started.md) ·
[Presentation types](../style/presentation-types.md)

A presentation that introduces a new user to the template by having them
change it. Each task slide names a file and an edit; when the edit is
saved, the page reloads and the slide marks its own task done. Done means:
a person with a fresh clone runs one command, goes through the deck in
about twenty minutes with an editor beside it, and at the end has edited
text, added a build step, a picture, and a slide, restyled the deck, and
knows how to check, present, and ask an agent for the rest.

## Immediate todos

### Done

- **Type, storyboard.** Below.
- **A presentation named by its directory.** `selectPresentations` takes
  `./tutorial` as well as an id, so every command works on a deck outside
  `presentations/`; `npm run tutorial` serves this one.
- **The deck**, built to the storyboard, with the `task` layout.
- **Checks**: unit tests of the task checks, and that the edit each task
  asks for is the edit its check sees; a browser test that every slide and
  step loads and every task shows its panel. The deck was also taken for
  real, each edit made on disk with the page open (the tracker has the
  run), and one task was done by an agent from the sentence on its slide.
- **A typing mistake names itself.** A slide file with a missing comma
  left the page blank; the client now parses the files itself and the
  error page names the file, the line, and the column.
- **Documentation**: the README's quick start and "Hosting the tutorial",
  getting started, the presentation types, the structure blocks.

### Open

1. **A person takes it.** Somebody who has not seen the template goes
   through the deck with nothing but the README. Gate: they finish every
   task without help; what stopped them is fixed in the deck.
2. **The storyboard, read by the user.** The deck was built in the same
   session as its storyboard, at the user's direction to create it; the
   rows are here to be commented on, and the slides change with them.

## Rules

- The tutorial lives in `tutorial/`, not under `presentations/`: it is not
  a project's deck, a project branch does not delete it, the live gateway
  does not serve it, and `npm run check` without arguments does not
  include it. It is available on every branch.
- It needs no asset store and no media in git. The one picture it shows is
  the one the reader adds.
- A reader's edits are theirs to throw away: `git restore tutorial`
  returns it to the start. Nothing in the deck asks for a commit.
- Every task can be checked from the slide's own data, or says plainly
  that it cannot tick itself. A task never claims to be done by a timer.
- The deck teaches the commands and files of this repository as they are;
  a command it shows is covered by the repository test that checks
  documented commands.
- Slides follow [slide style](../style/slides.md): one message per slide,
  a title that names the topic, a subtitle that states the point.

## Type

An **example**, in the glossary's sense (nobody presents it; it documents
the template), made hands-on: the reader drives it alone, at their own
computer, with the development server running, because the edits must
reload the page. Its notes are examples of notes and hold a hint for each
task. It is served locally (`npm run tutorial`); a static build shows the
slides to someone who only wants to look, without the editing.

## Storyboard

The deck goes: what you are looking at; changing a slide's text; steps,
pictures, and a slide of your own; making the deck look like yours;
checking and presenting; where to go next.

| # | Slide (title) | Steps: what appears | Source | Status |
|---|---|---|---|---|
|   | **Start here** | | | |
| 1 | Learn the template by editing this deck | the title | `title` layout | drafted |
| 2 | This deck is a folder of text files | (1) the four files that make a slide; (2) how a task slide works: edit, save, the page reloads and the task ticks | `content` layout | drafted |
|   | **Edit a slide** | | | |
| 3 | (outline) | the sections, this one active | `outline` layout | drafted |
| 4 | Change this title | the task panel: the file, what to change; ticks when the title differs | `task` layout, check on `title` | drafted |
| 5 | Add a point of your own | two bullets and the task; ticks when there are three | `task` layout, check on `bullets` | drafted |
| 6 | Math goes between dollar signs | the task: put a formula in the subtitle; ticks when the subtitle has one | `task` layout, check on `subtitle` | drafted |
| 7 | Notes are what you say | the task: press P, edit `notes.md`, watch the presenter window; cannot tick itself | `task` layout, no check | drafted |
|   | **Steps, pictures, slides** | | | |
| 8 | (outline) | the sections | `outline` layout | drafted |
| 9 | Build steps reveal a slide one click at a time | (1), (2), (3): three steps, the third with its own note | `progressiveBuild` layout | drafted |
| 10 | Give this slide a second step | the task; ticks when `buildSteps` has two entries; (2) a line that only the second step shows | `task` layout, check on `buildSteps` | drafted |
| 11 | Add a picture | the task: a file into `public/`, a `media` entry; shows the picture; ticks when the picture loads | `task` layout, check on `media` | drafted |
| 12 | Add a slide of your own | the task, with each text under the file it goes in: a new `content.json`, then its id in `presentation.json`; ticks when a section lists `my-slide` | `task` layout (`files`), check on the sections | drafted |
|   | **Make it yours** | | | |
| 13 | (outline) | the sections | `outline` layout | drafted |
| 14 | Change the colors | the task: uncomment a line of `theme.css`; the whole deck changes color; cannot tick itself | `task` layout, no check | drafted |
| 15 | A layout is a small React component | (1) what a layout is, with this panel as the example; (2) where it is registered | `content` layout | drafted |
|   | **Check and present** | | | |
| 16 | (outline) | the sections | `outline` layout | drafted |
| 17 | Check the deck before you show it | what the two commands look at; the task: run `npm run check -- ./tutorial` and `npm run capture -- ./tutorial`; cannot tick itself | `task` layout, no check | drafted |
| 18 | Present it | the keys, the presenter window, a build; the task: build this deck and serve the build, with `--host` for a tablet; cannot tick itself | `task` layout, no check | drafted |
| 19 | Ask an agent for the rest | the six skills, each with what to say | `content` layout | drafted |
| 20 | Now make your own | the three commands that start a project | `title` layout | drafted |

## Design as built

- **A deck by its directory** (`core/tooling/presentations.js`): an
  argument with a path separator or a leading dot names a directory with a
  `presentation.json`; its id is the directory's name. `npm run tutorial`
  is `node scripts/dev.mjs ./tutorial`; the other commands take
  `./tutorial` the same way (`npm run capture -- ./tutorial`).
- **The `task` layout** (`tutorial/layouts/TaskSlide/`): the slide's own
  content on the left (title, bullets, media, the line a second step
  shows), and on the right a panel with the task, the file to open, the
  text to look for or paste, and its state. `taskChecks.js` decides the
  state from the slide's data alone: a field that differs from its
  starting value, a list longer than it started, a string that contains
  something, a slide id that a section lists. A task without a check shows
  "Try it" and never claims to be done.
- **Reloading**: saving a `content.json` reloads the page, which returns to
  the same slide (the position is kept per browser tab), so the tick
  appears where the reader is looking.

## Completion criteria

- From a fresh clone, `npm install` and `npm run tutorial` open the deck,
  and every task can be done and is marked done by its edit.
- `npm test` covers the checks; `npm run test:ui` loads every slide and
  step of the tutorial without an error.
- The README says how to open it, and how to show it to someone else.
- A person new to the template has taken it and finished.
