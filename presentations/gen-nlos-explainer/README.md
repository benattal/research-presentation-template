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
   made from: the build scripts (`assets/build/`), source files that are
   not in Dropbox (`assets/sources/`, for example the Stanford bunny mesh),
   and parked media of earlier drafts (`assets/parked/`).

## Rebuilding the media

Only needed to change a clip; the built media are in the bucket. The
scripts in `assets/build/` read the paper's results from the group's
Dropbox folder `tcig-transient-nvs/figures` (the supplemental website's
assets, `1_teaser`, `5_QualSimulation`, `6_QualExperimental`,
`holi_1_to_3_trajectories`) and write `public/slides/`. Each script names
the Dropbox path at its top (`W=`); change it if Dropbox is mounted
elsewhere. They need ffmpeg, and `light-split.py` needs Python with numpy
and h5py. Run them from this directory:

```bash
bash assets/build/problem-statement.sh
bash assets/build/results.sh
python assets/build/light-split.py
```

`nlos-comparison.py` renders the rotating reconstructions of the slide
`nlos-comparison` from the volumes in `assets/sources/nlos-comparison/`
(copies from the bucket's `nlos_results_pages_20261114`; the script's
docstring gives the paths). It needs Python with numpy and numba:

```bash
python assets/build/nlos-comparison.py
```

After adding or changing media, push them (this copies only; it never
deletes anything in the bucket):

```bash
ASSETS_REMOTE=tcig: npm run assets -- push gen-nlos-explainer
```

The paper source (`../gen-nlos`), the compiled PDFs, and the reference
decks (`data/gen-nlos/`, local and ignored) are references for writing the
deck; the deck does not load them.
