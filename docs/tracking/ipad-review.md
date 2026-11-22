# Reviewing a deck on an iPad or iPhone: tracking

[Plan](../plans/ipad-review.md)

Current state: everything that needs no device is built and tested, on
`main` and merged into `gen-nlos-explainer`, not pushed: the touch fixes,
the narrower file serving, the browser tests, the two skills, and the
documentation. Open: the rest of the user's pass on an iPad and an iPhone,
the rest of the control tests of the feedback path, the two skills' gates,
merging `main` into `guest-lecture` and `vision-workshop`, and one
picture of the explainer (the summary slide's) that exists only on a
collaborator's machine. Resume from the
newest entry below.

## Standing directions

Every direction the user gives about this work, quoted and dated.

2026-11-22:

- "You can sync other branches, but don't change the decks that are
  live/being edited"
- "I am not asking you to change victor's presentation/the gen-nlos
  presentation. don't do that"
- "The distinction between live feedback and feedback inbox is a little
  unclear."
- "I'm also a little unclear on how the second session (e.g. the haiku
  agent) sends feedback to other claude sessions/agents"

2026-11-21:

- "Sorry, but why can't you? I told you where rclone.conf is. It is in
  ~/Downloads/tokens"
- "Please look for it in R2 to see if it's available It might be in my
  presentations bucket"
- "If you can reverse image search it, it's here. It may also be AI
  generated in which case, re-generate a placeholder?" (with the picture)
- "This is what I still see on the browser" (with a marked-up screenshot
  of the summary slide on the iPad)
- "It's on the summary slide" (of the report below).
- "By the way the cluttered room video is still not served correctly on
  the ipad"
- "The heavily cluttered room video seems to be broken." "On the ipad"
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

## 2026-11-22 18:30 — the explainer's media put back; what this work may touch

User direction (2026-11-22): "I am not asking you to change victor's
presentation/the gen-nlos presentation. don't do that", then "You can sync
other branches, but don't change the decks that are live/being edited".

- Undone: the entry below copied the bucket's newer
  `related-work/methods.mp4` and its poster over this machine's copies,
  unasked. The older pair (1342574 and 59914 bytes, 2026-11-19) is back,
  from the copies kept at the time. The bucket's newer pair is still
  there for whoever pulls.
- Kept: `hardware/propagating-light.mp4` and its poster, which were
  missing here and were fetched while looking for the summary slide's
  picture at the user's request.
- For the record, no commit of this work touches
  `presentations/gen-nlos-explainer/`. On that branch it merged `main` and
  added one entry to the explainer's tracker.
- Decided from the second direction: `guest-lecture` may merge `main`.
  `vision-workshop` is left alone: its sync needs `data-no-swipe` on one
  layout of a live deck (plan, "On merging into a project branch"), which
  is a change to that deck, and a push there redeploys.
- Next: unchanged.

## 2026-11-22 16:20 — the inbox skill run on Haiku, end to end; one defect found and fixed

No new direction. The session's goal (2026-11-22) asks for documentation
of each skill and worked examples; running the skill is how its example
was checked.

- Run: this session registered itself in `data/feedback/sessions.md` (all
  slides of `gen-nlos-explainer`), as `live-feedback` says. A second
  session was started in the checkout with
  `claude --model haiku -p "Use the feedback-inbox skill. … The attached
  image is also saved at <path>. The user wrote: …" --allowedTools
  "Skill,Read,Write,Glob,Grep,ListAgents,SendMessage,Bash(cp:*),Bash(mkdir:*),Bash(date:*),Bash(ls:*)"`,
  with the user's marked-up screenshot of the summary slide (the one from
  the iPad, 2026-11-21 19:10).
- First run, a defect: the session named the slide and step and described
  the mark, then stopped without forwarding. Copying the image out of
  `~/.claude/uploads/` was refused to it, and the skill made the copy a
  precondition. Fixed in the skill: when the copy is refused, the saved
  attachment's own path is forwarded and the note says `copy: not kept`.
- Second run, through: the note
  `data/feedback/gen-nlos-explainer/2026-11-22/1515-summary-step2.md` holds
  the user's words, the placement, and the mark; this session received the
  message in the skill's format, with the attachment's path, between two
  tool calls.
- What Haiku got right on this one screenshot: the slide (`summary`, from
  the counter `22 / 23` against `presentation.json`, there being no
  `?review` label), the step (2 of 2, from the Outlook text and the capture
  frames), the mark (one red curved arrow, no handwriting), and that the
  box shows a missing image with its alt text under the legend. It also
  offered a "likely reading" of what the arrow meant, labeled as its own;
  the skill asks it to describe and not decide, and the label keeps that
  honest. One screenshot is not the gate of ten.
- An interactive inbox would be asked for the permission to copy and could
  be given it; the headless run could not. Both paths now end in a
  forwarded screenshot.
- Also done: `related-work/methods.mp4` and its poster on this machine
  were the 2026-11-19 versions and the bucket's are from 2026-11-20
  (2053740 and 89739 bytes); the bucket's are copied here, the older pair
  kept in the session's temporary folder. `npm run check` still names the
  one picture that is in neither bucket.
- Also checked: the R2 settings the README and DATA.md give (`acl =
  private`, `no_check_bucket = true`), laid over the existing remote
  through `RCLONE_CONFIG_TCIG_*` variables, list and read the bucket; an
  upload was run as a dry run only, so that nothing was written.
- Checked: in the worktree on `guides` (framework as on `main`): `npm test`, 89 of 89; `npm run test:ui`, 44 of 44 in 124 s; `npm run check`, ok.
- Next: unchanged.

## 2026-11-22 15:30 — a session hands a screenshot to another; each skill says whose it is

User direction (2026-11-22): "I'm also a little unclear on how the second
session (e.g. the haiku agent) sends feedback to other claude
sessions/agents" and "The distinction between live feedback and feedback
inbox is a little unclear."

- Control test 3, observed: `claude --model haiku -p "<send this session a
  message naming the screenshot's path>" --allowedTools
  "ListAgents,SendMessage"`, run in the checkout, answered "SENT". The
  message arrived in this session between two tool calls, marked as coming
  from another session and carrying the path
  `~/.claude/uploads/<session id>/1b0ef513-image.jpg`; this session opened
  that file and saw the user's marked-up screenshot of the summary slide.
  The sender's name was the one `ListAgents` gives a session by default
  (the checkout's folder name and a number). The plan's control test 3 now
  says so. Still not observed: the inbox skill run through a review from an
  interactive session under Remote Control, and control test 4 (which
  model reads the marks well enough).
- Done: both skills open with which session they are for and a table of
  the two side by side. `live-feedback` is for the session that edits and
  is needed whenever the user reviews while slides change; `feedback-inbox`
  is for a second session that never edits and is needed only when several
  sessions edit. The inbox skill has a section on how a screenshot gets
  from it to the editing session (names from `ListAgents`, text by
  `SendMessage`, the image as a path, the registry in
  `data/feedback/sessions.md`). With one editing session there is no
  inbox, and both skills say so.
- Done: the person's side moved to a guide,
  `docs/guides/reviewing-on-a-tablet.md` (the usual case, one session,
  first; the inbox as the addition for several sessions; what to do when a
  screenshot arrives without a file). `docs/workflows/reviewing-on-a-tablet.md`
  is now the agents' procedure: the two roles, serving, how sessions find
  and message each other, a screenshot's path, placing it on a slide.
- Done: the inbox keeps a screenshot under its own extension (the observed
  upload was a JPEG), not `.png`.
- Checked: in the worktree on `docs-audit` (framework as on `main`): `npm test`, 88 of 88; `npm run check`, ok; `npm run test:ui`, 44 of 44 in 75 s. Two earlier runs each failed one test, a different one each time, on `page.goto: Timeout 30000ms` at a test server's first page load, while the machine was throttled (an install that takes 5 s took 3 min); recorded as load. A fresh clone of the final commit in a temporary folder: `npm ci` in 11 s; the README's steps (a branch, `npm run new -- my-talk`, the example deleted) give `npm run check` ok and `npm test` 88 of 88; with no store the asset command names the missing remote and the README section; with a folder as `ASSETS_REMOTE`, push, delete, pull returns the file; `npm run capture -- my-talk`, 5 frames, no errors or warnings.
- Next: unchanged: the device checklist, control test 4, and the two
  skills' gates.

## 2026-11-21 19:25 — on `main` and `gen-nlos-explainer`; first observations from the iPad

User direction (2026-11-21): "By the way the cluttered room video is still
not served correctly on the ipad", "It's on the summary slide", and, with
a marked-up screenshot of the summary slide taken on the iPad at 19:10,
"This is what I still see on the browser".

- Done: `main` is at the branch `ipad-review` (fast-forward), and `main`
  is merged into `gen-nlos-explainer` in the main checkout. Nothing is
  pushed. The explainer's server was restarted after the merge, so that
  `servedFiles` applies: `npm run dev -- gen-nlos-explainer --port 5174
  --host`, process id 39420.
- Done after the first merge: the hover highlights of the bar, the
  toolbar, and the overview apply only where the pointer hovers. Seen in a
  screenshot of the explainer in Chromium's iPad emulation: the tapped
  arrow stayed lit. The test of the touch paths now asserts that it does
  not, and fails without the fix.
- The summary slide. The screenshot shows Safari's missing-image mark and
  the alt text of `outlookImage`. Control: the same slide and step in
  desktop Chromium on this machine shows the same; the image's
  `naturalWidth` is 0, the server answers
  `/slides/summary/robot-outlook-busy-room.png` with the page
  (`text/html`), and `public/slides/summary/` holds only `ours-vase.mp4`
  and its poster. Cause: the file is not on this machine.
- Observed on the iPad, from that screenshot (Safari, landscape, without
  `?review`): the toolbar is visible at rest (checklist row 3); the whole
  navigation bar, with its dots and counter, is visible under Safari's
  bars (row 7, landscape).
- Control test 1, observed once: the marked-up screenshot reached this
  session with a line naming the file it was saved as,
  `~/.claude/uploads/<session id>/1b0ef513-image.jpg`, and the file is
  there (199751 bytes). A second picture, sent a few minutes later while
  the session was in the middle of a turn, came with no such line, and no
  second file appeared in that folder. So a path is not guaranteed: of two
  images, the one that opened a turn had a file and the one sent mid-turn
  did not (one case each; the cause is a guess). Whether a screenshot is
  attached from Photos or Files, and whether the same holds for a session
  started with `--remote-control` on a small model, is not yet observed.
  The `feedback-inbox` skill, the workflow, and the README take the path
  from the message and keep "send it again" as the fallback.
- The user asked (2026-11-21): "If you can reverse image search it, it's
  here. It may also be AI generated in which case, re-generate a
  placeholder?" and "Please look for it in R2 to see if it's available It
  might be in my presentations bucket", then "Sorry, but why can't you? I
  told you where rclone.conf is. It is in ~/Downloads/tokens". Until that
  path was given, nothing on this machine reached R2 (`rclone listremotes`
  empty, no default configuration, the tracker's older location
  `~/Downloads/rclone.conf` gone), and a search of the user's folders for
  the file was refused by the permission system. With
  `RCLONE_CONFIG=~/Downloads/tokens/rclone.conf`:
  - the `presentations` bucket answered some list and head requests with
    HTTP 500 and others normally; `--retries 3 --low-level-retries 5` got
    through;
  - `hardware/propagating-light.mp4` (3658810 bytes) and its poster (13325
    bytes) were in the bucket and are copied here, one file each with
    `rclone copyto`, so that no local media that differ from the bucket
    were overwritten;
  - the robot picture is in neither bucket: no file whose name contains
    `robot`, `outlook`, or `busy` in `presentations`, none named
    `robot-outlook*` or `busy-room*` under
    `tcig-projects/research-presentation-template`, and the bucket's
    `gen-nlos-explainer/public/slides/summary/` holds only `ours-vase.mp4`
    and its poster. The explainer's tracker says the same of it: "Its
    asset remains local in `public/`; no bucket upload has been
    requested." It is on the machine of the collaborator who made it;
  - `npm run check -- gen-nlos-explainer` now reports that one file
    missing, and nothing else.
  Not done: a reverse image search and a regenerated placeholder (this
  session has neither tool), and the picture the user sent could not be
  put in place because it has no file on disk.
- Checked, on `main` (the worktree):
  - `npm run test:ui`, Chromium, on the final code: 44 of 44 in 2 minutes.
  - `npm test`: 79 of 79.
- Checked, on `gen-nlos-explainer` after the merge:
  - `npm test`: 79 of 79.
  - `npm run check`: the lecture passes; the explainer fails on the same
    three missing media files as before the merge
    (`hardware/propagating-light.mp4`, its poster,
    `summary/robot-outlook-busy-room.png`).
  - The explainer loaded from the restarted server in Chromium at an
    iPad's size with `?review`: every slide ready, no response of 400 or
    more, no error; the bar reads `title step 1/1 1 / 23`, and after two
    taps `single-image step 1/3 3 / 23`.
  - Over the network address: `CLAUDE.md`, the explainer's tracker, the
    lecture's `presentation.json`, and a file of the explainer's `assets/`
    answer 403; the explainer's `presentation.json` answers 200.
  - `npm run capture -- gen-nlos-explainer`
    (`data/captures/gen-nlos-explainer/20261122-001052/`): 46 frames. The
    6 with errors are the two slides with missing media (`hardware`, five
    steps; `summary`, step 2). The 5 warnings are `outside-stage` on the
    `hardware` frames. Three frames changed since the run of 2026-11-19
    (`single-image`), a slide the commit ee7064a edited. No frame points
    at this work; the capture view has no navigation bar.
  - `npm run capture -- light-transport-and-neural-rendering`
    (`data/captures/light-transport-and-neural-rendering/20261122-001312/`):
    212 frames, 0 errors, 0 warnings, 0 changed since the run of
    2026-11-18.
- Next: the robot picture from the collaborator (a push of the explainer's
  media, or the file); the rest of the device checklist (plan todo 1);
  control tests 3 and 4 (todo 2).

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
