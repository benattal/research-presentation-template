# The skills

For the person using this template with a coding agent. A **skill** is a
written procedure that the agent loads when a task calls for it, so that it
does the task the way this repository needs instead of improvising. The six
skills live in `.claude/skills/<name>/SKILL.md`; each is a page or two that
you can read.

You do not have to name a skill. Ask for the thing in your own words and
Claude Code picks the skill whose description matches; typing `/<name>`
(for example `/validate-slides`) asks for it explicitly. An agent starting
work on a presentation should also offer the two review skills.

| You want to | Skill | Say something like |
|---|---|---|
| start a deck, or a new section of one | [`start-presentation`](#start-presentation) | "Plan a 20-minute talk on X from these papers" |
| see whether the slides render correctly | [`validate-slides`](#validate-slides) | "Check the slides" |
| get the images and videos, or upload new ones | [`sync-assets`](#sync-assets) | "Pull the media for my-talk" |
| watch the deck and comment while it is edited | [`live-feedback`](#live-feedback) | "I'll watch on my iPad" |
| send screenshots to a helper that routes them | [`feedback-inbox`](#feedback-inbox) | "Run the feedback inbox" |
| record the deck as a video, with or without a voice | [`narrated-video`](#narrated-video) | "Record a run-through" |

Each section below says what the skill is for, what you give it, what it
does, what you get back, and what it will not do without asking.
[Worked examples](worked-examples.md) follows each skill through a real
use, with the commands' output.

## start-presentation

**For:** the first hour of a new deck or a new section, which is where a
deck goes wrong: slides get built before anyone has agreed what the talk
is.

**You give it:** what the presentation is (audience, length, occasion) and
your material: papers, an older deck, result folders, a website.

**It does:**

1. names the type (lecture, research talk, interactive workshop, explainer
   video) and what follows from it;
2. reads your material and writes down what each piece is for;
3. makes the branch and `presentations/<id>/` (`npm run new`), a plan in
   `docs/plans/<id>.md`, and a tracker in `docs/tracking/<id>.md`;
4. writes the **storyboard** in the plan: one row per slide, with its
   title, what each key press shows, the source of each picture, and its
   status;
5. stops and shows you the storyboard.

**You get:** a plan to read and correct before a single slide exists. After
your yes it builds one section at a time, each to a good draft, and keeps
the storyboard in step with the slides.

**It will not:** serve a deck of placeholder slides, or start narration or
recording before the slides exist.

**Example:**

> Use the start-presentation skill. A 45-minute guest lecture on light
> transport for a graduate rendering course. My old slides are in
> `assets/old-lecture.pptx`; follow their structure. Draft the plan and
> storyboard only.

A worked example:
[from an idea to a storyboard](worked-examples.md#start-presentation-from-an-idea-to-a-storyboard).
More: [getting started](getting-started.md#4-plan-before-slides), and the
agent's procedure in
[making a presentation](../workflows/making-a-presentation.md).

## validate-slides

**For:** knowing that a deck renders as intended, after any change to
slides, layouts, a theme, or the framework.

**You give it:** the presentation's id, or nothing if the branch has one.

**It does:** runs `npm run capture`, which opens every slide at every build
step in a headless browser, screenshots it, and reports errors (a script
error, a missing image, a video that did not load) and warnings (text that
overflows the slide, a clipped box, a title that wraps). Then it opens the
frames it changed and compares each with what the slide should show,
because a clean report does not show a slide that is legible but wrong.

**You get:** the folder of the run (`data/captures/<id>/<time>/`, with a
contact sheet `index.html` you can open), the count of frames, what is
still wrong and why, and which changed frames were meant to change.

**It will not:** reword a slide. Wording, a wrong label, or a confusing
question comes back to you as a proposal.

**Example:**

> Validate the slides of my-talk and show me anything that overflows.

Needs a browser once (`npx playwright install chromium`) and the deck's
media. A worked example:
[catching a title that wraps](worked-examples.md#validate-slides-catching-a-title-that-wraps).
More: [visual validation](../implementation/visual-validation.md).

## sync-assets

**For:** moving images, videos, and source decks between your checkout and
the asset store. Media are not in git.

**You give it:** the presentation's id and the direction (pull or push).
The first time on a machine, it needs to know which store the project uses
and where rclone's configuration is, if rclone does not find it by itself.

**It does:**

- **pull:** `npm run assets -- pull <id>`, then `npm run check` to confirm
  that every file the slides name is now there;
- **push**, only when you ask for an upload: a dry run that it reads, the
  copy, and a comparison of every local file with the store.

**You get:** what was copied, and the names of any files the slides
reference that are still missing. A file missing after a pull is not in
the store at all: it is on the computer of whoever made it.

**It will not:** search your disk for access tokens, print them, upload
without being asked, delete from the store without being told the file, or
ever run `rclone sync` (which deletes).

**Example:**

> The summary slide shows a broken image. Pull the media for my-talk;
> rclone's configuration is at `~/keys/rclone.conf`.

A worked example:
[a fresh clone with gaps](worked-examples.md#sync-assets-a-fresh-clone-with-gaps).
More: [DATA.md](../../DATA.md), and the README's
[Large assets](../../README.md#large-assets) for setting up a store.

## live-feedback

**For:** the session that edits your slides, while you watch the deck on
another screen and tell it what to change. Use it whenever you review
while slides are being edited.

**You give it:** that you will be watching, and on what (a second monitor,
an iPad, a phone).

**It does:**

1. serves the deck (`npm run dev -- <id> --host` for another device) and
   gives you the address, with `?review` so that the bar names each
   slide's id and step;
2. writes down which slides it has, in `data/feedback/sessions.md`;
3. when you send a remark or a marked-up screenshot, finishes the step in
   hand so that the page still loads, looks at the image, records your
   words in the tracker, makes the change, and checks it;
4. replies with what it did for each mark and which slide and step to look
   at. Your screen has already reloaded.

**You get:** a deck that changes in front of you and never breaks while
you watch.

**It will not:** guess at an unclear mark (it asks), delete a slide or a
media file without confirming, or commit your screenshots.

**Example:**

> I'll review on my iPad while you fix the results section. Use
> live-feedback.

A worked example:
[a screenshot from the iPad](worked-examples.md#live-feedback-a-screenshot-from-the-ipad).

## feedback-inbox

**For:** a *second* session, on a small and cheap model, whose only job is
to receive screenshots from your tablet and pass each to the session that
edits that slide. It never edits anything.

You need it only when **more than one session is editing** (one on the
introduction, one on the results) and you do not want to work out which
session to send each screenshot to, or when you want a cheap session
listening while the expensive ones work. With a single editing session,
skip it: connect your tablet to that session and send screenshots there.

**You give it:** a terminal of its own, started in the repository:

```bash
claude --model haiku --remote-control
```

then "run the feedback inbox", and you open that session in the Claude app
on the tablet.

**It does,** for each screenshot: keeps a copy in `data/feedback/`, works
out the presentation, slide, and step (from the `?review` label, the
counter, or by comparing with the last capture), describes each mark, and
sends the editing session a message with the image's file path, your
words, and its reading. It tells you on the tablet where the screenshot
went, or that it could not place it.

**How the hand-off works:** Claude Code sessions on one computer can
message each other by name. The message is text, so the inbox sends the
*path* of the saved image and the editing session opens the file.

**It will not:** edit slides, decide what a mark means for the slide, or
send the screenshots anywhere outside your computer.

### live-feedback or feedback-inbox?

| | `live-feedback` | `feedback-inbox` |
|---|---|---|
| Runs in | the session that edits the slides | a separate session that never edits |
| Model | whatever the editing needs | a small one (Haiku, or Sonnet for hard handwriting) |
| You need it | whenever you review while slides change | only with several editing sessions, or to keep a cheap receiver |
| Does with a screenshot | makes the change | finds the slide and forwards the screenshot |

A worked example:
[the same screenshot, routed](worked-examples.md#feedback-inbox-the-same-screenshot-routed).
More, with the steps on the device:
[reviewing on a tablet](reviewing-on-a-tablet.md).

## narrated-video

**For:** turning a finished deck into a video: a silent run-through of any
deck, or an explainer with a synthesized voice reading the notes.

**You give it:** a deck whose slides are finished and validated. For a
voice: notes written as the sentences to be spoken, one note per build
step.

**It does:**

- **a run-through:** `npm run record -- <id>` films every slide and step
  and writes an MP4, a contact sheet, and a timeline;
- **with narration:** exports the notes as a script and flags text a voice
  reads badly; synthesizes the voice on your computer; transcribes the
  audio back to check every word; records the deck with each step held for
  its narration.

**You get:** the video's path and length, the narration's error rate, and
what was not checked.

**It will not:** send your script or audio to an online service (the
voices run locally), or record a deck whose slides are still changing.

**Example:**

> Record a silent run-through of my-talk so I can check the pacing.

Needs ffmpeg and an installed Edge or Chrome; narration also needs the
Python environments of [narration setup](../environments/narration.md).
A worked example:
[a run-through, then a voice](worked-examples.md#narrated-video-a-run-through-then-a-voice).
More: the agent's procedure in
[making a narrated video](../workflows/narrated-video.md).
