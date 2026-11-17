# Light transport and neural rendering: tracker

[Plan](../plans/light-transport-and-neural-rendering.md)

Current state: the sections are being built in parallel by agents; the
framework additions (math, citations, audience layout, bundled fonts), the
flatland engine, the operator explorer, the adjoint views, section 1, and
the time-of-flight slides have landed. Resume: when the remaining section
agents report, capture the whole deck and start the review cycles (plan
todo 12) with the brief in the session scratchpad (`review-brief.md`).

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
