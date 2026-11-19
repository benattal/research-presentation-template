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

### Open

1. **Gate 1: storyboard.** The storyboard below is the contract for the
   deck: every slide's title, what each key press shows, and its source.
   Check: the user has read it, or a reviewer given the user's
   instructions and the reference-deck analysis finds no slide whose
   purpose, title, or visual is unclear.
2. **Gate 2: problem statement** (slides 1–4). Check: the loop below.
3. **Gate 3: propagating light** (slides 5–6, with the WebGL render).
4. **Gate 4: related work** (slide 7).
5. **Gate 5: method** (slides 8–12, with the WebGL scene and flatland).
6. **Gate 6: results and summary** (slides 13–20).
7. **Gate 7: whole deck, refinement cycles 1 and 2.** A pass on all
   slides and notes, vetting by reviewers who see the deck fresh,
   consolidation and fixes; twice. Check: a full capture with no errors
   or warnings, and a cycle whose reviewers report nothing above
   cosmetic.
8. **Gate 8: narration.** A local text-to-speech model reads each step's
   notes; a local transcription checks them. Check: word error rate at
   most 3%, every term recognized, total 3:50 to 4:40.
9. **Gate 9: recording.** Finish the recorder parked on branch
   `recorder-wip` (framework, on `framework-sync`), record video v1.
   Check: 4:00 to 5:00, 1920×1080 at 30 fps, −16 LUFS ±1, under 80 MB.
10. **Gate 10: refinement cycles 3 and 4, with the video.** Reviewers
    watch the recording (contact sheets, the mix's transcript, the
    timeline) as well as the slides and notes; fixes, re-recording.
    Check: the completion criteria.
11. **Gate 11: delivery.** Final push to git and the bucket; the paper
    sync and the anonymity audit recorded in the tracker.

## Refinement loop

Every gate from 2 on runs this loop, and records each round in the
tracker (findings, what changed, what was declined and why):

1. **Build.** One section at a time, by the lead, in this checkout, in
   small commits. A subagent builds only a self-contained visualization
   from a written specification, in a git worktree that is removed when
   its work is merged. A slide is added to `presentation.json` only when
   it loads.
2. **Look.** `npm run check`, `npm run capture`, then every frame is
   read against the storyboard row: does each key press change the
   screen, does the step show what its narration says, does the title
   name what is on screen. For motion, frames at several times.
3. **Vet.** Two reviewers who did not build it, given the user's
   instructions, the storyboard, the reference-deck analysis, and the
   frames: one for content and clarity (would a CVPR viewer outside NLOS
   follow it, is anything missing or beside the point), one for layout,
   text, and motion ([slide review](../style/slide-review.md), the
   reference decks' look). They edit the presentation; they do not
   reword the paper.
4. **Consolidate and fix.** Findings are merged, checked against the
   user's directions, fixed at their cause, and the frames looked at
   again. The loop repeats until a round has no finding above cosmetic.
5. **Publish.** Commit, push to GitHub, push media to the bucket; the
   deck stays served on localhost for the user.

## Rules

- **Follow the instructions and resources given.** Structure, related
  work, hardware renderings, and section delineation after the reference
  decks (`data/gen-nlos/*.pptx`; the contrastive path marginalization
  video is a secondary reference). Results from the supplemental website
  (`data/gen-nlos/standalone.html`, Dropbox `figures/website/`) and the
  Dropbox figure folders, with the paper's scenes. NLOS reconstructions
  and comparisons from the bucket. WebGL for the visualizations.
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
opening and the method; lamp and globe, the fan, and the two paper rooms
carry the results.

| # | Slide (title) | Steps: what appears | Source |
|---|---|---|---|
| 1 | Title card | title, "CVPR 2027 Submission" | — |
| | **problem statement** (card) | | |
| 2 | Novel views from a single image | (1) the input view of the vase scene; (2) the image-only generation along the trajectory, red box on the region hidden in the input view; (3) the reference photo beside it: a different object | website `vase.png`, teaser `rgb_only`, reference photo |
| 3 | Video of propagating light | (1) the captured light video of the same scene, with a time readout; (2) direct light marked (white), then indirect (orange) | website `teaser-light-clean.mp4` |
| 4 | Novel views from propagating light | image-only and ours side by side, reference photo; red boxes | teaser `rgb_only`, `prediction` |
| | **propagating light** (card) | | |
| 5 | Lidar capture | WebGL render of the lidar and a tabletop (relay walls, occluder, hidden lamp), parts labeled; (1) a pulse travels to a visible point; (2) direct return, the measurement inset shows the first peak: depth; (3) wavefront to the hidden object and back, the weak later peak; (4) the scan over all visible surfaces | three.js |
| 6 | Hardware prototype | the photo with the parts named one by one (laser, scanning mirrors, beamsplitter, SPAD) | `hardware_figure/IMG_4018`, stickers blurred |
| | **related work** (card) | | |
| 7 | Related work | three columns, one lit per step: NLOS imaging / generative view synthesis / HOLI-1-to-3, each with one red limitation line; last step: our contribution lines in green | our own results as thumbnails |
| | **method** (card) | | |
| 8 | Processing the capture | WebGL, the vase scene: (1) RGB image and direct light give the colored point cloud; (2) indirect light gives the NLOS volume behind the occluder | three.js: `rgbd_aligned.npz`, `nlos.npy` |
| 9 | Conditioning videos | same 3D view, the camera moves along the target trajectory; warped RGB, MIP, MIP depth appear as synchronized panels | three.js, teaser `presentation/*.mp4` |
| 10 | Video generation | diagram: three streams and noisy target tokens into the video diffusion transformer; the output video plays; classifier-free guidance noted | drawn |
| 11 | NLOS reconstruction | flatland: (1) planar relay wall versus the visible surfaces of a scene as relays; (2) forward and adjoint operators, CGLS iterations sharpening | canvas, labeled illustration |
| 12 | Reconstruction with nonplanar relays | ours, CC-SOCR, 3D-GTR on the simulated room and captured scenes | bucket `nonplanar_nlos_results` |
| | **results** (card) | | |
| 13 | Training data (simulated) | tabletop digital twins; Infinigen rooms | bucket real2sim, website room GT |
| 14 | Captured scenes: same line of sight | (1) the shared input view and warped input; (2) reference photos: lamp or globe behind the occluder; (3) the NLOS conditioning differs | website, `6_QualExperimental` |
| 15 | Captured scenes: comparison | per method, one step each: GEN3C\* (0/20 seeds), HOLI-1-to-3\* (fails), ours (20/20 seeds); then all play | `rgb_only`, Dropbox HOLI folder, `prediction` |
| 16 | Classifier-free guidance | the fan: guidance scale 1, then 5 | `8_cfg_ablation` |
| 17 | Simulated room-scale scenes | ground truth and ours, then GEN3C\*, HOLI-1-to-3\*, Lyra 2; red boxes on hidden regions; second room | `test100_paper_8020_cfg3`, Dropbox HOLI folder |
| 18 | Quantitative evaluation | GEN3C\* versus ours: detection mAP, then Chamfer distance of occluded objects | paper Table 1 |
| 19 | Summary | takeaway lines one per step; limitation and outlook | — |
| 20 | Title card | as slide 1 | — |

## Visualizations

Each is driven by the step clock (`useStepClock`), so the live deck and
the recording show the same motion.

- **Lidar capture** (slide 5, three.js). In the manner of the reference
  decks' hardware renders: clean CG on black, a fixed three-quarter view,
  parts labeled in short white text. The lidar (laser, scanning mirrors,
  detector) aimed at a tabletop with two relay walls, an occluder, and a
  hidden lamp, as in the captured scenes. A pulse to a visible point; the
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

## Narration and recording (gates 8 to 10)

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
- The anonymity audit passes: frames, narration, captions, file metadata.
- Four refinement cycles are recorded in the tracker, each with its
  findings and their resolution.
- `npm run check` and `npm test` pass.
- Assets and the video are in the `presentations` bucket, verified by
  `rclone check`.
