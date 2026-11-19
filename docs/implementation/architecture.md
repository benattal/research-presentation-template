# Architecture

The framework turns a directory of slide data into a web page. This document
says which file owns each part of that path, so a change has one place to
go.

## From files to a page

```text
presentations/<id>/presentation.json ─┐
presentations/<id>/slides/*/content.json ┤   core/client/presentation/load.js
presentations/<id>/layouts/index.js ──┤──▶ buildPresentation()  ──▶ presentation
core/client/layouts/index.js ─────────┘                              │
                                                                     ▼
                                      core/client/App.jsx picks a view by ?mode=
                         audience │ presenter │ preview │ capture
```

1. A script (`scripts/dev.mjs`, `build.mjs`, `serve.mjs`, `capture.mjs`,
   `check.mjs`) finds the presentation with
   `core/tooling/presentations.js` and asks `core/tooling/viteConfig.js` for
   its Vite configuration. That configuration makes `core/client/` the Vite
   root, points the alias `@presentation` at `presentations/<id>/`, uses
   `presentations/<id>/public/` as the public directory, and defines two
   constants: `__PRESENTATION_ID__` and `__LIVE_SERVER__`.
2. `core/client/presentation/load.js` is the only client module that reads
   a presentation's files. It globs `slides/*/content.json`, imports the
   manifest and the layout registry, and calls `buildPresentation`.
3. `buildPresentation` (`core/client/presentation/model.js`, pure) validates
   everything, resolves asset paths, and returns the flat slide list every
   view navigates. If anything is wrong it throws a `PresentationError`
   listing every problem, and `main.jsx` shows them instead of the slides.
4. `App.jsx` chooses one of four views by the `mode` query parameter.

## Ownership

| Concern | Owner |
|---|---|
| Which presentations exist; their ids and directories | `core/tooling/presentations.js` |
| Vite configuration for every command | `core/tooling/viteConfig.js` |
| Whether a live server hosts the build | the hosting script, through `__LIVE_SERVER__` |
| Validating a presentation; slide order; step counts | `core/client/presentation/model.js` |
| Asset URLs (`/slides/...` → base-relative) | `prefixAssetPaths` in `model.js`; `assetUrl` for code |
| Getting slides ready before they are reached (media in memory, a layout's `prepare`) | `core/client/presentation/preload.js`, started by the audience view and the presenter's preview |
| Which notes file a step shows and saves to | `notesFileName` in `model.js` |
| The 1280×720 design size and scaling | `core/client/stage/Stage.jsx` |
| Slide transitions | `core/client/stage/transitions.js`, applied by `SlideFrame.jsx` |
| Current slide position of a window | `core/client/navigation/useSlidePosition.js` (moves in `position.js`) |
| Keys and swipes | `core/client/navigation/useKeyboardNavigation.js`, `useSwipeNavigation.js` |
| Audience ⇄ presenter window messages | `core/client/presenter/presenterChannel.js` |
| Who counts as the presenter | `core/client/presenter/presenterAccess.jsx` |
| Saving edited notes (development only) | `core/tooling/notesWriter.js` (a Vite plugin) |
| Live API, votes, presenter position | `core/server/liveApi.js`, `pollState.js` |
| Presenter password and token | `core/server/presenterAuth.js` |
| Voting open, follow-the-presenter on | the server's environment, served at `api/settings` |
| Serving presentations in live mode | `core/server/gateway.js` |
| In-browser capture checks | `core/client/capture/CaptureView.jsx` |
| Capture runs and their contact sheet | `scripts/capture.mjs`, `core/tooling/contactSheet.js` |
| Run-through recordings: holds, the frame grid, narration placement | `scripts/record.mjs`, `core/tooling/recording.js` |

## Views

| `?mode=` | Component | Purpose |
|---|---|---|
| (none) | `audience/AudienceView.jsx` | the slides, with navigation, toolbar, overview |
| `presenter` | `presenter/PresenterView.jsx` | timer, notes (editable in development), current slide preview, next slide |
| `preview` | `presenter/PreviewView.jsx` | the presenter window's iframe of the current slide |
| `capture` | `capture/CaptureView.jsx` | one slide and step at design size, for `scripts/capture.mjs` |

The audience view also reads `?bars=hidden`, which leaves out its progress
bar and navigation bar so the stage fills the window, with keys and
preloading unchanged. `scripts/record.mjs` films that page
([recording](recording.md)).

The audience and presenter windows talk over a `BroadcastChannel` named after
the presentation id. The audience window owns the position; the presenter
window and its preview follow it and send `next`/`previous` commands. Two
presentations open in one browser never share a channel, a stored position,
or a poll vote.

## Local and live

The client has one code path for features that need a server. Each such
feature asks `LIVE_SERVER` (from `live/liveApi.js`) once and otherwise
behaves the same:

- presenter access: the local implementation makes everyone the presenter;
  the live one asks for the server's password;
- polls: local polls show their options and a "local mode" badge; live polls
  vote through the API and receive counts through server-sent events;
- follow-the-presenter: active only when the live server's settings say so.

See [hosting](hosting.md) for running each mode.

## Server

`core/server/gateway.js` builds one Express app for every presentation:
`/<id>/` serves the presentation (Vite middleware in development, the build
in `dist/live/<id>/` in production) and `/<id>/api/` its live API. Each
presentation has its own poll state, saved to `.live-state/<id>.json`, so poll
ids never collide across presentations. `/` redirects to the presentation
whose manifest sets `"servedAtRoot": true`, or lists every presentation.

## Tests

`tests/` runs on Node's built-in test runner: `npm test` covers the pure
modules and repository structure, and `npm run test:ui` drives every view,
core layout, and live feature in a browser. See [testing](testing.md).
