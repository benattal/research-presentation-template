# Assets

Slide media (images, videos, GIFs, audio) and source material (PowerPoint
decks, extracted slide dumps, raw recordings) are **assets**. They do not go
in git. Their durable copy is the Cloudflare R2 bucket `tcig-projects` (the
"projects" bucket), under the prefix `research-presentation-template/`. In a
checkout they live in two ignored directories of each presentation:

| Directory | Contents | Served to the audience |
|---|---|---|
| `presentations/<id>/public/` | media the slides show, as `public/slides/<slide-id>/<file>` | yes (Vite's public directory) |
| `presentations/<id>/assets/` | source decks and raw material a slide was made from | no |

Code, slide content (`content.json`, notes), notebooks, and scripts stay in
git. Builds (`dist/`), capture runs (`data/captures/`), and live poll state
(`.live-state/`) are regenerated and stored nowhere.

A fresh checkout has no `public/` or `assets/`; pull them before presenting
or capturing. `npm run check` reports a presentation whose assets are
missing.

---

## Quick start

```bash
npm run assets -- pull <id>       # one presentation
npm run assets -- pull --all      # every presentation on this branch
```

`scripts/assets.mjs` runs rclone with the paths below; it only ever copies.

---

## Setup (once per machine)

### 1. Credentials

The bucket's S3 credentials are in a shell-sourceable file outside any
repository, `cloudflare-tokens.txt` (`R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`). On the main workstation it is in
`~/Downloads/cloudflare/`, next to a ready-made `rclone.conf` and the bucket's
own instructions (`cloudflare-instructions.txt`). Copy it from another machine
through a private channel if needed; it cannot be recovered from the
repository or the bucket.

Never write keys, account ids, or endpoints into this repository, a command
that is logged, or the bucket.

### 2. rclone

Install rclone (`winget install Rclone.Rclone`, `brew install rclone`, or
the package manager of the machine). The scripts expect a remote named
`tcig`. Check for a working remote before writing one:

```bash
rclone lsd tcig:tcig-projects && echo "remote OK"
```

If that fails, either point rclone at the existing configuration:

```bash
export RCLONE_CONFIG="$HOME/Downloads/cloudflare/rclone.conf"
```

or generate the standard configuration from the credentials file
(`~/.config/rclone/rclone.conf`; on Windows `%APPDATA%\rclone\rclone.conf`):

```bash
set -a; . ~/Downloads/cloudflare/cloudflare-tokens.txt; set +a
mkdir -p ~/.config/rclone
cat >> ~/.config/rclone/rclone.conf <<EOF
[tcig]
type = s3
provider = Cloudflare
access_key_id = $R2_ACCESS_KEY_ID
secret_access_key = $R2_SECRET_ACCESS_KEY
endpoint = $R2_ENDPOINT
region = auto
EOF
chmod 600 ~/.config/rclone/rclone.conf
rclone lsd tcig:tcig-projects
```

`RCLONE` names the rclone binary for `npm run assets` when it is not on
`PATH`; `ASSETS_REMOTE` overrides the remote and prefix
(default `tcig:tcig-projects/research-presentation-template`).

---

## Layout under `tcig-projects/research-presentation-template/`

```text
README.md                       what this prefix is, which repository owns it
presentations/
  <id>/
    public/slides/<slide-id>/   slide media, as served
    assets/                     source decks and raw material
```

The layout mirrors the repository: `presentations/<id>/public/` in a checkout
is `presentations/<id>/public/` under the prefix. Presentation ids are unique
across branches, so every project branch shares the one prefix.

---

## Pulling

```bash
npm run assets -- size <id>         # what is there, before a large pull
npm run assets -- pull <id>
```

By hand, for one directory:

```bash
rclone copy tcig:tcig-projects/research-presentation-template/presentations/<id>/public \
            presentations/<id>/public --progress
```

`copy` skips files already present with the same size and modification time,
so pulling again is cheap and an interrupted transfer resumes.

---

## Pushing

After adding or replacing media in `public/` or `assets/`:

```bash
npm run assets -- push <id>         # copies, then rclone check --one-way
```

- The scripts use `rclone copy`, **never `rclone sync`**. `sync` deletes every
  remote file that is missing locally, which wipes other machines' work.
- `push` takes explicit ids, so an upload is always deliberate.
- Verification is part of `push`: `rclone check --one-way` compares every
  local file with the bucket. Do not infer success from the copy's exit code
  alone.
- Name media for what they show (`edge-detection-demo.mp4`, not
  `image23.mp4`) and keep them under the slide that uses them.

### Removing files from the bucket

`copy` never deletes, so a file removed locally stays in the bucket. Remove
it explicitly, by name, after a dry run:

```bash
rclone delete --dry-run tcig:tcig-projects/research-presentation-template/presentations/<id>/public/slides/<slide-id>/<file>
rclone delete            tcig:tcig-projects/research-presentation-template/presentations/<id>/public/slides/<slide-id>/<file>
```

Never delete a whole presentation prefix without the user's explicit
direction.

---

## What is stored

**Stored:** every file in `public/` and `assets/`: the media the slides
show and the material they were made from (source decks, extracted slides,
recordings, generated figures).

**Not stored:** code, slide content, notes, notebooks, and scripts (git
holds them); builds and captures (regenerated); live poll state; logs;
credentials and rclone configurations.

Large media should be sized for the screen they play on: a 1280×720 stage
rarely needs a 4K video. Re-encode before pushing rather than after.

---

## Notes

- The prefix `README.md` records which repository owns the prefix. Keep it
  current when the layout changes.
- The `sync-assets` agent skill in `.claude/skills/` is the short version of
  this page for coding agents.
