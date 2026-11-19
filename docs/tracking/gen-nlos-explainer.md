# Generative view synthesis explainer: tracker

[Plan](../plans/gen-nlos-explainer.md)

Current state: gate 2, refinement cycle 1, pass (a) nearly complete (see
the newest entry). Iteration is on the slides; narrated run-throughs test
whole drafts. On the Mac (2026-11-19, evening): the deck is restyled
after the SIGASIA deck (Optima, white text, three sizes).

Resume from the newest entry below.

## Standing directions

Every direction of the user for this work, quoted, newest first. General
slide rules are in [slide style](../style/slides.md) and
[slide review](../style/slide-review.md).

2026-11-19, evening (on a new machine, a Mac):

- "can you read in @priorart/SIGASIApresentation_FINAL.pptx . can we use
  the styling in this? use optimal and no orange yellow font. also Font
  sizes (maybe types too not sure) all over the place, id probably pick
  2/3 font sizes and use those and only those consistenlty throguhout the
  pres". Read as Optima (the SIGASIA deck's face). Done: the theme takes
  that deck's look (black, white Optima titles at top left, regular
  weight); every text is white, "ours" and the contribution line are
  its green `#54FF6B` (also the target trajectory and denoised tokens in
  the method scene); indirect-light labels are white, amber stays on the
  plots, bands, and renders; three sizes, 40 / 22 / 16 px, credits
  included (was six: 44, 40, 26, 22, 17, 11.5). Optima is a macOS
  system font, not bundled: a Windows recording would fall back to
  Candara. `priorart/` (190 MB) is excluded locally, not committed.

2026-11-19, while building:

- "By the way my collaborators will be working on the repo
  simultaneously, so do your best to work well with them". Fetch and
  merge before every push; small commits, pushed often; their decisions
  (the theme) are kept and builders are told to touch only their task's
  files.
- Of removing the explainer from `guest-lecture`: "You can leave it that's
  fine. I do think cleaning up and merging relevant material from the
  branches would be good". Cleaned up (2026-11-19): twelve lecture
  worktrees and their branches, all ancestors of `guest-lecture` and
  clean; `../rpt-numbers` and local `lecture-numbers` (merged);
  `gen-nlos-work` (the stopped builders' partial layouts, rebuilt since);
  the empty `../rpt-gen-nlos`. Kept: `lecture-primer-draft-wip` (a
  thirteenth lecture worktree held an uncommitted earlier draft of the
  primer slides, saved as 7f5d636 before its folder was removed);
  `recorder-wip` (the unfinished recorder, for the recording gate);
  `framework-sync` (14 framework commits ahead of `main`, all already in
  this branch; `main` moves after `npm run test:ui` on an idle machine);
  `../rpt-main` (the framework worktree) and `../rpt-tts` (the local
  speech environment). Remote branches are untouched.
- "Also use the "video (6).mp4" file in my downloads directory (flipped
  horizontally) as ours for the real lamp scene": copied to
  `assets/sources/captured-comparison/ours-lamp-20261119.mp4` and used,
  flipped, as ours on the captured comparison's lamp row (791cbf2). "Also
  please push frequently".
- "For related work, more methods should be listed/more visual examples of
  methods should be shown. The visuals should also ideally be tied to a
  concrete technique". A builder is redoing the slide: each visual is the
  output of a named method.
- "For the slides that show the "same LOS but different indirect" maybe
  pause the indirect video to highlight the indirect difference" and "The
  video may also just start a little bit too late".
- Arrow keys (the user's repeated report): the capture slide rebuilt its
  WebGL scene on every visit, 1.1 to 1.5 s from key press to paint; it is
  now prepared once while idle and kept (about 20 ms). Framework: layouts
  can declare `prepare`, a step clock stops once settled (76c6c96,
  5bb000e).
- "Hmm, is there a reason you're pushing to the guest-lecture branch?
  Could push to the gen-nlos-explainer branch?" No good reason: the work
  was moved into this folder while it was on `guest-lecture` and committed
  there. This checkout is now on `gen-nlos-explainer` (which has
  everything; the old skeleton's history is merged in without its
  content) and pushes go there. `guest-lecture` stays at f39f8df, which
  still contains the explainer up to that commit (asked whether to remove
  it there).
- Goal (2026-11-19, afternoon): "Continue with docs\plans\gen-nlos-explainer.md
  plan. Repeat 3-4 times: (a) do a pass on the slides, notes, recorded
  video with subagents, (b) have subagents vet the slides, notes, recorded
  video and report feedback, (c) consolidate feedback, check for bugs, and
  repeat. Merge work often. Commit and push (to both git and R2) often."
  Gate 2 is open.
- A collaborator's feedback, passed on by the user: "Font sizes (maybe
  types too not sure) all over the place, id probably pick 2/3 font sizes
  and use those and only those consistenlty throguhout the pres"; "add
  background behind things that are separate (like the slide im attaching
  theres so much on there it ghets a bit chaotic to look at and theres a
  few others, it hink they could be better compartamentalized"; "the
  related works probably needs to be expanded to elaborate on holi1to3,
  gen3c etc". And the user: "The font sizing feedback/feedback about
  visual consistency should probably apply to other decks too (so it
  should be recorded somewhere permanent)". Done: one type scale in the
  theme (7876039); both rules in the slide style guide and the review
  checklist (a3fbf34). Open: the attached slide did not reach this
  session (which slide?); compartmentalizing the busy slides; related
  work, where this meets the user's earlier "I may not put too much
  emphasis on Holi. Just focus on the 2" (asked).
- Of the narrated run-through: "We can continue to iterate without the
  voiceover for now, but this was useful for testing for the final version
  of a draft". Iteration is on the slides; a narrated run-through is
  recorded again when a draft is ready to be tested whole
  (`assets/build/record-run-through.mjs`, narration in
  `assets/narration/`).
- "Okay, you can also continue with the remaining tasks incl. visualizing
  the ground truth volumes/capture setups for the NLOS reconstruction
  comparison". The pause is lifted for the open items: the ground-truth
  scene and capture-setup column (a builder is on it), the capture
  slide's visuals, and the narration-over-still-visuals audit.
- "There is also a bit of disconnect between the narration and the slides
  on the hardware visualization slide. When say that we capture a video, I
  might show the video. I would also show the indirect light propagating
  for different points potentially. Basically, narration is too long
  without supporting visuals/animations at times". First item of gate 2
  (plan, "For the second pass"); not built during the pause.
- "The "hanging arrow" from the processing the capture slide is still
  there." It was still in the builder's worktree; merged in 3e97a38 (the
  input arrows are removed).
- "Before you record the narration, could you record a video of moving
  through the deck with all of the transitions? Put it in a subdirectory
  of the data folder": `data/gen-nlos/recordings/2026-11-19-first-draft/`.
- "I do actually have to pause for a bit, so could I ask you to: Save
  state, record the ground truth rotation as a later todo; Record a
  runthrough of the presentation (with voiceover if possible)". The
  ground-truth builder is stopped and its todo is in the plan (gate 1,
  "Later todo"); the run-through is recorded from the deck as it stands.
- "Make sure "stanford f-k dataset" and "simulated room" are aligned":
  row labels share a left edge.
- "In "processing the capture" there's a hanging arrow from RGB image in
  the first slide which doesn't lead to anything until the later slides."
  Passed to the builder smoothing the method slides: no element may point
  at nothing.
- On the rotating comparison: "Instead of "captured letters" cite the
  stanford f-k dataset"; "You can show all rotating comparisons at the
  same time, no need for an ease in for 3d-gtr"; "Showing the ground
  truth scene would also be nice if you can pull it", "Same rotation
  animation for the scene. Also showing the position of the camera/its
  fov in the scene" (a builder is rendering it).
- "For future development, add docs and instructions making storyboarding
  a requirement for future presentations": framework commit 870af47
  (both agent files, slide style, plan conventions).
- "Okay the rotating comparison actually looks very very cool. Please
  include it": it follows the reconstruction slide in the method section.
- "For the lidar capture, I might shorten this to a single animation that
  doesn't require a slide switch -- showing pulses that correspond to both
  direct and indirect, sweeping once over the histogram". The capture
  slide is one measurement animation, then the scan.
- "Can you also put the rotating NLOS comparison *after* the last slide?
  I'm not sure I want to have it, since there's already a lot of content.
  But I would like to look at it". It is in an appendix section after the
  closing card.
- "Hmm, you removed the line sweeping across the histogram, animating in
  the pulses on the lhs? You didn't need to do that". It was delayed, not
  removed (a 3.8 s lead in the first step; in the indirect step the cursor
  started only past the direct peak). Both steps now sweep from time 0.
- "To me, the first pulse animation (before showing direct) is
  unnecessary. Also "a different smaller vase" is not really the right
  thing to say. Just say that it hallucinates the wrong object". The
  capture slide has three steps (direct, indirect, scan); the narration
  says "the video model hallucinates the wrong object".
- "I will ask you to pause before doing the second pass (once this first
  draft is complete, soon) just so that I have a chance to take a look at
  everything. Commit and push when this happens too." The first draft
  ends with a commit, a push, and a stop; gate 2 waits for the user.
- "I think you can make the pulse animation on the hardware vis slide (for
  both direct and indirect) slightly faster": 340 ms per ns, from 420.
- "The warped RGB animation also resets between pipeline slides. I might
  just make the others beside the first that animates the warped RGB
  originally just show the last frame?" The streams animate on
  `conditioning` only; later slides show stills of their last frame.
- "Can you also start working on and refining the script (for the
  voiceover)? It should read well." Voiceover v3 (715 words) is in the
  notes and in `data/gen-nlos/script/voiceover-v3.md`; an editor is
  reviewing it by ear.
- "Remember to vet animations. This should be added to the plan." The
  plan's refinement loop has a step for it and the completion criteria
  require it.
- "This all looks quite good. Some smoother animations for the processing
  pipeline (esp. jumps between slides) would be nice". A builder is
  making processing, conditioning, and generation one continuous
  animation.
- On the capture slide: "at the intersection of the first pulse you show
  with the wall, the reflected light highlight looks strange" (a
  camera-facing sprite; now a glow in the wall's plane); "Bring the
  "occluder" label closer to the teapot"; "you should also show the
  light leaving the laser, in addition to coming back (for both direct and
  indirect)"; "offset the scanning pattern slightly? One dot lands under
  the teapot nub." All done.
- "Could you commit and push soon, and spend sometime optimizing the
  performance of the framework/the deck? I just want to make sure visually
  there are no glitches and that it runs well"; "Still having some issues
  with responsive arrow key navigation"; "And content not preloading";
  "Most of these changes should likely help for the whole framework (not
  just this deck)". Preloading: the dev server answers no-cache, so the
  fetched files were requested again by every slide; the framework now
  keeps them in memory (0 media requests while navigating). A performance
  pass is running.
- "Could you make it so that the extents of the navigation bar don't
  change size every time we change slides": the dots no longer animate
  their width (not reproduced headless; to confirm).
- "Is the limitation you listed a limitation in the paper? I might focus
  on something a bit more impactful" and "the main limitation is likely
  that NLOS conveys a limited amount of information": the summary's
  limitation. "The videos also get unsynched for the training data. Make
  sure this doesn't happen here or elsewhere": one video element per
  slide, enforced by the panels layout.
- Of the flatland slide: "Wow the flatland example is really nice"; its
  move to the second part "is just slightly too fast": about 1 s now.
- "Still having lots of issues with content that loads after the slide
  changes" and "It's not just slide transitions -- it's within specific
  slides too (an arrow press should reveal content. but it gets loaded in
  slowly/visibly)". Measured: reveals faded in over 0.39 s (now within
  one frame); a video created on arrival had no frame for up to 3.3 s on
  a first visit (now a poster of its first frame, and every slide's media
  preloaded by the audience view).
- "Still a slight shift in content from the first captured slide to the
  second." The comparison slide reserved a note band under its grid and
  the first did not (16 px); both now place every element identically.
- "Please also be sure to debug transitions. On the related work slide,
  there's flashing in the highlight as we move from NLOS imaging to
  generative view synthesis". Not reproduced headless (one clean frame
  change); suspected cause removed: media keeps full opacity and a veil
  dims it. To confirm with the user.
- "Also as the subtitle on the first slide do "Anonymous CVPR 2027
  Submission"". Done, on the title and closing cards.
- "Make sure there is an instructions markdown file in the presentation
  discussing how to grab the data required for it if we move to a new
  machine". `presentations/gen-nlos-explainer/README.md`.
- On the results slides: "The simulated scenes are also a comparison. If
  you use captured scenes: comparison, use consistent naming for the
  simulated slide title too"; "For the comparisons, I would also try to
  be consistent about which method is shown first/in particular when our
  method appears. In one slide it appears last in another first";
  "Internal consistency in storytelling is very important"; "I would
  make ours first probably"; "For the "same line of sight" slide, I
  might split the propagating light video into direct and indirect to
  make it 4 columns. That way, it looks better when we transition to the
  next slide which also has 4 columns" and "the same layout can be used
  (the images don't jump from one place to another)".
- "Some strange thin outlines where videos *will* appear, before they do
  appear. Also sometimes the content is not fully loaded when I change
  slides". Outlines: a stitched video's edge showed around the covers of
  cells not yet revealed (brightest pixel 219 of 255; 4 after the covers
  reach 2 px past their cells). Loading: media preloading in the
  framework (in progress).
- "The hardware prototype image is nice. Make sure to include a web-gl
  animation of the capture procedure (as in the other reference decks),
  ideally showing direct and indirect light, ideally using the bunny
  scene". Slide 5, being built.
- "The arrow key controls are still a bit unresponsive. Could you also add
  an option to hide the top progress bar?" Measured: a slide change took
  0.8 s (fade out 0.4 s, then fade in 0.4 s); with `defaultTransition:
  none` it takes about 20 ms, and this deck uses it. New framework option
  `progressBar: false` in presentation.json (62761e5), used here.
- "Could you also update the storyboard as the slides evolve so that I can
  provide comments?" The plan's storyboard has a status column and is
  updated in the same commit as the slides it describes.
- "The gates do not have to be sequential on slides. It is more
  sequential on (a) getting slides, (b) capturing/recording a video".
  Sections are built in parallel; recording waits for the slides.
- Of the rebuilt first section: "I like the first few slides much better
  now. Could still use some refinement, but good start", then "I think I
  would save the refinement, for now, for the next iteration stage, and
  prioritize a good first draft of the rest of the presentation". Gate
  1 is now the first draft of the whole deck; refinement follows.
- "honestly, it is most useful to show results in a video that can't be
  demonstrated easily in a paper/pdf supplement. try not to just repeat
  results. we can use videos that are used/highlighted in the
  supplemental web page on the other hand (in addition to other ones
  maybe)". The quantitative slide is out; results are shown in motion.
- "Including classifier free guidance results, and ablations is not
  necessarily important in the presentation. we do not have to exactly
  follow the structure of the paper." The guidance slide and the
  ablations are out of the storyboard.
- "For related work, I may not put too much emphasis on Holi. Just focus
  on the 2---NLOS imaging and generative view synthesis". Slide 7 has
  two columns; HOLI-1-to-3 appears only as a baseline in the results.
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

## 2026-11-19 15:05 — cycle 1 (b): the layout review, handled so far

User directions (2026-11-19): see "Standing directions" (collaborators
work on the branch at the same time).

- Fixed (7c413c2; simulated comparison boxes in 9f4e9e0): one top line
  and the title's left edge for every comparison grid; lining figures on
  ticks and readouts; light-video block at the title's width; hardware
  caption on one line; sentence case on three slides' labels; dimmed
  related-work panels legible; larger summary result; comparison credits
  on one line. The recorder passes `--disable-lcd-text` (ClearType colored
  53 to 69% of lit text pixels in 1080p frames).
- Being built: the nonplanar comparison's polish (cells filled, white
  capture marks, the method slides' colormap, visible relay curvature).
- Open, to consolidate with the animation review: panel padding and gap
  tokens and panels on nlos-reconstruction and light-video; callouts at
  16 px on the method slides against 22 px elsewhere; axis-title and
  row-label grays; related work's first step in two and an "Ours" tile;
  the f-k tile's black band; the asterisk footnote on the comparison
  slides; a box on the indirect difference.
- For the user and collaborators to decide, not changed: green is both
  "ours" and the target trajectory and a token row (the collaborator's
  choice); red is the hidden region, the limitation lines, and the scan
  points; the face is not bundled, so a Windows recording is in Candara.

## 2026-11-19 14:50 — two machines on this branch; cycle 1 vetting

User directions (2026-11-19): see "Standing directions", including the
collaborator's on the Mac (Optima, no orange or yellow text, three sizes).

- Two sessions commit to `gen-nlos-explainer`: this one (Windows) and the
  collaborator's (a Mac). A push from here was rejected; their restyle
  (43362c9) was merged, with one conflict in the capture slide's stylesheet
  resolved by keeping the redesigned slide's classes and applying their
  styling to them. Rule from now on: fetch and merge before every push.
- Their theme stands: white Optima, green for "ours", 40 / 22 / 16 px.
  It replaces this session's orange titles and 44 / 26 / 22 / 17 scale.
  On Windows the face falls back to Candara; lining figures are now set
  for every slide (1cb310a), since Candara's old-style numerals made
  "2027" and "20/20" uneven.
- Pass (a) of cycle 1 is complete: the capture slide's redesign is merged
  (four steps: the scene's own light video, computed from the geometry;
  one measurement with the time of flight marked; three other visible
  points; the scan filling in the video).
- Vetting (b): the content review is in (findings and their handling
  below, when consolidated); the layout review and the animation review
  are running, both told of the new theme.
- Content review, handled so far (8e5e156): shorter summary notes; the
  input view and direct light in one step on the line-of-sight slide; no
  "X gives Y"; the reconstruction slide says it returns to the first part;
  seed notes say what is counted; one name for the steady-state RGB image;
  Image only / Image and propagating light; Stanford f-k dataset. Declined:
  dropping a section card (the user asked for clear delineation of
  sections). Open: red boxes and row labels on the simulated comparison;
  related work's first step split in two and an "Ours" tile in place of the
  green line; the footnote for the asterisks on the comparison slides; a
  box on the indirect difference; the comparison's colormap against the
  method slides'; scan points and the adjoint arrow sharing colors with
  other meanings (the user has approved those slides' look: ask).

## 2026-11-19 14:25 — cycle 1, pass (a): merged so far

User directions (2026-11-19): see "Standing directions" (the refinement
goal; a collaborator's feedback; related work; the light videos; branch).

- Merged and pushed (branch `gen-nlos-explainer`): the performance fixes
  (the capture slide is built once and kept: 1.1 to 1.5 s became about
  20 ms); one type scale; related work as five method tiles in two panels,
  each the output of the method it names (the interim bicycle clip was a
  CGLS reconstruction and was dropped); panels behind the parts of the
  three method slides; the ground-truth scene column on the nonplanar
  comparison (room geometry with the lidar and its field of view; for the
  Stanford-FK row the capture setup only, the scanner position fitted to
  the dataset's direct times of flight, 3.7 mm RMS, since the dataset has
  no ground truth and does not give the position); the new lamp result;
  the line-of-sight light videos (start with the light, pause on the
  largest difference); section 1's logged findings.
- Still building: the capture slide's redesign (narration always with a
  moving visual).
- Not reproduced: four page errors (`getContext` of null) seen once during
  rapid navigation right after a merge; a second run was clean.
- Next: merge the capture slide; `npm run test:ui` on the idle machine and
  move `main`; then (b), vetting by fresh reviewers (content and clarity;
  layout, type, and compartments; every animation and slide change), and
  (c), consolidation.

## 2026-11-19 13:40 — paused by the user; run-through recorded

User directions (2026-11-19): see "Standing directions" (pause, save state,
record a run-through; the ground-truth rotation is a later todo).

- Deck: 23 slides, 45 build steps, all drafted (storyboard in the plan).
  Since 12:50: the WebGL lidar capture on the bunny scene (one measurement
  animation, then the scan); the method on the vase scene in 3D, three
  slides run as one animation; the flatland reconstruction; the rotating
  NLOS comparison (in the method section); voiceover v4 in the notes.
- Recordings, local only, in
  `data/gen-nlos/recordings/2026-11-19-first-draft/` (README there):
  `deck-transitions-silent.mp4` (4:57) and `run-through-narrated.mp4`
  (5:37, Kokoro `af_heart`, local; -16.6 LUFS). Made with
  `assets/build/record-run-through.mjs`: real-time capture from headless
  Edge on the GPU (about 40 frames per second received, laid on a 30 fps
  grid), not the frame-exact recorder on `recorder-wip`.
- Checked: the last frame of every step (contact sheet); frames across the
  method slides' transitions; a local transcription of the narrated mix
  matches the script except "pretrained" heard as "protrained" and
  "one to three" heard as "1-3"; NLOS is spoken "en-loss".
- Narration: `assets/narration/v4-kokoro-heart/` (script, pronunciation
  map, 39 segments, manifest). The larger voice model (Qwen) took hours
  per clip on this machine and was not used.
- Open for the second pass (waits for the user): narration over still
  visuals, the capture slide first (plan, "For the second pass"); length
  (5:37 against 5:00); the ground-truth scene column (plan, "Later
  todo"); the logged review findings of section 1 (entry 12:50); whether
  the reconstruction slides should follow the processing slide; the flash
  on related work and the navigation bar's size, neither reproduced
  headless; arrow-key responsiveness (performance pass still running at
  this entry).

## 2026-11-19 12:50 — first draft: 16 slides served; four visualizations building

User directions (2026-11-19): see "Standing directions".

- Built here: title and closing cards; section cards (text only, as the
  reference decks'); single-image, light-video (time axis from the
  website's mapping, frame k = bin 320 + k at 16 ps, checked against the
  paper's three labeled stills), novel-views; hardware (the masked photo
  a stopped builder had prepared); related-work; training-data;
  line-of-sight (direct and indirect light rendered separately from
  `aligned_transients.h5` with the website's processing);
  captured-comparison; room-scale; summary.
- Framework (on `framework-sync`, merged here): `progressBar: false`;
  media preloading in the audience view; a `poster` on video media.
- Fixed: 0.8 s slide changes (now instant for this deck); 0.39 s reveal
  fades (instant); empty video frames on arrival (posters, preloading);
  video edges around unrevealed cells (covers 2 px larger); a 16 px
  shift between the two captured slides.
- A mistake to avoid: two chained shell commands deleted media after an
  earlier step in the chain had failed, breaking the served deck for a
  few minutes each time. Deletions now run only after the replacement
  is built and the check passes, as separate commands.
- Logged for gate 2 (refinement), from the two reviews of section 1:
  tie the light video's playback to the narration per step (the loop
  runs free: about 4 s of it shows almost nothing); longer holds on the
  final view; a label that says what the red box marks; the playhead in
  white, larger axis type; the first step of single-image shows one
  still while the narration says view synthesis; card and title sizes;
  red boxes 3 px; capture frames that show a mid-loop time.
- Pushed: git `guest-lecture` and `framework-sync`; media to the bucket
  `presentations`, folder `gen-nlos-explainer/` (rclone check: 0
  differences).
- Next: merge the four visualization slides as they land; then gate 2.

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
