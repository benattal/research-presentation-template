# How to Make Images with Generative AI

A vision workshop for high-school students: what generative AI is, its benefits and dangers, and how images are generated, with two hands-on practices and a notebook.

## Assets: pull them before presenting

The slides' media (`public/`) and source material (`assets/`) are not in
git. Their durable copy is the R2 bucket described in [DATA.md](../../DATA.md),
under `tcig-projects/research-presentation-template/presentations/diffusion/`:
`public/` (52 files, about 53 MB) and `assets/` (1 file, about 40 MB) as of 2026-11-17.

On a fresh checkout:

```bash
npm install
npm run assets -- pull diffusion   # needs rclone and the `tcig` remote (DATA.md, "Setup")
npm run check -- diffusion         # lists any asset still missing
npm run dev -- diffusion           # present it locally, without the live gateway
```

To pull every workshop at once: `npm run assets -- pull --all`. The
workshops are given through the live gateway (`npm run serve`, which
needs `.env`; see the branch section of CLAUDE.md).

After adding or changing media, push them (this copies only; it never
deletes anything in the bucket):

```bash
npm run assets -- push diffusion
```

## Notebook

The hands-on part is `notebooks/diffusion_workshop.ipynb`; its conda environment
is `environment.yml` at the repository root.
