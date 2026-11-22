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
- **Recording.** `npm run record`: a run-through video of any deck, holds
  from the deck's `recording.json`, narration placed by the timeline and
  leveled per segment; `?bars=hidden` shows the stage alone.
- **Project branches.** `main` is merged into `gen-nlos-explainer`,
  `guest-lecture`, and `vision-workshop`. A project branch that deleted
  `presentations/example/` deletes the files `main` adds there, on every
  merge.
- **Skills.** `start-presentation` and `narrated-video`, pointing at the
  workflows.
- **A repository someone else can pick up.** Guides for people in
  `docs/guides/` (getting started, walkthroughs, the skills, reviewing on
  a tablet), apart from the workflows for agents; a README that starts a
  new presentation and sets up an asset store; an asset store that is any
  rclone remote or folder (`core/tooling/assetStore.js`), with the owner's
  bucket as the default only; tests that fail when a skill is missing from
  the README or the guide, or a link names a heading that does not exist.
- **Player features** that the explainer needed and every deck gets:
  the step clock, media preloading kept in memory, video posters,
  `prepare` for slow layouts, `progressBar: false`.

### Open

1. **The comparison grid in core.** The explainer's `panels` layout (a
   grid of labeled media over one stitched video, panels revealed and
   dimmed per step, timed boxes on a region, groups on a panel) is the
   layout other decks will want first. It moves to `core/client/layouts/`
   with a slide in the example deck and browser-test coverage, under a
   name that says what it is. It waits until the explainer's collaborators
   have stopped editing it: moving a file that someone is changing costs
   them a conflict.
2. **Smaller layouts in core**, by the same procedure and the same wait:
   the annotated photo (callouts in the margins, one per step) and the
   section card.
3. **A type scale and panel tokens in core.** Core defines the tokens a
   theme overrides (`--type-title`, `--type-text`, `--type-small`;
   `--bg-panel`, `--radius-panel`, `--panel-padding`, `--panel-gap`), core
   layouts take their sizes from them, and a repository test fails on a
   literal font size in a layout. Today the rule ("one type scale per
   deck") is kept by hand, and only the explainer's theme defines the
   tokens.
4. **A frame-exact recorder.** `npm run record` captures in real time, so
   a busy machine drops frames. A record view that advances a virtual
   clock and screenshots every frame was started and not finished. Its
   branch was deleted from the remote at the user's word; the one commit
   (b3a35a5) remains as the local branch `recorder-wip` on the machine it
   was written on. Start from it if that machine is at hand, or write it
   again behind the same command.
5. **The recorder's open points**
   ([recording](../implementation/recording.md)): a real run with
   `--url`; the first step is filmed as loaded,
   without its entrance; this machine stalls for about a second in most
   full runs, which the command reports and cannot correct.
6. **The narration tools' open points**
   ([narration](../implementation/narration.md)): the duration estimate
   (160 words a minute; the Kokoro voice measured 150, and the silence
   around segments is not counted); sentence splitting after a
   single-letter word; the `qwen` and `chatterbox` environments and macOS
   untried from `setup.sh`.

## Rules

- Framework changes are made on a short-lived branch from `main`, reach
  `main` after the browser tests, and are then merged into project
  branches; the remote keeps `main` and one branch per presentation
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
