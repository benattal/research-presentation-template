# Narration

A narrated video of a presentation needs a voice reading a script in time
with the slides. Here the script is the presentation's notes, and the voice
is a text-to-speech model run on the presenter's own machine. This document
describes the path from notes to audio files, the directory those files
live in, and how to check the result without listening to all of it.

Nothing in this path sends text or audio to a service. A script may be
confidential until its paper is public, so synthesis and transcription both
run locally; the only network use is the one-time download of Python
packages and open model weights ([setup](../environments/narration.md)).

## The pipeline

```text
slides/<slide-id>/notes*.md ─┐
presentation.json ───────────┤ npm run narration -- <id>
pronunciation.json ──────────┘        │
                                      ▼
                     <narration dir>/script.json, steps.json, pron.json
                                      │ narration/narrate.py     (venv of the voice's backend)
                                      ▼
                     <narration dir>/<segment id>.wav, manifest.json
                                      │ narration/transcribe.py  (venv eval)
                                      ▼
                     word error rate of each segment against its script text
```

1. `npm run narration -- <id>` (`scripts/narration.mjs`, logic in
   `core/tooling/narration.js`) reads the notes in deck order and writes
   the script. It runs no Python.
2. `narration/narrate.py` synthesizes one audio file per segment and writes
   `manifest.json`.
3. `narration/transcribe.py` transcribes the audio with a speech recognizer
   and compares each segment with the script.
4. The recorder (`npm run record -- <id> --narration <dir>`) reads
   `steps.json` and `manifest.json` from the same directory to time each
   build step to its audio.

## Notes are the script

A build step is one position in the deck: a slide without `buildSteps` has
one, and a slide with them has one per entry
([presentation format](presentations.md)). Each build step speaks the notes
file it shows, the first time a step of its slide shows that file:
`notes.md` at step 0 and `notes-<k>.md` at step k. A later step that falls
back to `notes.md` is silent, as is a step with no notes file or a blank
one. `notesFileName` in `core/client/presentation/model.js` picks the file,
so narration and the presenter window agree on which notes belong to a
step.

One narrated step is one segment, and the model reads each segment on its
own, with no memory of the one before. The notes of a narrated step are
therefore one or more complete sentences of plain prose. A fragment that
continues the previous step's sentence is read with the wrong intonation,
and Markdown is read aloud: in the example presentation's notes, `**P**`
was spoken as "asterisk asterisk P". `npm run narration` warns about a
step whose notes do not start with a capital letter or digit, do not end
with a period, question mark, or exclamation mark, or contain emphasis
marks, backticks, dollar signs, a heading, a list, or a link
(`speechProblems`). The warnings do not stop the export.

The export changes no wording. A segment's text is its notes file with
each run of white space, line breaks included, written as one space.

## The command

```bash
npm run narration -- <id> [--out <dir>] [--voice <preset>] [--wpm 160]
```

| Option | Meaning |
|---|---|
| `--out` | the narration directory; default `presentations/<id>/assets/narration/<YYYYmmdd-HHMMSS>/` (UTC), which git ignores and `npm run assets -- push <id>` copies to the bucket ([DATA.md](../../DATA.md)) |
| `--voice` | a preset of `narration/voices.json`; default `kokoro-heart` |
| `--wpm` | speaking rate for the duration estimate, in words per minute; default 160 |

It prints one row per build step with its word count and the seconds its
notes take to speak at `--wpm` (words ÷ rate × 60), the totals, the
warnings, and the two commands to run next, with the paths of this
machine's Python environments filled in:

```text
index  slide             step  words  seconds  segment
    0  title                0     23      8.6  00-title-0
    1  outline-basics       0      -        -  (silent)
    2  what-is-this         0     14      5.3  02-what-is-this-0
    ...
example: 13 build steps, 5 narrated, 74 words, about 28 s of speech at 160 words per minute (narrate.py adds silence around each segment)
```

The estimate covers speech only. `narrate.py` adds 0.15 s of silence before
each segment and 0.35 s after it (`--lead`, `--tail`), and a pause of
0.45 s between sentence groups, so the audio is longer than the estimate
by about half a second per segment.

Exporting again into the same directory replaces `script.json`,
`steps.json`, and `pron.json`. After rewording a step, export to the same
`--out` and render only that segment with `narrate.py ... --only <segment
id>`; the manifest keeps the other segments' entries. A segment id
contains the step's index in the deck, so after adding or removing a build
step, export into a new directory instead: later segments are renumbered
and their old files would be left behind.

## The narration directory

```text
<narration dir>/
  script.json          npm run narration: the voice and the text of each segment
  steps.json           npm run narration: every build step, with its segment
  pron.json            npm run narration: the pronunciation map used
  manifest.json        narrate.py: what was rendered, with durations
  <segment id>.wav     narrate.py: one file per segment
```

A segment id is `<NN>-<slide-id>-<step>`: NN is the build step's 0-based
index in the deck, padded with zeros to at least two digits (to the width
of the deck's largest index), so the files sort in deck order. `step` is
the 0-based build step of the slide.

`script.json` is the input of `narrate.py`. `voice` is a preset name from
`narration/voices.json`, or an object with the same fields as a preset:

```json
{
  "voice": "kokoro-heart",
  "segments": [
    { "id": "00-title-0", "text": "Generative view synthesis from propagating light." },
    { "id": "02-single-image-0", "text": "Recent advances in ..." }
  ]
}
```

`steps.json` lists every build step of the deck in order; `segment` is
null for a silent step:

```json
[
  { "index": 0, "slide": "title", "step": 0, "layout": "title", "segment": "00-title-0" },
  { "index": 1, "slide": "card-problem", "step": 0, "layout": "sectionCard", "segment": null }
]
```

`manifest.json` records one render. Its top level has `script` (the path
given to `narrate.py`), `voice` (the resolved voice object), `model`,
`seed`, `sample_rate` (48000), `channels` (1), `subtype` (`PCM_24`),
`loudness_target_lufs`, `max_true_peak_dbtp`, `lead_s`, `tail_s`,
`pronunciations`, `total_duration_s`, and `segments`. Each segment has:

| Field | Meaning |
|---|---|
| `id`, `file` | the segment id and its file name, `<id>.wav`, beside the manifest |
| `duration_s` | length of the file in seconds, lead and tail silence included |
| `text` | the script's wording |
| `spoken_text` | the text given to the model, after the pronunciation map |
| `lufs_i`, `true_peak_dbtp` | measured integrated loudness and true peak of the file |
| `sha256` | hash of the file |
| `groups` | the sentence groups synthesized, each with its `text`, `seed`, `duration_s`, and `synth_s` (seconds the model took) |

## Synthesis

```bash
<NARRATION_HOME>/venvs/kokoro/Scripts/python.exe narration/narrate.py <dir>/script.json --out <dir> --pron <dir>/pron.json
```

(`bin/python` in place of `Scripts/python.exe` outside Windows; `npm run
narration` prints the line for this machine.) For each segment
`narrate.py`:

1. applies the pronunciation map (`narration/spoken_text.py`);
2. splits the text into sentence groups, at most 2 sentences and about 280
   characters each (a longer single sentence stays whole), and synthesizes
   each group on its own, so the model never runs long enough to drift.
   One loaded voice renders every group of every segment;
3. seeds each group from `--seed`, the segment id, and the group's index,
   so a rerun reproduces every file and a change to one segment leaves the
   others alone;
4. trims silence below -50 dBFS from each group's ends, resamples the
   group to 48 kHz, joins the groups with a 0.45 s pause, and adds the
   lead and tail silence;
5. applies one gain per segment toward `--lufs` (default -16 LUFS
   integrated), stopping where the true peak would pass `--max-true-peak`
   (default -1.5 dBTP);
6. writes `<id>.wav` (48 kHz, mono, 24-bit PCM) and, at the end,
   `manifest.json`.

The gain in step 5 has no limiter behind it, so a segment with a high peak
stays below the loudness target. In the example's render the five segments
measured between -25.2 and -18.0 LUFS, each with its true peak at
-1.5 dBTP. Level the segments when mixing if that spread is audible.

## Voices

`narration/voices.json` holds the presets; a preset names its `backend`
(which Python environment and model family render it) and that backend's
settings. Optional fields of any preset: `max_sentences` (2), `max_chars`
(280), `sentence_gap_s` (0.45).

| Preset | Backend | Model | Measured |
|---|---|---|---|
| `kokoro-heart` | `kokoro` | Kokoro-82M, speaker `af_heart`, speed 1.0 | used for one finished narration; see below |
| `kokoro-michael`, `kokoro-emma` | `kokoro` | Kokoro-82M, other speakers, speed 0.95 | sample clips only |
| `qwen-ryan`, `qwen-aiden` | `qwen` | Qwen3-TTS 1.7B CustomVoice | one clip of 51.3 s took 35,231 s to synthesize while the machine was busy; not used |
| `chatterbox-default`, `chatterbox-turbo` | `chatterbox` | Chatterbox | installed; not measured |

Measurements, all on one laptop (RTX 4070 Laptop GPU, 8 GB, Windows 11),
on 2026-11-19, with `kokoro-heart`:

- A 718-word script in 39 segments came to 306.6 s of audio, lead and tail
  silence included: 287 s without them, or 150 words per minute. The model
  took 9.9 s for all of it, about 29 times faster than real time.
- The example presentation's notes (74 words, 5 segments) came to 32.9 s of
  audio. The model took 3.0 s, 2.0 s of it on the first sentence group;
  the whole command took 96 s, most of it loading torch and the model.
- Transcribed back with `transcribe.py`, three of the example's five
  segments (43 words) had no word errors. The other two had 9 errors in
  36 words, all where Markdown was read aloud ("asterisk asterisk",
  "slash").

- Rendering the example a second time, into another directory, gave five
  files with the same SHA-256 as the first render.

Kokoro does not sample, so the seed does not change its output. The Qwen
and Chatterbox backends sample, and require a CUDA GPU.

## The pronunciation map

A model spells out or guesses abbreviations and names it has not seen:
"NLOS" needs to be said "en-loss", and "GEN3C" "Gen three C". A
presentation lists such terms in an optional `pronunciation.json` beside
its `presentation.json`, a flat object from the term as the notes write it
to the spelling the voice should read:

```json
{
  "NLOS": "en-loss",
  "LoRA": "Lora",
  "Lyra 2": "Lyra two",
  "3D-GTR": "three D G T R"
}
```

The notes keep the real spelling, which is also what the presenter window
shows. `npm run narration` copies the map to `pron.json` in the narration
directory (`{}` without the file), and `narrate.py --pron` applies it:

- a term matches as written, case included, and only as a whole term: not
  inside a longer word and not as part of a hyphenated compound ("NLOS"
  does not match in "non-NLOS");
- longer terms are replaced before shorter ones, one after another on the
  same text, so a spoken spelling must not contain a shorter term of the
  map as a whole word;
- the manifest keeps both `text` and `spoken_text`.

`npm run check` reports a `pronunciation.json` that is not an object of
non-empty strings. Find the terms a map needs by transcribing a first
render.

## Checking by transcription

```bash
<NARRATION_HOME>/venvs/eval/Scripts/python.exe narration/transcribe.py <dir>/manifest.json [--only <ids>] [--out report.json]
<NARRATION_HOME>/venvs/eval/Scripts/python.exe narration/transcribe.py <file>.wav
```

Given a manifest, `transcribe.py` transcribes every segment (or the ids of
`--only`) with faster-whisper `large-v3` and prints each segment's word
error rate against its script `text`, with the words that differ:

```text
00-title-0: WER 15.4% (4 of 26 words)
    insert: script "" heard "slash"
    insert: script "" heard "slash"
    insert: script "" heard "asterisk asterisk"
02-what-is-this-0: WER 0.0% (0 of 14 words)
...
5 segment(s), 79 words: WER 11.4%, 2 segment(s) differ from the script
```

The word error rate is the number of substituted, deleted, and inserted
words over the number of words in the script text. Both sides first go
through Whisper's English normalizer, so case, punctuation, and the
spelling of numbers do not count. The recognizer gets no prompt, so it is
not biased toward the expected words. The rate points at the segments to
read: a term the map respells can count as an error when the recognizer
writes what it heard ("en loss" for "NLOS"), and a person decides whether a
difference is a mispronunciation. Given a WAV file of any sample rate, the
command prints its transcript with the start time of each phrase, which
suits a finished mix.

## Tests

`tests/narration.test.mjs` (`npm test`) covers the export: step order,
segment ids, silent steps, the sentence check, the duration estimate, and
the pronunciation map's validation. The text functions of the Python side
have standard-library tests that need no venv:

```bash
python -m unittest discover -s narration
```
