# Visual validation

A slide deck is checked by looking at it. `npm run capture` renders every
slide at every build step in a headless browser, screenshots it at the
1280×720 design size, records what went wrong in the page, and writes a
contact sheet for review. It is the evidence that a change to a deck, a
layout, or the framework did what it was meant to and nothing else.

## Running it

```bash
npm run capture -- <id>                       # every slide and step
npm run capture -- <id> --slides intro,method # only these slide ids
npm run capture -- <id> --scale 2             # 2560×1440 screenshots
npm run capture -- <id> --strict              # exit 1 on any error or warning
npm run capture -- <id> --channel msedge      # use an installed browser
```

The first run needs a browser: `npx playwright install chromium` once, or
`--channel msedge` / `--channel chrome` to use one already installed. Assets
must be present (`npm run assets -- pull <id>`).

Each run writes a fresh directory, ignored by git:

```text
data/captures/<id>/<YYYYmmdd-HHMMSS>/
  01-title-1.png              <slide number>-<slide id>-<step>.png
  04-building-up-1.png ... 04-building-up-3.png
  diff/                       changed pixels, for frames that changed
  report.json                 every frame's findings
  index.html                  the contact sheet
```

Open `index.html` in a browser. The filters show all frames, only frames
with errors or warnings, or only frames that changed since the previous run;
a changed frame can be toggled between now, before, and the difference.

## What it checks

| Finding | Kind | Meaning |
|---|---|---|
| console error, uncaught exception | error | a layout threw or logged an error |
| failed request | error | a missing asset (HTTP 404) or a request that failed |
| image or video did not load | error | a media element never produced a frame |
| `slide-scrolls` | warning | the slide's content is taller than 720 pixels |
| `clipped` | warning | an element cuts off its own text (`overflow: hidden`, ellipsis) |
| `outside-stage` | warning | visible content extends past the stage edge |
| changed | information | more than 0.1% of pixels differ from the previous run |

Content a layout clips on purpose, inside its own `overflow: hidden` box, is
not reported. A full-bleed decoration that is meant to extend past the stage
is marked `data-overflow-ok` in its layout. Chromium's routine aborts of
media range requests are not reported; a video that really fails is caught
by the media check.

## How it works

`scripts/capture.mjs` starts a Vite dev server for the presentation in local
mode, opens Playwright's Chromium at 1280×720, and loads
`?mode=capture&slide=<index>&step=<step>` for every frame.
`core/client/capture/CaptureView.jsx` renders that one slide on an unscaled
stage, finishes every framer-motion animation immediately, waits for fonts,
images, and videos (then pauses videos so frames are repeatable), and
publishes `window.__captureReport` with its media and overflow findings.
The script adds the console errors and failed requests it observed,
screenshots the stage, and compares each frame with the same file in the
previous run using pixelmatch.

Layouts that animate on a timer (cycling backgrounds, autoplaying sequences)
change between runs; their "changed" flag is expected and the diff shows
where.

## Using it while iterating

1. Capture before changing anything, so the next run has a baseline.
2. Make the change.
3. Capture again and open the contact sheet with the "Changed" filter: every
   changed frame should be one you meant to change.
4. Fix every error and warning at its cause. A warning on a slide you did
   not touch is a finding to report.

Capture after any framework change on every presentation of the branch;
a change to a core layout or to `index.css` reaches all of them.
`npm run check` complements capture: it needs no browser, runs in seconds,
and catches unknown layouts, missing slides, and missing assets.
