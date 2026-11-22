# Reviewing on a tablet or phone

For the person reviewing a deck. A deck is edited on a computer, usually
with an agent, and read on whatever is at hand. This is how to read it on
an iPad or iPhone on the same network while it is being edited, and how to
send remarks back as marked-up screenshots. The agents' side of it is
[the review workflow](../workflows/reviewing-on-a-tablet.md).

The deck has no drawing or upload feature. You mark up a screenshot with
the device's own tools and send it as a message in the Claude app, through
Claude Code's Remote Control.

## 1. Open the deck on the device

On the computer (or ask the agent: "I'll watch on my iPad"):

```bash
npm run dev -- <id> --host
```

It prints a "Network" address and, under it, the same address with
`?review`. Open the second one in Safari on the device. With `?review` the
bar at the bottom names the current slide's id and build step (`step 2/3`)
beside the slide counter, so a screenshot says what it shows.

- **The same network.** The device and the computer are on the same Wi-Fi.
  A guest network that keeps its clients apart will not connect them.
- **The firewall.** On Windows, allow Node through the firewall when asked
  (the prompt appears the first time a server listens on the network).
- **A network you trust.** Every device on the network can read the deck:
  its slides, your presenter notes, its media. Nothing else of the
  repository is served.
- **Without Safari's bars.** Share, "Add to Home Screen", and open the page
  from there: it then has the whole screen.

The page follows the files: when a slide is saved on the computer, the
device shows the change by itself.

A slide that shows a blank picture or a question mark is almost always a
media file that is missing on the computer, not a problem with the tablet:
ask the agent to check the assets (`npm run check -- <id>`).

## 2. Move through it by touch

| To | Do |
|---|---|
| go to the next or previous step or slide | swipe left or right on the slide, or tap the arrows in the bar |
| jump to a slide | tap its dot in the bar; or tap the slide counter (`12 / 40`), then a card |
| close the overview | tap × at its top |
| go fullscreen (iPad; not on an iPhone) | the first button at the bottom left |

- A swipe is one finger moving sideways. It can start on text, a picture,
  or a video. On a control (a slider, a plot you can drag) the touch
  belongs to the control.
- On a phone held upright the dots are left out; the counter is there, and
  it opens the overview.
- In fullscreen the bar is hidden, and with it the `?review` label: take
  review screenshots outside fullscreen.
- The presenter window (notes, timer) needs a computer with two windows.

## 3. Send feedback

You need Claude Code's Remote Control: a claude.ai login on a paid plan,
the same account in the Claude app on the device, and the computer awake
with the session open.

### With one session editing (the usual case)

1. In the session that edits your slides, type `/remote-control` (or start
   it with `claude --remote-control`), and tell it you will send
   screenshots: it uses its `live-feedback` skill.
2. On the device, open that session in the Claude app (or at
   claude.ai/code).
3. For each remark: take a screenshot with the bar showing (on an iPad
   with a Pencil, swipe up from a bottom corner), mark it up, tap Done,
   attach it in the Claude app with a few words if the marks need them,
   and send.
4. The session finishes what it is doing, makes the change, and answers
   with the slide and step to look at. The page on your device has already
   reloaded.

### With several sessions editing: add an inbox

When one session has the introduction and another the results, you would
have to know which to send each screenshot to. An **inbox** does that for
you: a second, cheap session that only receives screenshots and forwards
each to the session that has that slide.

1. In each editing session, say you will review on a tablet. Each one
   serves or finds the deck and writes its name and its slides into
   `data/feedback/sessions.md`.
2. In another terminal, in the repository:

   ```bash
   claude --model haiku --remote-control
   ```

   and say "run the feedback inbox". (`--model` sets that session's model
   only. Typing `/model` inside a session also changes your default.)
3. On the device, open *that* session in the Claude app, and send
   screenshots as above.
4. The inbox answers on the device with where each screenshot went. The
   editing session makes the change and says what to look at.

How the forwarding works: Claude Code sessions on the same computer can
send each other text by name (`/list-agents` shows them). The inbox saves
your screenshot under `data/feedback/`, works out the slide from the
`?review` label, and sends the editing session the file's path with your
words and its own reading of the marks. The editing session opens the
image itself, and trusts the image over the reading.

### If a screenshot does not arrive as a file

The session is told where each attachment was saved on the computer, and
that path is what gets passed along. An image sent while the session is in
the middle of answering can arrive without one. The session says so; send
that screenshot again once it has answered, or save it to Files first
(Done, "Save to Files") and attach it from there.

### Where things are kept

- `data/feedback/<id>/<date>/`: each screenshot with your words and the
  inbox's reading beside it. Git ignores this folder: the slides are
  unpublished, and nothing in it leaves your computer.
- The project's tracker (`docs/tracking/<id>.md`), "Standing directions":
  your words, quoted and dated, written by the session that made the
  change.

## What has been tried

Browser tests cover the touch controls at a tablet's and a phone's sizes.
On a real iPad, the toolbar and the whole bar have been seen to show under
Safari's own bars, a marked-up screenshot sent from the iPad has arrived
in a session as a file, and a Haiku session has passed a screenshot's path
to another session, which opened it. The inbox skill has not yet been run
through a whole review, and an iPhone has not been tried:
[the plan](../plans/ipad-review.md) lists what is still to observe. If
something does not behave as this page says, that is a bug worth
reporting.
