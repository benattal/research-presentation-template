# Template restructure: tracker

[Plan](../plans/template-restructure.md)

Newest entry first.

## 2026-11-17 — Browser tests for every view and core layout

User direction (2026-11-17): "Could you make/run some tests on all UI
components to make sure they are working correctly?"

- Added `npm run test:ui` (tests/ui/, 28 tests in 5 suites) against the
  fixtures `tests/fixtures/ui-showcase` (every core layout) and
  `tests/fixtures/broken`; documented in
  [testing](../implementation/testing.md).
- Bugs the tests found, fixed: every page load logged a 404 for
  `/favicon.ico` (an inline icon in `core/client/index.html` now); changing
  a vote quickly could leave the browser showing the first choice while the
  server recorded the second, because vote responses can arrive out of order
  (`core/client/live/polls.js` now applies only the latest response and takes
  counts only from the server's stream).
- Checked the tests catch regressions: breaking build-step navigation and
  the slider-focus fix each made the audience suite fail.
- Checked: `npm test` 25 passing, `npm run test:ui` 28 passing (twice),
  `npm run check`.

## 2026-11-17 — Framework, tooling, and documentation landed; assets wait for rclone

User directions (2026-11-17), quoted: "use data/captures for visual
validation", "A subdirectory within data"; "When you're done with
everything, commit and push. Remember to create the new branch of the new
guest lecture presentation (and commit/push)"; "Items from
CLAUDE.md/AGENTS.md in research-project-template should also be ported
here".

- Landed: `core/` (client, server, tooling), `scripts/`, `tests/`, the
  example presentation, documentation, `DATA.md`, agent skills; the workshop
  presentations moved into `presentations/` on the `vision-workshop` branch.
- Framework fixes beyond the audit list below: a focused slider or button no
  longer swallows the presenter's arrow keys; touch drags on sliders,
  canvases, and `data-no-swipe` regions no longer change slides; the presenter
  window's notes, Markdown renderer, and editing load only in the presenter
  window; poll result labels wrap instead of being cut off; viewport media
  queries were removed from every layout (the stage is scaled, not
  reflowed).
- Checked: `npm run check` (all presentations load; only draft slides miss
  assets), `npm test` (25 passing), `npm run build:live` (6 builds), a
  production gateway smoke test, a two-browser live test (login, following,
  vote replacement, live results, reset with C, no page errors), and the
  notes writer (step routing, guards). Capture runs in `data/captures/`: 213
  frames over six presentations, 0 errors, 0 warnings.
- The rclone download was refused by the permission classifier; the user was
  asked to install rclone (`winget install Rclone.Rclone`). Until then the
  workshop assets exist only in this checkout's ignored `public/` and
  `assets/` directories and in the old repository's history.
- Next: commit the three branches with a fresh history and push; upload the
  assets once rclone is available.

## 2026-11-17 — Audit findings in the framework; restructure started

User directions (2026-11-17), quoted:

- "Turn this repository into a generic presentation template, with a new
  remote at https://github.com/benattal/research-presentation-template."
- "Please set up a DATA.md file for noting that assets should be pushed to my
  "projects" R2 bucket (credentials of which should be available in my home
  directory)."
- "Please set up different branches for different projects (including the
  current project, though you should re-organize its structure to make it a
  bit more modular)."
- "Please create a new branch called "guest-lecture" that I will be working
  from -- and which should just be hosted locally/with no associated server."
- "Please also start a fresh git history, remove the current large files from
  the project (pushing them to the bucket)."
- "Please also create some documentation/a pipeline on visual validation of
  the slides, since this is important for iterating on any given deck."
- "Btw for most presentations there will not be a "landing page" as there is
  with the stem-hs-workshop. Normal presentation structure with a title slide,
  content slides, etc." and "The landing page should perhaps by a different
  kind of slide?"

State before the restructure: commit `381783a` on
`github.com/benattal/stem-hs-diffusion` (`main`, fully pushed). Four
presentations (`diffusion`, `filtering`, `face-and-hand-tracking`,
`image-minipulation`) each carried identical copies of `main.jsx`, `App.jsx`,
`Presentation.jsx`, the data loaders, `vite.config.js`, a backend server, and
two `package.json` files with different Vite majors (6 in the presentations,
8 at the root). Git history: 220 MB, mostly slide media and source `.pptx`.

The bucket the user calls "projects" is `tcig-projects` (rclone remote
`tcig`; configuration in `~/Downloads/cloudflare/rclone.conf`, instructions in
`~/Downloads/cloudflare/cloudflare-instructions.txt`). rclone is not
installed on this machine; downloading the binary was refused by the
permission classifier, so the upload waits for the user to install rclone.

Framework bugs found by reading the code (fixed in the restructure):

- Slide position (`sessionStorage` keys `slide-index`, `slide-build`), the
  presenter `BroadcastChannel` (`vision-workshop-presenter`), poll "voted"
  flags, and edited notes in `localStorage` were not namespaced by
  presentation. All presentations share one origin behind the gateway, so a
  reload of one deck restored another deck's position, and a presenter window
  opened from one deck drove every open deck.
- Poll stores were global and keyed only by `pollId`, so two presentations
  with the same poll id shared counts. A persisted poll kept its old options
  after `content.json` changed them.
- Runtime poll counts were committed to git
  (`packages/core/backend/data/polls.json`).
- `server/dev.mjs` did not mount the numeric-poll route, so the numeric poll in
  the tracking deck failed in development but worked in production.
- The presenter password was hard-coded in source and in `README.md`.
- `setSlidePosition` called `setDirection` inside a `setCurrentIndex` updater;
  React may call updaters twice.
- A restored build step was validated against a constant (`100`) rather than
  the restored slide's step count.
- Notes edited in the presenter window were cached in `localStorage` and
  shadowed later changes to `notes.md` indefinitely.
- The presenter preview iframe accepted `postMessage` from any origin.
- Each voting and follow-the-presenter switch needed two environment variables
  (`VOTING_DISABLED` and `VITE_VOTING_DISABLED`, and so on) that had to agree.
- `ColabLinkSlide` fell back to a QR code for the old Railway deployment when
  a slide had no Colab URL.

Next: build `core/`, move the presentations, then fold in the per-layout audit
findings.
