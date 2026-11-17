# Environments and setup

## Requirements

- Node.js 22 or newer (`node --version`), with npm.
- rclone with access to the asset bucket, for anything that shows media
  ([DATA.md](../../DATA.md)).
- For visual validation, a Chromium browser for Playwright:
  `npx playwright install chromium` once, or an installed Edge or Chrome
  used with `npm run capture -- <id> --channel msedge`.

## Install

```bash
npm install
npm run assets -- pull --all    # media for every presentation on the branch
npm run check                   # every presentation loads and has its assets
npm test
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
