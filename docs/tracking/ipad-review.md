# Reviewing a deck on an iPad or iPhone: tracking

[Plan](../plans/ipad-review.md)

Current state: the plan is written and nothing is built. The explainer is
being served on the network for the user's first pass on an iPad. Resume
from the newest entry below.

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
