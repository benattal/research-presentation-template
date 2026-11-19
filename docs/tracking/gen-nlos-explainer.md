# Generative view synthesis explainer: tracker

[Plan](../plans/gen-nlos-explainer.md)

Current state: research running (four agents) and the HOLI-1-to-3 upload
agent running; plan written; branch `gen-nlos-explainer` created from
`framework-sync`. Next: plan todo 3, the script and storyboard v1.

Resume from the newest entry below.

## Standing directions

Every direction of the user for this work, quoted, newest first. General
slide rules are in [slide style](../style/slides.md) and
[slide review](../style/slide-review.md).

2026-11-18, while planning:

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
