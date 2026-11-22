# Worked examples, one per skill

For the person using this template with a coding agent. [The skills](skills.md)
says what each skill is for; this page follows each one through a real use,
from what you type to what comes back. The command output is copied from
runs of these commands on the example presentation and on a real deck,
with paths shortened and names changed; what the agent says is given in
substance, not word for word. Each example ends with what to check before
you believe the result.

- [start-presentation: from an idea to a storyboard](#start-presentation-from-an-idea-to-a-storyboard)
- [validate-slides: catching a title that wraps](#validate-slides-catching-a-title-that-wraps)
- [sync-assets: a fresh clone with gaps](#sync-assets-a-fresh-clone-with-gaps)
- [live-feedback: a screenshot from the iPad](#live-feedback-a-screenshot-from-the-ipad)
- [feedback-inbox: the same screenshot, routed](#feedback-inbox-the-same-screenshot-routed)
- [narrated-video: a run-through, then a voice](#narrated-video-a-run-through-then-a-voice)

## start-presentation: from an idea to a storyboard

**The situation.** You have a paper, four result videos, and a 20-minute
slot at a workshop. Nothing exists yet.

**1. Make the presentation and put your material in it.**

```bash
git switch -c cache-talk main
npm run new -- cache-talk --title "Radiance caching"
mkdir -p presentations/cache-talk/assets
cp ~/papers/radiance-caching.pdf presentations/cache-talk/assets/
cp -r ~/results/videos presentations/cache-talk/assets/results
```

`assets/` is where source material goes; git ignores it. (Or skip this and
tell the agent where the files are: it runs `npm run new` itself, which
refuses a directory that already exists.)

**2. Ask.**

> Use the start-presentation skill. A 20-minute research talk for a
> rendering workshop on our radiance caching paper
> (`presentations/cache-talk/assets/radiance-caching.pdf`). The result
> videos are in `assets/results/`. The audience knows path tracing. Plan it
> and show me the storyboard before building anything.

**3. What it does, and says.** It names the type first, because the type
fixes the rest: "A research talk: you drive it live, about a slide a
minute, notes are your speaking notes, local hosting with no server." It
reads the paper and lists each video with what it shows. It writes
`docs/plans/cache-talk.md` and `docs/tracking/cache-talk.md`, and stops.

**4. What you read.** The plan holds the storyboard: one row per slide.

```markdown
The talk goes: the problem (noise at low sample counts), the idea (stop
paths early with a cache), how the cache is trained, results, limits.

| # | Slide (title) | Steps: what appears | Source | Status |
|---|---|---|---|---|
|   | **Problem** | | | |
| 1 | Path tracing is noisy at 1 sample per pixel | (1) the 1-spp render; (2) the reference beside it | `assets/results/bedroom-1spp.mp4`, `bedroom-ref.mp4` | planned |
| 2 | Most of the noise is in the long paths | (1) one path drawn bounce by bounce; (2) its later bounces marked | a diagram to draw (canvas) | planned |
|   | **Idea** | | | |
| 3 | A cache ends the path after one bounce | (1) the path cut after its first bounce; (2) the cache lookup replacing the rest | the same diagram, second state | planned |
```

**5. Correct it in words.** This is the cheapest moment to change the talk.

> Row 2 takes too long for this audience; fold it into row 1 as a third
> step. Add a row after 3 with the equation, and a row before the results
> saying what the cache costs.

The agent edits the table and records what you said, quoted and dated,
under "Standing directions" in the tracker. When the table is the talk you
want:

> Good. Build the Problem section.

**6. What comes back.** Two or three slides, served at
`http://localhost:5173/`, each built to its row, with the row's status
changed to "drafted" in the same commit. Not the whole deck: one section,
to a good draft, then the next.

**Check before you believe it.** Every row has a source specific enough to
find ("a diagram to draw" is acceptable; an empty cell is not). The
five-slide starter that `npm run new` wrote is gone from
`presentation.json`. The tracker quotes your corrections.

## validate-slides: catching a title that wraps

**The situation.** You changed a title and want to know the deck still
looks right.

**1. A baseline, before the change.** Ask "capture the deck", or:

```bash
npm run capture -- example
```

```text
ok    08-poll-vote-1.png
ok    09-poll-results-1.png
ok    10-closing-1.png

13 frames: 0 with errors, 0 with warnings.
Contact sheet: data/captures/example/20261122-200635/index.html
```

One PNG per slide and build step (`04-building-up-2.png` is slide 4, step
2), and a contact sheet to open in a browser.

**2. Make the change.** Here, the title of `what-is-this` becomes "A
presentation is a directory of JSON and Markdown files that the framework
renders for you".

**3. Ask.**

> Validate the slides; I only touched what-is-this.

The agent captures that slide alone while it iterates:

```bash
npm run capture -- example --slides what-is-this
```

```text
warn  03-what-is-this-1.png  changed 2.9%

1 frames: 0 with errors, 1 with warnings, 1 changed since 20261122-200635.
```

It reads the report (`report.json` in the run's folder):

```text
title-wraps: h2.slide-title "A presentation is a directory of JSON and
Markdown files tha" (the title runs onto a second line)
```

and it opens the PNG to see the slide, because a count does not show what
a slide looks like.

**4. What it does about it.** A title is your wording, so it does not
shorten it for you. It reports: "The new title wraps onto two lines
(`title-wraps`). Titles here are one line. A shorter form: 'A presentation
is a directory of files'. Which do you want?" A layout problem (a box that
clips, a figure outside the stage) it fixes itself, at the cause.

**5. The final run, compared with the baseline.** After the fix it
captures the whole deck against the run from step 1, not against the
one-slide run:

```bash
npm run capture -- example --compare data/captures/example/20261122-200635
```

```text
13 frames: 0 with errors, 0 with warnings, 0 changed since 20261122-200635.
```

With the change kept, that line would name one changed frame: the one you
meant to change.

**Check before you believe it.** The agent names the run's folder and says
which changed frames were intended. Open the contact sheet yourself for
the slides you care about. `ERROR` lines (a missing image, a script error)
are never acceptable; a warning is acceptable only with a reason.

## sync-assets: a fresh clone with gaps

**The situation.** You cloned a colleague's project. The deck loads, and
some slides show grey boxes.

**1. Ask.**

> Some slides are missing pictures. Get the media for cache-talk.

**2. What it runs first.**

```bash
npm run check -- cache-talk
```

```text
FAIL cache-talk: 23 slides, 46 assets referenced
       error: missing asset public/slides/hardware/propagating-light.mp4 (used in slides\hardware\content.json)
       error: missing asset public/slides/summary/robot-outlook.png (used in slides\summary\content.json)
```

Then it looks for the store. If this machine has never been set up:

```text
The asset store is not set up on this machine: rclone has no remote named "tcig".
  store: tcig:tcig-projects/research-presentation-template   (the default; ASSETS_REMOTE is not set)
README.md, "Large assets", says how to get access to this store or set up one of your own.
```

**3. What it asks you.** It does not go looking for access tokens on your
disk. It asks: which store does this project use (the presentation's
README says), and where is your rclone configuration?

> The store is `r2:lab-decks`. My rclone config is at `~/keys/rclone.conf`.

**4. What it does.**

```bash
export RCLONE_CONFIG=~/keys/rclone.conf ASSETS_REMOTE=r2:lab-decks
npm run assets -- pull cache-talk
npm run check -- cache-talk
```

```text
FAIL cache-talk: 23 slides, 46 assets referenced
       error: missing asset public/slides/summary/robot-outlook.png (used in slides\summary\content.json)
```

One file is still missing. That is a different situation, and the agent
says so instead of trying again: "`robot-outlook.png` is not in the store.
The commit that added it is `ee7064a` by your colleague, on 20 November:
the slide was pushed and its picture was not. Ask them to run
`npm run assets -- push cache-talk`."

**5. Pushing, when you have added media.**

> Push the media for cache-talk.

```bash
npm run assets -- push cache-talk --dry-run     # it reads this list first
npm run assets -- push cache-talk               # copies, then compares every file
```

It reports the files and bytes uploaded and the result of the comparison.

**Check before you believe it.** `npm run check` ends with `ok`. After a
push, the comparison reported no differences. If you had local media that
were not yet pushed, the agent copied single files (`rclone copyto`)
instead of pulling everything, because a pull replaces a local file that
differs from the store's.

## live-feedback: a screenshot from the iPad

**The situation.** An agent is fixing the results section. You want to
read the deck on your iPad as it changes and mark what is wrong.

**1. Say so.**

> I'll review on my iPad while you work. Use live-feedback.

**2. What the agent does before it goes back to work.** It serves the deck
on your network and tells you what to open:

```text
  Cache Talk (presentations/cache-talk)
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.4.23:5173/  Wi-Fi
  Presenter window: press P, or add ?mode=presenter to the URL.
  Review on a tablet or phone, each slide's id and step in the bar: http://192.168.4.23:5173/?review
```

It runs `npm run check` first, so that a missing picture is found by it
and not by you, and it writes its own name and its slides into
`data/feedback/sessions.md`:

```markdown
| Session | Presentation | Slides | Since |
|---|---|---|---|
| research-presentation-template-34 | cache-talk | results | 2026-11-22 15:20 |
```

Then: "Open http://192.168.4.23:5173/?review in Safari. Type
`/remote-control` here and open this session in the Claude app to send
screenshots. I have the results section."

**3. You send a screenshot.** On the summary slide the picture is missing.
You take a screenshot, draw a red arrow at the empty box, and send it with
"This is what I still see".

**4. What the agent does with it.** It finishes the edit it was in the
middle of, so the page still loads. It looks at the image: the bar reads
`22 / 23`, the box shows a missing-image mark and the picture's
description. It does not start changing the layout. It checks the assets:

```text
FAIL cache-talk: 23 slides, 46 assets referenced
       error: missing asset public/slides/summary/robot-outlook.png (used in slides\summary\content.json)
```

It records your words in the tracker, with the image's path, and answers:

> The summary slide's picture, `robot-outlook.png`, is not on this
> computer, so every device shows that gap; it is not the iPad. It is not
> in the store either (the summary folder there holds only the video and
> its poster). It came with commit `ee7064a` from your colleague, who
> needs to push the media. Nothing in the slide was changed.

**5. A remark that is a change.** You circle a label and write "bigger".
The agent makes the label larger, captures that slide, looks at the frame,
and answers: "`results`, step 2: the axis label is now the same size as
the caption. It is on your screen." Your iPad already shows it.

**Check before you believe it.** The page never showed an error while you
watched. The tracker's "Standing directions" has your words. For anything
the agent says it changed, the slide and step it names look changed on
your device.

## feedback-inbox: the same screenshot, routed

**The situation.** Two agents are editing: one has the introduction, one
the results. You do not want to remember which session to send each
screenshot to.

**1. Each editing session registers.** You tell each "I'll review on my
iPad"; each adds its row to `data/feedback/sessions.md` with the slides it
has.

**2. Start the inbox,** in a third terminal, in the repository:

```bash
claude --model haiku --remote-control
```

> Run the feedback inbox for cache-talk.

It reads the registrations and tells you who is listening: "Two sessions:
`…-34` has the results section, `…-41` has the introduction. Nobody has
the method slides. Open the deck with `?review` and keep the bar in your
screenshots." Open this session in the Claude app on the iPad.

**3. Send the screenshot** from the previous example, with "This is what I
still see on the browser".

**4. What the inbox writes.** A note beside the image, under
`data/feedback/cache-talk/2026-11-22/1515-summary-step2.md` (adapted from
what a Haiku session wrote for that screenshot):

```markdown
status: sent to research-presentation-template-34
received: 2026-11-22 15:15 (local)

## The user wrote (verbatim)

"This is what I still see on the browser"

## Placement

- Slide: summary (22 / 23 by the counter; the title on screen reads "Summary")
- Build step: 2 of 2 (the `outlook` step; the Outlook heading and text are visible)
- How found: counter 22 / 23 matched against presentation.json, cross-checked
  with the on-screen title and the step text. Sure.

## Marks

- A red hand-drawn arrow, curved, starting in the empty space at the upper
  right and ending with its head at the top-right corner of the box.
- No handwriting.
```

The screenshot had no `?review` label, so it placed the slide from the
counter and the step from the capture frames. With the label it reads both
directly.

**5. What it sends,** to the session that has that slide:

```text
Feedback from the user, sent from their tablet at 15:15.
Image: C:\Users\you\.claude\uploads\<session>\1b0ef513-image.jpg   (open it; it is the feedback)
The user wrote: "This is what I still see on the browser"
Shows: cache-talk, slide summary, step 2 of 2 (counter 22 / 23 and the on-screen title; sure)
The inbox's reading of the marks, which may be wrong:
- A red hand-drawn curved arrow … pointing at the top-right corner of the illustration box.
- No handwriting.
```

It tells you on the iPad: "Sent to `…-34`." The editing session receives
the message between two of its steps, opens the image itself, and carries
on as in the previous example.

**6. When something does not fit.** The inbox says so on the iPad instead
of guessing: "No session has the method slides; I kept the screenshot as
not placed." Or: "This image arrived without a file; send it again once I
have answered." If it cannot copy the image into `data/feedback/`, it
passes on the saved attachment's own path and notes that no copy was kept.

**Check before you believe it.** The inbox's answer names the session and
the slide. The editing session's answer talks about what your marks point
at, which shows it opened the image and did not only read the inbox's
description.

## narrated-video: a run-through, then a voice

**The situation.** The deck is finished. You want a video: first silent,
to judge the pacing, then with a voice reading the notes.

**1. A silent run-through.**

> Record a run-through of the example deck.

```bash
npm run record -- example
```

```text
example: 13 steps, 36 s planned, 1920×1080 at 30 fps
661 frames received over 36.1 s (18.3 per second), 1084 written at 30 fps.
Key presses showed in the capture within 425 ms; frames reached the recorder within 2144 ms.
warning: the capture fell behind the page, so the video shows changes late; record again when the machine is idle.
Recording: data/recordings/example/20261122-200703/run-through.mp4
Contact sheet: data/recordings/example/20261122-200703/contact-sheet.png
```

The agent reads those lines for you. Here it would say: "The video is 36
seconds, but this run fell behind (the computer was busy): I will record
again with nothing else running before you judge the timing." It also
opens the contact sheet, one tile per step, to see that each step
finished.

**2. The script is the notes.**

> Now make it a narrated video.

```bash
npm run narration -- example
```

```text
index  slide             step  words  seconds  segment
    0  title                0     23      8.6  00-title-0
    1  outline-basics       0      -        -  (silent)
    2  what-is-this         0     14      5.3  02-what-is-this-0
    3  building-up          0      8      3.0  03-building-up-0
    4  building-up          1      -        -  (silent)
    5  building-up          2      8      3.0  05-building-up-2

example: 13 build steps, 5 narrated, 74 words, about 28 s of speech at 160 words per minute
warning: 00-title-0 has Markdown or math, which a voice reads aloud or drops (emphasis marks, backticks)
A voice reads each step on its own: write the notes of a narrated step as complete sentences of plain prose.

Wrote script.json, steps.json, pron.json in presentations/example/assets/narration/20261122-200624
```

Each row is one build step: the words of its note and the seconds they
take. Silent steps have no note. The agent brings you the warnings as
proposals, because the notes are your words: "The title's note has
`**bold**` and a backtick, which the voice would read aloud. Plain version:
'…'. Shall I change it?" A term the voice gets wrong goes into
`presentations/<id>/pronunciation.json`.

**3. The voice, on your computer.** Once per machine,
`bash narration/setup.sh kokoro eval` builds the two Python environments
([narration setup](../environments/narration.md)). Then the two commands
that step 2 printed: `narrate.py` writes one WAV per narrated step, and
`transcribe.py` listens to each and compares what it hears with the
script. The agent reads every step whose error rate is not zero: a
spelling variant is fine, a dropped or wrong word is redone.

**4. Record with the narration.**

```bash
npm run record -- example --narration presentations/example/assets/narration/20261122-200624
```

Each step is now held for as long as its narration lasts, and the audio is
placed where its step appears.

**5. What comes back.** "The video is at `data/recordings/example/…/`,
1 min 12 s. Narration: 5 segments, word error rate 0 on four, one spelling
variant on the fifth. The capture had no late frames. I watched the start
and end of every step: each sentence is heard while its picture is on
screen. Not checked: the audio on other speakers."

**Check before you believe it.** Watch it once through with sound. A
sentence that plays over a picture that has stopped changing is a finding
for the slides, not for the recording. To keep the video, ask for it to be
copied into the presentation's `assets/` and pushed; recordings are not
stored otherwise.
