# Reviewing a deck on an iPad or iPhone

[Latest status and resume point](../tracking/ipad-review.md) ·
[The guide, for people](../guides/reviewing-on-a-tablet.md) ·
[The workflow, for agents](../workflows/reviewing-on-a-tablet.md) ·
[Hosting](../implementation/hosting.md) ·
[Testing](../implementation/testing.md)

A person editing a deck with an agent on a computer opens the deck on an
iPad or iPhone on the same network, moves through it by touch, marks up
screenshots with the tablet's own tools, and sends them to the agent through
Claude Code's Remote Control. Done means three things: every control of the
audience view works by touch on both devices; two skills carry a sent
screenshot to the session working on the slide it shows; and `README.md`
says how to set all of it up.

The deck has no drawing, annotation, or upload feature of its own. Marking
up happens in the tablet's screenshot tools, and the upload is a message in
the Claude app.

## Immediate todos

Work these in order, one at a time. Everything that could be built and
tested without the device is built. What is open needs the device and the
user.

### Done

- **Touch fixes that leave the desktop unchanged.** The toolbar shows at
  rest where nothing can hover; fullscreen is offered only where the
  browser has it; the presenter view takes the page's height; a quick
  second tap is not a zoom. Gate passed: `npm run test:ui`.
- **Touch changes that alter behavior**, listed under
  [behavior changes](#behavior-changes). The user's direction to implement
  this plan was taken as the yes for each. Gate passed: `npm run test:ui`.
- **Tooling.** The development server hands out the deck and refuses the
  rest of the checkout; `npm run preview -- <id> --host`;
  `npm run dev -- <id> --host` prints the review address.
- **Browser tests for touch**: a tablet and a phone held both ways, a
  touch path for every action a key has, swipes on every kind of media,
  and `UI_TEST_BROWSER=webkit`. The new tests fail on the code as it was
  and pass on the code as it is.
- **Hover and mouse audit** of the core layouts and of the layouts of
  every project branch; the list is in the tracker.
- **The two skills**, `feedback-inbox` and `live-feedback`, written to the
  [design](#feedback-through-remote-control). Their gates are todos 3
  and 4.
- **Documentation**: the README sections (reviewing on an iPad or iPhone;
  the skills, for agents), the
  [guide](../guides/reviewing-on-a-tablet.md) for people and the
  [workflow](../workflows/reviewing-on-a-tablet.md) for agents, hosting,
  testing,
  the presentation format (`data-no-swipe`), and a rule in the agent files
  to offer the skills.

### Open

1. **Device pass.** With `npm run dev -- <id> --host` running, the user
   goes through the [checklist](#device-checklist) on an iPad and an
   iPhone, in Safari, portrait and landscape. Each row gets an observation
   in the tracker. A row that fails is a bug in what was built: find its
   cause and fix it on `main`.
2. **Control tests for the feedback path** ([below](#control-tests)), in
   the same sitting. Test 3 is observed in part. A failed test rewrites
   the matching step of the skill.
3. **Gate of `feedback-inbox`**: ten real marked-up screenshots, sent from
   the iPad, each reach the right session with the right slide named, or
   are reported to the user as not placed.
4. **Gate of `live-feedback`**: a session in the middle of a slide edit
   receives a forwarded screenshot, finishes its current step, makes the
   change, and reports; the page on the iPad never fails to load
   meanwhile.
5. **The other project branches.** `guest-lecture` and `vision-workshop`
   merge `main`, each with the follow-ups the audit found
   ([below](#on-merging-into-a-project-branch)), and each after a capture
   of its presentations. `gen-nlos-explainer` has merged it.
6. **WebKit, the rest.** `UI_TEST_BROWSER=webkit` has run the audience
   tests only, and one older test fails there for a reason the tracker
   gives. Run the other four files, and settle that test.

## Rules

- No annotation, drawing, editing, or upload feature in the deck or the
  servers. Feedback travels through Remote Control.
- Slides are not reflowed for a small screen: the stage is 1280×720 and
  scaled. Only the window's own controls (the navigation bar, the toolbar,
  the overview) adapt to the device.
- Touch fixes are framework changes: they land on `main` after
  `npm run test:ui` and are then merged into the project branches.
- A fix removes the cause on every device; no branch on a device's name or
  user agent. A capability is asked for directly (does the Fullscreen API
  exist, can the pointer hover).
- `--host` is for a network the user trusts: every device on it can read
  the deck's slides, notes, and media.
- The screenshots are of unpublished slides. They are kept under
  `data/feedback/`, which git ignores, and are never committed or
  uploaded.
- A screenshot the user sent is the user's feedback. What a model wrote
  about the screenshot is that model's reading, and can be wrong: the
  session that edits the slide opens the original image before acting.

## Device checklist

"Built" is what the code now does, checked in a desktop browser's
emulation. "On the device" is to be observed; the tracker holds the
observations.

| # | Try | Built | On the device |
|---|---|---|---|
| 1 | Swipe left and right, starting on text or an image | the slide changes | to observe |
| 2 | Swipe starting on a video, a drawing, or a 3D scene | the slide changes; a region marked `data-no-swipe` keeps the drag | to observe, on the explainer's slides |
| 3 | Look for the toolbar at the left of the bar without touching anything | visible where the pointer cannot hover | iPad: visible (the user's screenshot). iPhone: to observe |
| 4 | Tap fullscreen on the iPad; look for the button on the iPhone | iPad: fullscreen, the bar hides. iPhone: no button, because Safari there has no fullscreen for pages | to observe; and how one leaves fullscreen on the iPad (Safari's own control is expected) |
| 5 | Tap the slide counter | the overview opens; × or a card closes it | to observe |
| 6 | iPhone, portrait: find the slide number | shown; the dots are left out under 768 px | to observe |
| 7 | Safari with its toolbars showing: is the whole bar visible, in both orientations | the page takes its height from the page, not from `100vh` | iPad, landscape: the whole bar is visible under Safari's bars (the user's screenshot). Portrait and iPhone: to observe |
| 8 | Tap an arrow twice quickly; pinch; drag a slide up and down | no double-tap zoom (`touch-action: manipulation`); pinching still zooms | to observe |
| 9 | Tap a slide dot in a long deck | a dot's slot is as tall as the arrows where the pointer is coarse; its width still shrinks with the number of slides, and the overview is the easier way | to observe |
| 10 | Swipe from the left edge of the screen | not handled: Safari's "back" gesture may take it | to observe |
| 11 | Let every video slide play; then turn on Low Power Mode and reload | videos are muted and inline (`Media.jsx`), which iOS requires to play them unasked | to observe |
| 12 | Go through the whole deck twice without reloading | every media file is kept in memory (`preload.js`): about 58 MB for the explainer, 39 MB for the lecture | to observe: does Safari reload the page |
| 13 | Lecture only: the two `.webm` videos and the 13 MB GIF | nothing built; the explainer's 33 videos are all H.264 `yuv420p` MP4, at most 1752×780 | to observe |
| 14 | Tap the presenter button | a second tab; the two-window presenter view is for a computer | a stated limit |
| 15 | Edit a slide on the computer while the device shows it | the device updates by hot reload | to observe |
| 16 | Add the page to the Home Screen and open it from there | the page declares itself a web app, to open without Safari's bars | to observe |
| 17 | Open the address with `?review`; take a screenshot | the bar names the slide's id, `step k/n`, and `i / N` | to observe: is the label legible in a screenshot |
| 18 | Tap an arrow and look at it afterwards | it is not left highlighted | to observe |

## Design as built

### Defects fixed

| What | Where |
|---|---|
| The toolbar shows at rest when the pointer cannot hover (`@media (hover: none)`: a query about the input device, on the window's controls, not a viewport query in a slide) | `core/client/index.css` |
| `useFullscreen` returns `toggleFullscreen: null` where `document.fullscreenEnabled` is false; the audience view then renders no button and binds no key | `core/client/audience/useFullscreen.js`, `AudienceView.jsx` |
| The presenter view is sized by the page (`100%`), like the audience view | `core/client/index.css` |
| `touch-action: manipulation` on the page: no double-tap zoom | `core/client/index.css` |
| The hover highlights of the bar, the toolbar, and the overview apply only where the pointer hovers (`@media (hover: hover)`): on a touch screen a tap leaves `:hover` set, and the pressed arrow stayed lit | `core/client/index.css` |
| The overview has a close button: Safari on iOS sends no click for a tap on a plain box, which is what closing by a click outside the grid relies on | `core/client/audience/SlideOverview.jsx` |

### Behavior changes

Each changes something that a desktop user or an existing slide had.

- **Swipes start on media.** `canvas`, `svg`, and `video` no longer keep a
  touch by their tag. Media that only show something let the swipe
  through; an element that takes drags declares `data-no-swipe`
  (`useSwipeNavigation.js`, and the rule in
  [presentation format](../implementation/presentations.md)). A video with
  the browser's controls keeps its touches.
- **A swipe is one finger travelling farther sideways than up or down.** A
  pinch and a mostly vertical drag no longer change the slide.
- **The slide counter is a button** that opens the overview, on every
  device. Its text and place are unchanged.
- **The counter stays on narrow windows** (under 768 px); only the dots are
  left out there.
- **`?review`** adds the slide's id and build step to the end of the bar.
  Without the flag nothing is added.
- **A dot's slot is as tall as the arrows beside it** where the pointer is
  coarse (it was 20 px). The bar's height does not change.
- **The page declares itself a web app** (`mobile-web-app-capable`), which
  matters only when it is opened from a Home Screen.

### Tooling

- `servedFiles` in `core/tooling/viteConfig.js` is what the development
  server may read from disk: the client, the presentation's directory, and
  `node_modules/`; it refuses a presentation's `assets/`. Before, it could
  read the whole checkout, and with `--host` so could every device on the
  network.
- `scripts/preview.mjs` takes `--host`; `scripts/dev.mjs` prints the
  network address with `?review`.

### Not built

- **A way out of fullscreen on the iPad.** Safari shows its own control
  there; row 4 of the checklist says whether that is enough.
- **Wider dots.** With many slides a dot stays narrow; the overview is the
  touch path to a slide.
- **The presenter window on a tablet** (row 14): reviewing does not need
  it.

### On merging into a project branch

The audit found these, each on a project branch and so not changed on
`main`:

- `vision-workshop`, `presentations/diffusion/layouts/EmbeddingSpaceSlide/EmbeddingScatterPlot.jsx`:
  its SVG reads `onPointerMove` and is not marked. With the new rule a
  finger moved across the plot also changes the slide on release, unless
  the audience is following the presenter. It needs `data-no-swipe`.
- `guest-lecture`, `OperatorExplorer`: `.operator-controls` appear on
  `.operator-render:hover`, so a touch screen may never show them.
- `guest-lecture`, `flatland/RoomView.jsx`: a canvas that passes pointer
  handlers through. Its callers that drag are inside marked boxes;
  `RenderingEquation` passes a tap (`onPointerDown`) only.

## Browser tests

`tests/ui/audience.test.mjs`, in Chromium with touch:

- **Devices.** The layout checks also run on an iPad and an iPhone, each
  held both ways, as Playwright describes them (`TOUCH_DEVICES` in
  `harness.mjs`: size, pixel ratio, touch, a pointer that cannot hover),
  plain and with `?review`, for the fixture and a 70-slide deck. Slides are
  not captured at these sizes: a slide is the same 1280×720 picture at any
  scale, so `npm run capture` already covers it.
- **A touch path for every action.** One test reads the actions of
  `KEY_ACTIONS` from the source and fails when one has no touch path in
  the test; resetting a poll is the stated exception.
- **Swipes** on an image, a video, a canvas, and a shape in an SVG move
  on; on a video with controls and on marked regions they do not; nor do a
  pinch or a vertical drag.
- **WebKit.** `UI_TEST_BROWSER=webkit` runs the suites on Playwright's
  build of Safari's engine. It is not Safari on iOS. The tracker has its
  result.

`tests/ui/errorsAndHosting.test.mjs` asks the development server for files
of the deck (200) and for files of the checkout and the deck's `assets/`
(403).

## Feedback through Remote Control

### What Claude Code provides

From the Claude Code documentation (pages named in the tracker), as read
for this plan; the control tests check the parts the design rests on.

- **Remote Control** connects the Claude app on an iPad or iPhone to a
  session running on the computer. Start it inside a session with
  `/remote-control`, or with `claude --remote-control`. It needs a
  claude.ai login on a paid plan, the same account on the device, and the
  computer awake with the session open.
- **A photo attached in the app is seen by the session as part of the
  message.** The documentation does not say that it is also saved as a
  file. Other attached files are downloaded to the computer and reach the
  session as file paths.
- **One session can message another** on the same machine (`SendMessage`;
  `/list-agents` shows who can be reached). Native Windows needs Claude
  Code 2.1.234 or newer. Messages are text only: an image crosses as a path
  that the receiving session opens itself. A message is read between tool
  calls when the receiver is busy and starts a turn when it is idle, so the
  receiver does not poll.
- **The model is chosen per session**: `claude --model haiku` in one
  terminal, a larger model in another. Typing `/model` in a session also
  saves the choice as the default for new sessions, so the inbox is started
  with the flag. A skill's `model` field lasts one turn and does not make a
  session a small-model session.

### Control tests

1. **Does a screenshot have a path?** Observed once: a marked-up iPad
   screenshot attached to a message reached the session with a line naming
   the file it was saved as, under `~/.claude/uploads/<session id>/`, and
   the file was there. The skill copies from that path. A second image,
   sent while the session was in the middle of a turn, came with no path
   and no file. Still to observe: when a path is given and when not (a
   message that opens a turn against one sent mid-turn; Photos against
   Files; a session started with `--remote-control` on a small model).
2. **The fallback.** If an image arrives with no path, the skill asks for
   it again. To observe: that sending it again, as its own message or from
   the Files app, gives it a path.
3. **Session to session.** Observed: a one-shot Haiku session started in
   this checkout (`claude --model haiku -p …`, allowed `ListAgents` and
   `SendMessage`) listed the machine's sessions, sent a working session a
   message naming a screenshot's path, and that session received it
   between tool calls and opened the image. A session's name is the one
   `ListAgents` reports for it. Not yet observed: the same from an
   interactive session under Remote Control running the inbox skill.
4. **How small can the model be?** Ten real marked-up screenshots, read by
   Haiku and by Sonnet: the slide and step named, each mark and what it
   points at transcribed, each compared with the user's own account. The
   inbox runs on the smallest model that places all ten and misreads no
   mark.

If tests 1 and 2 both fail, an image cannot leave the session that received
it. The user then chooses between sending each screenshot directly to the
session that works on the slide (no inbox), and a folder on the computer
that the tablet's photos sync into, with the same two skills reading from
it.

### Design

Two kinds of session run in the checkout. **Working sessions** edit slides,
on the model the work needs, with the `live-feedback` skill; each lists
its name and the slides it has in `data/feedback/sessions.md`. **The
inbox** is one session on a small model with Remote Control on, with the
`feedback-inbox` skill; it is the session the user opens in the Claude app.
Neither watches a folder or polls: an upload is a message to the inbox, and
a forward is a message to a working session.

For each screenshot the inbox keeps a copy under
`data/feedback/<id>/<date>/` with the user's words; places it (the review
label, else the counter, else a match against the last capture run's
frames, else the user's words); reads the marks without deciding what
should change; sends the working session the image's path first, then the
user's words, then its reading, labeled as its own; and tells the user
where the screenshot went, or that it was not placed and why.

A working session, when a message arrives, reaches a point where the deck
loads; opens the image, which outranks the reading; records the user's
words in the project tracker; makes the change (an unclear mark is a
question, a deletion is confirmed); checks; and replies with what was done
for each mark and the slide and step to look at.

The skills hold the steps: `.claude/skills/feedback-inbox/SKILL.md` and
`.claude/skills/live-feedback/SKILL.md`.

## Completion criteria

- Every checklist row is observed on an iPad and an iPhone and is either
  working or a stated limit in the README.
- `npm run test:ui` covers tablet and phone sizes and a touch path for
  every action, and passes on Chromium; its WebKit result is recorded.
- With `--host`, the development server refuses files outside the deck.
- Ten screenshots sent from the iPad each reach the right working session,
  whole, or are reported as not placed.
- A working session takes a forwarded screenshot mid-edit without the page
  on the tablet failing to load.
- `README.md`, hosting, testing, and the workflow document describe the
  above; both skills are in `.claude/skills/`; every project branch has
  merged `main`.
