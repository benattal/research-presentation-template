# Image Filtering Workshop

A vision workshop for high-school students: blur, filtering, edge detection, and from filters to deep learning, with a hands-on notebook.

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
