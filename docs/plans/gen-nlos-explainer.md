# Generative view synthesis explainer

[Latest status and resume point](../tracking/gen-nlos-explainer.md)

A narrated explainer video of 4 to 5 minutes for the supplemental material
of the anonymous CVPR submission "Generative View Synthesis from
Propagating Light" (source in `../gen-nlos`), built as the presentation
`presentations/gen-nlos-explainer/` and recorded from it. It should be fit
for an award candidate: results first, one clear argument, the paper's own
scenes throughout, WebGL visualizations where a picture explains the idea,
and natural synthetic narration. Done means: the video, its narration, its
captions, and the deck pass the completion criteria below after at least
three review cycles, and the HOLI-1-to-3 trajectories are in the Dropbox
figures folder.

## Immediate todos

Work these in order, one at a time; research agents run in parallel at the
start.

### Done

1. **Research.** Four reports: the reference decks (`data/gen-nlos/*.pptx`,
   primary) and the contrastive path marginalization video (secondary);
   the supplemental website (`data/gen-nlos/standalone.html`, the Dropbox
   `figures/website/`) and the Dropbox figure folders; the bucket's results
   (NLOS reconstructions, baselines, HOLI-1-to-3, captured transients,
   meshes); local text-to-speech. Gate: each report's findings are in the
   tracker, and the storyboard below names a source for every visual.
2. **HOLI-1-to-3 upload.** A dedicated agent copies the HOLI-1-to-3
   rendered-trajectory videos of the paper's scenes from the bucket into
   the new Dropbox folder `figures/holi_1_to_3_trajectories/`, with a
   README giving each file's source, scene, and figure. Gate: the README
   lists every paper scene, as copied or as missing.
3. **Script and storyboard v1.** One narration per build step, written as
   that step's notes (`notes.md`, `notes-<step>.md`), 620 to 720 words in
   all. Every claim and number traced to a section of the paper. Gate: the
   storyboard table below is filled with real sources and durations.
4. **Script review, cycle 1.** Three independent reviewers, each given the
   paper and the script, not each other's reports: correctness against the
   paper; clarity for a CVPR reader outside NLOS imaging; narrative and
   pacing against the reference decks. Gate: every finding fixed or
   answered in the tracker; script v2.
### Open

5. **Slides v1.** Builders, in parallel, each owning its layouts and
   slides (brief: `data/gen-nlos/script/BUILD-BRIEF.md`): results panels
   and numbers; title, section cards, prior work, and capture; WebGL
   propagating light; WebGL method overview (the vase scene's point cloud
   and NLOS volume); flatland NLOS reconstruction. Slides are composed
   from result media and our own visuals, never pasted paper figures.
   Gate: `npm run capture` with no errors or warnings, every frame looked
   at, merged and served.
6. **Deck review cycles.** Repeat 3–4 times: vet slides and notes with
   subagents (content, clarity, layout and text, motion), consolidate,
   fix, merge, push to git and the bucket. Gate: a cycle with no findings
   above cosmetic.
7. **Narration.** Only after the deck gate: synthesize every step's notes
   with the chosen local model (environment in `../rpt-tts`); transcribe
   it back with a local ASR. Gate: word error rate at most 3%, every
   technical term recognized, total narration 3:50 to 4:40.
8. **Framework: recording.** Only after the narration gate: finish the
   recorder parked on `recorder-wip` (record view, `npm run video`,
   docs, tests) on `framework-sync`, then merge. Gate: `npm test`, a
   recording of the example deck.
9. **Video v1.** Record and assemble. Gate: 4:00 to 5:00, 1920×1080 at
   30 fps, loudness −16 LUFS ±1 with true peak below −1.5 dBTP, file
   under 80 MB, and every narrated sentence on screen with the visual it
   refers to.
10. **Video review, cycle 1.** Content reviewers (paper correctness, clarity),
    a layout and text vetter (docs/style/slide-review.md), and a video
    reviewer working from contact sheets, the final mix's transcript, and
    the timeline. Fixes, then v2 of slides, narration, and video.
11. **Video review, cycle 2.** A fresh full review of v2, a sync of every number
    and name with the paper source as it stands, and the anonymity audit.
    Fixes, then the final recording.
12. **Delivery.** Push `public/` and `assets/` (including the narration and
    the final video) to the `presentations` bucket; record the deliverable
    paths, the open questions, and the needed-things list in the tracker.

## Rules

- **Anonymous.** No author, institution, lab, or funding names; no logos
  except a vendor's on equipment; no people; no URLs to code or project
  pages; no acknowledgments. The voice is synthetic. The video file
  carries no metadata (`-map_metadata -1`) and has a neutral name. Prior
  work is cited in the third person.
- **Consistent with the paper.** Method names as the paper writes them
  (GEN3C\*, Lyra 2, HOLI-1-to-3\*, CC-SOCR, 3D-GTR); numbers from the main
  paper's tables and captions; scenes from the paper and the supplemental
  website (the hidden-vase teaser, the lamp and globe pair, the fan, the
  paper's Infinigen rooms). Where the website and the paper disagree, the
  paper wins and the tracker records the disagreement.
- **Slide rules.** [Slide style](../style/slides.md) and
  [slide review](../style/slide-review.md) hold, and their word rules
  (plain statements, no metaphors, no agency for things without it) hold
  for the narration too. The deck must also work presented live.
- **Confidential until publication.** Narration, transcription, and every
  other processing of the script run locally; no paper text goes to a
  cloud service.
- **Branches.** Framework changes land on `framework-sync`, then merge into
  `gen-nlos-explainer`; `main` moves to `framework-sync` after an idle
  `npm run test:ui`. Presentation work stays on `gen-nlos-explainer`.
  Nothing is pushed to GitHub unless the user asks.
- **Assets.** Media live in ignored `public/` and `assets/` and in the
  `presentations` bucket, folder `presentations/gen-nlos-explainer/`
  (`ASSETS_REMOTE=tcig:`). The paper PDFs and reference decks in
  `data/gen-nlos/` stay local (excluded in `.git/info/exclude`).
- **Dropbox.** Write only inside `figures/holi_1_to_3_trajectories/`;
  never change another file there.
- **Local hosting.** No `poll`, `pollResults`, or `numericPoll` layouts.
- **Look.** Colors from the reference decks: black background, white
  text, orange `#FFCC66` titles and accents, a Futura-like face (Jost).
  Formatting from the light-transport lecture: title at top left, the
  visual filling the slide, short labels, credits at bottom right. Slides
  have a title and no subtitle line (the narration states the point).

## Design

### Storyboard

About 150 words a minute; the times include pauses on results.
Sections show as the slide's section label; one outline-free run, since
a five-minute video has no room for divider slides unless the references
show they pay off.

| # | Slide | Point | Visual (source) | Time |
|---|---|---|---|---|
| 1 | title | Title, anonymous submission | a frame of a result (website) | 0:06 |
| 2 | teaser | Propagating light lets a video model reveal a hidden object | input view, light video, novel views with and without propagating light, reference photo (teaser scene, website) | 0:25 |
| 3 | motivation | Image-only generation hallucinates occluded content | same input, GEN3C\* or Lyra 2 inventing different objects (website, bucket) | 0:20 |
| 4 | propagating-light | A lidar records direct light (depth) and indirect light (hidden surfaces) | WebGL W1: pulse, relays, hidden object, measurement $b_p(t)$ | 0:35 |
| 5 | capture | One viewpoint, two measurements: steady-state RGB and a light video | WebGL W4 or the hardware photo; captured light-video frames (teaser panels) | 0:20 |
| 6 | prior-work | NLOS imaging recovers geometry, generative models recover appearance | relay-wall NLOS, camera-controlled generation, HOLI-1-to-3 (paper figures, credited) | 0:25 |
| 7 | approach | Condition a video model on visible and hidden geometry | WebGL W2: point cloud and NLOS volume along the trajectory; conditioning videos; token concatenation | 0:45 |
| 8 | nlos-reconstruction | Every visible surface is a relay; Monte Carlo operators with CGLS | WebGL W3: flatland forward and adjoint transport, CGLS iterations | 0:25 |
| 9 | nlos-comparison | Sharper than CC-SOCR, more robust than 3D-GTR | paper Fig. 4 panels (Dropbox `nlos_comparison`) | 0:12 |
| 10 | training-data | Trained only on simulation: tabletop digital twins and Infinigen rooms | dataset renders (Dropbox, bucket) | 0:15 |
| 11 | captured-results | Same line of sight, different hidden object: ours 20/20, GEN3C\* 0/20 | lamp and globe trajectories, stitched (website) | 0:30 |
| 12 | more-captured | The hidden vase and fan; guidance commits to the object | vase and fan trajectories; CFG panel (website, paper Fig. 7) | 0:20 |
| 13 | room-results | Room-scale scenes: correct hidden furniture | Lyra 2, GEN3C\*, HOLI-1-to-3\*, ours (website, bucket) | 0:25 |
| 14 | numbers | Detection and hidden geometry improve | chart of mAP and Chamfer distance, tabletop and room (paper Table 1) | 0:15 |
| 15 | summary | Takeaways, limitations, outlook | a final result | 0:20 |
| 16 | end | Title again | — | 0:05 |

### Visualizations

Written with three.js (WebGL) or a 2D canvas, each driven by the step
clock so the live deck and the recording show the same motion.

- **W1, propagating light** (must). The captured tabletop in 3D: two relay
  walls, an occluder, a visible object, the hidden object, the lidar at
  $\mathbf{o}$. Step 1: the laser reaches $\mathbf{x}_p$ and the direct
  return gives depth; the measurement plot fills with a sharp peak. Step 2:
  a spherical wavefront from $\mathbf{x}_p$ reaches the hidden object and
  returns as the weak indirect peak at $t_{\mathbf{y}}$. Step 3: scanning
  many $\mathbf{x}_p$ gives the light video. Matches paper Fig. 2.
- **W2, conditioning** (should). The captured point cloud (RGB unprojected
  with direct-return depth) and the NLOS volume in one 3D view, with the
  camera moving along the target trajectory; the warped RGB, MIP, and
  MIP-depth panels beside it. Needs a captured RGB image, depth map, and
  NLOS volume; without them the slide uses the overview figure's panels.
- **W3, NLOS with arbitrary relays** (should). A 2D slice: a nonplanar
  relay, a hidden object, confocal measurements; the adjoint
  (backprojection) spreads each measurement over its circle; CGLS
  iterations sharpen the estimate. Computed live on a small grid and
  labeled as an illustration.
- **W4, hardware** (nice). The capture system in 3D (laser, beamsplitter,
  scanning mirrors, objective, SPAD, RGB camera) with the laser and return
  paths, after the hardware photo; falls back to the photo.

### Narration

Each build step's notes are its narration, in plain spoken English (no
markdown, numbers written as spoken). A local TTS model reads them, one
step per file, with a fixed voice and seed and a pronunciation map for
terms (NLOS, GEN3C, HOLI-1-to-3, CGLS, LoRA, MIP). A local ASR transcribes
every file back for the word-error and term checks. Narration WAVs live in
`assets/narration/`, with a manifest of durations.

### Recording

`npm run video -- <id>` (to be documented in `docs/implementation/video.md`):
each slide step is rendered in the `record` view at 1920×1080, its
animations and videos stepped by a virtual clock at 30 fps (static steps
are one frame held), so the result does not depend on the machine's
speed. Steps last their narration plus padding; slide changes cross-fade
over 0.5 s and build steps over 0.3 s. The narration track is placed by
the same timeline, loudness-normalized, and muxed; captions (SRT) come
from the notes and the timeline.

### Review cycles

| Cycle | Reviews | Output |
|---|---|---|
| 1 | script: correctness, clarity, narrative | script v2 |
| 2 | slides v1 and video v1: content, layout and text, video timing and audio | slides, narration, video v2 |
| 3 | v2 fresh review, paper sync, anonymity audit | final |

Reviewers edit the presentation: structure, flow, visuals, pacing, and
clarity for a viewer. They check that the script states the paper
correctly, but they do not critique or reword the paper's own content and
language, which the narration follows. Reviewers get the paper and the
artifact, not the previous reviewers' conclusions. Each finding is fixed
or answered in the tracker.

### Deliverables

- `presentations/gen-nlos-explainer/` on `gen-nlos-explainer` (slides,
  notes as script, layouts) and its media in the bucket.
- The video (`gen-nlos-explainer.mp4`), its captions (`.srt`), and the
  narration, in `assets/video/` and the bucket.
- The HOLI-1-to-3 trajectories in Dropbox `figures/holi_1_to_3_trajectories/`.
- The tracker's needed-things list: results the video would gain from
  (for example a rendered backprojection video), kept short.

## Completion criteria

- The video runs 4:00 to 5:00 at 1920×1080, 30 fps, under 80 MB, with
  loudness −16 LUFS ±1 and true peak below −1.5 dBTP.
- The final mix's transcript matches the script with a word error rate of
  at most 3%, and every technical term is recognized.
- Every number and method name matches the main paper as it stands at the
  final sync; every visual uses a scene from the paper or the website.
- The capture of the deck has no errors or warnings, and every frame and
  every video contact sheet has been looked at.
- The anonymity audit passes: frames, narration, captions, file metadata.
- Three review cycles are recorded in the tracker, each with its findings
  and their resolution.
- `npm run check` and `npm test` pass on `gen-nlos-explainer`; `npm run
  test:ui` passes on `framework-sync` before `main` moves.
- Assets and the video are in the `presentations` bucket, verified by
  `rclone check`.
