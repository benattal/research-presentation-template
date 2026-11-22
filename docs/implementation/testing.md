# Testing

Three layers, each run by Node's built-in test runner or a script:

| Command | What it checks | Needs |
|---|---|---|
| `npm test` | pure modules (presentation model, slide math, slide positions, poll state, live API, narration export, recording plans, the asset store) and repository structure | Node |
| `npm run test:ui` | every view, core layout, and live feature, driven in a real browser | a browser |
| `npm run check` and `npm run capture -- <id>` | the presentations of the branch: loading, assets, rendering | assets; a browser for capture |

`npm run test:ui` and the module tests of `npm test` use fixtures in
`tests/fixtures/`, so they pass on every branch whatever its presentations.
`npm test` also checks the structure of each presentation on the branch (a
README that says how to pull its assets, no build files of its own, no
viewport media queries, imports through `@core`) and that the README and
the skills guide name every skill. The asset store's tests copy files with
rclone, and are skipped, saying so, on a machine without it. `check` and
`capture` test the branch's own presentations
([visual validation](visual-validation.md)).

## Browser tests

```bash
npx playwright install chromium   # once
npm run test:ui
UI_TEST_BROWSER=msedge npm run test:ui    # or use an installed Edge or Chrome
npx playwright install webkit     # once, for the next line
UI_TEST_BROWSER=webkit npm run test:ui    # Playwright's build of Safari's engine
```

WebKit is the engine nearest to Safari on an iPad or iPhone, and is not
that browser: it has none of Safari's toolbars and gestures. What only a
device shows is checked on a device
([reviewing on a tablet](../guides/reviewing-on-a-tablet.md)).

The suites in `tests/ui/` start their own servers on free ports (a Vite
development server for local mode, the gateway for live mode) and run one
file at a time:

| File | Covers |
|---|---|
| `layouts.test.mjs` | every core layout at every build step: its content, loaded media, and no errors or overflow; fails when a core layout is added without a fixture slide; and the overflow report on slides that do not fit |
| `audience.test.mjs` | keys, buttons, dots, overview, swipes (on media that only show something, and not on controls, on regions marked `data-no-swipe`, with two fingers, or mostly up and down), a touch path for every action a key has (it fails when a key is added without one), the toolbar at rest where nothing can hover, no fullscreen button where the browser has none, the `?review` label, focus handling, position persistence, toolbar, progress bar, the stage alone with `?bars=hidden`; the stage and each slide heading holding still across every slide and build step, and every `SlideTitle` header alike (math in a title included); at nine window sizes, and on a tablet and a phone held both ways as Playwright describes them (`TOUCH_DEVICES` in `harness.mjs`), for the fixture and a generated 70-slide deck (`longDeck`), the navigator is centered, the counter shows, and the stage stays clear of the navigation bar, toolbar, and progress bar |
| `presenter.test.mjs` | the presenter window following and driving the audience window, per-step notes, the preview, the timer, and saving edited notes without reloading the audience |
| `live.test.mjs` | presenter login and logout, votes across browsers, changing a vote, live results, reset with C, numeric polls, closed voting, follow-the-presenter, the gateway's listing at `/` and its redirect from `/<id>` to `/<id>/` |
| `errorsAndHosting.test.mjs` | the load-error screen, unknown modes, the development server serving the deck from disk and refusing the rest of the checkout, and a static build served under a URL prefix |

`tests/ui/harness.mjs` holds the shared setup. The fixture
`tests/fixtures/ui-showcase/` uses every core layout at least once, with SVG media
(text files, so they live in git) and one presentation-specific layout;
`tests/fixtures/broken/` has the errors the load-error test expects, and
`tests/fixtures/overflow/` the text that the overflow report must catch.

## Adding a core layout

Add a slide using it to `tests/fixtures/ui-showcase/` (and to the slide
order in its `presentation.json`), and an entry for that slide in
`EXPECTATIONS` in `tests/ui/layouts.test.mjs`. The layout test fails until
both exist. The suites find fixture slides by id (`goToSlide(page, 'poll')`
and `counterText('poll')` in `harness.mjs`), so adding slides does not
disturb them.
