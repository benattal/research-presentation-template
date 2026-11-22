# Environments and setup

## Requirements

- Node.js 22.12 or newer (`node --version`), with npm.
- rclone with access to the asset store, for a presentation that has
  media ([DATA.md](../../DATA.md) says how to get access or set up a store
  of your own). The example presentation has none.
- For visual validation, a Chromium browser for Playwright:
  `npx playwright install chromium` once, or an installed Edge or Chrome
  used with `npm run capture -- <id> --channel msedge`.
- For recording a run-through (`npm run record`), ffmpeg on `PATH` and an
  installed Edge or Chrome ([recording](../implementation/recording.md)).

## Install

```bash
npm install
npm run assets -- pull --all    # media of the branch's presentations; needs the store
npm run check                   # every presentation loads and has its assets
npm test
npm run test:ui                 # needs Playwright's Chromium, or UI_TEST_BROWSER=msedge
```

One `npm install` at the repository root installs everything; presentations
have no packages of their own.

## Running

[Hosting](../implementation/hosting.md) describes local and live mode. In
short: `npm run dev -- <id>` presents one presentation with no server;
`npm run serve` runs the live gateway and needs `.env` (copy `.env.example`
and set `PRESENTER_PASSWORD`).

## Ports

| Port | Used by |
|---|---|
| 5173 | `npm run dev` (change with `--port`) |
| 4173 | `npm run preview` |
| 3000 | the live gateway (`PORT`) |
| 24678 and up | hot-reload sockets of the live gateway in development, one per presentation |

## Windows

The scripts run the same under PowerShell, cmd, and Git Bash
(`npm run ...`). Git stores text files with LF line endings
(`.gitattributes`).
