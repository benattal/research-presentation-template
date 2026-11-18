# Image Filtering Workshop

A vision workshop for high-school students: blur, filtering, edge detection, and from filters to deep learning, with a hands-on notebook.

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
4. **The repository, on the `vision-workshop` branch:**

   ```bash
   git clone git@github.com:benattal/research-presentation-template.git
   cd research-presentation-template
   git checkout vision-workshop
   ```

5. **The notebook's environment** (for the hands-on part): with conda
   installed, `conda env create -f environment.yml` at the repository
   root, then `conda activate vision-workshop`.
6. **The live gateway** (how the workshops are given): copy `.env.example`
   to `.env` at the repository root and set `PRESENTER_PASSWORD`; never
   commit `.env`.
7. The steps under "Assets" below: `npm install`, pull the assets,
   check, present.

To screenshot and check the slides (`npm run capture`), Edge or Chrome must
be installed (`--channel msedge`), or run `npx playwright install chromium`
once.

## Assets: pull them before presenting

The slides' media (`public/`) and source material (`assets/`) are not in
git. Their durable copy is the R2 bucket described in [DATA.md](../../DATA.md),
under `tcig-projects/research-presentation-template/presentations/filtering/`:
`public/` (34 files, about 4 MB) as of 2026-11-17; it has no `assets/`.

On a fresh checkout:

```bash
npm install
npm run assets -- pull filtering   # needs rclone and the `tcig` remote (DATA.md, "Setup")
npm run check -- filtering         # lists any asset still missing
npm run dev -- filtering           # present it locally, without the live gateway
```

To pull every workshop at once: `npm run assets -- pull --all`. The
workshops are given through the live gateway (`npm run serve`, which
needs `.env`; see the branch section of CLAUDE.md).

After adding or changing media, push them (this copies only; it never
deletes anything in the bucket):

```bash
npm run assets -- push filtering
```

## Notebook

The hands-on part is `notebooks/filtering_workshop.ipynb`; its conda environment
is `environment.yml` at the repository root.
