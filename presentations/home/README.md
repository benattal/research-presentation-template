# Vision Workshop

The landing page served at the root of the live gateway; it links to the four workshops.

## Assets: pull them before presenting

This presentation has no assets in the bucket today. If it gets any, they
live in the R2 bucket described in [DATA.md](../../DATA.md), under
`tcig-projects/research-presentation-template/presentations/home/`.

On a fresh checkout:

```bash
npm install
npm run assets -- pull home   # needs rclone and the `tcig` remote (DATA.md, "Setup")
npm run check -- home         # lists any asset still missing
npm run dev -- home           # present it locally, without the live gateway
```

To pull every workshop at once: `npm run assets -- pull --all`. The
workshops are given through the live gateway (`npm run serve`, which
needs `.env`; see the branch section of CLAUDE.md).

After adding or changing media, push them (this copies only; it never
deletes anything in the bucket):

```bash
npm run assets -- push home
```
