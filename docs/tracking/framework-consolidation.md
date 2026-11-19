# Framework consolidation: tracking

[Plan](../plans/framework-consolidation.md)

Current state: rules, workflows, the glossary, the `media/` convention, and
the narration tools are on `framework-sync`; the recorder is being ported;
`main` has not moved. Resume from the newest entry below.

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
- "Yeah don't use simlinks like that" (of junctions between checkouts).

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
