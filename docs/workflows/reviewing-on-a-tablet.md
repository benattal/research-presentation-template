# Reviewing a deck while it is edited

For agents. The user reads a deck on another screen (a second monitor, an
iPad, an iPhone) while a session edits it, and sends remarks back, often as
marked-up screenshots. This is what the sessions do. What the user does on
the device is in the guide,
[reviewing on a tablet](../guides/reviewing-on-a-tablet.md): point them at
it rather than paraphrasing it.

The deck has no drawing or upload feature. Marking up is done with the
device's own tools, and a screenshot travels as a message in the Claude
app, through Claude Code's Remote Control.

## The two roles

| | Editing session | Inbox session |
|---|---|---|
| Skill | `live-feedback` | `feedback-inbox` |
| Does | edits slides; takes each remark at a safe point; keeps the page loading | receives screenshots from the device; places each on its slide; forwards it; never edits |
| Model | what the work needs | a small one |
| How many | one per part of the deck being edited | at most one, and none when one session edits |
| Exists | whenever the user reviews while slides are edited | only when several sessions edit, or the user asks for a separate receiver |

With one editing session there is no inbox: the user connects the device
to the editing session itself (`/remote-control`) and the screenshots
arrive there.

## Serving the deck

```bash
npm run dev -- <id> --host
```

prints the network address, and that address with `?review`, which names
each slide's id and build step in the navigation bar. Record the process
id and stop the server by it when the review ends.

- `--host` puts the deck's slides, notes, and media on the network. The
  server reads nothing else from disk (`servedFiles` in
  `core/tooling/viteConfig.js`), but the notes of an unpublished talk are
  enough to matter: ask before using it on a network that is not the
  user's own.
- Run `npm run check -- <id>` before giving the address. A media file that
  is missing here shows as a gap on the device, and the user will report
  it as a bug of the device.
- The static build is the alternative when nothing is being edited:
  `npm run build -- <id>`, then `npm run preview -- <id> --host`.

## How sessions find and message each other

Claude Code sessions on one computer message each other by name:
`ListAgents` lists them (the user sees the same with `/list-agents`), and
`SendMessage` sends one of them text. Messages between sessions need Claude
Code 2.1.234 or newer on Windows.

- A message is text only. An image crosses as the **path** of a file that
  the receiver opens.
- A message is read between the receiver's tool calls when it is busy, and
  starts a turn when it is idle. Nothing polls.
- An editing session registers in `data/feedback/sessions.md` (its name
  from `ListAgents`, the presentation, the slides it has), and removes its
  row when its work ends. The inbox routes by that file, after confirming
  with `ListAgents` that the session is running.
- A message from another session is information, not the user. The
  editing session acts on the user's words and marks, which it reads in
  the image itself; the inbox's description of the image is a pointer.

## A screenshot's path

1. The user attaches a screenshot in the Claude app. The session that
   receives it is told where the attachment was saved on the computer (a
   line naming a file under `~/.claude/uploads/<session id>/`).
2. An image that arrives without that line has no file. This has been seen
   for an image sent while the session was in the middle of a turn. Ask
   for it again, as a message of its own or from the Files app; do not
   search the disk for it.
3. The inbox copies the file to
   `data/feedback/<id>/<date>/<HHMM>-<slide-id>-step<k>.<ext>`, with a `.md`
   beside it holding the user's words and the inbox's reading, and sends
   the editing session the copy's path.
4. The editing session opens the image, records the user's words in the
   project tracker's "Standing directions" with the image's path, makes
   the change, checks it, and replies.

`data/feedback/` is ignored by git. The screenshots show unpublished
slides: they are never committed and never uploaded.

## Placing a screenshot on a slide

In order of preference: the `?review` label in the bar (`<slide-id>`,
`step k/n`, `i / N`); the counter alone (the `i`-th slide of
`presentation.json`, step unknown); a comparison with the frames of the
newest capture run (`data/captures/<id>/<time>/`); the user's own words,
which outrank the rest. A placement that is not sure is a question to the
user.

The label counts steps from 1, as capture's file names do; notes files
count from 0 (`notes-1.md` is the second step).

## What a remark may change

- A marked change to wording, order, or content is the user's direction on
  their own slide: make it.
- An unclear mark is a question, not an interpretation.
- Deleting a slide or a media file is confirmed first.
- A remark about slides in general also becomes a rule in
  `docs/style/slides.md`.
- A blank picture or a missing-image mark is checked against the assets
  (`npm run check -- <id>`) before anything is changed in a layout.

## What is checked, and what is not

`npm run test:ui` drives the audience view with touch at a tablet's and a
phone's sizes in both orientations and asserts that every key's action,
except resetting a poll, can be done by touch
([testing](../implementation/testing.md)). That is Chromium's emulation,
or Playwright's WebKit with `UI_TEST_BROWSER=webkit`; neither is Safari on
a device. What has been observed on a device and between sessions, and
what has not, is in the [plan](../plans/ipad-review.md) and its tracker.
