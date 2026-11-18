# Image Manipulation

A vision workshop for high-school students: how images form, pixels and color channels, intensity operations, and position transformations, with a hands-on activity.

## Assets: pull them before presenting

The slides' media (`public/`) and source material (`assets/`) are not in
git. Their durable copy is the R2 bucket described in [DATA.md](../../DATA.md),
under `tcig-projects/research-presentation-template/presentations/image-manipulation/`:
`public/` (61 files, about 53 MB) and `assets/` (131 files, about 56 MB) as of 2026-11-17.

On a fresh checkout:

```bash
npm install
npm run assets -- pull image-manipulation   # needs rclone and the `tcig` remote (DATA.md, "Setup")
npm run check -- image-manipulation         # lists any asset still missing
npm run dev -- image-manipulation           # present it locally, without the live gateway
```

To pull every workshop at once: `npm run assets -- pull --all`. The
workshops are given through the live gateway (`npm run serve`, which
needs `.env`; see the branch section of CLAUDE.md).

After adding or changing media, push them (this copies only; it never
deletes anything in the bucket):

```bash
npm run assets -- push image-manipulation
```
