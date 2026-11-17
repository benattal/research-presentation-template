# research-presentation-template

Interactive slide decks for research talks, lectures, and workshops, written
as data and rendered by a small React framework. A presentation is a
directory of JSON and Markdown; the framework gives every presentation the
same audience view, presenter window, keyboard and touch navigation, and
visual validation, and can add live audience features (polls,
follow-the-presenter) through an optional server.

## Using this template

`main` holds the framework and one example presentation. Each project lives
on its own branch:

1. Branch from `main`: `git switch -c <project>`.
2. Start a presentation: `npm run new -- <id> --title "Talk title"`, and
   delete `presentations/example/`.
3. Say what is specific to the branch in the "This branch" section of
   `CLAUDE.md` and `AGENTS.md` (edit both; a test checks that their shared
   sections match).
4. Keep framework fixes on `main` and merge `main` into the branch.

| Branch | Contents | Hosting |
|---|---|---|
| `main` | framework, documentation, `presentations/example/` | either mode |
| `vision-workshop` | four interactive workshops for high-school students and a landing deck | live gateway (Railway) |
| `guest-lecture` | one research guest lecture | local only, no server |

## Quick start

```bash
npm install                  # Node 22 or newer
npm run dev                  # the only presentation, or: npm run dev -- <id>
```

Open http://localhost:5173/. Press **P** for the presenter window (notes,
timer, preview of the current and next slide); arrow keys in either window
drive the slides.

| Key | Action |
|---|---|
| → ↓ Space Enter PageDown | next build step or slide |
| ← ↑ Backspace PageUp | previous |
| O / Escape | slide overview / close it |
| F | fullscreen |
| P | presenter window |
| C | reset the current slide's poll (live mode, presenter only) |

## A presentation

```text
presentations/<id>/
  presentation.json          title, sections, slide order
  slides/<slide-id>/
    content.json             { "layout": "content", "title": ..., "bullets": [...] }
    notes.md                 presenter notes (notes-<step>.md for one build step)
  layouts/index.js           layouts specific to this presentation
  public/slides/<slide-id>/  images and videos (from the asset bucket)
  assets/                    source decks and raw material (from the asset bucket)
  theme.css                  optional: override the framework's colors and fonts
```

Media are not in git: `npm run assets -- pull <id>` fetches them from the
R2 bucket ([DATA.md](DATA.md)). The format and every core layout are
described in [docs/implementation/presentations.md](docs/implementation/presentations.md)
and [docs/implementation/layouts.md](docs/implementation/layouts.md).

## Commands

| Command | What it does |
|---|---|
| `npm run dev -- <id>` | local mode: one presentation on a Vite dev server, no backend |
| `npm run build -- <id>` | static build in `dist/<id>/`, openable from any static host |
| `npm run preview -- <id>` | serve that build on this machine |
| `npm run serve` | live mode for development: every presentation at `/<id>/` with presenter login, polls, follow-the-presenter |
| `npm run build:live` then `npm start` | live mode for production |
| `npm run new -- <id>` | start a presentation |
| `npm run check` | load every presentation and check its assets, without a browser |
| `npm run capture -- <id>` | screenshot every slide and build step and report overflow, console errors, missing media, and changes since the last run |
| `npm run assets -- pull\|push\|check\|size <id>` | move assets between the checkout and the bucket |
| `npm run extract-pptx -- <deck.pptx>` | pull text, media, and notes out of a PowerPoint deck |
| `npm test` | unit and repository tests |

Live mode needs `PRESENTER_PASSWORD` in `.env` (see `.env.example`).
[Hosting](docs/implementation/hosting.md) covers both modes and deployment.

## Repository layout

```text
core/client/     React framework (the Vite root)
core/server/     live gateway
core/tooling/    presentation discovery, Vite configuration
presentations/   one directory per presentation
scripts/         command-line entry points
tests/           node:test suites
docs/            documentation (start at docs/index.md)
```

## Documentation

Start at [docs/index.md](docs/index.md). Coding agents read
[CLAUDE.md](CLAUDE.md) or [AGENTS.md](AGENTS.md) first.
