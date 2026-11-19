# Generative View Synthesis from Propagating Light

A narrated explainer of 4 to 5 minutes for the supplemental material of the
anonymous CVPR submission of the same name, recorded from this deck. Each
build step's notes are its narration. The deck and the video must stay
anonymous. The plan is [docs/plans/gen-nlos-explainer.md](../../docs/plans/gen-nlos-explainer.md).

## On a new machine

Everything the deck shows is either in git (slides, notes, layouts) or in
the R2 bucket `presentations` (media). Nothing else is needed to present.

1. Install Node 22 or newer and rclone (`winget install Rclone.Rclone`,
   `brew install rclone`), then `npm install` in the repository.
2. Give rclone the `tcig` remote. The credentials are not in the
   repository: copy `rclone.conf` (or `cloudflare-tokens.txt`) from the
   previous machine through a private channel, then either point rclone at
   it or generate the configuration ([DATA.md](../../DATA.md), "Setup"):

   ```bash
   export RCLONE_CONFIG="$HOME/Downloads/rclone.conf"
   rclone lsd tcig:presentations && echo "remote OK"
   ```

3. Pull the media. This deck's assets are in the bucket `presentations`,
   folder `gen-nlos-explainer/` (not in `tcig-projects`, where DATA.md
   keeps the other decks), so the asset commands take `ASSETS_REMOTE=tcig:`:

   ```bash
   ASSETS_REMOTE=tcig: npm run assets -- pull gen-nlos-explainer
   npm run check -- gen-nlos-explainer      # lists any asset still missing
   npm run dev -- gen-nlos-explainer --port 5174
   ```

   `public/` holds what the slides show; `assets/` holds what they were
   made from and what else is too large for git: source files that are
   not in Dropbox (`assets/sources/`, for example the Stanford bunny
   mesh), narration audio (`assets/narration/`), and parked media of
   earlier drafts (`assets/parked/`). The scripts that build the media
   are in git, in `media/`.

## Rebuilding the media

Only needed to change a clip; the built media are in the bucket. The
scripts that build them are in git, in `media/`
([presentation format](../../docs/implementation/presentations.md)); edit
them there, not in the bucket (the copies under `assets/build/` in the
bucket are from before 2026-11-19 and are superseded). They read the
paper's results from the group's Dropbox folder
`tcig-transient-nvs/figures` (the supplemental website's assets,
`1_teaser`, `5_QualSimulation`, `6_QualExperimental`, `7_conventionalnlos`,
`holi_1_to_3_trajectories`) and sources kept under `assets/sources/`, and
write `public/slides/`. `media/figures.sh` and `media/figures.py` find the
Dropbox folder on Windows and macOS; set `GEN_NLOS_FIGURES` to its path if
it is mounted elsewhere. Run the scripts from this directory:

| Script | Slides | Needs |
|---|---|---|
| `bash media/problem-statement.sh` | single-image, light-video, novel-views | ffmpeg |
| `bash media/results.sh` | captured-comparison, room-scale, line-of-sight stills | ffmpeg |
| `python media/light-split.py` | line-of-sight (direct and indirect light) | ffmpeg; numpy, h5py |
| `bash media/training-data.sh` | training-data | ffmpeg |
| `bash media/summary.sh` | summary | ffmpeg |
| `python media/related-work.py` | related-work | ffmpeg; numpy, numba |
| `python media/nlos-comparison.py` | nlos-comparison | ffmpeg; numpy, numba, h5py, Pillow |
| `python media/method-scene.py` | processing, conditioning, generation | ffmpeg; numpy, scipy, Pillow |
| `node media/lidar-capture-mesh.mjs` | lidar-capture (the bunny mesh) | the repository's node modules |

After adding or changing media, push them (this copies only; it never
deletes anything in the bucket):

```bash
ASSETS_REMOTE=tcig: npm run assets -- push gen-nlos-explainer
```

The paper source (`../gen-nlos`), the compiled PDFs, and the reference
decks (`data/gen-nlos/`, local and ignored) are references for writing the
deck; the deck does not load them.
