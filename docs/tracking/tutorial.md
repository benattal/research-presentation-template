# The tutorial: tracking

[Plan](../plans/tutorial.md)

Current state: the deck is built to its storyboard, taken once for real by
a script that edits the files the way a reader would, and tested. Open: a
person who has not seen the template takes it; the user reads the
storyboard. Resume from the newest entry below.

## Standing directions

Every direction the user gives about this work, quoted and dated.

2026-11-22:

- "This is mostly for things in worked examples like "make the
  presentation and put your material in it""
- "I also do want to make sure that much of this (e.g. in the worked
  examples) can be automated just by prompting an agent to carry out these
  tasks. Is that possible/mentioned as an option?"
- The session's goal, third item: "-> Create a *presentation* introducing
  users to the framework worked example, and tell new users how to host
  it, so that they can look at it. This presentation might also be
  interactive in the sense that the users *need to go through* the worked
  example to edit it."

## 2026-11-22 18:30 — the browser suite in one clean run; two faults in the tests themselves

The session's goal check (2026-11-22) asked for a clean full run of the
browser suite, which the entry below did not have.

- Found: the suite's failures were of three kinds, none in the deck.
  - A server's first page load after a cold start. In a fresh worktree
    with empty dependency caches, the presenter suite failed in its setup
    (`page.goto` over 30 s) and every test in it was cancelled. Fixed in
    `tests/ui/harness.mjs`: `startLocal` and `startLive` request the page
    and every module it imports once before returning, so the bundling of
    dependencies happens in a suite's setup.
  - A race in `tests/ui/presenter.test.mjs`: after "Save" it waited for
    the edited text inside the notes box and then read the notes file. The
    editor sits inside that box and holds the text from the moment it is
    typed, so the wait returned at once and the file was read before the
    server wrote it. It now waits for the editor to close. The failed run
    left `tests/fixtures/ui-showcase/slides/title/notes.md` edited in the
    main checkout; it was restored with git.
  - Stalls of the machine of ten seconds and more (measured in the entry
    below), which neither fix removes.
- Checked: `npm run test:ui` in a worktree of `main` with
  `node_modules/.vite` deleted first (a fresh clone's state): 47 of 47 in
  180 s, in one run. The presenter suite alone from cleared caches: 5 of 5
  in 8.5 s.
- Next: a newcomer's run of the tutorial from a fresh clone, by an agent
  given only the README; then plan todos 1 and 2.

## 2026-11-22 17:30 — built, taken for real, tested

User direction (2026-11-22): the goal's third item, quoted above. The
repository asks for a storyboard that the user reads before slides are
built; the goal said to create the deck without stopping. The storyboard
was written first, in the plan, and the deck built to it in the same
session; the plan lists the user's reading of it as open.

- Decided: the tutorial is a new deck in `tutorial/`, not a change to
  `presentations/example/`. The example's slides are cited across the
  documents with measured output (narration error rates, capture runs),
  and a second deck under `presentations/` would have to be deleted by
  every project branch and would be served by the live gateway. A deck
  named by its directory needs neither.
- Done: `selectPresentations` takes a directory (`./tutorial`);
  `npm run tutorial`; `tutorial/` with 20 slides in five sections, nine of
  them tasks, its own `task` layout and `theme.css`; `/tutorial/public/`
  ignored.
- Taken for real (`npm run tutorial -- --port 5188`, a browser on it, each
  edit written to disk by a script):
  - `task-title`, `task-bullets`, `task-math`, `task-steps`: "To do" before
    the edit, "Done" after it, the page still on the same slide;
  - `task-picture`: with the line added and no file, still "To do" with a
    notice saying where the file goes; with the file there, "Done";
  - `task-new-slide`: "Done" once `my-slide` exists and is listed; the deck
    then has 21 slides and the new one shows;
  - `task-theme`: `--accent` goes from `#6c63ff` to `#ff7a59`; the slide
    stays "Try it", as designed.
- Found by that run, a defect of the framework and not of the deck: a
  slide file with a missing comma left a blank white page. The JSON import
  failed as a module (HTTP 500 for it), and Vite 8.3.8's error overlay
  threw while building itself (`… || err.id || "unknown file").split is
  not a function`), so nothing was shown. Fixed at the framework's own
  boundary: `core/client/presentation/load.js` imports the JSON files as
  text and `parseJsonFile` parses them, so the load-error screen lists
  "slides/task-title/content.json is not valid JSON: Expected ',' or '}'
  after property value in JSON at position 23 (line 3 column 3)", and
  `npm run check` prints the same line. Mending the file brings the deck
  back.
- Found by the first capture: the core layouts print Markdown marks as
  they are, so `` ` `` and `**` showed on the slides. The deck's text is
  plain; the `task` layout alone shows code between backticks.
- Found by `npm run check`: a sentence in a slide that read like a media
  path ("…slides/ with a content.json") was counted as a missing asset.
  Reworded; a task names its places with `@folder`, `@public`, and `@media`
  so that no slide spells out the path of a file that is not there.
- An agent does a task from the slide's sentence: `claude --model haiku -p
  "In the tutorial deck, add a third bullet to the slide task-bullets."`
  with only `Read`, `Edit`, `Write`, `Glob`, `Grep` allowed added the
  entry, which is the edit the slide's check sees. One task, one run.
- Hosting, each way the README gives: `npm run tutorial` (the banner
  names `tutorial`); `npm run build -- ./tutorial` writes `dist/tutorial/`;
  `npm run preview -- ./tutorial` answers; and the build served by a plain
  web server under `/people/me/tutorial/` shows the slides and moves
  (`2 / 20`, no error). Opening the build's `index.html` from the disk
  does not work (measured earlier for a build: the browser refuses its
  scripts), and the README says so.
- Checked, in the worktree on `guides` (framework as on `main`):
  - `npm test`: 99 of 99 (the task checks, `parseJsonFile`, the documents'
    commands and options, the skills' worked examples).
  - `npm run check`: ok; `npm run check -- ./tutorial`: ok, 20 slides, 0
    assets referenced.
  - `npm run capture -- example`: 13 frames, 0 errors, 0 warnings, 0
    changed (the new loader changes no frame). `npm run capture --
    ./tutorial`: 30 frames, 0 errors, 0 warnings
    (`data/captures/tutorial/20261122-214812/`); the frames were read after
    each change to the deck.
  - `npm run test:ui`: every file has passed on this code, not in one run.
    `audience.test.mjs` 23 of 23 and `errorsAndHosting.test.mjs` 5 of 5
    run alone; `layouts`, `live`, `presenter`, and `tutorial` passed
    inside a full run (the two files above failed in that run). Two full
    runs failed tests in the files that load a fresh page per test, on
    30-second timeouts.
  - That was measured, not assumed to be load: six fresh loads of the
    fixture take about 250 ms each with the new loader and with the old
    one (107 requests either way); one load in eighteen took 11 s. The
    machine stalls for seconds at a time after hours of work (a one-line
    PowerShell query took over two minutes at one point); the loader is
    not slower. A dev server left running in the same worktree during the
    first failing run was stopped; the second run failed the same way
    without it.
- Not checked: a person taking it; the deck on a tablet; Safari; the
  browser suite in one clean run on an idle machine.
- Next: plan todos 1 and 2.
