# Recording a run-through

`npm run record` films a presentation from start to end, as its audience
would see it presented: every slide and every build step in order, each
held long enough for its animation or its narration. It writes an H.264
video at a constant frame rate, with the narration mixed in when one is
given. The video is for reviewing a deck's pacing and motion, and for
drafts of a narrated video.

A step is one key press of the audience view: one build step of one slide.
Steps are numbered from 0 across the presentation, and `timeline.json`
lists them.

## Running it

```bash
npm run record -- <id>                          # the whole presentation, silent
npm run record -- <id> --narration <dir>        # held for, and mixed with, narration
npm run record -- <id> --only 12-20             # steps 12 to 20 only
npm run record -- <id> --out <dir>              # write somewhere else
npm run record -- <id> --size 1280x720 --fps 60
npm run record -- <id> --channel chrome         # Chrome instead of Edge
npm run record -- <id> --url http://localhost:5173/   # a deck that is already served
```

| Option | Default | Meaning |
|---|---|---|
| `--out <dir>` | `data/recordings/<id>/<YYYYmmdd-HHMMSS>/` | where the files go |
| `--narration <dir>` | none | a [narration directory](#narration); steps are held for their narration and its audio is mixed in |
| `--only <first>-<last>` | every step | the step indexes to record, both included |
| `--channel msedge\|chrome` | `msedge` on Windows, `chrome` elsewhere | the installed browser that films |
| `--size <width>x<height>` | `1920x1080` | the video's size in pixels, both even; the 1280×720 stage is scaled to fit it |
| `--fps <n>` | `30` | the video's frame rate |
| `--url <url>` | none | film this deck instead of starting a server; it must be the presentation `<id>`, served by this version of the framework |

It needs `ffmpeg` on `PATH` and an installed Edge or Chrome, and it says
what to install when either is missing. Playwright's own Chromium cannot
film: it has no H.264 decoder, so slides' MP4 videos would be blank.
Assets must be present (`npm run assets -- pull <id>`).

Each run writes a fresh directory, ignored by git:

```text
data/recordings/<id>/<YYYYmmdd-HHMMSS>/
  run-through.mp4     the video; with --narration, with sound
  video-only.mp4      with --narration: the same video without sound
  timeline.json       when each step was shown, and what the capture measured
  contact-sheet.png   the last frame of every step, in order, five to a row
```

Look at the contact sheet first: each tile should show its step finished.
Then read the two lines the command prints about the capture
([below](#reading-the-capture-numbers)).

## How long each step is held

Holds are data. A presentation may have a `recording.json` beside its
`presentation.json`, described in the
[presentation format](presentations.md#recordingjson); `npm run check`
validates it. It gives, for the slides that need it, how long each build
step's own motion takes (`seconds`) and whether that motion plays once
(`oneShot`) or loops.

| Recording | Step | Held for |
|---|---|---|
| silent | has an entry | `seconds` + 0.5 s |
| silent | has no entry | `defaultHold` (5 s unless set) |
| narrated | has a narration segment | the segment + 0.35 s, and at least `seconds` + 0.5 s when `oneShot` |
| narrated | has no segment | `silentHold` (2.5 s unless set), and at least `seconds` + 0.5 s when `oneShot` |

A one-shot animation is shown in full however short its narration; a loop
is cut when the narration ends. The margins are `MOTION_MARGIN_S` and
`NARRATION_GAP_S` in `core/tooling/recording.js`, where `stepHold` owns
these rules. Every recording opens with `LEAD_IN_S` (1.5 s) before the
first step's time.

The presentation's first step is on screen when the recording starts, so
its entrance animation is not filmed. A recording that starts later
(`--only 12-20`) opens on the step before its first one and arrives by a
key press, so the lead-in shows step 11 and step 12 plays its entrance.

## Narration

`--narration <dir>` names a directory with two files and the audio they
name:

```text
<dir>/manifest.json   { "segments": [{ "id": "intro", "file": "intro.wav", "duration_s": 4.2 }, ...] }
<dir>/steps.json      [{ "slide": "title", "step": 0, "segment": "intro" }, ...]
```

`manifest.json` lists the audio segments: an `id`, a `file` relative to
the directory, its length in seconds, and optionally its measured
loudness (`lufs_i`, in LUFS), which the mix uses. `steps.json` says which segment
belongs to which step: `slide` is a slide id, `step` its 0-based build
step, and `segment` a segment id, or `null` for a step without narration.
Other fields in either file are ignored, and a step that `steps.json` does
not mention has no narration.

The command stops before recording, listing every mismatch, when
`steps.json` names a step the presentation does not have, names a segment
the manifest lacks, or gives one step two segments, and when an audio file
is missing.

Each segment starts at the time the page handled its step's key press
(`at` in `timeline.json`). When the manifest gives every segment's
measured loudness (`lufs_i`, which `narration/narrate.py` writes), each
segment gets the gain that brings it to −16 LUFS, with a limiter that
keeps its true peak under −1.5 dBTP, so every step sounds as loud as the
next; on the explainer's narration that brought segments from a spread
of 4.8 dB to 0.3 dB. Without the measurements the summed narration is
normalized as a whole, which sets the average and keeps the differences
(`narrationMixFilter`). The video is encoded once, without sound, as
`video-only.mp4`; `run-through.mp4` adds the sound without encoding the
picture again.

## How it works

`scripts/record.mjs` starts a Vite server for the presentation in local
mode (unless `--url` names one), and opens the audience view in headless
Edge or Chrome with the GPU, in a window of the video's size. It prints
the WebGL renderer, and warns when that is a software renderer: slides
that draw with WebGL would not keep up.

The page is the audience view itself, opened with `?bars=hidden`, which
leaves out the progress bar and the navigation bar so the stage fills the
window. Keys, preloading, and transitions work as they do when presenting.
The command waits for `data-slides-ready` on `<body>`, which the audience
view sets once every slide's media is in memory and every layout's
`prepare` has run, then presses the right arrow key once per step.

Frames come from the browser's screencast (`Page.startScreencast` of the
Chrome DevTools Protocol). The browser sends a JPEG when the page changes,
stamped with its time: none while a slide is still, and each rendered frame
during an animation. `frameGrid` in `core/tooling/recording.js` lays them
on the video's constant frame rate, repeating the frame on screen to fill
the time between two frames, and the frames are piped to ffmpeg (H.264,
`-crf 15`, no metadata).

Key press times are read from the page: a listener records when the page
handled each press, and `timeline.json` and the narration use that time,
not the time the command sent the key.

## Limits

The capture is in real time. The page animates at its own speed while the
command films it, so the video is faithful only while the machine keeps
up, and two runs do not produce the same frames. It is not frame exact. A
record view that advances the page's clock one frame at a time, so that
every frame is rendered and none can be late, is unfinished on the branch
`recorder-wip`.

Three behaviors of the screencast shape what a recording can get wrong:

- The browser keeps at most three frames waiting for the command's
  acknowledgement, and drops every frame after them. The command
  acknowledges a frame as soon as it reads it, so frames are dropped only
  when the command or the machine is late. If the page stops changing
  while frames are being dropped, the browser sends nothing more, and the
  capture would show the page as it was before the dropped frames until
  the next change. So 150 ms after the last change, the command starts the
  screencast again, which sends the page as it is. A change recovered this
  way shows in the video late, by the time the page took to go quiet.
- The browser encodes frames in parallel, so a frame can arrive after a
  newer one. The command drops a frame older than the one on screen.
- Nothing tells the command that a frame was dropped during an animation
  that keeps running. The video then holds the previous frame for longer;
  the next frame corrects it.

## Reading the capture numbers

The command prints what the capture measured, and `timeline.json` records
it under `capture`:

| Field | Meaning | A good run |
|---|---|---|
| `framesReceived` | frames the browser sent | none while a slide is still, tens per second during animation |
| `framesOutOfOrder` | frames that arrived after a newer one, and were dropped | a few percent of the frames |
| `framesRecovered` | changes whose frame the browser dropped, shown late after restarting the screencast | 0 |
| `maxFrameDelay` | the longest time, in seconds, between a frame's stamp and the command reading it | under 0.25 |
| `maxPressToFrame` | the longest time, in seconds, between the page handling a key press and the first frame after it | under 0.05 |

Each step in `timeline.json` has `at`, the time the page handled its key
press, and `firstFrameAt`, the time of the first frame after it, both in
seconds from the start of the video. `firstFrameAt` is `null` for a step
that arrived without a key press (the presentation's first) and for a step
during which no frame arrived.

The command warns when `framesRecovered` is not 0, and when either delay
passes 0.25 s. Both mean the machine did not keep up: other work was
running, or the laptop was throttling. Record again when it is idle; the
recording is not corrected afterwards.
