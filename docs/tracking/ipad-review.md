# Reviewing a deck on an iPad or iPhone: tracking

[Plan](../plans/ipad-review.md)

Current state: everything that needs no device is built and tested: the
touch fixes, the narrower file serving, the browser tests, the two skills,
and the documentation. Open: the user's pass on an iPad and an iPhone, the
control tests of the feedback path, the two skills' gates, and merging
`main` into `guest-lecture` and `vision-workshop`. Resume from the newest
entry below.

## Standing directions

Every direction the user gives about this work, quoted and dated.

2026-11-21:

- "Please also note these skills that you create in the README so that
  they can readily be used by agents. An agent might ask the user if they
  want to use these skills when working on a presentation"
- "Please implement docs\plans\ipad-review.md" (set as the session's goal).
- "Could you host the website for the gen-nlos-explainer so that I can test
  iPad navigationo right now?"
- "We do not need features for editing on the iPad/annotation -- just
  making sure layout/UI elements work on the iPad/iPhone. Also for
  annotation uploads, I will probably just rely on claude remote control
  (assuming the claude account is linked to the ipad)."
- "I'll also probably make some skills in this repo for: -> Using a lighter
  weight model (e.g. sonnet or haiku) to monitor for uploads, and *parse
  them* for the thread they are relevant to (though the thread working on a
  specific slide will be sent the whole upload as well). -> Monitoring for
  live feedback while editing a deck"
- "Please scope out these changes in a plan, as well as adding instructions
  for users wishing to use an iPad for workflows in the main README.md for
  editing."
- "How easy would it be to, when we host a presentation, to host it at an
  IP accessible via an iPad/iPhone on the same network? It would be nice to
  be able access it, take screenshots of slides, annotate (locally on the
  iPad), and upload screenshots to provide comments? No development yet,
  just scoping this feature out"

## 2026-11-21 18:40 — built: touch fixes, file serving, tests, skills, documentation

User direction (2026-11-21): "Please implement docs\plans\ipad-review.md",
and, while that was under way, "Please also note these skills that you
create in the README so that they can readily be used by agents. An agent
might ask the user if they want to use these skills when working on a
presentation".

The plan made each behavior change the user's decision. The direction to
implement the plan was taken as the yes for the changes the plan
recommended; that reading is the agent's, and each change is listed in the
plan under "Behavior changes" so that any of them can be turned down.

- Done, on the branch `ipad-review` from `main`, in a worktree beside the
  checkout (`../rpt-ipad-review`, removed after the merge):
  - touch fixes and behavior changes in `core/client/` (the plan's "Design
    as built" lists each with its file);
  - `servedFiles` in `core/tooling/viteConfig.js`; `--host` for
    `npm run preview`; the review address printed by `npm run dev --host`;
  - tests in `tests/ui/audience.test.mjs` and
    `tests/ui/errorsAndHosting.test.mjs`; `TOUCH_DEVICES` and
    `UI_TEST_BROWSER=webkit` in `tests/ui/harness.mjs`;
  - the skills `.claude/skills/feedback-inbox/` and
    `.claude/skills/live-feedback/`; `/data/feedback/` in `.gitignore`;
  - `README.md` (reviewing on an iPad or iPhone; skills for agents),
    `docs/workflows/reviewing-on-a-tablet.md`, hosting, testing,
    architecture, presentation format, `making-a-presentation`, the
    `start-presentation` skill, and a rule in `CLAUDE.md` and `AGENTS.md`
    to offer the review skills.
- Looked at: screenshots of the fixture deck in Chromium's emulation of an
  iPhone 13 and an iPad, both ways, with `?review`: the toolbar shows at
  rest, the counter and the review label sit at the right of the bar, the
  overview has its close button. One thing seen and not changed: an
  overview card shows a title's math as its source (`$x_k$`).
- Probed: Playwright's `hasTouch` makes `(hover: none)` and
  `(pointer: coarse)` match in Chromium, so the touch contexts of the
  tests exercise the two media queries.
- Audit of drags, on every branch (`git grep` for a canvas or SVG with
  pointer, mouse, or touch handlers): all but two already sit in a box
  marked `data-no-swipe`. The two are in the plan under "On merging into a
  project branch" (`EmbeddingScatterPlot` on `vision-workshop`;
  `RoomView` on `guest-lecture`, whose dragging callers are marked).
- Audit of hover and mouse:
  - core layouts: every `:hover` is a highlight on something that also
    works by tap (`colab-button`, `discussion-prompt`, `np-submit`,
    `poll-option`, `links-card`); no `onMouse*` handler. Touch works.
  - core, presenter view: the message of a formula KaTeX cannot render is
    a `title`, seen only on hover. Open; the presenter view is for a
    computer.
  - `gen-nlos-explainer` layouts: no hover rule and no pointer, mouse,
    touch, or click handler. Every slide only shows, so a swipe may start
    anywhere on it.
  - `light-transport-and-neural-rendering` layouts: `OperatorExplorer`
    shows `.operator-controls` on `.operator-render:hover`, and
    `AdjointViews` tracks `onMouseMove` for a cursor. Open, on
    `guest-lecture`.
  - `vision-workshop` layouts: eight files with `:hover` highlights; no
    hover-revealed control and no mouse-only handler.
- Checked that no presentation on this checkout imports a file outside
  its own directory, `@core`, and installed packages (so `servedFiles`
  covers what a deck loads).
- Control test 3, in part: `ListAgents` on this machine (Claude Code
  2.1.330, native Windows) lists the other sessions by name. A path sent
  and opened is not yet observed.
- The user's report (2026-11-21): "The heavily cluttered room video seems
  to be broken." "On the ipad". Found: the summary slide's image
  `public/slides/summary/robot-outlook-busy-room.png` (alt text: "a mobile
  robot with lidar facing a heavily cluttered bedroom") is not on this
  machine; the server answers the request with the page (745 bytes,
  `text/html`). It is one of the three files `npm run check` reports
  missing, named by the commit ee7064a. Not a touch or iPad defect; the
  fix is pulling the media, which needs the rclone remote. Every video of
  the explainer is at most 1752×780, H.264 level 4.0 or lower.
- Checked, in the worktree on `ipad-review` (framework as on `main`, the
  example presentation):
  - `npm test`: 79 of 79.
  - `npm run test:ui`, Chromium: 44 of 44 in 12 minutes (the machine was
    throttling). After the
    last test changes, `tests/ui/audience.test.mjs` again: 23 of 23.
  - Fail first: with `core/` and `scripts/` as before this work and the
    new tests, all 8 new tests fail (swipes on media, touch paths, toolbar
    at rest, no fullscreen, `?review`, the two device layouts, served
    files); with the new code they pass.
  - `UI_TEST_BROWSER=webkit`, `tests/ui/audience.test.mjs` only: 22 of 23.
    The one failure is a test from before this work, "shows the stage
    alone with ?bars=hidden": it navigates while the first page is still
    preloading media, and WebKit reports the interrupted request as an
    error (`... panel-2.svg due to access control checks`). A finding to
    verify on Safari: reloading a deck while it preloads may log the same.
    The other four test files have not been run on WebKit.
  - `npm run check`: ok. `npm run build`: built. `npm run capture`: 13
    frames, 0 errors, 0 warnings
    (`data/captures/example/20261121-235916/`).
  - By use: `node scripts/dev.mjs example --port 5190 --host` prints the
    review address; over the network address, `/@fs/<checkout>/CLAUDE.md`,
    this tracker, and `package.json` answer 403, the example's
    `presentation.json` and a slide's `content.json` answer 200;
    `node scripts/preview.mjs example --port 4190 --host` answers on the
    network address. Both stopped by process id.
  - A first run in the fresh worktree failed one older test on a timeout
    (the load-error screen, 37 s): the dependency cache was cold. The same
    test passes in 0.7 s warm. Recorded as cold start, not as a defect.
- Next: the user's device pass (plan todo 1) and the control tests
  (todo 2).

## 2026-11-21 17:05 — plan written; the explainer is served on the network

User direction (2026-11-21): "Please scope out these changes in a plan, as
well as adding instructions for users wishing to use an iPad for workflows
in the main README.md for editing." and, while that was under way, "Could
you host the website for the gen-nlos-explainer so that I can test iPad
navigationo right now?"

- Done: `docs/plans/ipad-review.md` and this tracker, listed in the two
  indexes. They are in the main checkout on `gen-nlos-explainer`, not
  committed. The plan is framework work, so it is committed to `main` first
  and merged into the project branches. No code, skill, or README change
  was made: the README section is todo 9 of the plan, written once what it
  describes exists.
- Running: `npm run dev -- gen-nlos-explainer --port 5174 --host`, process
  id 12144, at http://192.168.4.23:5174/. Windows classes this Wi-Fi as
  "Public"; the firewall has an inbound allow rule for
  `C:\Program Files\nodejs\node.exe` on that profile, and the address
  answers from this machine (HTTP 200). Whether the iPad reaches it is
  not yet observed.
- Found, by probe: with `--host` the server hands out files of the whole
  checkout. `GET http://192.168.4.23:5174/@fs/<checkout>/CLAUDE.md`
  returned the file (16170 bytes, `text/markdown`, the size on disk); so did
  `docs/tracking/gen-nlos-explainer.md` (77007 bytes) and a file under
  `presentations/gen-nlos-explainer/assets/`. `.git/config` returned 403. A
  name that does not exist returns the page (745 bytes, `text/html`), so a
  200 alone does not show a file was served. The explainer is an anonymous
  submission: the plan's rule is a trusted network only, and its todo 3
  narrows what the server hands out.
- Found, by reading code (each a hypothesis; the plan's device checklist
  has the row that checks it): swipes that start on a video, SVG, or canvas
  are ignored; the toolbar is invisible without hover; fullscreen is called
  unguarded; the overview opens only with a key; the slide number is hidden
  under 768 px.
- Measured: the explainer's `public/` holds 33 MP4 files (51.7 MB, all
  H.264 High, `yuv420p`, by `ffprobe`), 20 PNG, 27 JPEG, 1 WebP; the
  lecture's holds 7 MP4, 2 WebM, a 13 MB GIF, 25 PNG, 49 JPEG.
- Read, in the Claude Code documentation (code.claude.com/docs/en:
  `remote-control`, `skills`, `sub-agents`, `cross-session-messaging`,
  `hooks`, `tools-reference`, `model-config`; fetched 2026-11-21 by a
  research agent, not checked by use): a photo attached over Remote Control
  is seen as part of the message, with no file path documented; other
  attachments are downloaded and passed as paths; messages between sessions
  are text only and need 2.1.234 or newer on native Windows. This machine
  has Claude Code 2.1.330.
- Checked: `npm test`, 79 of 79 pass (every document reachable from the
  index, no dead links). No capture or browser test: nothing that renders
  changed.
- Checked: `npm run check` fails for `gen-nlos-explainer`, for a reason
  this work did not touch: three media files that the slides name are not
  on this machine (`public/slides/hardware/propagating-light.mp4`, its
  `.poster.jpg`, and `public/slides/summary/robot-outlook-busy-room.png`),
  so the `hardware` and `summary` slides show gaps on the iPad. The pull
  could not run: rclone has no `tcig` remote here (no `RCLONE_CONFIG`, no
  `%APPDATA%\rclone\rclone.conf`, no `rclone.conf` in `~/Downloads`).
  Whether the three files are in the bucket is not known. The lecture
  passes.
- Next: the user's observations for the device checklist (plan todo 1),
  then the four control tests (todo 2), in the same sitting.
