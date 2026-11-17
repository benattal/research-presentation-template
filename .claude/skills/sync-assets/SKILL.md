---
name: sync-assets
description: Pull a presentation's media and source decks from the R2 bucket, or push new ones to it. Use when asked to fetch, download, upload, push, back up, or sync slide images, videos, PowerPoint decks, or anything in a presentation's public/ or assets/ directory, or when npm run check reports missing assets.
---

# Sync presentation assets with the bucket

Slide media (`presentations/<id>/public/`) and source material
(`presentations/<id>/assets/`) live in the R2 bucket `tcig-projects` under
`research-presentation-template/presentations/<id>/`, never in git.
`DATA.md` at the repository root is the full description.

## 1. Check rclone and the remote

```bash
rclone lsd tcig:tcig-projects 2>/dev/null && echo "remote OK"
```

If it fails, follow "Setup" in `DATA.md`. Never print credentials, write
them into the repository, or upload them.

## 2. Pull

```bash
npm run assets -- size <id>     # how much, before a large pull
npm run assets -- pull <id>
npm run check -- <id>           # every referenced asset now exists
```

## 3. Push (only when the user asked for an upload)

```bash
npm run assets -- push <id> --dry-run   # read what would be copied
npm run assets -- push <id>             # copy, then rclone check --one-way
```

The script only ever runs `rclone copy`; never run `rclone sync`, which
deletes remote files that are missing locally. Report the files and bytes
uploaded and the result of the check.

## 4. Deleting from the bucket

Only on the user's explicit direction, by file name, after
`rclone delete --dry-run` (see "Removing files from the bucket" in
`DATA.md`).
