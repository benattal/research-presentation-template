---
name: sync-assets
description: Pull a presentation's media and source decks from the asset store, or push new ones to it. Use when asked to fetch, download, upload, push, back up, or sync slide images, videos, PowerPoint decks, or anything in a presentation's public/ or assets/ directory, when npm run check reports missing assets, when a slide shows a missing image or video, and when asked to set up or check the store.
---

# Sync presentation assets with the asset store

Slide media (`presentations/<id>/public/`) and source material
(`presentations/<id>/assets/`) are never in git. They live in the asset
store, under `presentations/<id>/`. `DATA.md` at the repository root is the
full description, with the setup of each kind of store.

## 1. Which store, and is it reachable

`ASSETS_REMOTE` names the store (`remote:path`, or a directory). The
presentation's `README.md` and the "This branch" section of `CLAUDE.md`
say which one the project uses; without the variable the commands use this
repository's own bucket, which needs its access tokens.

```bash
npm run assets -- size <id>
```

If it says the store is not set up on this machine, follow "Setup" in
`DATA.md`, and ask the user for what only they have: which store, and the
path of the rclone configuration (`RCLONE_CONFIG`). Do not search the disk
for tokens or configurations, and never print them, write them into the
repository, or upload them.

## 2. Pull

```bash
npm run assets -- pull <id>
npm run check -- <id>           # every referenced asset now exists
```

`pull` replaces a local file that differs from the store's. When the
checkout has media that are not pushed yet, fetch only the missing files,
one by one (`rclone copyto`, in `DATA.md`, "Pulling").

A file that `npm run check` still reports missing after a pull is not in
the store: it is on the machine of whoever made it. Say so, with the name
of the commit that added the reference; do not draw a replacement.

## 3. Push (only when the user asked for an upload)

```bash
npm run assets -- push <id> --dry-run   # read what would be copied
npm run assets -- push <id>             # copy, then rclone check --one-way
```

The commands only ever run `rclone copy`; never run `rclone sync`, which
deletes files in the store that are missing locally. Report the files and
bytes uploaded and the result of the check. Push media together with the
git push of the slides that use them.

## 4. Deleting from the store

Only on the user's explicit direction, by file name, after
`rclone delete --dry-run` (see "Removing files from the store" in
`DATA.md`).
