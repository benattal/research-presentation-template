# research-presentation-template

Interactive slide decks for research talks, lectures, and workshops, written
as data and rendered by a small React framework. A presentation is a
directory of JSON and Markdown; the framework gives every presentation the
same audience view, presenter window, keyboard and touch navigation, and
visual validation, and can add live audience features (polls,
follow-the-presenter) through an optional server.

It is built to be used with a coding agent (Claude Code, or any agent that
reads `AGENTS.md`): the repository carries the agent's instructions and six
skills, so the agent plans a deck with you, builds it, checks every slide,
and takes your feedback while you watch. Everything also works by hand.

- New here: take the tutorial (`npm install`, then `npm run tutorial`): a
  deck that teaches the template by having you edit it.
  [Getting started](docs/guides/getting-started.md) then walks from a clone
  to a deck of your own.
- Working with an agent: [the skills](docs/guides/skills.md) says what to
  ask for.
- Everything else: [docs/index.md](docs/index.md).

## Quick start

```bash
git clone <this repository's address>
cd research-presentation-template
npm install                  # Node 22.12 or newer
npm run tutorial             # the hands-on tour: start here
npm run dev                  # the only presentation, or: npm run dev -- <id>
```

Each prints an address; open it (http://localhost:5173/). `npm run dev` on
`main` shows the example presentation, one slide per core layout. Press
**P** for the presenter window (notes, timer, preview of the current and
next slide); arrow keys in either window drive the slides.

| Key | Action |
|---|---|
| → ↓ Space Enter PageDown | next build step or slide |
| ← ↑ Backspace PageUp | previous |
| O / Escape | slide overview / close it |
| F | fullscreen |
| P | presenter window |
| C | reset the current slide's poll (live mode, presenter only) |

## The tutorial

`tutorial/` is a deck that introduces the template through a worked
example that you complete yourself. Each task slide names a file and an
edit (change a title, add a bullet, a build step, a picture, a slide of
your own, the colors); when you save, the page reloads and the slide marks
its task done. Each task also shows what to say to a coding agent that
makes the edit for you. It takes about twenty minutes, needs no media and
no asset store, and is on every branch.

**Take it** (this is the way that lets you edit):

```bash
npm install
npm run tutorial             # open the address it prints, with an editor beside the browser
```

If the port is taken, choose another: `npm run tutorial -- --port 5200`.

**Show it to someone on your network** (their browser, your computer; add
`?review` to the address on a tablet):

```bash
npm run tutorial -- --host
```

**Host it for people who only want to look**: a static build has the
slides, without the editing, and goes on any web host (GitHub Pages,
Netlify, a university web folder):

```bash
npm run build -- ./tutorial            # writes dist/tutorial/
npm run preview -- ./tutorial          # check it at http://localhost:4173/
```

then copy the contents of `dist/tutorial/` to the host. It works under any
address or sub-folder, and needs a web server: opening `index.html` from
the disk does not work.

**Start over:** `git restore tutorial`, and `git clean -fdx tutorial` to
remove the slide and the picture you added.

## Start a new presentation

`main` holds the framework and the example. Each project lives on its own
branch.

```bash
git switch -c my-talk                         # 1. a branch for the project
npm run new -- my-talk --title "My Talk"      # 2. a five-slide starter
git rm -r presentations/example               # 3. a project branch holds only its own decks
npm run dev                                   # 4. edit the files; the page reloads
npm run check && npm run capture -- my-talk   # 5. it loads; every slide is screenshot and checked
```

Then:

- Say what the branch is in the "This branch" section of `CLAUDE.md` and
  `AGENTS.md` (the same text in both; a test checks that they match).
- Plan before building: a storyboard, one row per slide, in
  `docs/plans/my-talk.md`. With an agent, ask for it: "Use the
  start-presentation skill: a 20-minute research talk on X; my material is
  in `presentations/my-talk/assets/`."
- Decide where images and videos will live ([Large assets](#large-assets))
  before the first one.
- Keep framework fixes on `main` and merge `main` into the branch.

[Getting started](docs/guides/getting-started.md) goes through each step,
with and without an agent. [Walkthroughs](docs/guides/walkthroughs.md)
covers joining someone's project, starting from a PowerPoint deck,
recording a video, and more; [worked examples](docs/guides/worked-examples.md)
shows each skill in use.

## A presentation

```text
presentations/<id>/
  README.md                  what it is; which asset store it uses
  presentation.json          title, sections, slide order
  slides/<slide-id>/
    content.json             { "layout": "content", "title": ..., "bullets": [...] }
    notes.md                 presenter notes (notes-<k>.md for one build step, counted from 0)
  layouts/index.js           layouts specific to this presentation
  public/slides/<slide-id>/  images and videos (from the asset store, not in git)
  assets/                    source decks and raw material (from the asset store, not in git)
  theme.css                  optional: override the framework's colors and fonts
```

The format and every core layout are described in
[presentation format](docs/implementation/presentations.md) and
[layouts](docs/implementation/layouts.md).

## Large assets

Images, videos, and source decks do not go in git. They live in an **asset
store** outside the repository, and `npm run assets` copies them with
[rclone](https://rclone.org/) (`winget install Rclone.Rclone`,
`brew install rclone`):

```bash
npm run assets -- pull <id>     # store → your checkout
npm run assets -- push <id>     # your checkout → store, then a check of every file
```

A deck without media needs none of this. A fresh clone of a project that
has media shows gaps until you pull; `npm run check` lists what is missing.

`ASSETS_REMOTE` names the store, the way rclone writes it: `remote:path`,
or a folder on your computer. Set it in your shell's profile:

```bash
export ASSETS_REMOTE="r2:my-decks"          # bash, zsh
$env:ASSETS_REMOTE = "r2:my-decks"          # PowerShell
```

Without it the commands use this repository's own bucket, which only its
maintainers' access tokens open. If you are joining a project, its
`presentations/<id>/README.md` says which store it uses: ask whoever
invited you for access. If you are starting one, set up a store:

### Cloudflare R2 (access tokens required)

R2 is private storage. **Nobody can list, pull, or push anything in a
bucket without an access token**, so every person and machine that needs
the media needs one, and you decide who gets them.

1. In the Cloudflare dashboard, open **R2 object storage** and create a
   bucket, for example `my-decks`.
2. Under **Account Details**, choose **Manage** next to **API Tokens** and
   create a token with the permission **Object Read & Write**, limited to
   that bucket.
3. Copy the **Access Key ID** and the **Secret Access Key** at once (the
   secret is shown only once) into a password manager. Your endpoint is
   `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
4. Add a remote to rclone's configuration (`rclone config file` prints
   where it is):

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

5. `export ASSETS_REMOTE="r2:my-decks"`, then
   `rclone lsf "$ASSETS_REMOTE" && echo "store OK"`.

A collaborator needs a token too: create one for them, or share yours
through a password manager. Tokens never go in the repository, in a chat,
or in a command an agent logs; tell an agent the *path* of the rclone
configuration, not its contents.

### Dropbox

Each person signs in to their own Dropbox, so there are no tokens to hand
around.

1. Create a folder in Dropbox, for example `Decks/assets`, and share it
   with your collaborators in Dropbox.
2. Run `rclone config`: a new remote named `dropbox`, storage `dropbox`,
   app key and secret left blank, then sign in when the browser opens.
3. `export ASSETS_REMOTE="dropbox:Decks/assets"`, then
   `rclone lsf "$ASSETS_REMOTE" && echo "store OK"`.

With the Dropbox desktop app, the folder is already on your disk: skip
rclone's sign-in and use its path,
`ASSETS_REMOTE="$HOME/Dropbox/Decks/assets"`. The same works for any folder
that something else keeps in sync.

[DATA.md](DATA.md) is the reference: the layout of a store, pulling one
file, removing files, and what is and is not stored.

## Working with an agent

`CLAUDE.md` and `AGENTS.md` are the agent's instructions for this
repository, and `.claude/skills/` holds six skills: procedures the agent
loads when a task calls for one. Ask in your own words, or name a skill
(`/validate-slides`). An agent starting work on a presentation asks whether
you want the two review skills.

**You can ask for almost everything in this README instead of doing it.**
The commands are shown so that you know what happened and can do it by
hand; an agent runs them for you from one sentence:

| Instead of | Say |
|---|---|
| the five commands of "Start a new presentation", and copying your material in | "Start a presentation called my-talk on its own branch, delete the example, and copy the PDFs from ~/papers/cache into its assets." |
| writing a storyboard and slides | "Use the start-presentation skill: a 20-minute talk on X from that material. Show me the storyboard first." |
| `npm run check`, `npm run capture`, and reading every frame | "Validate the slides." |
| `npm run assets -- pull` and `push` | "Get the media for my-talk." / "Push the media." |
| serving the deck and opening it on a tablet | "I'll watch on my iPad." |
| the tutorial's tasks | the sentence each task slide shows |

The agent stops for what only you can give: a yes to the storyboard, your
wording, which asset store to use, and the path of your rclone
configuration (it does not look for access tokens).

| Skill | What it is for | Say something like |
|---|---|---|
| [`start-presentation`](docs/guides/skills.md#start-presentation) | a new deck or section: its type, a plan with a storyboard you approve, then slides | "Plan a 20-minute talk on X from these papers" |
| [`validate-slides`](docs/guides/skills.md#validate-slides) | screenshot every slide and build step and review the frames | "Check the slides" |
| [`sync-assets`](docs/guides/skills.md#sync-assets) | pull a presentation's media from the asset store, or push new media | "Pull the media for my-talk" |
| [`live-feedback`](docs/guides/skills.md#live-feedback) | for the session that edits, while you watch on another screen: it serves the deck, takes each remark at a safe point, and keeps the page loading | "I'll watch on my iPad" |
| [`feedback-inbox`](docs/guides/skills.md#feedback-inbox) | for a second, small-model session that only receives screenshots from a tablet and forwards each to the session editing that slide; needed only when several sessions edit | "Run the feedback inbox" |
| [`narrated-video`](docs/guides/skills.md#narrated-video) | record a run-through, with or without a synthesized voiceover | "Record a run-through" |

[The skills](docs/guides/skills.md) describes each one: what you give it,
what it does, what comes back, and what it will not do without asking.
[Worked examples](docs/guides/worked-examples.md) follows each skill through
a real use, with the output of every command.

## Reviewing on an iPad or iPhone

A deck can be read on a tablet or phone on the same network while it is
edited on the computer, and marked-up screenshots sent back to the agent
that edits it.

```bash
npm run dev -- <id> --host
```

Open the address it prints for review (the "Network" address with
`?review`) in Safari on the device. Every device on that network can read
the slides and their notes, so use a network you trust. The page reloads by
itself when a slide is saved.

| Touch | Action |
|---|---|
| swipe left or right, or the bar's arrows | next or previous build step or slide |
| a dot in the bar | that slide |
| the slide counter (`12 / 40`) | slide overview; × or a card closes it |
| the toolbar, bottom left | fullscreen (not on an iPhone), presenter window |

To send feedback, type `/remote-control` in the session that edits your
slides, open that session in the Claude app on the device, and send it
marked-up screenshots; with `?review`, each screenshot names its slide and
step. [Reviewing on a tablet or phone](docs/guides/reviewing-on-a-tablet.md)
has every step, including the inbox for several sessions.

## Branches

| Branch | Contents | Hosting |
|---|---|---|
| `main` | framework, documentation, `presentations/example/` | either mode |
| `vision-workshop` | four interactive workshops for high-school students and a landing deck | live gateway (Railway) |
| `guest-lecture` | one research guest lecture | local only, no server |
| `gen-nlos-explainer` | a narrated explainer video for a paper; the branch also carries the guest lecture's deck | local only, no server |

A project branch says what is specific to it in the "This branch" section
of `CLAUDE.md` and `AGENTS.md`.

## Commands

| Command | What it does |
|---|---|
| `npm run tutorial` | serve the tutorial deck (`tutorial/`); the same as `npm run dev -- ./tutorial` |
| `npm run dev -- <id>` | local mode: one presentation on a Vite dev server, no backend; `--host` also serves it to the network, for a tablet or phone |
| `npm run build -- <id>` | static build in `dist/<id>/`, for any web host |
| `npm run preview -- <id>` | serve that build on this machine; `--host` as for `dev` |
| `npm run serve` | live mode for development: every presentation at `/<id>/` with presenter login, polls, follow-the-presenter |
| `npm run build:live` then `npm start` | live mode for production |
| `npm run new -- <id>` | start a presentation |
| `npm run check` | load every presentation and check its assets, without a browser |
| `npm run capture -- <id>` | screenshot every slide and build step and report overflow, console errors, missing media, and changes since the last run |
| `npm run record -- <id>` | record a run-through video of every slide and build step, with narration when given one (needs ffmpeg and Edge or Chrome) |
| `npm run assets -- pull\|push\|check\|size <id>` | move assets between the checkout and the asset store |
| `npm run extract-pptx -- <deck.pptx>` | pull text, media, and notes out of a PowerPoint deck |
| `npm run narration -- <id>` | export the notes as a narration script and print the commands that synthesize it locally ([narration](docs/implementation/narration.md)) |
| `npm test` | unit and repository tests |
| `npm run test:ui` | browser tests of every view, core layout, and live feature |

A presentation under `presentations/` is named by its id. Any other
directory with a `presentation.json` is named by its path, with a leading
`./` (`npm run capture -- ./tutorial`).

Live mode needs `PRESENTER_PASSWORD` in `.env` (see `.env.example`).
[Hosting](docs/implementation/hosting.md) covers both modes and deployment.

## Repository layout

```text
core/client/      React framework (the Vite root)
core/server/      live gateway
core/tooling/     presentation discovery, Vite configuration, the asset store
presentations/    one directory per presentation
tutorial/         the hands-on tour: a deck you learn the template by editing
scripts/          command-line entry points
narration/        Python tools for a synthesized voiceover
tests/            node:test suites
docs/             documentation (start at docs/index.md)
.claude/skills/   the skills an agent loads
data/             ignored: capture runs, recordings, feedback screenshots
```

## Documentation

[docs/index.md](docs/index.md) lists everything. Guides
([docs/guides/](docs/guides/getting-started.md)) are written for you;
workflows (`docs/workflows/`) are the procedures agents follow. Coding
agents read [CLAUDE.md](CLAUDE.md) or [AGENTS.md](AGENTS.md) first.
