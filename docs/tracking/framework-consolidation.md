# Framework consolidation: tracking

[Plan](../plans/framework-consolidation.md)

Current state: `main` holds the rules, workflows, the glossary, the
`media/` convention, the narration tools, the recorder, and two skills.
Resume from the newest entry below.

## Standing directions

Every direction the user gives about this work, quoted and dated.

2026-11-19:

- "If you could actually spend some time on organizing the code a bit,
  merging useful work into the main branches/other branches that would be
  great (incl. feedback that is general to other presentations as well).
  Might be nice to have a glossary of different presentation types as
  well."
- "Clean up the code to make it more extensible, merge useful work and
  insights into main/into the core codebase. Some of the work for video
  recordings and voice recordings is also quite valuable as well. Some
  durable instructions for workflows here would be great".
- "By the way my collaborators will be working on the repo simultaneously,
  so do your best to work well with them".
- "Please clean up the extraneous branches on the remote not representing
  a presentation when you get the chance to (once their work is complete).
  main, gen-nlos-explainer, guest-lecture, vision-workshop should all
  stay".
- "Yeah don't use simlinks like that" (of junctions between checkouts).

## 2026-11-19 19:20 — `main` moved

- `npm run test:ui` on the framework branch: 36 of 36 pass (199 s),
  including the new `?bars=hidden` test. `npm test`: 79 pass. `npm run
  build -- example` builds.
- `main` fast-forwarded to the framework branch (29 commits); the remote's
  `framework-sync` is deleted after that, and `lecture-numbers` was
  deleted earlier (every commit on it is in `guest-lecture`).
- Kept on the remote, each with one commit that no other branch has:
  `recorder-wip` (the frame-exact recorder, plan item) and
  `nlos-comparison-polish-wip` (paused slide work of the explainer).
- Next: merge `main` into the three presentation branches.

## 2026-11-19 18:30 — the recorder, per-segment loudness, skills

User direction (2026-11-19): the remote keeps `main`, `gen-nlos-explainer`,
`guest-lecture`, `vision-workshop`; other branches go once their work is
complete (quoted above).

- Merged the recorder port: `npm run record`, `core/tooling/recording.js`,
  `recording.json` (validated by `npm run check`), `?bars=hidden` in the
  audience view, `docs/implementation/recording.md`. Five conflicts with
  the narration port, each one line added by both in the same place; both
  kept. `npm test`: 79 pass.
- The builder's finding on late frames: the browser keeps at most three
  unacknowledged screencast frames and drops the rest, so a change could
  be missing until the next one. The recorder drops out-of-order frames,
  restarts the screencast 150 ms after the last change, and reports late
  and recovered frames. On the example deck (13 steps, 1920×1080): presses
  shown within 26 ms, one frame 964 ms late, one change recovered.
- Loudness: the recorder now gives each narration segment the gain to
  −16 LUFS from the manifest's `lufs_i`, with a limiter. Measured on twelve
  segments of the explainer's narration (sources −23.3 to −17.7 LUFS): per
  segment −16.5 to −16.2 LUFS, peak −1.8 dBFS; normalizing the sum as
  before left −19.8 to −15.0.
- Skills: `start-presentation`, `narrated-video`.
- Not run: `npm run test:ui` (next; `main` moves when it passes). Not
  tried: a real `npm run record --narration` run with the merged code.
- Remote branches besides the four kept: `framework-sync` (goes when
  `main` has it), `recorder-wip`, `nlos-comparison-polish-wip`,
  `lecture-numbers`; each is examined before it is deleted.

## 2026-11-19 16:45 — documents, media scripts, narration

User directions (2026-11-19): see "Standing directions".

- On `framework-sync`: the general rules in `docs/style/slides.md` and
  `slide-review.md`; `docs/style/presentation-types.md`; `docs/workflows/`
  (three procedures); `media/` in the presentation format; Python caches
  ignored; `narration/`, `npm run narration`, their tests and documents
  (merged from a builder's branch: 57 node tests and 12 Python tests pass;
  on the example deck, a fresh environment built by `narration/setup.sh`
  reproduced identical audio, and a plain-prose segment transcribed with no
  errors).
- On `gen-nlos-explainer`: nine media scripts moved from the bucket into
  `media/`, with one definition of where the sources are; three of them
  re-run to byte-identical outputs; `pronunciation.json` tracked.
- Found: narration segments differ in loudness (−25 to −18 LUFS for a −16
  target), because gain-only normalization stops at the peak ceiling.
- Not done: the recorder (a builder is porting it); `npm run test:ui`;
  `main`; the merges into `guest-lecture` and `vision-workshop`.
- Deferred on purpose: moving the explainer's layouts to core, while a
  collaborator is editing them.
