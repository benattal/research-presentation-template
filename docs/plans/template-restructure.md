# Template restructure

[Latest status and resume point](../tracking/template-restructure.md) ·
[Architecture](../implementation/architecture.md) ·
[Visual validation](../implementation/visual-validation.md)

Turn the vision-workshop monorepo into `research-presentation-template`: a
generic framework for interactive slide decks, with one branch per project.
Done means `main` holds the framework, one example presentation, and the
documentation; `vision-workshop` holds the four workshop decks in the new
layout; `guest-lecture` holds one locally hosted deck with no server; all
three branches build, pass the checks, and capture cleanly; large media live
in the `tcig-projects` R2 bucket instead of git; the repository starts from a
fresh history on the new remote.

## Immediate todos

Work these in order, one at a time.

### Done

1. **Plan and tracker.** This file and its tracker exist.
2. **Framework in `core/`.** `core/client`, `core/server`, `core/tooling`;
   presentations are data plus `layouts/index.js`. `npm run check` and
   `npm test` pass.
3. **Two hosting modes.** Local mode (Vite only) and live mode (gateway),
   both run end to end, including a two-browser live test.
4. **Bug fixes.** Framework and layout fixes are listed in the trackers
   (`template-restructure`, and `vision-workshop` on that branch).
5. **Visual validation pipeline.** `npm run capture`; every presentation
   captures with no errors or warnings.
6. **Documentation.** Agent files, `docs/`, `DATA.md`, agent skills
   (`sync-assets`, `validate-slides`); every document reachable from
   `docs/index.md` (tested).

### Open

7. **Assets to R2.** Upload `public/` and `assets/` of every workshop
   presentation with `npm run assets -- push <id>` (which verifies with
   `rclone check`) and write the prefix `README.md`. Blocked until rclone is
   installed on this machine. Gate: a pull into an empty directory
   reproduces the files.
8. **Branches and fresh history.** Re-initialize git; commit `main`; branch
   `vision-workshop` and `guest-lecture` from it; push all three to
   `github.com/benattal/research-presentation-template`. Gate: each branch
   passes `npm run check` and `npm test`.

## Rules

- A presentation is a directory under `presentations/<id>/`. Its directory
  name is its id and its URL segment; nothing else names it.
- Code lives in `core/` only when two or more presentations use it, or when
  it is part of the framework every presentation gets (navigation, presenter
  tools, live features). A layout used by one presentation lives in that
  presentation.
- Each behavior has one owner. The hosting script decides whether a live
  server exists; the server decides whether voting is open and whether the
  audience follows the presenter; the client asks the server instead of
  reading a second copy of the same setting.
- Media and source decks are assets: they live in the bucket and in ignored
  `public/` and `assets/` directories, never in git.
- The old history stays on `github.com/benattal/stem-hs-diffusion`; nothing
  on the new remote depends on it.

## Design as deployed

`core/tooling/presentations.js` discovers presentations and validates their
manifests. `core/tooling/viteConfig.js` builds one Vite configuration per
presentation: the shared client in `core/client/` is the Vite root, the alias
`@presentation` points at `presentations/<id>/`, and `publicDir` points at its
`public/`. `core/client/presentation/` loads the manifest, slide contents, and
layouts through that alias. The audience view, the presenter window, the
presenter's preview iframe, and the capture view are four modes of the same
client, chosen by the `mode` query parameter.

## Completion criteria

- `main`, `vision-workshop`, and `guest-lecture` exist on the new remote with
  a fresh history.
- Each branch passes `npm run check`, `npm test`, and `npm run build`.
- `npm run capture` reports no console errors, failed requests, or overflow
  on the example and guest-lecture presentations; workshop findings are
  recorded in the tracker.
- The R2 copy of every workshop asset passes `rclone check`.
