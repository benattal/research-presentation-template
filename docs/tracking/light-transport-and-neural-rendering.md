# Light transport and neural rendering: tracker

[Plan](../plans/light-transport-and-neural-rendering.md)

Current state: the user is reviewing the deck on the dev server while the
edits below are made in git worktrees by four agents, merged one at a
time. Resume from the plan's "User edits after cycle 3".

## Standing directions

Every direction of the user still in force for this lecture, quoted, newest
first. General slide rules are also in
[slide style](../style/slides.md) and [slide review](../style/slide-review.md);
earlier directions are quoted in the dated entries below. Read this list
before changing a slide.

2026-11-17, while resuming:

- "Again, several unnecessary numbers in the slides (the number for ODE
  solver and formula)"
- "Please also launch subagents (up to 4) to help"
- "Also make sure you are recording my guidance somewhere so that it
  doesn't get lost. Maybe in tracking (at the top) or somewhere more
  permanent?"
- "Please restart the page it crashed" (the deck is viewed live on the dev
  server: edits that can break it are made in a worktree)
- "I like the light transport matrix slides overall, good idea for the
  visualization. I think for visualizing the columns/rows we can actually
  visualize (a) all pixels that observe the scene for a given
  illumination, (b) all paths from the light sources (along with their
  total contributions) that end up at a certain pixel (roughly)"
- "I need the light transport matrix stuff to be more tied explicitly to
  the rendering equation/iterated rendering equation from the previous
  section (also worth showing the iterated rendering equation when we're
  applying sucessive bounces? maybe that's what you can use an extra column
  for)"
- "There's a big jump from these operator evaluations of light transport
  to Monte Carlo, this needs to be made more clear. It doesn't necessarily
  need to be a ton more detail, but if we plan to explain it more
  intuitively/in less detail, then we can't get bogged down in too much
  text/excessive information"
- "You do not need numbers under sum so far, or even need the sum so far
  column"
- "Something like merging this with the scattering integral
  visualization/slide would be nice. I could do without the bar charts on
  the scattering integral slide. I think the specific numerical values in
  many of these demos are unnecessary"
- "The rendering equation slide has a bunch of equations that *do not*
  feel tied to appropriate visuals. This is a great place to illustrate
  what each term means with animations and visuals. You don't always need
  to borrow from existing decks if it makes it clunkier to explain a
  concept"
- "I think the last slide of this section before operator light transport
  can just be re-iterating the Neumann series takeaway, showing again the
  iterated updates of x <- Ax + b (and what this is expanded) in 2D"
- "Spectral view slide is nice -- again I like the equations here, and how
  you are using the eigenspace to show that it *does* in fact compute the
  inverse (in the eigenbasis). However, the visuals are again disconnected
  from the content (this is a theme)"
- "The neumann series slide is okay, but I fail to see what exactly it's
  illustrating. If you could relate the content & equations more
  effectively to the visuals that would be good."
- "I think we can skip the geometric series slide"
- "The fixed point equation slide is nice, and visually illustrates (for
  one step) that applying the update x <- Ax + b brings you closer to the
  solution. I want you to show this for multiple steps. This should also be
  a prompt to the class (any ideas for how to solve for this without
  knowing the inverse?), which will be elucidated more on later slides"
- "I don't like the "light paths" slide at the intro. Instead, before
  jumping into content, we should introduce the lecture outline, talk about
  high level topics that the lecture will cover. This light paths slide is
  also not particularly useful by itself, each slide should serve a
  purpose."

## 2026-11-18 01:00 — resumed; cycle 3 checked; user's section edits

The user's directions of this session are under "Standing directions".

Done on resuming:

- New machine set up: Node 26.13.1 and rclone 1.76 (winget), `npm
  install`, assets pulled (75 + 91 files). Checks pass (`npm run check`,
  `npm test` 30/30, deck tests 86/86); full capture 20261118-002432: 210
  frames, 0 errors, 0 warnings.
- Cycle 3's items checked in the frames: done as listed, except
  adj-sensitivity's check (one line overflowing the right margin, labels
  wrapping; now two rows, as adj-gradient's). Open: vol-vre's six-line
  stack is taller than its figure (a content choice: the slide rules allow
  three lines); lt-radiance's beam edges are smooth at 4× zoom, the core
  clipped white by the ×3 exposure (the review's complaint was not
  recorded).
- Timing, measured in the audience view (dev build): lt-iterate's steps
  settle in 0.92–0.97 s, as lt-neumann-sum's; the 1.5 s of cycle 3 is not
  reproduced. lt-operators' 2.2 s and 2.4 s steps are its propagation
  animations. Found: entering lt-path-tracing blocks the main thread for
  0.53 s (the slide appears at 1.1 s against about 0.45 s), and the
  lt-divider render for 0.44 s.

## 2026-11-18 00:40 — paused in review cycle 3

User direction (2026-11-17): "Could you I ask you to pause, commit, and push
-- noting remaining TODOs in the plan doc?" And: "Also make sure
instructions for installing the assets for each lecture are available in
that lecture folder".

- Cycle 3 reviews are in (two content reviewers, one layout, text, and UI
  vetter); the fixes were partly applied by two agents, stopped at the
  pause. The tree passes `npm run check`, the deck tests, and `npm test`,
  and every slide loads without errors. A full capture at the pause (run 20261118-000531) has 210 frames with 0 errors and 0 warnings; its frames are not yet reviewed.
- Removed the layouts no slide uses (paths and random walks, matrix-free,
  memory meter) and their helpers.
- Remaining work: the plan's "Cycle 3: remaining work".

## 2026-11-17 23:30 — review cycle 2 done

User directions this cycle (2026-11-17), quoted: "Again, high level
explanations over things that are too technical. No anthropomorphizing",
and of the adjoint divider, "The "Adjoint light transport" title slide has
these words split between two lines. That's not nice". Both are in
docs/style/slide-review.md.

- Reviews: two content reviewers (opening to the aside; volume to the
  closing), comparing with CMU 15-468, CMU 15-463, and CSC2529 decks, and a
  layout, text, and UI vetter that drove every slide and 88 controls in Edge
  at two window sizes.
- Structure: the aside is shorter (`lt-direct-global` folded into
  `lt-probing`; it and `lt-primal-dual` moved to the appendix; `lt-epipolar`
  ends on Episcan3D); new `nr-inverse` (analysis by synthesis, CMU 15-468)
  opens neural rendering; `adj-quadrature` (the volume rendering gradient,
  with a new visual) moved into the adjoint section before
  `adj-radiative-backprop`.
- Content: the adjoint derivation is one equation stack in $\theta$; the
  adjoint is derived through the Neumann series
  ($\langle q, \sum_k A^k z\rangle = \langle (I - A^\top)^{-1} q, z\rangle$); the
  time-of-flight weights are derived on the transient slide and the phasor
  slide starts from the transient; albedo is $\rho_i$ throughout; per-bounce
  labels and the measured ratio ($\approx 0.64 \to \rho(A) = 0.69$, a test
  pins both); the one-sample path-tracing estimator; the direct/global
  identity on the probing slide.
- Layout and UI: one thumbnail size on the bounce columns; derivation
  stacks top-aligned; borrowed figures without panel letters; aligned
  figure rows; slider focus fixed; the explorer's bounce step is a 0.9 s
  cross-fade; the spectral plot no longer refits between steps.
- Framework (on `main`): `npm run check` reports LaTeX whose backslash JSON
  read as an escape (`"\theta"` loads as a TAB); the slide-style rule
  against section numbers; two checklist items.

## 2026-11-17 16:45 — assets in the bucket; review cycle 2 running

User direction (2026-11-17): "Please commit and push intermittently, and make
sure assets are uploaded to R2. Do the same after each round of vetting, and
once you finish too".

- Done: rclone installed (winget). Pushed this lecture's `public/` (55 files)
  and `assets/` (89 files), and the four workshop presentations' assets
  (diffusion, filtering, tracking, image-manipulation, from the
  vision-workshop branch), each verified by `rclone check` with 0
  differences; wrote the prefix README. Commits on guest-lecture through
  2826d8d; framework commits cherry-picked to main (a69d264).
- Cycle 1: content reviews (two), a layout and text vetting pass, and a UI
  pass; fixes applied by section; feedback recorded in
  docs/style/slide-review.md.
- Next: cycle 2 reports (content ×2, layout/text/UI), fixes, commit, push,
  assets push.

## 2026-11-17 20:10 — sections in progress; framework additions landed

User directions (2026-11-17), quoted:

- "No weird phrases like "one equation, read five ways". Just state things
  plainly."
- "White space is not used effectively in these slides", "Some lines of
  text are far too long", and "The bounces demo (and I imagine many other
  sldies) are too busy with text. Sometimes having just a short label
  (which I can explain) is better."
- "I think I would also like you to use a plain white background for this
  presentation and black text (mostly)"
- "Also, please have an agent validate UI components again. The slide
  navigator seems to be off-center. And things don't get resizsed
  appropriately (content overlaps with slide navigator) for differently
  sized screens."
- "The bounces demo looks better. I think visualizing the light propagating
  can be done more effectively. Mirror/glossy don't seem to be correct?
  Though I could be wrong. The selection for different items in the demo
  (e.g. reset, ...) is buggy. Remember to validate UI components"
- "Unfortunately I don't really find the neumann series derivation
  convincing right now. perhaps light transport is not the right form for
  this initial explainer. i think something more like a taylor series
  expansion could be useful. perhaps also doing some intuitive spectral
  analysis of the operator (and the effect of the neumann series/inverse
  applied to different vectors) would be helpful"
- "you should try not make more than one point per bullet."
- "Try not to use active verbs for things that don't have agency (e.g.
  "transmittance turns the equation into...")"
- "For the radiative transfer equation section, there should also be a way
  to write the integro-differential equation as operator light transport
  (I - A)x = b. ..." and "The integral equation for volume rendering just
  applies integrals/monte carlo to evaluate the operators and does not
  require differentiation"
- "An interpretation of adjoints as "sensitivity" would also be useful --
  how much changing the local gradient of radiance and its effect on the
  loss/image pixels"
- "In place of "Speaker Venue Date" you can just write "Benjamin Attal,
  Postdoc. with David Lindell""
- Goal: "Complete the presentation ... Go through a few cycles of (a)
  finalizing content, (b) vetting it ... (incl. checking flow against
  slides from other real courses), (b) editing again"

- Done: core math rendering and load-time formula checks; citations
  (`sources.json`, slide `credits`, core `credits` layout, tests); audience
  layout fix (stage fits beside the navigation bar, centered navigator,
  tests at nine window sizes); bundled fonts (Inter, Source Serif 4,
  JetBrains Mono); white theme and tighter slide spacing; operator
  explorer as light (pulse propagation, spotlight for the BRDF, focus-free
  controls; mirror and glossy verified as correct reflections); adjoint
  views (measurement, derivative, operator derivative, gradient,
  sensitivity); section 1 rebuilt as geometric series, Neumann series, and
  a spectral view; the time-of-flight and structured-light slides; the
  directions above recorded in docs/style/slides.md.
- Checked: `npm test` 28/28; `npm run check` ok; flatland tests 8/8;
  linear algebra 12/12 and time-of-flight 16/16 deck tests; captures of the
  finished slides have no errors or warnings.
- Next: the agents building section 2's figures and room visuals,
  sections 3–5's figures, and section 3's visuals report; then the full
  capture and the first review cycle.

## 2026-11-17 14:45 — lecture restructured, placeholders regenerated

User directions (2026-11-17), quoted:

- "The slide titles are not great. Weird phrases rather than single
  words/clear phrases encapsulating the content of a section", "Math isn't
  rendering correctly.", and "In ../waabi there should be some guidelines
  for writing slides that are actually quite useful."
- "The time of flight section is out of order. It should appear more
  starting in the discussion of neural rendering/application of light
  transport to neural rendering/reconstruction"
- "For the "fun with operator light transport" section, I want you to put
  together an embedded demo/nice visualization that allows us to do the
  following for a simple scene: -> Visualize the effect of different
  operations (applying the BRDF, applying propagation, etc.) in order to
  construc the light transport matrix A -> Visualize the effect of
  iterating the light transport matrix -> Visualizing the effect of
  iteratiing + adding these components"
- "Similar fun visualizations for the other components of the presentation
  as well"
- "I don't know about a heatmap. Things should look like real light
  transport."
- "For adjoint light transport, you can use different visualizations --
  some similar derivation of the operator light transport/successive
  scattering of the adjoint radiance would be nice."
- "For adjoint light transport, I would also use the opeartor form of light
  transport to derive the operator form of gradients/differential light
  transport, and then show why/how the adjoint comes into play (as
  (I - A)^-T, which requires approximation via successive applications of
  the adjoint through the neumann series). Different terms such as the
  gradient of the operator wrt scene parameters, etc. will come into play
  here"
- "You can also forego PRB, since I thnk it's a bit too involved/specific"
- "I think I would also like you to use a plain white background for this
  presentation and black text (mostly)"
- "In place of "Speaker Venue Date" you can just write "Benjamin Attal,
  Postdoc. with David Lindell""
- "No weird phrases like "one equation, read five ways". Just state things
  plainly."
- "The bounces demo (and I imagine many other sldies) are too busy with
  text. Sometimes having just a short label (which I can explain) is
  better.", "Some lines of text are far too long", and "White space is not
  used effectively in these slides"
- The adjoint section is titled "Adjoint light transport ⚡" (an earlier
  direction, relayed by the coordinating agent; its verbatim text is not in
  this tracker).

Done:

- Plan: every slide table is now `Slide | Title | Subtitle | Visual`, with
  topic titles and one-statement subtitles of at most about 65 rendered
  characters (measured by script); long formulas moved into the visual
  column, and interactive and comparison visuals say "short labels only".
  The outline and summary slides list one plain line per section. Section
  2 is named "Operator light transport". `lt-time` and `lt-nlos` became
  `nr-transient` and `nr-nlos`, after `nr-recipe`. Section 5 derives
  differential light transport in operator form (`adj-measurement`,
  `adj-derivative`, `adj-operator-derivative`, `adj-adjoint`,
  `adj-importance`, `adj-neumann`, `adj-gradient`), then
  `adj-radiative-backprop`; `adj-cost` and `adj-path-replay` are gone, and
  `adj-quadrature` and `adj-volumes` are optional. No visual is a heatmap:
  `neumannSeries`, `transportMatrix`, `opticalComputing`, and
  `probingMatrix` are renders of the room; `adjointFlatland` became the
  adjoint modes of `operatorExplorer` and of `flatlandPaths`. The source
  catalogue lists the 34 cited keys (checked by script: none missing,
  none unused), with the survey's corrections (temporal frequency probing
  SIGGRAPH 2014, epipolar time of flight by Achar et al. 2017, Nayar et al.
  SIGGRAPH 2006). `velten2013` (not in the survey) is no longer cited;
  `forsythe1950` stays, marked unverified. Visual identity is white slides
  with dark renders. The engine section describes `scene.js`,
  `transport.js`, and `render.js` as they are.
- `docs/style/slides.md`: topic titles with one short subtitle, plain
  statements, short labels, and visuals that fill the free space (the
  directions quoted), and the slide, writing, and citation rules from the
  waabi guidelines that apply to any deck;
  `docs/style/writing.md` gains the "grow" rule.
- `docs/implementation/presentations.md` ("Math in text", `SlideTitle` and
  `Text` for custom layouts) and `docs/implementation/layouts.md` (the
  `content` layout's `subtitle`).
- "This branch" in `CLAUDE.md` and `AGENTS.md` names the presentation and
  links the plan.
- Placeholders regenerated from the tables by a scratchpad script that
  rewrites only placeholder slides; each placeholder's planned visual is
  one short line ("Planned: equation; operatorExplorer (derivative)").
  7 created, the rest rewritten; `title`, `questions`, `lt-operators`,
  `lt-iterate`, `lt-neumann-sum`, and `nr-cw-tof` were already written and
  kept. Removed the untracked placeholder directories `adj-cost`,
  `adj-path-replay`, `lt-nlos`, and `lt-time`.

Checked: `npm run check -- light-transport-and-neural-rendering` (66 slides,
every formula renders); `npm test` (25 of 25 pass). No capture was run.

Open:

- The written slides `lt-operators` ("One bounce"), `lt-iterate`
  ("Bounces"), `lt-neumann-sum`, and `nr-cw-tof` have titles or subtitles
  that differ from the plan's ("Transport operator", "Multiple bounces",
  and shorter subtitles); one side changes to match.
- `sectionLabel` is rendered as plain text, so math there would show as
  source.

Next: finish the engine and `operatorExplorer` (todos 6 and 8), then
todo 3.

## 2026-11-17 — plan written

User direction (2026-11-17): "I would like you to write up a plan in
docs/plans for putting together a new presentation
"light-transport-and-neural-rendering". This will replace "guest-lecture".
Please borrow slides and visuals from existing professor's slides, citing
and providing proper attribution. Look at Matt O'Toole's slides, Ioannis
Gkioulekas' slides, and others in the areas of computational imaging and
rendering. Please create interesting interactive visuals, explanations that
can be understand intuitively without being too long (though being rigorous
enough to believe)." The direction included the lecture outline the plan's
sections follow, and ended "Make sure it looks pretty!"

- Done: plan and tracker; source survey of course decks, papers, project
  pages, and open-source demos (summarized in the plan's source catalogue).
- Found: the core loads Inter from Google Fonts (`core/client/index.html`),
  so local mode without a network falls back to system fonts. Planned as a
  framework fix in todo 3.
- Next: todo 2, rename and scaffold; check with `npm run check`,
  `npm test`, and a capture of the skeleton.
