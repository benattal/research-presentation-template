# Generative view synthesis explainer

[Latest status and resume point](../tracking/gen-nlos-explainer.md)

A narrated explainer video of 4 to 5 minutes for the supplemental material
of the anonymous CVPR submission "Generative View Synthesis from
Propagating Light" (source in `../gen-nlos`), recorded from the deck
`presentations/gen-nlos-explainer/` in this checkout. The aim is quality,
not speed: a deck and video fit for an award candidate. Done means every
gate below has passed, in order, each through its refinement loop.

## Immediate todos

The gates run in order; a gate opens only when the one before it has
passed. Inside a gate the work repeats the refinement loop below until
its check passes.

### Done

- **Research.** The reference decks, the supplemental website and Dropbox
  figures, the bucket's results, and the paper are inventoried (tracker).
- **Script v2.** The paper's wording, cut to spoken length; it is re-cut
  to the storyboard's beats as each section is built.
- **Storyboard.** Below; the user set the plan as the goal.

### Open

1. **Gate 1: first draft of the whole deck.** Each section built to a
   good draft and shown on the served deck; sections may be built in
   parallel (the order that binds is slides, then recording): problem statement
   (slides 1–4, drafted), propagating light (5–6, with the WebGL capture
   render), related work (7), method (8–12, with the WebGL scene and
   flatland), results and summary (13–18). Check per section: `npm run
   check`, a capture with no errors or warnings, and every frame read
   against its storyboard row. Reviewer findings on drafted sections are
   logged in the tracker for gate 2, not acted on yet.
   When the draft is complete: commit, push to git and the bucket, and
   stop. The user looks at everything before the second pass starts.
2. **Gate 2: whole deck, refinement cycles 1 and 2.** Opens only on the
   user's word. A pass on all
   slides and notes, vetting by reviewers who see the deck fresh,
   consolidation with the logged findings and the user's comments, fixes;
   twice. Check: a full capture with no errors or warnings, and a cycle
   whose reviewers report nothing above cosmetic.
3. **Gate 3: narration.** A local text-to-speech model reads each step's
   notes; a local transcription checks them. Check: word error rate at
   most 3%, every term recognized, total 3:50 to 4:40.
4. **Gate 4: recording.** Finish the recorder parked on branch
   `recorder-wip` (framework, on `framework-sync`), record video v1.
   Check: 4:00 to 5:00, 1920×1080 at 30 fps, −16 LUFS ±1, under 80 MB.
5. **Gate 5: refinement cycles 3 and 4, with the video.** Reviewers
   watch the recording (contact sheets, the mix's transcript, the
   timeline) as well as the slides and notes; fixes, re-recording.
   Check: the completion criteria.
6. **Gate 6: delivery.** Final push to git and the bucket; the paper
   sync and the anonymity audit recorded in the tracker.

## Refinement loop

The refinement gates (2 and 5) run this loop over the whole deck, and
record each round in the tracker (findings, what changed, what was
declined and why). Gate 1 runs its build and look steps per section:

1. **Build.** One section at a time, by the lead, in this checkout, in
   small commits. A subagent builds only a self-contained visualization
   from a written specification, in a git worktree that is removed when
   its work is merged. A slide is added to `presentation.json` only when
   it loads.
2. **Look.** `npm run check`, `npm run capture`, then every frame is
   read against the storyboard row: does each key press change the
   screen, does the step show what its narration says, does the title
   name what is on screen.
3. **Vet the animations.** A capture shows one still per step, so motion
   is checked on its own: for every animated step and every looping
   video, frames at a series of times from the key press to the settled
   state, tiled and looked at; and for every pair of consecutive
   slides, the frames across the change. Checked: the motion shows what
   the narration says while it says it; nothing jumps, flashes, or
   restarts; light travels and arrives where the geometry says; clips
   shown together stay in step; elements shared by two slides do not
   move; a key press during an animation moves on at once; the pace is
   neither rushed nor slow. Run in a browser with the GPU, forward,
   backward, and with rapid presses.
4. **Vet.** Two reviewers who did not build it, given the user's
   instructions, the storyboard, the reference-deck analysis, and the
   frames: one for content and clarity (would a CVPR viewer outside NLOS
   follow it, is anything missing or beside the point), one for layout,
   text, and motion ([slide review](../style/slide-review.md), the
   reference decks' look), who repeats the animation check above
   independently. They edit the presentation; they do not reword the
   paper.
5. **Consolidate and fix.** Findings are merged, checked against the
   user's directions, fixed at their cause, and the frames looked at
   again. The loop repeats until a round has no finding above cosmetic.
6. **Publish.** Commit, push to GitHub, push media to the bucket; the
   deck stays served on localhost for the user.

## Rules

- **Follow the instructions and resources given.** Structure, related
  work, hardware renderings, and section delineation after the reference
  decks (`data/gen-nlos/*.pptx`; the contrastive path marginalization
  video is a secondary reference). Results from the supplemental website
  (`data/gen-nlos/standalone.html`, Dropbox `figures/website/`) and the
  Dropbox figure folders, with the paper's scenes. NLOS reconstructions
  and comparisons from the bucket. WebGL for the visualizations.
- **Show what a PDF cannot.** The video is for what the paper and a PDF
  supplement cannot show: camera trajectories, light propagating, 3D
  views, comparisons in motion. It does not restate static results
  (tables, still comparisons). The videos the supplemental website
  highlights are used, with others where they help.
- **Internally consistent.** One order in every comparison, on screen
  and in the narration: reference or ground truth, ours, GEN3C\*,
  HOLI-1-to-3\*, Lyra 2. Slides that follow one another share a grid
  where they share content, so images do not jump. Titles of parallel
  slides are parallel ("Captured scenes: comparison", "Simulated
  scenes: comparison").
- **Composed slides, not pasted figures.** Slides are built from result
  media and our own visuals in designed layouts.
- **Look.** Colors from the reference decks: black, white text, orange
  `#FFCC66` titles and accents, a Futura-like face (Jost). Formatting
  from the light-transport lecture: title at top left, the visual filling
  the slide, short labels, credits at bottom right. No subtitle lines.
- **Words.** The paper's terms and phrasing, changed only for clarity;
  plain statements; no metaphors, no anthropomorphism, no possessives
  that give an inanimate thing something; "feed-forward" for the method.
  [Slide style](../style/slides.md) holds for slides and narration.
- **Anonymous.** No author, institution, lab, or funding names; no logos
  except a vendor's on equipment; no people; no links; stickers with
  codes blurred; no photo metadata. The voice is synthetic; the video
  file carries no metadata.
- **Confidential until publication.** Narration and transcription run
  locally; no paper text goes to a cloud service.
- **One folder.** All work is in this checkout, on its current branch; a
  worktree exists only while a subagent's task runs and is removed after
  the merge. Framework changes still land on `framework-sync` first and
  are merged here.
- **Assets.** Media live in ignored `public/` and `assets/` and in the R2
  bucket `presentations`, folder `presentations/gen-nlos-explainer/`
  (`ASSETS_REMOTE=tcig:`). `data/gen-nlos/` stays local.
- **Sequential.** No narration or recording work before the deck gates
  pass.

## Storyboard

Structure after the reference decks: the problem and the measurement
first, with our result inside the first minute; related work by category;
the method on one evolving picture; results by experimental condition.
Each section opens with a silent card. Every key press changes what is on
screen: one narration beat is one build step with its own visual change.
Titles name what is on screen. Scenes: the vase capture carries the
opening and the method; lamp and globe and the two paper rooms
carry the results. This table is kept current as slides change (status:
planned, building, drafted, refined), so comments can be made against it.
The deck does not follow the paper's structure: the
classifier-free guidance result and the ablations are left out.

| # | Slide (title) | Steps: what appears | Source | Status |
| --- | --- | --- | --- | --- |
| 1 | Title card | title, "Anonymous CVPR 2027 Submission" | — | drafted |
|  | **problem statement** (card) |  |  | drafted |
| 2 | Novel views from a single image | (1) the input view of the vase scene; (2) the views generated from the image alone, the camera moving right, a red box on the hidden region when it comes into view; (3) the reference photo, the real vase boxed | website `vase.png`, teaser `rgb_only`, reference photo | drafted |
| 3 | Video of propagating light | (1) the captured light video with a time readout, a time axis with a playhead; (2) direct light: its intervals on the axis and a still at 5.98 ns; (3) indirect light: its interval and a still at 11.06 ns | website `teaser-light-clean.mp4` (16 ps per frame from 5.12 ns) | drafted |
| 4 | Novel views from propagating light | one step: the reference photo, generation with propagating light (ours), generation without, in step; red boxes on the hidden region | teaser `prediction`, `rgb_only` | drafted |
|  | **propagating light** (card) |  |  | drafted |
| 5 | Lidar capture | WebGL render of the lidar hardware and the website's corner scene (relay walls, teapot occluder, hidden bunny), in the manner of the reference decks' hardware renders, parts labeled; (1) one measurement as a single animation: the pulse leaves the laser and reaches a visible point, the direct return and the indirect light from the hidden object come back, and the plot is swept once across both peaks; (2) the scan over all visible surfaces | three.js | drafted |
| 6 | Hardware prototype | the photo of the prototype; parts named one per step by a line: pulsed laser, scanning mirrors, single-photon avalanche diode; then the steady-state image beside it | `hardware_figure` photo, masked, sticker blurred | drafted |
|  | **related work** (card) |  |  | drafted |
| 7 | Related work | two columns, one lit per step, each with a red limitation line: NLOS imaging (an NLOS volume of the bike scene along a trajectory; "Geometry, not photorealistic appearance"), generative view synthesis (GEN3C\* on the hidden-lamp scene; "Hidden content is hallucinated"); last step: "Ours: generative view synthesis from propagating light" in green | bucket conventional results (data of Lindell et al., credited); `6_QualExperimental` `rgb_only` | drafted |
|  | **method** (card) |  |  | drafted |
| 8 | Processing the capture | WebGL, the vase scene: (1) RGB image and direct light give the colored point cloud; (2) indirect light gives the NLOS volume behind the occluder | three.js: `rgbd_aligned.npz`, `nlos.npy` | drafted |
| 9 | Conditioning videos | same 3D view, the camera moves along the target trajectory; warped RGB, MIP, MIP depth appear as synchronized panels | three.js, teaser `presentation/*.mp4` | drafted |
| 10 | Video generation | diagram: three streams and noisy target tokens into the video diffusion transformer; the output video plays | drawn | drafted |
| 11 | NLOS reconstruction | flatland: (1) planar relay wall versus the visible surfaces of a scene as relays; (2) forward and adjoint operators, CGLS iterations sharpening | canvas, labeled illustration | drafted |
| 12 | Reconstruction with nonplanar relays | rotating renders of the reconstructed volumes, all three methods in step, in one step: ours, CC-SOCR, 3D-GTR; rows: the simulated room, the Stanford-FK dataset | rendered from the bucket's volumes (`nonplanar_nlos_results`), the paper figure's variants, matched by PSNR | drafted |
|  | **results** (card) |  |  | drafted |
| 13 | Training data (simulated) | (1) a tabletop digital twin, as a trajectory; (2) six Infinigen rooms, as trajectories | `4_overview` twin ground truth; `test100_paper_8020_cfg3/gt` | drafted |
| 14 | Captured scenes: same line of sight | rows: hidden lamp, hidden globe; four columns on the comparison slide's grid, one per step: reference photo (the scenes differ), input view (identical), direct light (identical), indirect light (differs) | website refs and `lamp.png`; direct and indirect videos rendered from `aligned_transients.h5` | drafted |
| 15 | Captured scenes: comparison | same grid as slide 14, the reference photo staying in place; one method per step, all in step: ours (20/20 seeds), GEN3C\* (0/20 seeds), HOLI-1-to-3\* (method fails); red boxes on the hidden region at the held final view | `6_QualExperimental` `prediction`, `rgb_only`; Dropbox HOLI folder | drafted |
| 16 | Simulated scenes: comparison | two rooms, all methods in step: (1) ground truth and ours; (2) GEN3C\*; (3) HOLI-1-to-3\* and Lyra 2 (no boxes yet) | `test100_paper_8020_cfg3`, Dropbox HOLI folder | drafted |
| 17 | Summary | our vase result at the left; one line per step: the takeaway, the limitation, the outlook | teaser `prediction` | drafted |
| 18 | Title card | as slide 1 | — | drafted |

## Visualizations

Each is driven by the step clock (`useStepClock`), so the live deck and
the recording show the same motion.

- **Lidar capture** (slide 5, three.js). In the manner of the reference
  decks' hardware renders: clean CG on black, a fixed three-quarter view,
  parts labeled in short white text, rendering the hardware setup and
  the capture procedure as those decks do. The lidar (laser, scanning
  mirrors, detector) aimed at the scene of the website's light section
  and the paper's Fig. 2: two relay walls, the teapot occluder, the hidden
  bunny. A pulse to a visible point; the
  direct return and the first peak of the measurement; the wavefront to
  the hidden object and back, and the weak later peak; the scan.
- **The vase scene in 3D** (slides 8–9, three.js). The captured point
  cloud and the reconstructed NLOS volume, from the capture's own data;
  the camera moving along the target trajectory, with the three
  conditioning videos in step.
- **NLOS reconstruction in flatland** (slide 11, canvas). Computed live:
  a planar relay wall against the visible surfaces of a scene as relays;
  the forward and adjoint operators; CGLS iterations. Labeled an
  illustration.

The stopped builders' partial versions of these are on branch
`gen-nlos-work` (unreviewed); each is read before deciding to reuse it.

## Narration and recording (gates 3 to 5)

Each build step's notes are its narration. A local model reads them, one
file per step, with a fixed voice and a pronunciation map; a local
transcription checks every file. The recorder renders each slide step on
a virtual clock at 1920×1080 and 30 fps, cross-fades between steps and
slides, places the narration by the same timeline, and writes captions.

## Completion criteria

- The video runs 4:00 to 5:00 at 1920×1080, 30 fps, under 80 MB, with
  loudness −16 LUFS ±1 and true peak below −1.5 dBTP.
- The final mix's transcript matches the script with a word error rate of
  at most 3%, and every technical term is recognized.
- Every number and method name matches the main paper as it stands at the
  final sync; every visual uses a scene from the paper or the website.
- The capture of the deck has no errors or warnings; every frame and
  every video contact sheet has been looked at.
- Every animation and every slide-to-slide change has been vetted in
  motion (frame series from press to settled, forward and backward), by
  the lead and by a reviewer, with the result recorded in the tracker.
- The anonymity audit passes: frames, narration, captions, file metadata.
- Four refinement cycles are recorded in the tracker, each with its
  findings and their resolution.
- `npm run check` and `npm test` pass.
- Assets and the video are in the `presentations` bucket, verified by
  `rclone check`.
