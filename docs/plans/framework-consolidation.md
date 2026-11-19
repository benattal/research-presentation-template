# Framework consolidation

[Latest status and resume point](../tracking/framework-consolidation.md)

The explainer video project (`gen-nlos-explainer`) produced tools, layouts,
and rules that other presentations need: a recorder, local narration,
workflows, a comparison grid, style rules. This plan moves what is general
out of that one deck and into the framework and its documents, so that the
next presentation starts with them.

## Immediate todos

### Done

- **Rules and procedures.** The slide style guide and review checklist hold
  the explainer's general feedback; `docs/style/presentation-types.md` is
  the glossary of presentation types; `docs/workflows/` holds the
  procedures (making a presentation, a narrated video, working together).
- **Media scripts are code.** A presentation keeps the scripts that build
  its media in `media/`, in git ([presentation format](../implementation/presentations.md)).
- **Narration.** `narration/` (local text-to-speech, transcription for
  checking) and `npm run narration` (a deck's notes as a script).
- **Player features** that the explainer needed and every deck gets:
  the step clock, media preloading kept in memory, video posters,
  `prepare` for slow layouts, `progressBar: false`.

### Open

1. **Recorder.** `npm run record`: a run-through video of any deck, with
   narration placed by the timeline, holds from the deck's
   `recording.json`. Check: unit tests, a recording of the example deck.
2. **`main`.** The framework branch reaches `main` after
   `npm run test:ui` passes on an idle machine; `main` is then merged into
   the project branches.
3. **Skills.** Short skills for the narrated-video workflow, pointing at
   the documents.
4. **The comparison grid in core.** The explainer's `panels` layout (a
   grid of labeled media over one stitched video, panels revealed and
   dimmed per step, timed boxes on a region, groups on a panel) is the
   layout other decks will want first. It moves to `core/client/layouts/`
   with a slide in the example deck and browser-test coverage, under a
   name that says what it is. It waits until the explainer's collaborators
   have stopped editing it: moving a file that someone is changing costs
   them a conflict.
5. **Smaller layouts in core**, by the same procedure and the same wait:
   the annotated photo (callouts in the margins, one per step) and the
   section card.
6. **A type scale and panel tokens in core.** Core defines the tokens a
   theme overrides (`--type-title`, `--type-text`, `--type-small`;
   `--bg-panel`, `--radius-panel`, `--panel-padding`, `--panel-gap`), core
   layouts take their sizes from them, and a repository test fails on a
   literal font size in a layout. Today the rule ("one type scale per
   deck") is kept by hand, and only the explainer's theme defines the
   tokens.
7. **A frame-exact recorder.** `npm run record` captures in real time, so
   a busy machine drops frames. A record view that advances a virtual
   clock and screenshots every frame is unfinished on branch
   `recorder-wip`; finish it behind the same command, or delete the
   branch.
8. **Narration loudness.** Segments are normalized with gain only, so a
   segment with high peaks stays below the target. Level them with a
   limiter, or in the recorder's mix.

## Rules

- Framework changes are made on `framework-sync`, reach `main` after the
  browser tests, and are then merged into project branches
  ([working together](../workflows/working-together.md)).
- Code moves to `core/` when every presentation gets it, when two
  presentations use it, or when it is a pattern layouts share; a layout
  used by one presentation stays there until a second needs it or the user
  asks for it in core.
- A layout that moves to core gets a slide in the example presentation, a
  row in [layouts](../implementation/layouts.md), and browser-test
  coverage, in the commit that moves it.
- Nothing moves while its owner is editing it.

## Completion criteria

- `main` holds the recorder, the narration tools, the workflows, and the
  rules; every project branch has merged it.
- The comparison grid, the annotated photo, and the section card are core
  layouts, used by the explainer from core.
- `npm test` fails on a literal font size in a layout.
- One recorder remains.
