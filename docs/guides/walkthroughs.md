# Walkthroughs

For the person using this template. Each is one situation, start to finish:
what to type, what to say to an agent if you work with one, and what you
should see. [Getting started](getting-started.md) is the longest one, a new
presentation from an empty clone; the ones here are shorter.
[Worked examples](worked-examples.md) follows each of the six skills
through a real use. The tutorial (`npm run tutorial`) is the place to
start if you have never edited a deck here.

In each walkthrough the commands can be typed or asked for: the **With an
agent** line gives the sentence that has an agent run them.

- [Join a project someone else started](#join-a-project-someone-else-started)
- [Start from a PowerPoint deck](#start-from-a-powerpoint-deck)
- [A slide shows a missing picture](#a-slide-shows-a-missing-picture)
- [Review on an iPad while an agent edits](#review-on-an-ipad-while-an-agent-edits)
- [Check the pacing with a recorded run-through](#check-the-pacing-with-a-recorded-run-through)
- [Make a narrated video](#make-a-narrated-video)
- [Two people on one branch](#two-people-on-one-branch)
- [Take the framework's updates into your branch](#take-the-frameworks-updates-into-your-branch)
- [Run a workshop with live polls](#run-a-workshop-with-live-polls)

## Join a project someone else started

You were given the repository's address and the name of a branch.

```bash
git clone <address>
cd research-presentation-template
git switch <branch>
npm install
npm run check
```

`npm run check` lists every image and video the slides name that is not on
your computer. On a fresh clone that is all of them: media are not in git.

1. Find out which store the project uses: the presentation's `README.md`
   (`presentations/<id>/README.md`) and the "This branch" section of
   `CLAUDE.md` say. Ask the person who invited you for access: the access
   tokens of an R2 bucket, or a share of a Dropbox folder.
2. Set up rclone for it once ([DATA.md](../../DATA.md), "Setup").
3. Pull, check again, and open the deck:

   ```bash
   npm run assets -- pull <id>
   npm run check -- <id>
   npm run dev -- <id>
   ```

Then read the project's tracker, `docs/tracking/<id>.md`: its top says
where the work stands, and "Standing directions" holds what has already
been decided.

**With an agent:** "I just cloned this. Get the media for `<id>` and tell
me where the project stands." Give it the path of the rclone configuration
when it asks; it does not go looking for tokens.

## Start from a PowerPoint deck

```bash
mkdir -p presentations/my-talk/assets
cp ~/Desktop/old-talk.pptx presentations/my-talk/assets/
npm run extract-pptx -- presentations/my-talk/assets/old-talk.pptx
```

That writes `presentations/my-talk/assets/slides/`: one folder per slide
with its text (`content.json`), its presenter notes (`notes.md`), and its
pictures and videos (`media/`), and a `manifest.json` of the whole deck in
order. It is raw material, not a converted deck: the slides here are built
from layouts, not from positioned boxes.

From there, for each slide you keep: choose a layout, copy the media it
needs into `presentations/my-talk/public/slides/<slide-id>/`, and write its
`content.json`.

**With an agent:** "Use the start-presentation skill. The old deck is
`presentations/my-talk/assets/old-talk.pptx`: extract it, follow its
structure, and draft the storyboard." It reads the extracted text and
notes, and proposes which slides to merge, split, or redraw.

## A slide shows a missing picture

A grey box, a question mark, or a line of description where a picture
should be.

```bash
npm run check -- <id>
```

names the file. Three cases:

- **You have not pulled.** `npm run assets -- pull <id>`.
- **It is in the store, and you have local media you do not want replaced.**
  Copy that one file ([DATA.md](../../DATA.md), "Pulling").
- **It is not in the store.** Whoever added the slide pushed the slide and
  not its media. `git log -S'<file name>' -- presentations/<id>` names the
  commit and its author; ask them to run
  `npm run assets -- push <id>`.

The same picture is missing on every device, so a tablet that shows the
gap is not the problem.

## Review on an iPad while an agent edits

> I'll watch on my iPad and send you screenshots.

The agent serves the deck on your network and gives you an address ending
in `?review`. Open it in Safari. Type `/remote-control` in the agent's
session, open that session in the Claude app on the iPad, and send
marked-up screenshots there. Each comes back as a change on the page in
front of you. [Reviewing on a tablet](reviewing-on-a-tablet.md) has every
step, and the version with several agents.

## Check the pacing with a recorded run-through

```bash
npm run record -- my-talk
```

needs ffmpeg and an installed Edge or Chrome. It films every slide and
build step and writes, under `data/recordings/my-talk/<time>/`, a
`run-through.mp4`, a `contact-sheet.png` with the last frame of every step,
and a `timeline.json`. Watch the video for a step that is over before it
can be read, or an animation cut short.

**With an agent:** "Record a silent run-through and tell me which steps are
too short." (the `narrated-video` skill)

## Make a narrated video

For an explainer: the deck, recorded, with a synthesized voice reading the
notes. The slides come first and must be finished.

1. Write each build step's note as the sentences to be spoken:
   `notes.md` for a slide, `notes-1.md` for its second step, and so on.
2. `npm run narration -- my-talk` prints each step's words and seconds,
   warns about text a voice reads badly, and prints the two commands that
   synthesize the voice and check it by transcription.
3. Set up the voice once per computer
   ([narration setup](../environments/narration.md)), then run those two
   commands. Everything runs on your computer; nothing is sent to a
   service.
4. `npm run record -- my-talk --narration <the narration folder>` records
   the deck with each step held for its narration.

**With an agent:** "Make the narrated video of my-talk" (the
`narrated-video` skill). It goes gate by gate (slides, script, voice,
recording, review) and reports the word error rate of the narration and
what it could not check.

## Two people on one branch

- Pull before you start and before every push:
  `git pull` (or `git fetch` and `git merge`). A rejected push means the
  other person pushed: merge, never force.
- Small commits, pushed often. Push the media with the slides that use
  them (`npm run assets -- push <id>`).
- After pulling someone's slides, pull their media
  (`npm run assets -- pull <id>`) and run `npm run check`.
- What each of you decided is quoted in the tracker's "Standing
  directions". When two decisions conflict, leave both visible and settle
  it between you; an agent does not pick one.

[Working together](../workflows/working-together.md) is the full list,
written for agents and true for people.

## Take the framework's updates into your branch

The template improves on `main`. To bring that into a project branch:

```bash
git fetch origin
git merge origin/main
npm install
npm run check && npm test
```

A project branch has deleted `presentations/example/`, so a change to the
example on `main` shows as a conflict: keep it deleted
(`git rm -r presentations/example`, then `git commit`). After the merge,
look at your deck (`npm run capture -- <id>`): a framework change can move
things.

A fix to the framework itself (anything under `core/`, `scripts/`, or
`tests/`) goes to `main` first and then into the branches, so that every
project gets it.

## Run a workshop with live polls

Local mode needs no server and has no voting. For polls from the
audience's phones, or to have their screens follow yours:

```bash
cp .env.example .env        # then set PRESENTER_PASSWORD in it
npm run serve               # every presentation at /<id>/, with polls
```

Use the `poll`, `pollResults`, and `numericPoll` layouts
([layouts](../implementation/layouts.md), "Live audience"). To put it on
the internet for a room, see [hosting](../implementation/hosting.md),
"Deployment".
