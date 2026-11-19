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
   For the second pass, from the user (2026-11-19): narration runs too
   long over visuals that have stopped changing. (a) Lidar capture
   (slide 5): show the captured video when the narration says a video is
   captured; show indirect light propagating from several visible
   points, not one; proposal: step 1, the hardware and scene with the
   captured light video beside them; step 2, one measurement (pulse,
   direct return, indirect light, the plot swept once); step 3, the same
   for two or three other scan points in quick succession, the
   wavefronts reaching the hidden object from different relays; step 4,
   the scan, with the measurements assembling into the video. (b) Every
   step: compare the narration's length with how long its visual keeps
   changing (the recording's timeline gives both), and either add a
   visual beat, split the step, or shorten the sentence.
2. **Gate 2: whole deck, refinement cycles 1 and 2.** Open since
   2026-11-19. Cycle 1: the pass and the vetting are done; the
   consolidation is paused at the user's request with its open list in
   the tracker's newest entry. A pass on all
   slides and notes, vetting by reviewers who see the deck fresh,
   consolidation with the logged findings and the user's comments, fixes;
   twice. Check: a full capture with no errors or warnings, and a cycle
   whose reviewers report nothing above cosmetic.
3. **Gate 3: narration.** A local text-to-speech model reads each step's
   notes; a local transcription checks them. Check: word error rate at
   most 3%, every term recognized, total 3:50 to 4:40.
4. **Gate 4: recording.** Record video v1 with `npm run record`
   ([narrated video](../workflows/narrated-video.md)). Check: 4:00 to
   5:00, 1920×1080 at 30 fps, −16 LUFS ±1, under 80 MB.
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
- **Look.** Styled after the SIGGRAPH Asia holography deck
  (`priorart/SIGASIApresentation_FINAL.pptx`, local): black slides, all
  text white in Optima, one weight, no orange or yellow text; "ours" in
  that deck's green `#54FF6B`; amber stays only on marks of indirect
  light. Three text sizes and no others: 40 px titles and cards, 22 px
  text and labels, 16 px ticks, notes, and credits (`theme.css`).
  Formatting from the light-transport lecture: title at top left, the
  visual filling the slide, short labels, credits at bottom right. No
  subtitle lines.
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
- **One folder, one branch.** All work is in this checkout, on branch
  `gen-nlos-explainer`, and is pushed there; a
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
| 2 | Novel views from a single image | (1) the input view of the vase scene and the views generated from the image alone, the camera moving right; (2) the video starts over and a red box marks the hidden region at the held final view; (3) the reference photo, the real vase boxed, with the note "Red: hidden in the input view" | website `vase.png`, teaser `rgb_only`, reference photo | refined |
| 3 | Video of propagating light | (1) the captured light video with a time readout, a time axis with a white playhead; (2) direct light: its intervals on the axis and a still at 5.98 ns, the video looping over them; (3) indirect light: its interval and a still at 11.06 ns, the video looping over it at half speed | website `teaser-light-clean.mp4` (16 ps per frame from 5.12 ns) | refined |
| 4 | Novel views from propagating light | one step: the reference photo, generation with propagating light (ours), generation without, in step; red boxes on the hidden region | teaser `prediction`, `rgb_only` | drafted |
|  | **propagating light** (card) |  |  | drafted |
| 5 | Lidar capture | WebGL render of the lidar hardware and the website's corner scene (relay walls, teapot occluder, hidden bunny), in the manner of the reference decks' hardware renders, parts labeled; at the left, on panels, this scene's video of propagating light as the lidar captures it, and under it the photon-count plot; (1) the video plays once (3.5 s); (2) one measurement as a single animation: the plot appears, the pulse leaves the laser and reaches a visible point (ringed in the video), the direct return and the indirect light from the hidden object come back, and the plot is swept once across both peaks; then the time of flight is marked on the plot (11 s); (3) the measurements at three other visible points (floor, the other wall, the first wall), one after another, each with its wavefronts to the hidden object and back and its direct and indirect peaks at its own times (6.3 s); (4) the scan over all visible surfaces, the video filling in the scan's order, then playing, with each scan point lit as the direct and the indirect light reach it (8.2 s) | three.js; the video is computed in the layout from the scene's geometry (c = 0.3 m/ns) | drafted |
| 6 | Hardware prototype | the photo of the prototype; parts named one per step by a line: pulsed laser, scanning mirrors, single-photon avalanche diode; then the steady-state image beside it | `hardware_figure` photo, masked, sticker blurred | drafted |
|  | **related work** (card) |  |  | drafted |
| 7 | Related work | two panels, one lit per step, each a row of method tiles: a clip produced by the method, the method's name and citation, and, in red, what it lacks. (1) NLOS imaging: f-k migration (Lindell et al. 2019; the f-k migration volume of the captured bicycle, the camera panning): geometry, not photorealistic appearance; phasor fields (Liu et al. 2020, fast RSD; the simulated living room, turning): developed for planar relay surfaces; HOLI-1-to-3* (Shen et al. 2025; the hidden-lamp scene): single object, per-scene optimization. (2) Generative view synthesis: GEN3C* (Ren et al. 2025; the hidden-lamp scene): hidden content is hallucinated; Lyra 2 (Shen et al. 2026; a simulated room): conditioned on visible observations only. Red boxes on the hidden region of the lamp scene, at the last view; "* our reimplementation" under the panels. (3) both panels dimmed, "Ours: generative view synthesis from propagating light" in green | `assets/build/related-work.py`: Dropbox `7_conventionalnlos/conventional_nlos/qualitative/fkdata_fk/inputs/bike_meas_180min_mip.mp4` (data of Lindell et al., credited); bucket `nlos_results_pages_20261114`, `g2/c_room/living_room/runs/fast_rsd_plain`; `holi_1_to_3_trajectories/captured_lamp_holi123.mp4`; `6_QualExperimental` `paperscene5/rgb_only`; `5_QualSimulation` `lyra2`, room `zone_full_3000023` | drafted |
|  | **method** (card) |  |  | drafted |
| 8 | Processing the capture | WebGL, the vase scene, in a panel, with the RGB image and the light video in a panel at the left (no arrows): (1) the image's pixels move out to their depths from direct light: the colored point cloud; (2) the NLOS volume appears behind the occluder, from indirect light | three.js: `rgbd_aligned.npz`, `nlos.npy` | drafted |
| 9 | Conditioning videos | continues from slide 8 without a cut: the view eases to the trajectory framing, the inputs give way to three stream videos (warped RGB, MIP, MIP depth) as the left panel narrows around them and the view widens, the target trajectory draws in with its frusta, then the camera moves along it with the streams in step | three.js, teaser `presentation/*.mp4`, MIP re-rendered from the volume | drafted |
| 10 | Video generation | continues from slide 9: the 3D view recedes, the stream videos stay in their panel as stills of the last view, and the diagram builds left to right in three panels that each show with their first part (encoders, tokens, and noisy target tokens; the video diffusion transformer with LoRA; target tokens, decoder), ending with the generated video playing | drawn; teaser `prediction` | drafted |
| 11 | NLOS reconstruction | flatland: (1) planar relay wall versus the visible surfaces of a scene as relays; (2) forward and adjoint operators, CGLS iterations sharpening | canvas, labeled illustration | drafted |
| 12 | Reconstruction with nonplanar relays | rotating renders, all in step, in one step: the scene, then the reconstructed volumes of ours, CC-SOCR, 3D-GTR; rows: the simulated room (its meshes through the reconstructions' camera, with the lidar, its field of view, and the scanned points), the Stanford-FK dataset (the capture setup: relay wall, scanner, the reconstructed box; no ground truth of the letters exists) | rendered by `assets/build/nlos-comparison.py` from the bucket's volumes (`nonplanar_nlos_results`), the paper figure's variants, matched by PSNR; the room's meshes and the Stanford capture's relay points and times of flight (`fk-torch/evaluation_and_comparisons_20261108`) | drafted |
|  | **results** (card) |  |  | drafted |
| 13 | Training data (simulated) | two rows, each on a panel: (1) five tabletop digital twins (chef, lamp, bouquet, lavender, teapot), as trajectories; (2) five Infinigen rooms, as trajectories | dual-relay v2 training set, ccw90 ground truth; `test100_paper_8020_cfg3/gt` | drafted |
| 14 | Captured scenes: same line of sight | rows: hidden lamp, hidden globe; four columns on the comparison slide's grid, one per step: reference photo (the scenes differ), input view (identical), direct light (identical), indirect light (differs; pauses 2.5 s at 9.82 ns with red boxes on the arcs and "different indirect light" with arrows, then plays on) | website refs and `lamp.png`; direct and indirect videos rendered from `aligned_transients.h5` | drafted |
| 15 | Captured scenes: comparison | same grid as slide 14, the reference photo staying in place; one method per step, all in step: ours (20/20 seeds), GEN3C\* (0/20 seeds), HOLI-1-to-3\* (method fails); red boxes on the hidden region at the held final view | `6_QualExperimental` `prediction`, `rgb_only`; Dropbox HOLI folder | drafted |
| 16 | Simulated scenes: comparison | two rooms, all methods in step: (1) ground truth and ours; (2) GEN3C\*; (3) HOLI-1-to-3\* and Lyra 2; a red box on the first room's hidden couch and rug at the held final view (the region the paper's figure crops) | `test100_paper_8020_cfg3`, Dropbox HOLI folder | drafted |
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
  bunny. The scene's video of propagating light, computed from its
  geometry as the lidar captures it (direct light white, indirect light
  from the hidden object amber); a pulse to a visible point; the direct
  return and the first peak of the measurement; the wavefront to the
  hidden object and back, and the weak later peak; the same from three
  other visible points; the scan, which fills the video.
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

Each build step's notes are its narration, and the tools are the
framework's ([narrated video](../workflows/narrated-video.md)):
`npm run narration -- gen-nlos-explainer` writes the script from the
notes, a local model reads it, one file per step, with a fixed voice and
the deck's `pronunciation.json`, and a local transcription checks every
file. `npm run record -- gen-nlos-explainer --narration <dir>` films the
deck at 1920×1080 and 30 fps, holds each step for its narration or for
its motion (`recording.json`), and places the narration by the same
timeline. Captions are not written by the tools yet.

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
