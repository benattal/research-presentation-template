# Hosting

A presentation runs in one of two modes. The hosting script decides which,
and tells the client through the build constant `__LIVE_SERVER__`; nothing
else switches modes.

| | Local mode | Live mode |
|---|---|---|
| Commands | `npm run dev`, `npm run build`, `npm run preview` | `npm run serve`, `npm run build:live` + `npm start` |
| Server | none (Vite's dev server, or any static file host) | Express gateway, `core/server/gateway.js` |
| Presentations per server | one, at `/` | every presentation on the branch, at `/<id>/` |
| Presenter window | yes, no login | yes, after the presenter password |
| Notes editing | development server only | development (`npm run serve`) only |
| Polls | options shown, no voting | live voting from audience devices |
| Follow-the-presenter | no | when `PRESENTER_CONTROLLED=true` |

## Local mode

```bash
npm run dev -- <id>          # http://localhost:5173/, hot reload
npm run dev -- <id> --host   # also reachable from other devices on the network
npm run tutorial             # the first tutorial: npm run dev -- tutorial
```

A presentation outside `presentations/` is named by its directory, with a
leading `./`, in every command of this page.

The development server reloads the page for a change to a slide, a
layout, or the client. It keeps the configuration it started with
(`core/tooling/viteConfig.js`: the build constants, the files it may
serve). After a pull or a merge that changes the framework, restart it:
a client that reads a build constant the running server was not started
with fails with "... is not defined" and shows nothing.

The presenter opens the presenter window with **P** (or `?mode=presenter`)
and drags it to the laptop screen; the audience window goes on the projector
in fullscreen (**F**). The two windows are in the same browser and talk over
a `BroadcastChannel`, so either window's arrow keys and a clicker drive both.

To present from a build instead of the dev server (no hot reload, no file
watching):

```bash
npm run build -- <id>        # dist/<id>/, built with a relative base
npm run preview -- <id>      # http://localhost:4173/
npm run preview -- <id> --host   # the build, on the network as well
```

`dist/<id>/` uses relative paths, so it can also be copied to any static
host or opened under any URL prefix.

### On the network

`--host` makes either server reachable from a tablet or phone on the same
network, to read a deck there while it is edited
([reviewing on a tablet](../guides/reviewing-on-a-tablet.md)). The
development server then prints its network address, and that address with
`?review`, which names each slide's id and build step in the navigation
bar.

Every device on the network can read what the server hands out, so use
`--host` on a network you trust. The development server reads three places
from disk: the client (`core/client/`), the presentation's directory, and
`node_modules/`. It refuses the rest of the checkout and the
presentation's `assets/` (`servedFiles` in `core/tooling/viteConfig.js`).
A deck's slides, presenter notes, and media are the deck, and are served.
The static build serves `dist/<id>/` only. Saving notes from the presenter
window stays limited to this machine (`core/tooling/notesWriter.js`).

The audience view works by touch: swipes, the bar's arrows, the slide
counter for the overview, and a toolbar that shows without hover. The
two-window presenter view needs a computer.

## Live mode

Live mode adds what needs a server: presenter login, polls, and
follow-the-presenter. Configure it in `.env` at the repository root (copy
`.env.example`) or in the hosting service's environment:

| Variable | Meaning |
|---|---|
| `PRESENTER_PASSWORD` | required; the password the presenter window asks for |
| `PORT` | listening port, default 3000 |
| `VOTING_DISABLED=true` | close voting on every poll; results stay visible |
| `PRESENTER_CONTROLLED=true` | every non-presenter browser follows the presenter's slide and its own navigation is disabled |
| `LIVE_STATE_DIR` | where poll votes are saved, default `.live-state/` |

```bash
npm run serve                # development: hot reload, notes editing
npm run build:live           # dist/live/<id>/ for every presentation
npm start                    # production: serves dist/live/
```

The gateway serves each presentation at `/<id>/` and its API at
`/<id>/api/` (see `core/server/liveApi.js` for the routes). `/` redirects to
the presentation whose manifest sets `"servedAtRoot": true`; a branch with
several presentations uses a small landing presentation with a
`presentationLinks` slide for this. Without one, `/` lists the
presentations. `/<id>` redirects to `/<id>/`, and `/health` answers
`{ "status": "ok", "presentations": [...] }` for a hosting service's health
check.

The presenter logs in once in the presenter window; the token is shared by
every window of that browser, so the audience view on the projector also acts
as the presenter (publishing its position when follow-the-presenter is on,
resetting polls with **C**).

Votes are recorded per browser: each browser sends a random voter id kept in
its `localStorage`, and the server keeps one vote per id, so changing a vote
replaces it and reloading cannot vote twice. Poll state is saved per
presentation in `.live-state/<id>.json` and survives restarts on a persistent
disk.

### Deployment

The live gateway deploys as one service from the repository root, for
example on Railway:

| Setting | Value |
|---|---|
| Build command | `npm ci && npm run assets -- pull --all && npm run build:live` |
| Start command | `npm start` |
| Variables | `PRESENTER_PASSWORD`, and optionally the switches above |

Pulling assets during the build needs the bucket credentials in the build
environment (an rclone configuration through `RCLONE_CONFIG`); alternatively
build locally, where the assets already are, and deploy the result. A
deployment's poll state is lost on redeploy unless `LIVE_STATE_DIR` points
at a persistent volume.
