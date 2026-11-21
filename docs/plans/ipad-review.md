# Reviewing a deck on an iPad or iPhone

[Latest status and resume point](../tracking/ipad-review.md) ·
[Hosting](../implementation/hosting.md) ·
[Testing](../implementation/testing.md)

A person editing a deck with an agent on a computer opens the deck on an
iPad or iPhone on the same network, moves through it by touch, marks up
screenshots with the tablet's own tools, and sends them to the agent through
Claude Code's Remote Control. Done means three things: every control of the
audience view works by touch on both devices; two skills carry a sent
screenshot to the session working on the slide it shows; and `README.md`
says how to set all of it up.

The deck gets no drawing, annotation, or upload feature of its own. Marking
up happens in the tablet's screenshot tools, and the upload is a message in
the Claude app.

## Immediate todos

Work these in order, one at a time. Todos 1 and 2 need the device and the
user; they are one sitting.

### Done

Nothing has landed. The findings in this plan come from reading the code and
from one probe of a running server; none is confirmed on a device.

### Open

1. **Device pass.** With `npm run dev -- <id> --host` running, the user goes
   through the [checklist](#device-checklist) on an iPad and an iPhone, in
   Safari, portrait and landscape. Each row gets an observation in the
   tracker. Gate: every row is observed; the rows that fail are the work of
   todos 3 and 4, and a row that passes is struck from them.
2. **Control tests for the feedback path.** Four short tests
   ([below](#control-tests)) decide whether the design of the two skills
   holds: whether a photo sent over Remote Control exists as a file on the
   computer, whether one session can hand an image to another, and whether a
   small model reads marked-up screenshots well enough to route them. Gate:
   each test has a recorded result; the design section is rewritten if one
   fails.
3. **Touch fixes that leave the desktop unchanged.** The failures of todo 1
   that are plain defects: a control that does nothing or cannot be seen on
   a touch device ([candidates](#candidates-defects)), and the two tooling
   repairs (`npm run preview -- <id> --host`; the network server handing
   out fewer files). Gate: `npm run test:ui`, and the user repeats the failed
   checklist rows.
4. **Touch changes that alter behavior.** The failures of todo 1 whose fix
   changes what a desktop user or an existing slide sees
   ([candidates](#candidates-behavior-changes)). Each is proposed to the
   user with its effect on existing decks and built on a yes. Gate as for
   todo 3, plus a capture of every presentation on the branch.
5. **Browser tests for touch.** `tests/ui/audience.test.mjs` gains tablet
   and phone window sizes in both orientations, a test that every action in
   the README's key table has a touch path, and a swipe that starts on each
   kind of media. `launchBrowser` in `tests/ui/harness.mjs` accepts
   `UI_TEST_BROWSER=webkit`. Gate: the suite fails on the code as it is
   before todos 3 and 4, and passes after.
6. **Hover and mouse audit of layouts.** Every `:hover` rule and `onMouse*`
   handler in a layout is read for an action or a piece of information that
   only a pointer can reach. Core layouts are fixed on `main`; a
   presentation's own layouts on its branch. Gate: a list in the tracker,
   one line per layout, each marked "touch works", "fixed", or "open, with
   the reason".
7. **Skill `feedback-inbox`.** Written to the design below, as it stands
   after todo 2. Gate: ten real marked-up screenshots, sent from the iPad,
   each reach the right session with the right slide named, or are reported
   to the user as not placed.
8. **Skill `live-feedback`.** Gate: a session in the middle of a slide edit
   receives a forwarded screenshot, finishes its current step, makes the
   change, and reports; the page on the iPad never fails to load meanwhile.
9. **Documentation.** The README section
   ([outline](#readme-section)), a paragraph on touch and on `--host` in
   [hosting](../implementation/hosting.md), a workflow document
   `docs/workflows/reviewing-on-a-tablet.md` linked from
   [the index](../index.md), and the touch tests in
   [testing](../implementation/testing.md). Written last, so that every
   sentence describes something that exists.

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
- `npm run dev -- <id> --host` is for a trusted network. It serves every
  file of the checkout to anyone on the network, not only the deck: a
  request to the network address for `/@fs/<checkout>/CLAUDE.md` returns
  the file, because `createViteConfig` sets `server.fs.allow` to the
  repository root. An unpublished or anonymous project is exposed with it.
- The screenshots are of unpublished slides. They are kept under an ignored
  directory and never committed.
- A screenshot the user sent is the user's feedback. What a model wrote
  about the screenshot is that model's reading, and can be wrong: the
  session that edits the slide opens the original image before acting.

## Device checklist

Each row is a hypothesis from the code, to be confirmed or struck on the
device. "Expect" is what the code suggests will happen, not a measurement.

| # | Try | Expect | Where |
|---|---|---|---|
| 1 | Swipe left and right, starting on text or an image | the slide changes | `useSwipeNavigation.js` |
| 2 | Swipe starting on a video, an SVG diagram, or a canvas | nothing happens: a touch that starts on `canvas, svg, video` is left to the element (`INTERACTIVE_SELECTOR`). On a slide that is all media, only the arrow buttons move | `useSwipeNavigation.js` |
| 3 | Look for the fullscreen and presenter buttons at the left of the bar without touching anything | not visible: `.toolbar-buttons` has `opacity: 0` until `.presentation:hover` | `index.css` |
| 4 | Tap fullscreen on the iPad, then on the iPhone | iPad: fullscreen, the bar hides, and there is no visible way back but Safari's own. iPhone: nothing, and an exception, because Safari on iPhone has no `requestFullscreen` on the page and `useFullscreen` calls it unguarded | `useFullscreen.js` |
| 5 | Open the slide overview | impossible without a keyboard: only the **O** key opens it | `AudienceView.jsx` |
| 6 | iPhone, portrait: find the slide number | absent: under 768 px wide, `.nav-dots` and `.nav-slide-counter` are hidden | `index.css` |
| 7 | iPhone and iPad, Safari with its toolbars showing: is the whole navigation bar visible, in both orientations | unknown: the page is sized with `height: 100%`, the presenter view with `100vh`, and Safari's toolbars change the visible height | `index.css` |
| 8 | Double-tap a slide; pinch; drag a slide up and down | unknown: the page does not set `touch-action`, and `.slide` has `overflow-y: auto` | `index.css` |
| 9 | Tap a slide dot in a long deck | hard to hit: a dot's slot is 16 px wide and shrinks to 6 px | `index.css` |
| 10 | Swipe from the left edge of the screen | Safari's "back" gesture may take the swipe | none |
| 11 | Let every video slide play; then turn on Low Power Mode and reload | videos play inline and muted (`Media.jsx` sets `muted` and `playsInline`); in Low Power Mode the poster shows instead | `Media.jsx` |
| 12 | Go through the whole deck twice without reloading | no reload by Safari. Every media file is kept in memory as a Blob (`preload.js`): about 58 MB for the explainer, 39 MB for the lecture | `preload.js` |
| 13 | Lecture only: the two `.webm` videos and the 13 MB GIF | unknown; the explainer's 33 videos are all H.264 `yuv420p` MP4, which iOS plays | media |
| 14 | Tap the presenter button | a new tab, not a second window; iOS suspends the tab in the background, so the two do not run side by side | `AudienceView.jsx` |
| 15 | Edit a slide on the computer while the iPad shows it | the iPad updates by hot reload, without a touch | Vite |
| 16 | Add the page to the Home Screen and open it from there | unknown; the page declares nothing for it | `index.html` |

## Touch fixes

### Candidates: defects

Each is built only if its checklist row fails.

- **Toolbar visible where nothing can hover** (row 3). The toolbar shows
  at rest when the device's pointer cannot hover (`@media (hover: none)`,
  a query about the input device in the window's own controls, not a
  viewport query inside a slide).
- **Fullscreen only where it exists** (row 4). `useFullscreen` reports
  whether the Fullscreen API is present; the button is not rendered when it
  is not. On an iPad in fullscreen, a way back that does not need a key.
- **Page height** (row 7). The audience and presenter views take the height
  that is visible with the browser's toolbars showing.
- **`preview --host`**. `scripts/preview.mjs` pins `host: 'localhost'`; it
  takes the same flag as `scripts/dev.mjs`. A static build is the quicker
  page to load on a tablet and hands out only `dist/<id>/`.
- **Fewer files on the network.** With `--host`, the development server
  hands out the client, the presentation's slides, layouts, and `public/`,
  and what Vite itself needs, and refuses the rest of the checkout (the
  plans, the trackers, a presentation's `assets/`). Control: the probe in
  the tracker, repeated, returns 403 for those.

### Candidates: behavior changes

Each changes something a desktop user or an existing slide has today, so
each is the user's decision.

- **Swipes that start on media** (row 2). Media that only show something
  (a video without controls, a static SVG) let the swipe through; an
  element that takes drags declares it with `data-no-swipe`, as sliders and
  charts already do. The interactive canvases and SVGs of the lecture and
  the workshops would each need the attribute, so this lands with an audit
  of them and a browser test that dragging each still does not change the
  slide.
- **An overview button** in the toolbar (row 5), next to fullscreen.
- **The slide number on narrow windows** (row 6): the counter stays when
  the dots hide.
- **Which slide a screenshot shows.** A screenshot carries the counter
  (`12 / 40`) when the window is wide and not fullscreen, and nothing
  otherwise; it never carries the build step. A URL flag in the manner of
  `?bars=hidden` (`?review`) would add the slide's id and step to the
  navigation bar, outside the stage. It makes placing a screenshot a matter
  of reading a label. Without it, the inbox compares the screenshot with
  the frames of the last capture run.
- **Larger targets** (row 9) for the dots and toolbar buttons where the
  pointer is coarse.
- **Zoom and scroll gestures** (row 8), if the pass shows the page zooming
  or the slide sliding under a finger.
- **Home Screen** (row 16): the two `meta` tags that open the page without
  Safari's toolbars, if the user wants screenshots without them.

### Not planned

The presenter window on a tablet (row 14): reviewing does not need it. It
is stated as a limit in the README.

## Browser tests

The suites run Chromium at 1280×720; `audience.test.mjs` already sets
`hasTouch` and checks swipes and nine window sizes. Three additions:

- **Sizes.** The window-size test also runs at an iPad's and an iPhone's
  sizes, portrait and landscape, with Playwright's device descriptors
  (touch, device pixel ratio, mobile viewport). Slides are not captured at
  these sizes: a slide is the same 1280×720 picture at any scale, so
  `npm run capture` already covers it.
- **A touch path for every action.** One test lists the actions of the
  README's key table and asserts, with the keyboard unused, that each can
  be done: next, previous, overview and its closing, fullscreen where the
  browser has it.
- **WebKit.** `UI_TEST_BROWSER=webkit` after
  `npx playwright install webkit` runs the suites on the engine nearest to
  Safari. It is not Safari on iOS: it has no toolbars that resize the page,
  and whether it plays the decks' videos on Windows is to be measured. The
  device pass stays the gate for rows 7, 10, 11, 12, and 16.

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

1. **Does a photo have a path?** Send one screenshot from the iPad's Photos
   to a Remote Control session and ask the session where the image is on
   disk. Decides whether an image can be handed on at all.
2. **Does a file have a path?** Save the same marked-up screenshot to the
   Files app and attach it as a file. Decides the fallback for test 1: one
   more tap on the iPad.
3. **Session to session.** Two sessions in this checkout, on this machine:
   one sends the other a path, the other opens the image. Also settles how
   a session is named so that the name says which slides it works on.
4. **How small can the model be?** Ten real marked-up screenshots from
   todo 1, read by Haiku and by Sonnet: the slide and step named, each mark
   and what it points at transcribed, each compared with the user's own
   account. The inbox runs on the smallest model that places all ten and
   misreads no mark.

If tests 1 and 2 both fail, an image cannot leave the session that received
it. The user then chooses between sending each screenshot directly to the
session that works on the slide (no inbox), and a folder on the computer
that the tablet's photos sync into, with the same two skills reading from
it.

### Design

Two kinds of session run in the checkout. **Working sessions** edit slides,
on the model the work needs; each is named for the presentation and the
section or slides it has. **The inbox** is one session on a small model
with Remote Control on; it is the session the user opens in the Claude app.
Neither watches a folder or polls: an upload is a message to the inbox, and
a forward is a message to a working session.

**`feedback-inbox`**, for each message that carries screenshots:

1. Keep the image under `data/feedback/<id>/<date>/`, which is ignored by
   git, with the user's typed words beside it, verbatim.
2. Place it: the presentation, the slide's id, and the build step, with how
   each was found (the review label, the counter, a match against the last
   capture run's frames, or the user's words) and how sure the reading is.
3. Read the marks: for each, what it is (a circle, an arrow, handwriting),
   what on the slide it points at, and the handwriting transcribed, with
   anything illegible said to be illegible.
4. Send the working session for that slide one message: the path of the
   original image first, the user's words, then the reading, labeled as the
   inbox's reading. A screenshot that concerns several slides goes to each
   of their sessions, whole.
5. Tell the user, on the iPad, where each screenshot went. A screenshot the
   inbox cannot place, or one for a slide no session is working on, is
   reported and kept with the status "not placed"; the inbox asks rather
   than guesses.

The inbox edits nothing in the repository but `data/feedback/`.

**`live-feedback`**, for a working session while it edits a deck:

1. Before the work starts, the deck is served (`npm run dev -- <id>
   --host`), the page loads, and the session's name says what it has.
2. When a message arrives, finish the current step so the deck still
   loads, then open the original image and compare it with the inbox's
   reading. Where they disagree, the image decides.
3. Record the user's words, quoted and dated, in the project tracker's
   "Standing directions", with the image's path. A direction about slides
   in general also goes to `docs/style/slides.md`.
4. Make the change. A marked change to wording or order is the user's own
   direction on content and is made; a mark whose meaning is unclear is
   asked about, not interpreted. Deleting a slide or a media file is
   confirmed first.
5. Keep the page loading throughout: a slide enters `presentation.json`
   only once it loads. The tablet shows the change by hot reload.
6. Reply naming what was done for each mark and which slide and step to
   look at, and what was not done and why.

## README section

"Reviewing on an iPad or iPhone", after "Quick start":

- **Serve it**: `npm run dev -- <id> --host`, the "Network" address it
  prints, the same Wi-Fi, a trusted network; on Windows, allowing Node
  through the firewall.
- **Move through it**: a table of touch actions beside the key table
  (swipe, the arrows, the dots, overview, fullscreen), and what a tablet
  does not do (the two-window presenter view).
- **Send feedback**: start the inbox (`claude --model <model>
  --remote-control` in the checkout), open that session in the Claude app,
  take a screenshot, mark it up, attach it, send. What comes back, and
  where the screenshots are kept.
- A link to the workflow document for the rest.

## Completion criteria

- Every checklist row is observed on an iPad and an iPhone and is either
  working or listed as a stated limit in the README.
- `npm run test:ui` covers tablet and phone sizes and a touch path for
  every action, and passes on Chromium; its WebKit result is recorded.
- With `--host`, the development server refuses files outside the deck.
- Ten screenshots sent from the iPad each reach the right working session,
  whole, or are reported as not placed.
- A working session takes a forwarded screenshot mid-edit without the page
  on the tablet failing to load.
- `README.md`, hosting, testing, and the workflow document describe the
  above; both skills are in `.claude/skills/`.
