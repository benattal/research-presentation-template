# Testing

Three layers, each run by Node's built-in test runner or a script:

| Command | What it checks | Needs |
|---|---|---|
| `npm test` | pure modules (presentation model, slide positions, poll state, live API, narration export, recording plans) and repository structure | Node |
| `npm run test:ui` | every view, core layout, and live feature, driven in a real browser | a browser |
| `npm run check` and `npm run capture -- <id>` | the presentations of the branch: loading, assets, rendering | assets; a browser for capture |

`npm test` and `npm run test:ui` test the framework against fixtures in
`tests/fixtures/`, so they pass on every branch whatever its presentations.
`check` and `capture` test the branch's own presentations
([visual validation](visual-validation.md)).

## Browser tests

```bash
npx playwright install chromium   # once
npm run test:ui
UI_TEST_BROWSER=msedge npm run test:ui    # or use an installed Edge or Chrome
```

The suites in `tests/ui/` start their own servers on free ports (a Vite
development server for local mode, the gateway for live mode) and run one
file at a time:

| File | Covers |
|---|---|
| `layouts.test.mjs` | every core layout at every build step: its content, loaded media, and no errors or overflow; fails when a core layout is added without a fixture slide; and the overflow report on slides that do not fit |
| `audience.test.mjs` | keys, buttons, dots, overview, swipes (and drags on controls that are not swipes), focus handling, position persistence, toolbar, progress bar, the stage alone with `?bars=hidden`; the stage and each slide heading holding still across every slide and build step, and every `SlideTitle` header alike (math in a title included); at nine window sizes, for the fixture and a generated 70-slide deck (`longDeck` in `harness.mjs`), the navigator is centered and the stage stays clear of the navigation bar, toolbar, and progress bar |
| `presenter.test.mjs` | the presenter window following and driving the audience window, per-step notes, the preview, the timer, and saving edited notes without reloading the audience |
| `live.test.mjs` | presenter login and logout, votes across browsers, changing a vote, live results, reset with C, numeric polls, closed voting, follow-the-presenter |
| `errorsAndHosting.test.mjs` | the load-error screen, unknown modes, and a static build served under a URL prefix |

`tests/ui/harness.mjs` holds the shared setup. The fixture
`tests/fixtures/ui-showcase/` uses every core layout once, with SVG media
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
