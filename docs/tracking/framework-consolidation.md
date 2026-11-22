# Framework consolidation: tracking

[Plan](../plans/framework-consolidation.md)

Current state: `main` holds the rules, workflows, the glossary, the
`media/` convention, the narration tools, the recorder, and two skills;
all three presentation branches have merged it, and the remote holds
only `main` and those three. Resume from the newest entry below.

## Standing directions

Every direction the user gives about this work, quoted and dated.

2026-11-22:

- "It seems like docs/workflows may actually be for agents. I think a clear
  separation between what is for the agent and what is for the user can be
  helpful (specifically, some walkthroughs for the user)"
- The session's goal: "-> Make sure the code, docs, and skills are up to
  date -> Make sure the README provides enough information for a user to
  get started with a new presentation, and each skill * There should be
  more specific documentation for each skill in docs * There should be
  more specific examples of use cases/walkthroughs for users"
- "Looks like some of this exists in docs/workflows -- if this could be
  expanded and linked to from the README that would be good"
- "The main readme also does not list gen-nlos as a branch"
- "I think I would also like you to add a markdown file (somewhere in docs)
  doing a walkthrough of creating a new presentation using some of these
  skills/workflows"
- "Also some instructions in the README for setting up a store for larger
  assets (cloudflare or dropbox) would be good. Cloudflare needs to make
  clear that access tokens are required"
- "Can you make sure that the skill, docs, code are all up to date? I would
  like to share this repository with a collaborator so that they can use
  it"

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
- "Yes push please and delete those remote branches" (answering whether
  to push the `vision-workshop` merge, which may redeploy the live
  service, and whether to delete `recorder-wip` and
  `nlos-comparison-polish-wip`, each holding one unfinished commit that
  no other branch has).
- "Yeah don't use simlinks like that" (of junctions between checkouts).

## 2026-11-22 15:30 — audited for a collaborator: guides, an asset store of one's own, 67 corrections

User direction (2026-11-22): "Can you make sure that the skill, docs, code
are all up to date? I would like to share this repository with a
collaborator so that they can use it", with the further directions quoted
above.

- Method: a script checked that every path, `npm run` script, flag, and
  code identifier named in 31 documents exists (they did); three read-only
  reviewers compared what the documents say with what the code does, one
  group of documents each; and a fresh clone of `main` in a temporary
  folder was walked through as a newcomer would (install, check, tests, a
  new presentation, a project branch without the example, capture, build,
  and an asset store that is a plain folder).
- Found by the walk, and fixed in code:
  - `npm run assets -- pull <id>` failed for a presentation with no
    `assets/` in a store of real directories (a folder, Dropbox): rclone
    reports a missing directory there (exit 3), where R2 lists nothing.
    `pull` now copies the asset directories the store has and says when it
    has none.
  - `pull --all` with nothing in the store for the branch pulled every
    presentation (an empty id list meant "all"). It now says the store
    holds nothing.
  - With no store configured the command printed rclone's own error. It
    now says that rclone has no remote of that name and where the README
    explains the setup.
  - The store's logic moved from `scripts/assets.mjs` to
    `core/tooling/assetStore.js`, with tests against a folder store
    (`tests/assetStore.test.mjs`; skipped, saying so, without rclone).
  - `npm run new` wrote the owner's bucket path into each new
    presentation's README; it now names "the asset store" and asks the
    author to say which.
  - `package.json` allowed Node 22.0; Vite 8 needs 22.12.
- Found by the reviewers and corrected in the documents (67 exact
  replacements in 19 files, each checked against the code first): which
  text fields render math; `title-wraps`, `--compare`, and `--no-compare`
  in the capture documents and the `validate-slides` skill (a full run
  after partial runs was compared with the last partial run); the
  gateway's `/health` and its redirect to `/<id>/`; notes files counted
  from 0; a recording is not an asset until it is copied into `assets/`;
  "push often" against "push only when asked" (now: push git and media
  together, once the user has said the work is pushed); a quoted user in
  the agent files, against their own rule; the structure and command
  blocks of the agent files; a static build "opened from disk", which a
  browser refuses (measured: a `file://` page loads no module script).
- Written: `docs/guides/` for people (`getting-started.md`,
  `walkthroughs.md`, `skills.md`, `reviewing-on-a-tablet.md`), with
  `docs/workflows/` kept for agents and `docs/index.md` saying which is
  which; the README (starting a presentation, large assets with R2's
  access tokens and Dropbox, the skills with what to say, the branch table
  with `gen-nlos-explainer`); `DATA.md` for any store, with the owner's
  bucket as one section; the `sync-assets`, `live-feedback`, and
  `feedback-inbox` skills.
- R2 and Dropbox setup steps are from rclone's and Cloudflare's own pages,
  read on 2026-11-22 (rclone.org/s3 "Cloudflare R2", rclone.org/dropbox,
  developers.cloudflare.com/r2/api/tokens). Tried here: a folder store,
  end to end, and the owner's R2 bucket in dry-run. Not tried here:
  creating an R2 token, and rclone's Dropbox sign-in.
- Left alone, for the owner: `docs/plans/template-restructure.md` still
  lists its last two todos as open (assets to R2; branches and fresh
  history), and the second looks done; `slide-review.md` asks for white
  slides while the default theme is dark (a review rule, not a claim about
  the framework); `guest-lecture` and `vision-workshop` have not merged
  `main`.
- Checked: in the worktree on `docs-audit` (framework as on `main`): `npm test`, 88 of 88; `npm run check`, ok; `npm run test:ui`, 44 of 44 in 75 s. Two earlier runs each failed one test, a different one each time, on `page.goto: Timeout 30000ms` at a test server's first page load, while the machine was throttled (an install that takes 5 s took 3 min); recorded as load. A fresh clone of the final commit in a temporary folder: `npm ci` in 11 s; the README's steps (a branch, `npm run new -- my-talk`, the example deleted) give `npm run check` ok and `npm test` 88 of 88; with no store the asset command names the missing remote and the README section; with a folder as `ASSETS_REMOTE`, push, delete, pull returns the file; `npm run capture -- my-talk`, 5 frames, no errors or warnings.
- Next: the open todos of the plan, unchanged.

## 2026-11-19 21:45 — `vision-workshop` pushed; the remote has four branches

User direction (2026-11-19): "Yes push please and delete those remote
branches".

- `vision-workshop` pushed (dba4b0e to 4008d1d, a fast-forward of the
  remote). Whether the push redeployed the live service was not checked
  from here.
- Deleted from the remote: `recorder-wip` and
  `nlos-comparison-polish-wip`. Both remain as local branches on the
  machine this was done on (b3a35a5, 2316b1f). The second is also a patch
  in the explainer's bucket,
  `assets/parked/nlos-comparison-polish-wip/tracked-changes.patch`,
  beside its media.
- The remote now holds `main`, `gen-nlos-explainer`, `guest-lecture`,
  `vision-workshop`.
- Next: the open items of the plan, in order.

## 2026-11-19 20:30 — `main` merged into the presentation branches

- `gen-nlos-explainer`: merged and pushed, with the deck's
  `recording.json` and its documents updated. `npm test` 79 pass,
  `npm run check` passes for both decks.
- `guest-lecture`: merged and pushed. Conflicts: the two index files
  (both entries kept) and `presentations/example/` (kept deleted,
  including `recording.json`, which `main` added). `npm test` 79 pass;
  `npm run check` passes for both decks with their media copied in; the
  lecture builds.
- `vision-workshop`: merged locally (commit 7f71950 on the local branch),
  `presentations/example/` kept deleted; `npm test` 79 pass, `home`
  builds; `npm run check` reports only media that the temporary checkout
  does not have. Not pushed: the branch is deployed (Railway), a push may
  redeploy the live service, and a redeploy loses poll state unless it is
  kept on a volume. Not run on any project branch: `npm run test:ui`
  (36 of 36 on `main`).
- Remote branches now: `main`, `gen-nlos-explainer`, `guest-lecture`,
  `vision-workshop`, and the two with unmerged, unfinished work
  (`recorder-wip`, `nlos-comparison-polish-wip`). Deleted:
  `framework-sync`, `lecture-numbers`.
- The framework worktree `../rpt-main` is removed after this entry;
  framework work is done on a short-lived branch from `main`.
- Next: the user's word on pushing `vision-workshop` and on the two
  remaining branches; then the open items of the plan.

## 2026-11-19 19:50 — the recorder on a real deck: two fixes

- `npm run record -- gen-nlos-explainer --only 6-10` failed twice, on
  cases the example deck does not have. (1) "Screencast is already
  active": two requests for a fresh frame overlapped, so two stops were
  followed by two starts; restarts are now one at a time. (2) "write
  after end": a frame still on its way when the recording stopped was
  written to the closed encoder; frames after the end are now left out.
- After the fixes, steps 6 to 10 (video, WebGL, a section card): 26.6 s,
  1758 frames received, key presses shown within 153 ms, 4 changes
  recovered, contact sheet correct for all five steps.
- With narration (`--only 6-8 --narration <dir>`, the explainer's earlier
  narration with its one stale step removed): 17.0 s, key presses shown
  within 11 ms, audio at −16.4 LUFS, speech beginning 0.2 s after each
  step (the segments' own lead silence), no metadata beyond the encoder
  tag.
- Both fixes are on `main`. Not tried: `--url`.

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
