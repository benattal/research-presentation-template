# Light transport and neural rendering

A guest lecture: the Neumann series, operator light transport (with an
aside on computational imaging), volume rendering, neural rendering, and
adjoint light transport. It is presented locally, with no server. The plan
is [docs/plans/light-transport-and-neural-rendering.md](../../docs/plans/light-transport-and-neural-rendering.md);
its status is in the [tracker](../../docs/tracking/light-transport-and-neural-rendering.md).

## Setting up a new machine

Once per machine, in this order:

1. **Node.js 22 or newer**, with npm, and git (`node --version` checks
   the version).
2. **rclone**: `winget install Rclone.Rclone` on Windows,
   `brew install rclone` on macOS, or the system's package manager. On
   Windows, open a new terminal afterwards so `rclone` is on `PATH`; if
   a shell still does not find it, set `RCLONE` to the full path of
   `rclone.exe` for `npm run assets`.
3. **Bucket credentials.** Copy the `cloudflare/` folder
   (`cloudflare-tokens.txt` and `rclone.conf`) from `~/Downloads/` on the
   main workstation through a private channel: it is in neither the
   repository nor the bucket. Point rclone at it and check the `tcig`
   remote:

   ```bash
   export RCLONE_CONFIG="$HOME/Downloads/cloudflare/rclone.conf"
   rclone lsd tcig:tcig-projects && echo "remote OK"
   ```

   In PowerShell, set it with
   `$env:RCLONE_CONFIG = "$HOME\Downloads\cloudflare\rclone.conf"`. The
   variable lasts for one shell: set it in each new one, set it once for
   good with `setx RCLONE_CONFIG "%USERPROFILE%\Downloads\cloudflare\rclone.conf"`
   on Windows, or write the remote into rclone's default configuration as
   [DATA.md](../../DATA.md), "Setup", shows.
4. **The repository, on the `guest-lecture` branch:**

   ```bash
   git clone git@github.com:benattal/research-presentation-template.git
   cd research-presentation-template
   git checkout guest-lecture
   ```

5. The steps under "Assets" below: `npm install`, pull the assets,
   check, present.

To screenshot and check the slides (`npm run capture`), Edge or Chrome must
be installed (`--channel msedge`), or run `npx playwright install chromium`
once.

## Assets: pull them before presenting

The slides' media and the source material are not in git. Their durable copy
is the R2 bucket `tcig-projects` ([DATA.md](../../DATA.md)), under

```text
tcig-projects/research-presentation-template/presentations/light-transport-and-neural-rendering/
  public/    figures, photos, and videos the slides show (about 38 MB)
  assets/    source decks, papers, and their extracted pages (about 455 MB)
```

On a fresh checkout:

```bash
npm install
npm run assets -- pull light-transport-and-neural-rendering   # needs rclone and the `tcig` remote
npm run check -- light-transport-and-neural-rendering         # reports any asset still missing
npm run dev                                                    # present at http://localhost:5173/
```

`npm run assets` needs rclone and its `tcig` remote, set up once per
machine (above), and `RCLONE_CONFIG` set in the shell if the remote is not in
rclone's default configuration. The interactive slides need no assets: they
render the 2D room in the browser.
A slide whose media are missing shows a broken image, and `npm run check`
lists it.

After adding or changing media, push them:

```bash
npm run assets -- push light-transport-and-neural-rendering    # copies only; never deletes in the bucket
```

**Status (2026-11-17, during review cycle 3):** `public/` (75 files) and
`assets/` (91 files) are in the bucket, verified with `rclone check`. Push
again after adding media.

`assets/sources/README.md` (in the bucket with the assets) records where
every borrowed figure, photo, and video came from; the slides credit them
through `sources.json`.

## Presenting offline

```bash
npm run build -- light-transport-and-neural-rendering   # static build in dist/light-transport-and-neural-rendering/
npm run preview -- light-transport-and-neural-rendering # serve that build locally
```

Fonts, math, and media are bundled into the build, so it needs no network.
