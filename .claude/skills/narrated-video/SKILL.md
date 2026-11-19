---
name: narrated-video
description: Turn a finished deck into a narrated video, or record a silent run-through of any deck: export the notes as a script, synthesize the voiceover locally, check it by transcription, and record the deck with the narration placed on its steps. Use when asked to record, film, or make a video or run-through of a presentation, to add or redo a voiceover or narration, to fix a mispronounced term, or to check a deck's pacing.
---

# Record a deck, with or without narration

`docs/workflows/narrated-video.md` is the procedure, with its gates;
`docs/implementation/narration.md` and `docs/implementation/recording.md`
describe the tools. This skill is the commands in order.

Before anything: the slides exist and pass the `validate-slides` skill. Do
not synthesize or record a deck whose slides are still being built.
Everything below runs on this machine; never send a script or audio to a
service.

## A silent run-through (any deck)

```bash
npm run record -- <id>
```

Needs `ffmpeg` and an installed Edge or Chrome. It writes
`data/recordings/<id>/<time>/`: `run-through.mp4`, `contact-sheet.png`
(the last frame of every step), `timeline.json`. Read the contact sheet;
each tile shows its step finished. Read the two lines the command prints
about the capture: late or recovered frames mean the machine was busy, so
stop other work and record again. A step whose motion is longer than the
default hold gets an entry in `presentations/<id>/recording.json`.

## With narration

1. **Script.** The notes are the script (`notes.md`, `notes-<k>.md`).

   ```bash
   npm run narration -- <id>
   ```

   It prints each step's words and seconds and warns about notes a voice
   reads badly; fix those in the notes (plain sentences, no Markdown), and
   list misread terms in `presentations/<id>/pronunciation.json`. Slide
   content is the user's: propose changes to wording, do not make them
   unasked.
2. **Voice.** Once per machine: `bash narration/setup.sh kokoro eval`
   (`docs/environments/narration.md`). Then run the two commands that
   step 1 printed: `narrate.py` (one WAV per step and `manifest.json`) and
   `transcribe.py` (word error rate per step). Read every step whose rate
   is not zero: a spelling variant is fine, a wrong or dropped word is
   not. Redo only those steps with `--only <segment ids>`.
3. **Record.**

   ```bash
   npm run record -- <id> --narration <narration dir>
   ```

   Each step is held for its narration and the audio is placed where its
   step appears, leveled per segment to −16 LUFS.
4. **Check.** The contact sheet; the length; the capture lines; then
   watch, or pull frames at each step's start and end: every sentence is
   heard while its visual is on screen. A sentence over a picture that has
   stopped changing is a finding for the slides.

## Report

Give the video's path, its length, the narration's word error rate, and
the capture's late and recovered frames. Say what was not checked. For an
anonymous video, say whether frames, audio, and file metadata were
audited. Recordings are ignored by git; push a deliverable to the bucket
with the `sync-assets` skill only when the user asks for it.
