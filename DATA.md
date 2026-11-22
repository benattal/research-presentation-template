# Assets

Slide media (images, videos, GIFs, audio) and source material (PowerPoint
decks, extracted slide dumps, raw recordings) are **assets**. They do not go
in git: they are large, and git keeps every version of them for ever. Their
durable copy is an **asset store**, a place outside the repository that
rclone can copy to and from. In a checkout they live in two ignored
directories of each presentation:

| Directory | Contents | Served to the audience |
|---|---|---|
| `presentations/<id>/public/` | media the slides show, as `public/slides/<slide-id>/<file>` | yes (Vite's public directory) |
| `presentations/<id>/assets/` | source decks and raw material a slide was made from | no |

Code, slide content (`content.json`, notes), notebooks, and scripts stay in
git. Builds (`dist/`), capture runs (`data/captures/`), and live poll state
(`.live-state/`) are regenerated and stored nowhere.

A fresh checkout has no `public/` or `assets/`; pull them before presenting
or capturing. `npm run check` reports a presentation whose assets are
missing. The example presentation has no assets and needs no store.

---

## Quick start

```bash
npm run assets -- pull <id>       # one presentation
npm run assets -- pull --all      # every presentation of this branch that the store holds
```

`scripts/assets.mjs` runs rclone with the paths below; it only ever copies.
Without access to the store it stops and says so
([Setup](#setup-once-per-machine)).

---

## Which store

`ASSETS_REMOTE` names the store, in the form rclone uses: `remote:path` for
a remote in rclone's configuration, or a directory of this machine.

```bash
export ASSETS_REMOTE="r2:my-decks"                     # bash, zsh
$env:ASSETS_REMOTE = "r2:my-decks"                     # PowerShell
ASSETS_REMOTE="r2:my-decks" npm run assets -- pull my-talk   # for one command
```

Set it in the shell's profile to keep it; the commands do not read `.env`.
Without it, the store is `tcig:tcig-projects/research-presentation-template`
(`DEFAULT_ASSETS_REMOTE` in `core/tooling/assetStore.js`): the bucket of the
people who maintain this repository, which nobody else can read or write
without its access tokens.

A project says which store it uses where its collaborators will look: in
each presentation's `README.md`, and in the "This branch" section of
`CLAUDE.md` and `AGENTS.md`. Whoever starts a project chooses the store;
whoever joins one needs access to that store.

Three kinds of store are in use or tested:

| Store | Access | Good for |
|---|---|---|
| A Cloudflare R2 bucket | **access tokens**, one set per person or shared privately | a group; large media; no personal account involved |
| A Dropbox folder, through rclone's Dropbox remote | each person signs in to their own Dropbox once | people who already share a Dropbox folder |
| A directory a sync client keeps (the Dropbox or OneDrive app's folder, a network drive) | whatever the sync client needs | one person, or a team that already syncs a folder |

---

## Setup (once per machine)

### 1. rclone

Install rclone: `winget install Rclone.Rclone`, `brew install rclone`, or
the machine's package manager. `RCLONE` names the binary for
`npm run assets` when it is not on `PATH`.

### 2. Access to the store

Do the one of the following that matches the project's store.

#### Cloudflare R2: a bucket of your own

R2 is private storage: **nothing in a bucket can be listed, pulled, or
pushed without an access token.** Every person and every machine that
needs the media needs one. The repository never contains them.

1. In the Cloudflare dashboard, open **R2 object storage** and create a
   bucket (for example `my-decks`).
2. Create a token: under **Account Details**, choose **Manage** next to
   **API Tokens**, then **Create Account API token** (or **Create User API
   token**). Give it the permission **Object Read & Write** and limit it to
   the bucket. A collaborator who only views decks can have **Object Read
   only**.
3. Cloudflare then shows an **Access Key ID** and a **Secret Access Key**.
   The secret is shown once: copy both now, into a password manager or a
   file outside every repository. The endpoint is
   `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`, with your account's id.
4. Give rclone a remote, in its configuration file
   (`~/.config/rclone/rclone.conf`; on Windows
   `%APPDATA%\rclone\rclone.conf`; `rclone config file` prints the path):

   ```ini
   [r2]
   type = s3
   provider = Cloudflare
   access_key_id = <Access Key ID>
   secret_access_key = <Secret Access Key>
   region = auto
   endpoint = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   acl = private
   no_check_bucket = true
   ```

   `no_check_bucket` keeps rclone from trying to create the bucket, which a
   token limited to objects may not do. `rclone config` writes the same
   remote interactively (storage `s3`, provider `Cloudflare`).
5. Point the commands at it and check:

   ```bash
   export ASSETS_REMOTE="r2:my-decks"
   rclone lsf "$ASSETS_REMOTE" && echo "store OK"
   ```

To let a collaborator in, create a token for them (step 2) or hand them
yours, through a private channel: a password manager's sharing, not email
or chat, and never a commit. They do steps 4 and 5 with it.

#### Dropbox

Each person signs in to their own Dropbox; nothing is handed around.

1. Create the folder in Dropbox (for example `Decks/assets`) and share it,
   in Dropbox, with the collaborators.
2. Run `rclone config`: new remote, name it `dropbox`, storage `dropbox`,
   leave the app key and secret blank, and sign in when the browser opens.
   rclone keeps the sign-in as a token in its configuration file, which is
   therefore private too.
3. Point the commands at the folder and check:

   ```bash
   export ASSETS_REMOTE="dropbox:Decks/assets"
   rclone lsf "$ASSETS_REMOTE" && echo "store OK"
   ```

A shared folder sits wherever each person put it in their own Dropbox, so
`ASSETS_REMOTE` may differ from person to person; the path after it does
not. Team folders are addressed with a leading slash
(`dropbox:/Team Folder/assets`).

With the Dropbox desktop app, the folder is already on the disk and rclone
needs no remote at all: use its path.

```bash
export ASSETS_REMOTE="$HOME/Dropbox/Decks/assets"            # macOS, Linux
$env:ASSETS_REMOTE = "C:/Users/<you>/Dropbox/Decks/assets"   # Windows
```

The app then syncs in its own time: wait for it to finish before telling a
collaborator that the media are there.

#### This repository's own bucket

For the maintainers' projects (the default store, and the bucket
`presentations` that some branches name in their "This branch" section).
The commands expect a remote named `tcig`. Its tokens are held by the
repository's owner, in a file outside any repository
(`cloudflare-tokens.txt`: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_ENDPOINT`) beside a ready-made `rclone.conf`. Ask the owner for them;
they cannot be recovered from the repository or the bucket.

Either point rclone at the ready-made configuration:

```bash
export RCLONE_CONFIG="<path to>/rclone.conf"
rclone lsd tcig:tcig-projects && echo "remote OK"
```

or write the remote into rclone's own configuration from the tokens file:

```bash
set -a; . "<path to>/cloudflare-tokens.txt"; set +a
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

### Keeping tokens safe

Never write keys, account ids, endpoints, or an rclone configuration into
this repository, a command that is logged, a chat, or the store itself. An
agent working in the repository does not read them into its output and
does not search a disk for them: tell it the path of the configuration
(`RCLONE_CONFIG`) when it needs the store.

---

## Layout in the store

```text
<ASSETS_REMOTE>/
  README.md                       what this store is, which repository owns it
  presentations/
    <id>/
      public/slides/<slide-id>/   slide media, as served
      assets/                     source decks and raw material
```

The layout mirrors the repository: `presentations/<id>/public/` in a checkout
is `presentations/<id>/public/` in the store. Presentation ids are unique
across branches, so every project branch can share one store.

---

## Pulling

```bash
npm run assets -- size <id>         # what is there, before a large pull
npm run assets -- pull <id>
npm run check -- <id>               # every asset the slides name now exists
```

`pull` copies the asset directories the store has for that presentation,
and says so when it has none. `copy` skips files already present with the
same size and modification time, so pulling again is cheap and an
interrupted transfer resumes. A local file that differs from the store's is
replaced by the store's: to fetch a few missing files without touching
local work in progress, copy them one by one.

```bash
rclone copyto "$ASSETS_REMOTE/presentations/<id>/public/slides/<slide-id>/<file>" \
              presentations/<id>/public/slides/<slide-id>/<file>
```

---

## Pushing

After adding or replacing media in `public/` or `assets/`:

```bash
npm run assets -- push <id> --dry-run   # what would be copied
npm run assets -- push <id>             # copies, then rclone check --one-way
npm run assets -- check <id>            # the comparison alone, any time
```

- Push media when the slides that use them are pushed. A slide whose media
  stayed on one machine shows a gap on every other.
- The commands use `rclone copy`, **never `rclone sync`**. `sync` deletes every
  file in the store that is missing locally, which wipes other machines'
  work.
- `push` takes explicit ids, so an upload is always deliberate.
- Verification is part of `push`: `rclone check --one-way` compares every
  local file with the store. Do not infer success from the copy's exit code
  alone. With `--dry-run` nothing is copied and nothing is compared.
- Name media for what they show (`edge-detection-demo.mp4`, not
  `image23.mp4`) and keep them under the slide that uses them.

### Removing files from the store

`copy` never deletes, so a file removed locally stays in the store. Remove
it explicitly, by name, after a dry run:

```bash
rclone delete --dry-run "$ASSETS_REMOTE/presentations/<id>/public/slides/<slide-id>/<file>"
rclone delete           "$ASSETS_REMOTE/presentations/<id>/public/slides/<slide-id>/<file>"
```

Never delete a whole presentation from the store without the user's
explicit direction.

---

## What is stored

**Stored:** every file in `public/` and `assets/`: the media the slides
show and the material they were made from (source decks, extracted slides,
recordings, generated figures).

**Not stored:** code, slide content, notes, notebooks, and scripts (git
holds them); builds and captures (regenerated); live poll state; logs;
tokens and rclone configurations.

Large media should be sized for the screen they play on: a 1280×720 stage
rarely needs a 4K video. Re-encode before pushing rather than after.

---

## Notes

- The store's `README.md` records which repository owns it. Keep it current
  when the layout changes.
- The `sync-assets` agent skill in `.claude/skills/` is the short version of
  this page for coding agents;
  [the skills guide](docs/guides/skills.md#sync-assets) says how to ask for
  it.
