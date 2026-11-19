# Generative view synthesis explainer: tracker

[Plan](../plans/gen-nlos-explainer.md)

Current state: the plan is rewritten with sequential gates and a
refinement loop; everything is in this checkout (branch `guest-lecture`,
`presentations/gen-nlos-explainer/`). The deck on screen is still the
placeholder skeleton the user rejected. Open gate: 1, the storyboard.
No subagents are running.

Resume from the newest entry below.

## Standing directions

Every direction of the user for this work, quoted, newest first. General
slide rules are in [slide style](../style/slides.md) and
[slide review](../style/slide-review.md).

2026-11-19, while building:

- "A hardware photo can be included, but we should also be rendering the
  hardware setup/capture procedure as in the invprop video, the flying
  with photons video (thought the hardware setup isn't exactly the same).
  Relying on the same bunny scene, for visual consistency with the
  website, would be useful". Slide 5 renders the hardware and the
  capture in WebGL on the website's teapot-and-bunny corner scene.
- Goal: "Implement the docs\plans\gen-nlos-explainer.md plan. Repeat 3-4
  times: (a) do a pass on the slides, notes, recorded video with
  subagents, (b) have subagents vet the slides, notes, recorded video
  and report feedback, (c) consolidate feedback, check for bugs, and
  repeat. Merge work often. Commit and push (to both git and R2) often."
- "A few immediate comments: -> The navigation doesn't work (arrow keys
  are broken) -> The slide titles don't really make sense -> The content
  on the slides don't really make sense either. I'm confused about the
  lack of quality here. I gave you a lot of resources and some detailed
  instructions about what this should contain. Kill all subagents, and
  take a step back, and plan out an effective presentation." Then: "Take
  a step back, and plan out the presentation more effectively, given the
  existing plan and the resources I gave you", "Update the plan to make
  sure it's clear, has clear sequential gates, discusses
  refinement/iteration", "Please move all work to this folder. I don't
  like how you created another folder to work off of. We can just create
  another presentation folder here", "Move the plan doc/all work that
  you did in ../rpt... here. Again, I don't like the different folders
  (unless its for a worktree, which should eventually get cleaned up)",
  and "The holi 1-to-3 work is done also, right? That can be removed
  from the plan if so".
- "Again, I want to re-iterate that the goal is not necessarily to do this
  fast. It's to follow the plan and instructions I gave and craft a very
  high quality presentation". Passed to every builder; each gate waits for
  quality, not for the clock.
- "None of the slides appear to be filled out. Also where are you storing
  the presentation? I don't see it in the source tree": the deck lives in
  the worktrees `../rpt-gen-nlos` (served) and `../rpt-gen-nlos-work`, not
  in the main checkout (which stays on `guest-lecture`).
- "No, I'm not asking you to put the paper's own figures on the slides"
  and "I gave you specific instructions for making the deck, which is not
  "put the papers figures there". The instructions are to make a deck that
  looks polished." Slides are composed from result media and our own
  visualizations, in designed layouts; no pasted paper figures.
- "You also do not need to work on video recording before any part of the
  deck is finished. If that's what's overloading things, then don't do it
  yet. You can have sequential gates". The recorder (parked on
  `recorder-wip`) and the TTS evaluation (stopped; its environment is in
  `../rpt-tts`) wait until the deck passes its review gate.

2026-11-18, while planning:

- "Goal set: Repeat 3-4 times: (a) do a pass on the slides, notes,
  recorded video with subagents, (b) have subagents vet the slides, notes,
  recorded video and report feedback, (c) consolidate feedback, check for
  bugs, and repeat" and "Merge work often. Commit and push (to both git
  and R2) often."
- "The "reviewers" need to focus less on correcting content already in
  the paper, and focus more on editing the presentation itself and making
  it good/clear". Review briefs ask for presentation edits (structure,
  flow, visuals, pacing, clarity for a viewer) and for misstatements of the
  paper by the script, not for critiques or rewordings of the paper.
- "I'm also not asking you to change the language from what's in the
  paper, unless it helps with clarity (which sometimes it does, but you
  don't need to "correct" things in the paper)". The narration takes the
  paper's wording by default (its terms, its phrasing of claims) and
  departs from it only for clarity; reviewer rewrites that only "correct"
  the paper's language are not applied.
- Of a reviewer's objection that "feed-forward" conflicts with the
  iterative NLOS solver: "The generative method is also feed forward.
  That's a fine way to classify it." The script keeps "feed-forward" for
  the method, in contrast with HOLI-1-to-3's per-scene optimization.
- Of a reviewer's proposal to say "the brightest value along each ray,
  and its depth" instead of "maximum-intensity projection": "Yeah I don't
  think replacing maximum intensity projection as "the brightest..." is a
  good idea. what you have is too verbose and reads clearly as AI. again,
  sort of anthropomorphising the ray by giving it something (through "its
  depth"). I've asked you not to do this". Keep established technical
  terms (maximum-intensity projection, MIP depth) instead of verbose
  paraphrases; a possessive that gives an inanimate thing something ("its
  depth") counts as anthropomorphism. Reviewer rewrites are screened for
  both before they are applied. To add to docs/style/slides.md on
  `framework-sync` (pending).
- "Yes that is the bucket I was referring to. Use it for large assets in
  this presentation." (the R2 bucket `presentations`), and "Remember to
  upload the holi 1-to-3 comparisons from the tcig r2 bucket to dropbox if
  you haven't already. and tell me what folder you put it in. try not to
  put too much extra stuff in the dropbox folder": the Dropbox folder gets
  only the videos and one short README.
- "Try to use the same orange text black background as the other
  presentations", then "Please take a look at the
  light-transport-and-neural rendering lecture here, which is also well
  formatted", "Not for the colorscheme, but for formatting in general", and
  "But don't use subtitles for the slides like they are used in
  light-transport-and-neural-rendering". Colors from the reference decks
  (black background, white text, orange #FFCC66 titles and accents, Futura
  PT Book, here the open Jost); layout from the lecture (title at top left,
  the visual filling the slide, short labels, credits at bottom right);
  titles without a subtitle line.
- "Make sure to host the presentation site on localhost so that I can look
  at it": `npm run dev -- gen-nlos-explainer --port 5174` from
  `../rpt-gen-nlos` (the branch `gen-nlos-explainer`), at
  http://localhost:5174/. Edits happen in `../rpt-gen-nlos-work` (branch
  `gen-nlos-work`) and reach the served branch by fast-forward once checked;
  the served deck's `public/` and `assets/` are junctions to the working
  copy's.
- "Please launch a subagent whose goal is to handle the uploading of
  Holi-1-to-3 results so that this doesn't get forgotten/saved for last"
- "Please prefer using the pptx files over the video file as primary
  references (though you should be looking through all of them). The
  contrastive path marginalization video is just another reference"
- "I would also please take a look at the standalone website in
  data/gen-nlos" and "Having consistency with the paper/website in terms of
  the scenes we use to visualize things could be nice"
- "You may need to recompile ../gen-nlos"
- "Please use subagents as much as you would like, to carry out multiple
  tasks, to review, etc."
- "Copy over a copy of the main document, and the current (very
  incomplete) version of the supp pdf in ../gen-nlos to data/gen-nlos"
- "Please create a new branch for the presentation, and upload assets that
  you need to a new cloudflare R2 folder in my presentations bucket"
- The request (abridged only by list formatting): "Create a 4 to 5 minute
  explainer presentation & video, as part of the supplemental material of
  gen-nlos paper"; "The paper can be found in ../gen-nlos"; "It is an
  anonymous CVPR submission"; "The presentation should be fit for an award
  candidate/best paper awardee"; "You should vet the document for clarity,
  correctness, understability, many of the things I've asked you to do for
  other presentations here, and iterate on it multiple times"; "You should
  use some good text to voice models to record the entire video & script,
  and make sure that it reads well and sounds good"; "You should look at
  the data in data/gen-nlos -- these contain presentations that are good
  references. Some things to take from them... The broad structure (how
  the idea is introduced with nice results, how related work is
  discussed); Nice visualizations (renderings for the hadware setup);
  Clear delineation of sections and explanations"; "You can find results
  to use in the dropbox in C:\Users\attal\Kyros Group Dropbox\Group
  Folders\tcig-transient-nvs\figures, which should be live synced"; "Look
  in the website sub folder, this contains a supp website which should
  have results that get updated"; "Also look for other results that should
  be included, and be consistent with the main paper (the supp pdf of the
  paper is not complete yet)"; "Please use NLOS algorithm
  results/comparisons that should be stored on the R2 bucket"; "Some
  videos of backprojection renderings could be useful potentially, flag
  something if you need it (ideally in a list of needed things, though try
  not to make it too long)"; "Make use of embedded web-gl to make nice
  visualizations for the presentation"; "Please also upload the results
  from Holi-1-to-3 that are in the R2 bucket to the dropbox folder that I
  linked, specifically the videos showing the rendered trajectories for
  the scenes in the paper from Holi 1-to-3"; "Create the plan in
  docs/plans. You will also have to carry it out without my feedback as I
  will be offline for the night, but do your best to go through review
  cycles."

## Open questions for the user

None open. Resolved: "my presentations bucket" is the R2 bucket
`presentations` (the user, 2026-11-18).

## 2026-11-19 11:10 — stopped, moved here, plan rewritten

User directions (2026-11-19): see "Standing directions" (stop the
subagents, step back and plan, sequential gates, one folder).

- Stopped: all five slide builders and their dev servers and browsers
  (by PID). Their partial layouts are parked, unreviewed, on branch
  `gen-nlos-work` (c9dc22f).
- Checked, arrow keys: a browser probe shows the position advancing on
  every press; the placeholder slides declared build steps that changed
  nothing on screen, so presses looked dead. Cause: steps without a
  visual change, not the navigation code. The storyboard now requires a
  visible change per key press.
- Moved: the deck, plan, and tracker into this checkout on
  `guest-lecture` (framework commits merged from `framework-sync`:
  the step clock, three, Jost, the extract-pptx notes fix, two style
  rules); `public/` and `assets/` moved; the worktrees `../rpt-gen-nlos`
  and `../rpt-gen-nlos-work` removed (branches `gen-nlos-explainer` and
  `gen-nlos-work` remain). Left outside: `../rpt-tts` (the local TTS
  environment, partly installed) and an empty `../rpt-gen-nlos` folder
  that a running program holds open.
- Plan: rewritten. Gate 1 is the storyboard (20 slides after the
  reference decks' structure); gates 2–6 build one section each through
  the refinement loop; gate 7 is two whole-deck cycles; narration,
  recording, and two more cycles with the video follow. The HOLI-1-to-3
  upload is done and out of the plan.
- Next: gate 1, then gate 2 (the problem-statement section).

## 2026-11-18 23:10 — research in; script v2; skeleton served

- HOLI-1-to-3 upload done: Dropbox `figures/holi_1_to_3_trajectories/`
  holds four videos (captured lamp and globe, cw45, encoded from the
  bucket's `frames_flipped/` PNGs because the bucket's `video.mp4` is
  mirrored; rooms `normal_3000037` and `zone_full_3000023`, copied
  unchanged) and a README. Source: `tcig-projects/fk-torch/outputs/
  holi_video_v2_frames_20261117/`. The figure panels are frame 19 of the
  captured trajectories (PSNR match; the bucket README's "frame 21" is
  wrong, corrected in the Dropbox README).
- Reference decks (primary: the two pptx; secondary: the contrastive path
  marginalization video): payoff within a minute; a CG hardware render
  with a pulse shell, then a histogram inset, then the measured video;
  related work by category with a red limitation line and spotlight
  dimming, then a green contribution line; silent section cards; about 8
  words a slide; narration in "we", present tense, about 600–700 words.
  Black, white, #FFCC66, Futura PT. Finding to fix on `framework-sync`:
  `scripts/extract-pptx.mjs` matches notes to slides by file number
  instead of each slide's relationships, so notes come out shifted.
- Bucket (`tcig-projects`): our, GEN3C*, and Lyra 2 videos for the paper
  scenes are only in Dropbox (`6_QualExperimental/scenes/*/prediction`,
  `5_QualSimulation/assets`); captured transients for the lamp and globe
  exist only as raw `.mat` (no video in the bucket; Dropbox has
  `6_QualExperimental/scenes/paperscene{5,6}/transient/preview.mp4` and
  `1_teaser/lidar_wave_frames/combined/combined_overlay.mp4`); NLOS
  comparison stills and volumes in `nlos_results_pages_20261114/
  nonplanar_nlos_results/`; conditioning MIP videos in
  `scene_exports/paperscene5_6_v2_original_20261114_v2/…/conditioning/`;
  room meshes and cameras in `scene_exports/test100_*`. Paper scene ids:
  lamp `paperscene5_v2`, globe `paperscene6_v2` (trajectory cw45); rooms
  `normal_3000037`, `zone_full_3000023`.
- Script cycle 1: a correctness review and a clarity review of v1, both
  applied in v2 except where they conflict with the user's directions
  (no paraphrase of "maximum-intensity projection"; "feed-forward" kept;
  no rewording of the paper's language). v2 follows the paper's
  sentences, 735 words.
- For the paper, not the video (to tell the user): the compiled
  supplement prints "[TODO: Victor …]" notes and a TODO naming "the
  Stanford setup" (`\TODO` is active in preamble.tex), which would break
  anonymity; the tabletop training set is 52 scenes / 416 trajectories in
  Sec. 4 but 44 / 352 in the supplement.
- Done: the deck skeleton (19 slides, six sections, notes from script
  v2), commit 6dcdfff, pushed as `gen-nlos-explainer`.
- Next: the recorder merge, the media, the custom layouts, the narration.

## 2026-11-18 21:45 — plan written; research running

User directions: see "Standing directions" (all of 2026-11-18).

- Done: the paper compiled with MiKTeX into a scratch directory (bibtex
  needs `BIBINPUTS`/`BSTINPUTS` set to the paper directory when the output
  directory differs; MiKTeX prints "unsupported version of Windows" and
  carries on). Pages 1–12 are the main paper, 13–23 the supplement; split
  losslessly with Ghostscript into `data/gen-nlos/gen-nlos-main.pdf`,
  `gen-nlos-supp.pdf`, and the combined `gen-nlos-main-and-supp.pdf`.
  `data/gen-nlos/` is excluded through `.git/info/exclude` (it was
  untracked and not ignored).
- Done: branch `gen-nlos-explainer` in worktree `../rpt-gen-nlos`, from
  `framework-sync` (main plus the canvas hooks and widgets, pending an idle
  `npm run test:ui` before `main` moves); `npm run new -- gen-nlos-explainer`.
- Found: rclone's configuration is `~/Downloads/rclone.conf`
  (`RCLONE_CONFIG`); the remote `tcig:` has two buckets, `presentations`
  (empty) and `tcig-projects`. `ASSETS_REMOTE=tcig:` makes `npm run
  assets` address `tcig:/presentations/<id>/…`, the `presentations` bucket.
- Running: reference-deck analysis, website and Dropbox inventory, bucket
  inventory, local TTS evaluation, and the HOLI-1-to-3 upload.
- Next: script and storyboard v1 from the reports.
