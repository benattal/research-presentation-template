# Making a narrated video

How to turn a deck into a narrated video: an
[explainer video](../style/presentation-types.md#explainer-video). The
stages are gates, in this order; a later stage does not start before the
one before it has passed, because each consumes the last one's output and
because the tools of the later stages are worthless while the slides are
still changing.

The tools are described in [narration](../implementation/narration.md)
(set up once per machine: [narration setup](../environments/narration.md))
and [recording](../implementation/recording.md).

## Gate 1: the slides

The deck is made by the [general procedure](making-a-presentation.md), with
what its type adds:

- Every build step is a narration beat and changes the screen. Animations
  are driven by the step clock (`useStepClock`), so that a recording
  reproduces them; a slide holds one video element, with clips shown
  together stitched into one file.
- Nothing interactive: nobody is there to use a control.
- Decide the length (minutes, and words at about 150 words per minute),
  whether the video is anonymous, and whether the script is confidential.

## Gate 2: the script

The script is the deck's notes: `notes.md` for a slide's first step and
`notes-<k>.md` for step `k`.

1. Write each step's note as one or more complete sentences, in the
   source's wording, plain and literal ([writing style](../style/writing.md)).
2. Export and measure it: `npm run narration -- <id>` writes the script and
   prints each step's words and estimated seconds, and warns about notes a
   voice reads badly (Markdown, math). Compare the total with the target;
   cut sentences, not words.
3. Read it by ear, one step at a time. A list with an aside, three nouns in
   a row, or a sentence whose point comes last is hard to follow when
   heard. An independent reviewer who reads only the script finds more than
   its author.
4. List the terms a voice will misread (abbreviations, names with digits or
   hyphens) in the presentation's `pronunciation.json`.

Check: the word count fits the length, and no step's narration outlasts
what its slide shows by more than a second or two.

## Gate 3: the narration

`npm run narration -- <id>` ends by printing two commands. The first
synthesizes the script with a local text-to-speech model
(`narration/narrate.py`): one audio file per step, a fixed voice, a fixed
seed. The second transcribes the audio back (`narration/transcribe.py`)
and reports each step's word error rate against the script: this finds
mispronounced terms and dropped words without anyone listening. Both run
on this machine; a confidential script is never sent to a service.

After a correction, synthesize only the changed steps
(`narrate.py --only <segment ids>`; the others keep their files). Fix a
misread term in
`pronunciation.json`, not by respelling the notes, which the presenter
view and captions also show.

Check: the transcript matches the script except for spelling variants, and
every technical term is recognized.

## Gate 4: the recording

1. **A silent pass first:** `npm run record -- <id>` plays every slide and
   step and writes a video with a contact sheet of every step's last
   frame. Read the contact sheet; watch the transitions.
2. **Then with narration:** `npm run record -- <id> --narration <dir>`
   holds each step for its narration and places each audio file at the
   moment its step appears.
3. A step whose animation must be seen in full, or whose motion is longer
   than a default hold, says so in the presentation's `recording.json`
   ([presentation format](../implementation/presentations.md#recordingjson)).
4. Read the two lines the command prints about the capture: a late or
   recovered frame means the machine was busy, and the run is repeated
   when nothing else is running.

Check: the length; every sentence heard while its visual is on screen; the
loudness (about −16 LUFS integrated, true peak below −1.5 dBTP); no
metadata in the file.

## Gate 5: review with the video

Two more refinement cycles, with reviewers who watch the recording as well
as the slides: the contact sheet, frames pulled at each step's start and
end, the transcript of the mix, and the timeline (when each step began and
how long its narration is). The most common finding is a sentence spoken
over a picture that has stopped changing; the fix is a visual beat, a split
step, or a shorter sentence.

## Delivery

- The final video, its timeline, and the narration directory go to the
  bucket with the deck's assets.
- An anonymous video is audited once more: frames, narration, captions,
  file metadata, and the names of files inside the deliverable.
- The tracker records the final numbers (length, size, loudness, words) and
  the audit.

## What takes the time

In practice the slides take most of the work, and each later gate takes a
small fraction of the one before it, provided the gates are kept. A narrated
run-through is cheap once the tools exist, and is the only test of the
whole: record one as soon as a full draft exists, to find what a still
capture cannot show, and then go back to the slides.
