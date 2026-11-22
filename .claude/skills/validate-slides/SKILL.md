---
name: validate-slides
description: Render every slide of a presentation headlessly, screenshot each build step, and review the frames for overflow, console errors, missing media, and unintended changes. Use after editing slides, layouts, themes, or anything in core/ that renders, and whenever asked to check, review, preview, or screenshot a deck.
---

# Validate slides visually

`npm run capture` is the evidence that a deck renders as intended.
`docs/implementation/visual-validation.md` is the full description.

## 1. Preconditions

- Assets present: `npm run check -- <id>` reports no missing assets
  (otherwise use the `sync-assets` skill).
- A browser: Playwright's Chromium (`npx playwright install chromium`), or an
  installed one with `--channel msedge` or `--channel chrome`.

## 2. Baseline, change, capture

Capture before changing anything when no recent run exists, so the next run
has something to compare with:

```bash
npm run capture -- <id>
```

Make the change, then capture again. Restrict to the slides involved while
iterating (`--slides id1,id2`), and capture the whole deck before reporting
done. A run compares itself with the newest earlier run, so compare that
last full run with the baseline, not with a partial run:

```bash
npm run capture -- <id> --compare data/captures/<id>/<baseline run>
```

After a change under `core/`, capture every presentation on the branch.

## 3. Review

The run prints one line per frame and the path of
`data/captures/<id>/<time>/index.html`. Then:

- Fix every ERROR (console error, exception, failed request, media that did
  not load) at its cause.
- Fix every warning (`slide-scrolls`, `clipped`, `text-past-box`,
  `outside-stage`, `title-wraps`) by making the content fit; mark an element
  `data-overflow-ok` only when it is a deliberate full-bleed decoration.
- Open the PNGs of every frame you changed and of every frame the run flags
  as changed, with the Read tool, and check them against what the slide
  should show. Counts alone do not show a slide that is legible but wrong.

## 4. Report

State the run directory, the frame count, the errors and warnings that
remain (with the reason for each), and which changed frames were intended.
Content issues (wording, a wrong label) are proposals for the user, not
edits.
