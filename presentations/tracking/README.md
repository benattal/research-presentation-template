# Face and Hand Tracking

A vision workshop for high-school students: digital humans, AI for digital humans, and landmark detection, with a hands-on challenge.

## Assets: pull them before presenting

The slides' media (`public/`) and source material (`assets/`) are not in
git. Their durable copy is the R2 bucket described in [DATA.md](../../DATA.md),
under `tcig-projects/research-presentation-template/presentations/tracking/`:
`public/` (38 files, about 37 MB) and `assets/` (86 files, about 88 MB) as of 2026-11-17.

On a fresh checkout:

```bash
npm install
npm run assets -- pull tracking   # needs rclone and the `tcig` remote (DATA.md, "Setup")
npm run check -- tracking         # lists any asset still missing
npm run dev -- tracking           # present it locally, without the live gateway
```

To pull every workshop at once: `npm run assets -- pull --all`. The
workshops are given through the live gateway (`npm run serve`, which
needs `.env`; see the branch section of CLAUDE.md).

After adding or changing media, push them (this copies only; it never
deletes anything in the bucket):

```bash
npm run assets -- push tracking
```
