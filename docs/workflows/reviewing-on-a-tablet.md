# Reviewing a deck on a tablet or phone

A deck is edited on a computer, usually with an agent, and read on whatever
is at hand. This is the procedure for reading it on an iPad or iPhone on
the same network while it is being edited, and for sending remarks back as
marked-up screenshots. It has three parts: opening the deck on the device,
moving through it by touch, and the path a screenshot takes to the session
that edits the slide.

The deck has no drawing or upload feature. Marking up is done with the
device's own screenshot tools, and a screenshot travels as a message in the
Claude app, through Claude Code's Remote Control.

## 1. Open the deck on the device

```bash
npm run dev -- <id> --host
```

The command prints a "Network" address and, under it, the same address
with `?review`. Open the second one in Safari on the device. With
`?review` the navigation bar names the current slide's id and build step
(`step 2/3`) beside the slide counter, so a screenshot of the page says
what it shows.

- **The same network.** The device and the computer are on the same Wi-Fi.
  A guest network that keeps its clients apart will not connect them.
- **The firewall.** On Windows, Node must be allowed through the firewall
  for the network's profile (the prompt appears the first time a server
  listens on the network).
- **A network you trust.** Every device on the network can read the deck:
  its slides, its presenter notes, its media. The server reads nothing
  else from disk: the rest of the checkout (plans, trackers, other
  presentations) and the presentation's `assets/` are refused
  (`servedFiles` in `core/tooling/viteConfig.js`).
- **A build instead.** `npm run build -- <id>` and then
  `npm run preview -- <id> --host` serve the static build: only
  `dist/<id>/`, a quicker first load, and no hot reload.
- **Without Safari's bars.** Add the page to the Home Screen (Share, "Add
  to Home Screen") and open it from there: it then has the whole screen.

The page on the device follows the files: a saved change shows by hot
reload, without a touch.

## 2. Move through it by touch

Everything a key does has a touch path, apart from resetting a poll, which
the presenter does at a keyboard.

| Action | Touch | Key |
|---|---|---|
| Next, previous | swipe left or right on the slide; or the bar's arrows | → ← and the others |
| Jump to a slide | a dot in the bar; or the slide counter, then a card | O, then click |
| Close the overview | × at its top; or a card | Escape |
| Fullscreen | the toolbar's button, where the browser has it | F |
| Presenter window | the toolbar's button | P |

- **Swipes.** One finger, travelling farther sideways than up or down. A
  swipe may start on text, an image, a video without controls, or a
  drawing. It is left to the element when it starts on a form control, a
  link, a video with controls, or a region a layout marked `data-no-swipe`
  ([presentation format](../implementation/presentations.md)). A layout
  whose canvas or SVG takes drags marks it; otherwise a drag on it changes
  the slide.
- **Narrow windows.** Under 768 px wide the dots are left out; the slide
  counter stays, and it opens the overview.
- **Fullscreen.** Safari on an iPhone has no fullscreen for pages; the
  button is not shown there. Use the Home Screen page, or `?bars=hidden`
  for the stage alone. In fullscreen the bar is hidden, so the review
  label is too: take review screenshots outside fullscreen.
- **The presenter window** opens as a second tab on a tablet. A tablet
  keeps one tab running at a time, so the two-window presenter view is for
  a computer.

## 3. Send feedback

Two kinds of Claude Code session run in the checkout, each with a skill:

- a **working session** edits slides, on the model the work needs, with
  the `live-feedback` skill. It serves the deck, lists the slides it has
  in `data/feedback/sessions.md`, and takes feedback at its next safe
  point without the page failing to load;
- the **inbox** is one session on a small model with Remote Control on,
  with the `feedback-inbox` skill. It is the session opened on the device.
  For each screenshot it keeps a copy, works out the presentation, slide,
  and step, reads the marks, and sends the working session for that slide
  the image's path, the user's words, and its reading.

Neither polls. A screenshot is a message to the inbox; a forward is a
message between sessions, read between tool calls when the receiver is
busy and starting a turn when it is idle.

### Set up

1. In the working session, say that you will review on a tablet. It runs
   `live-feedback`: serves the deck with `--host`, registers, and gives
   you the address.
2. In a second terminal, in the checkout, start the inbox and ask it to
   run the feedback inbox:

   ```bash
   claude --model haiku --remote-control
   ```

   `--model` sets the model of that session only. Typing `/model` inside a
   session also changes the default for new sessions.
3. On the device, open that session in the Claude app (or at
   claude.ai/code), signed in to the same account.

Remote Control needs a claude.ai login on a paid plan, and the computer
awake with the session open. Messages between sessions need Claude Code
2.1.234 or newer on Windows; `/list-agents` shows the sessions that can
be reached.

### For each remark

1. Take a screenshot with the bar showing (on an iPad with a Pencil, swipe
   up from a bottom corner), and mark it up.
2. Attach it in the Claude app, add a few words if the marks need them,
   and send. The session is told where the attachment was saved on the
   computer (a file under `~/.claude/uploads/<session id>/`), and that
   path is what the inbox hands on: a message between sessions carries
   text only. If an image arrives without a path, the inbox says so and
   asks for it again as a file (Done, "Save to Files", attach from Files).
3. The inbox answers on the device with where the screenshot went. The
   working session makes the change and replies with the slide and step to
   look at; the page on the device has already reloaded.

With one working session and no need for a small model, skip the inbox:
start the working session itself with Remote Control (`/remote-control`)
and send the screenshots to it.

### Where things are kept

- `data/feedback/<id>/<date>/`: each screenshot and, beside it, the user's
  words and the inbox's reading. Git ignores `data/feedback/`: the slides
  are unpublished.
- `data/feedback/sessions.md`: the working sessions and their slides.
- The project's tracker, "Standing directions": the user's words, quoted
  and dated, written by the session that made the change.

## What is checked

`npm run test:ui` drives the audience view with touch at a tablet's and a
phone's sizes in both orientations, and asserts that every key's action
can be done by touch ([testing](../implementation/testing.md)). That runs
in Chromium's emulation, or in Playwright's WebKit with
`UI_TEST_BROWSER=webkit`; neither is Safari on a device. What only a
device shows (Safari's own toolbars and gestures, video playback, memory)
and what only use shows (a screenshot's way from the Claude app to a file
on the computer) is listed, with what has been observed so far, in the
[plan](../plans/ipad-review.md) and its tracker.
