# Light transport and neural rendering

A guest lecture: the Neumann series, operator light transport (with an
aside on computational imaging), volume rendering, neural rendering, and
adjoint light transport. It is presented locally, with no server. The plan
is [docs/plans/light-transport-and-neural-rendering.md](../../docs/plans/light-transport-and-neural-rendering.md);
its status is in the [tracker](../../docs/tracking/light-transport-and-neural-rendering.md).

## Assets: pull them before presenting

The slides' media and the source material are not in git. Their durable copy
is the R2 bucket `tcig-projects` ([DATA.md](../../DATA.md)), under

```text
tcig-projects/research-presentation-template/presentations/light-transport-and-neural-rendering/
  public/    figures, photos, and videos the slides show (about 35 MB)
  assets/    source decks, papers, and their extracted pages (about 410 MB)
```

On a fresh checkout:

```bash
npm install
npm run assets -- pull light-transport-and-neural-rendering   # needs rclone and the `tcig` remote
npm run check -- light-transport-and-neural-rendering         # reports any asset still missing
npm run dev                                                    # present at http://localhost:5173/
```

rclone and its `tcig` remote are set up once per machine, as
[DATA.md](../../DATA.md) describes (`winget install Rclone.Rclone`, then
point rclone at the configuration next to the bucket credentials). The
interactive slides need no assets: they render the 2D room in the browser.
A slide whose media are missing shows a broken image, and `npm run check`
lists it.

After adding or changing media, push them:

```bash
npm run assets -- push light-transport-and-neural-rendering    # copies only; never deletes in the bucket
```

**Status (2026-11-17):** the assets have not been pushed yet. rclone is not
installed on the workstation where the lecture was built, so `public/` and
`assets/` exist only there. Install rclone and push them before working from
another machine.

`assets/sources/README.md` (in the bucket with the assets) records where
every borrowed figure, photo, and video came from; the slides credit them
through `sources.json`.

## Presenting offline

```bash
npm run build -- light-transport-and-neural-rendering   # static build in dist/light-transport-and-neural-rendering/
npm run preview -- light-transport-and-neural-rendering # serve that build locally
```

Fonts, math, and media are bundled into the build, so it needs no network.
