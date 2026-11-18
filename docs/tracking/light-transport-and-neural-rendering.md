# Light transport and neural rendering: tracker

[Plan](../plans/light-transport-and-neural-rendering.md)

Current state: paused at the user's request after cycle 1. All four cycle
1 (c) fix passes are merged and pushed, and their media are in the bucket.
Cycles 2 and 3 have not started. The shared widgets are in `core/` (on
`framework-sync`, not yet on `main`). Next:
- cycle 2: a full capture, vetting with the brief of cycle 1, then fixes;
- move `main` to `framework-sync` after an idle `npm run test:ui`;
- the user's answers to the open questions in the newest entry.

Resume from the newest entry below.

## Standing directions

Every direction of the user still in force for this lecture, quoted, newest
first. General slide rules are also in
[slide style](../style/slides.md) and [slide review](../style/slide-review.md);
earlier directions are quoted in the dated entries below. Read this list
before changing a slide.

2026-11-18, after cycle 1:

- "The neural rendering section is good overall, but I think there's too
  little connection to the representation. In the scene and measurement
  field slide, at least, you should make it clear that these quantities
  are produced by an NN"

- On `lt-path-tracing`'s "4,096 paths per pixel": first "Remove "4096
  paths per pixel" that's totally arbitrary", then withdrawn: "Eh it's
  actually okay, you don't need to change this -- it's tied to a specific
  example". The label stays.
- "Make sure that for long sessions the web page does not start lagging.
  Perhaps there's some basic cache management/something you can do here?"

2026-11-17, while resuming:

- "Showing a justification below (why terms cancel), which then fades out
  when the next equation is shown (A^k+1 -> 0) could be nice"
- "For some of the equations it would be nice if you faded the left and
  right in separately (with different clicks/arrow key presses), so that
  these could be a chance to ask students questions. Not all of them have
  to do this, but some could be nice. Putting a question mark over the
  equality before showing the RHS could also be an option. Do this for (I -
  A)S_k in the Neumann series section"
- "The presenter notes currently don't seem to render latex correctly. This
  should be fixed."
- "I would clean up AGENTS.md and CLAUDE.md so that they don't get bloated.
  Try not to include direct quotes, while still retaining useful
  informaiton"
- "The neumann series image in the outline can be improved -- you can show
  the 2D example of iterative x <- b + Ax updates"
- "If there are additional widget/UI element classes that you want to
  create in core/ that would be helpful for this presentation you are
  welcome to do so." And: "I would also abstract out any common patterns
  that you already use here into core/"
- "I would also recommend re-designing the inverse monte carlo rendering
  slide from Gkioulekas, while still citing them. If a figure is simply
  cut from a paper or presentation, and doesn't exactly fit, you are
  welcome to (and should) re-design while citing/attributing."
- "When you say "like G" and "like S" on the volume rendering slides,
  students will not remember what these are. You have to make sure that
  terms you use are clear." And: "I understand that all of these
  suggestions I'm giving require navigating some challenging tradeoffs
  (verbosity, clarity, overexplaining, underexplaining), but you'll need to
  do your best to address them. Make sure your vetting loop is robust."
- "Another important thing: I would also like you to introduce stops for
  (a) pausing for questions and (b) asking a question about the content to
  the students to keep them engaged. There's lots of interesting,
  challenging content here, that requires some thought to figure out.
  Several places can be used as stopping points to let the students play
  around with some ideas/problem solve"
- "Be sure to also add presenter notes. I would have agents "read them out
  loud" to themselves to make sure they flow well, make for a good
  presentation to graduate students."
- "I think other refinements to visuals to make things more intuitive and
  illustrative like this are possible."
- "The operator light transport image can remain mostly the same -- it
  would be nice to have different bars separating different slices of the
  image, each with a different number of bounces per slice (which should be
  labeled)"
- "I also think that the title slide can be different, showing some cool
  visuals for neural rendering in addition to a much more interesting one
  for light transport (showing some cool rendered effects)"
- Goal (replacing the one below): "Address all of the requested edits,
  then repeat 3-4 times (a) do a pass on the slides and notes with
  subagents, (b) have subagents vet the slides and notes and report
  feedback, (c) consolidate feedback, check for bugs, and repeat"
- Earlier goal: "Address all of the requested edits, then repeat 3-4 times (a) do
  a pass on the text with subagents, (b) have subagents vet the text and
  report feedback, (c) consolidate feedback and repeat"
- "For the adjoint slides, the sum so far numbers are not useful"
- "On later slides, there are also numbers that I don't find particularly
  useful. Everything needs to have an illustrative use. The bar chart
  indicating contributions might be useful, but I think there's a more
  intuitive way to visualize this, potentially by progressively
  highlighting different scene components/parameters"
- "The neural rendering slides are quite good, I'll have more specific
  feedback tomorrow. I'm sure many of my previous comments about clarity
  and flow also apply to some of the slides here too"
- "Many of the volume rendering slides I think get a bit lost. I think
  showing the integro-differential form is useful. I think deriving the
  integral form is useful. I'm a bit confused about what is happening
  beyond that."
- "Some of the figures/visuals are a bit broken (on the quadrature slide
  for example). Again, unnecessary numbers"
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

## 2026-11-18 13:00 — cycle 1 done; paused

The last two fix passes are merged.

**Adjoint section and appendix** (bf57fab, merged in a124cae).
- Derivatives have one color, amber (`--derivative`). Blue is kept for
  sensors and importance.
- `adj-gradient` keeps the room's size at every step. It draws one uniform
  band per surface, sized by that surface's derivative. Its notes answer
  why the ceiling ranks above the red wall, checked against the engine.
- `adj-importance`'s haze is gone: importance is now drawn at each beam's
  destination.
- `adj-sensitivity`'s $\delta e$ ring starts on the red wall.
- Unnamed symbols are now named: $m$ and $q$ on `adj-adjoint`, $A = SG$ on
  `adj-operator-derivative`, $x$ and $e$ on `adj-neumann`, and $q_k$ on
  `adj-radiative-backprop`.
- `lt-structured-light` describes indirect-invariant imaging.
- `lt-three-point` gets "kernel of S" under $f_r$.
- `lt-how-to-apply` says "precomputed".
- `adj-volumes` is three cropped panels, with nothing clipped.
- `adj-quadrature`, `lt-radiance` and `lt-primal-dual` have their layout
  fixes.
- Notes: all 19 slides are in the new format.

**Operator light transport and aside** (5b54db9, merged in d80f517).
- Each path is drawn in its term's color, from the new render palette
  `--term-light-0…3`. The path-tracing walk labels its segments $e$, $Ae$,
  $A^2e$, $A^3e$. The notes name paths by their number of bounces.
- Scattering has its own color (fuchsia, `.term-scattering`).
- `lt-matrix` shows $x_{k+1} = e + Ax_k$ and an iterates column as the row
  view adds bounces, with notes for every step.
- `lt-transport` defines $e = Ep$ and $c = Cx$ where the series appears,
  and shows its medium only at its own step.
- `lt-dual` is redrawn in the deck's notation ("diagram after Fig. 2").
- `lt-epipolar` has a caption for each half.
- `lt-relighting` no longer repeats its image.
- `lt-operators` has 3 steps.
- `lt-iterate` and `lt-neumann-sum` keep their thumbnails in place.
- `lt-optical-computing`'s notes now say that any algorithm needing only
  products with $T$ can run optically. They no longer claim the Neumann
  iteration does.
- Both sources were fetched and checked: `otoole2010` (power iteration,
  Arnoldi and GMRES) and `cmu15463-probing`. They are in the bucket.
- Notes: the main thread's spoken part is 899 words, and the aside's 1,436.

**Found while merging, for cycle 2.** `--derivative` (#ffc83c) and
`--term-light-0` (#ffc93c, the color of $e$'s path) are the same yellow.
The two passes chose them independently.

**Open questions for the user** (with those of the 11:00 entry):
- **Adjoint and appendix:**
  - "lost" light is now red on `adj-operator-derivative`;
  - `adj-derivative`'s renders are amber instead of true color;
  - the added line "one bounce $A = SG$";
  - several notes are still above 120 spoken words (`adj-gradient` 177,
    `adj-importance` 176, `vol-inverse` about 205).
- **Operator light transport and aside:**
  - `lt-iterate`'s new header line $A^{k+1}e = A(A^ke)$;
  - the fuchsia for scattering;
  - cutting the aside to about four slides;
  - the overlap of `lt-transport` and `lt-matrix`.
- **Unused media in the bucket:**
  - `adj-volumes/ratio-and-delta-tracking.png`;
  - `lt-dual/primal-dual-configurations.png`;
  - the old `nr-representation` images.
- **Still open from before:** the provenance lines for the title media
  (a pass's tool refused to write them; they await the user).

## 2026-11-18 11:00 — cycle 1 (c): fixes merging

**Opening, Neumann series, closing, linear-algebra appendix** (cff32fd,
merged in 87aa117). The changes:
- `la-fixed-point`, `la-neumann` and `la-spectral` share one plane
  (origin, scale and size), so nothing jumps between them.
- The fixed-point trial is (2, 0.1), not the suggested (1.4, 0.4). At
  (1.4, 0.4), $Ax$ is only 6.6° from $x$, so $A$ still reads as a scaling.
- `la-neumann` labels its dot $S_2 b$ / $S_6 b$ and the dashed term
  $A^3 b$.
- `la-spectral` ends with "$= \sum c_i/(1-\lambda_i)\, v_i = (I-A)^{-1}b$".
- `la-iteration` shows $x_0 = 0$, and its takeaway reads "if the spectral
  radius $\rho(A) < 1$".
- The fog photo's credit names Steve Lacey.
- `la-geometric` marks partial sums that are off the chart on the chart's
  edge.

**Notes.** Every notes file of these 12 slides is in the
Transition / Step / Remember / Stop / If asked format. Their spoken part
went from 2,838 to 1,695 words. The planned stops are:
- `la-fixed-point` step 4 (solving without the inverse);
- `la-neumann` step 2 ($(I-A)S_k = ?$);
- the pause on `la-iteration`;
- the pause on the questions slide.

**Questions for the user, from this pass:**
- the trial at (2, 0.1);
- the $A^3 b$ label;
- the wording "the spectral radius";
- the roadmap's notes, at 174 spoken words for six rows.

**Volume and neural rendering** (4812a6f, merged in d257b33). The
changes:
- `vol-rte` shows $T = e^{-\sigma_a d}$ until $\sigma_s$ is introduced.
- `vol-integrating-factor`:
  - colors $D$, $K$ and $Q$ as its neighbours do;
  - labels the strip's axis and the light's direction;
  - shades the integrand $T(KL+Q)$ and marks $T(d)L(d)$.
- `vol-vre` has four steps: the three-term line "from the integrating
  factor", then $x = b + Ax$, $A = D^{-1}K$, and the series, with the
  render.
- `nr-representation` is redrawn in the deck's notation, as the new
  `MeasurementFields` layout, credited "Fig. 2, redrawn". The old images
  are unused.
- `nr-transient-quadrature` uses one scale for every step, with break
  marks.
- `nr-nerf`'s labels name no symbols from earlier slides.
- `nr-baked` marks the row its step is about.
- `nr-radiance-cache` reads "$A(x - \hat x)$: missing light".
- `nr-flash-cache` shows its identity under the figure.
- The credits no longer read "after … after", and CSC2529 gets its year.

**Notes.** All 24 slides' notes are in the new format: 3,080 spoken words,
about 128 per slide, down from 8,238.

**Questions for the user, from this pass:**
- `nr-applications`' propagating-light video is still dark after the crop.
  Brighter clips exist in `assets/sources/malik2024` (`cornell_multiview`,
  `coke_teaser`).
- On `nr-transient`, two of the bounce colors are hard to tell apart in the
  legend.
- `nr-transient-quadrature`'s 3 ns step shows small returns under the
  shared scale.

## 2026-11-18 08:30 — cycle 1 (b) findings; widgets in core

**Widgets in `core/`.** `core/client/stage/` now holds:
- the canvas and animation hooks (`canvas.js`);
- `EquationStack`;
- `Slider` and `Readout` (`Controls.jsx`), with one Slider replacing the
  lecture's two;
- `Chart`.

`docs/implementation/layouts.md` lists them. They are on
`framework-sync` (7df7f0a, pushed), which was merged into `guest-lecture`;
the lecture's copies are removed (ead5d96). Every compared frame is
unchanged except the sliders on `la-geometric` and `la-apply`, which take
the deck's one slider style. `main` moves to `framework-sync` once
`npm run test:ui` passes on an idle machine.

**Vetting, cycle 1 (b).** Three of four reports are in. One finding is
shared by all three: the notes read about 147 minutes for a 75-minute
lecture, with about 30 class questions. Cycle 1 (c) therefore rewrites
every slide's notes into one format:
- a spoken core of about 120 words per slide;
- stops marked "planned", "optional", or "pause";
- the rest under "If asked".

The planned stops are about 13, spread across the sections. The fix
briefs are in the session scratchpad (`fix-brief.md` and one file per
section).

The largest findings:
- **Notation and indexing:**
  - $b$ and $e$ need a bridge between the Neumann series and light
    transport sections.
  - $x_0 = 0$ is not shown on `la-iteration`.
- **Pictures that jump or mislead:**
  - the plane moves between `la-fixed-point` and `la-neumann`;
  - `adj-gradient`'s bands vary along each surface while the slide states
    one albedo per surface, and its room shrinks at the slide change.
- **Wrong statements:**
  - `nr-representation`'s relighting answer contradicts `nr-baked`;
  - `vol-rte`'s $T$ uses $\sigma_s$ before it exists;
  - the bars on `nr-transient-quadrature` do not do what the notes say;
  - `lt-structured-light` describes blocking instead of
    indirect-invariant imaging.
- **Clarity:**
  - symbols from slides back are not named: `adj-adjoint`'s $m$ and $q$,
    `nr-nerf`'s $A$ and $b$;
  - derivatives are drawn in three colors in the adjoint section;
  - `nr-representation`'s borrowed figures clash with the deck's
    notation, so they are to be redrawn;
  - `vol-vre` repeats the previous slide's derivation;
  - the fog photo's credit omits the photographer.

Added to the questions for the user: `nr-memory` has no visual (a chart
of the memory sizes, or fold it into the adjoint divider).

## 2026-11-18 08:00 — cycle 1 (a) merged; vetting running

The last two section passes are merged:

**Volume and neural rendering** (1c922fa):
- `nr-inverse` is redrawn as the flatland room recovering the red wall's
  albedo by gradient descent. Its strips are $\hat C$, $\tilde C$ and
  $\partial_\theta\hat C$, plus a row of the iterates $\theta_k$; it asks
  $\nabla_\theta\ell \overset{?}{=}$.
- `nr-cw-tof`'s cut-out figure is redrawn as the emitted and received
  waves, with the phase as a delay.
- `vol-rte` defines $\omega$, $f_p$ and $\omega'$.
- `vol-quadrature` asks for $\alpha_i$ before showing it.
- `nr-transient` has no tick values.
- Questions and pauses are in the notes of both sections.

**Operator light transport and aside** (1f95651):
- `lt-divider` shows the room in five labelled slices, by number of
  bounces.
- `lt-rendering-equation` draws propagation in a neutral tone.
- `lt-path-tracing` asks why one random direction is unbiased, and shows
  the justification under the line.
- `lt-transport` builds $\mathbf T = C(I + A + A^2 + \cdots)E$ term by
  term with its paths.
- `lt-matrix` starts from one lit element, $p = \delta_k$; the row view
  builds over three steps.
- `lt-probing`'s masks are $s_k$, so they no longer clash with the
  sensor $q$.
- `lt-neumann-sum`'s notes explain why it starts at $x_0 = e$.
- `EquationStack` lines can grow term by term (`parts`).

Open questions for the user from these passes:
- `nr-nerf`, `nr-representation` and `nr-memory`: redraw them, or give
  them a picture?
- The label wording on `nr-baked`, `nr-recipe` and
  `nr-transient-quadrature`.
- `nr-inverse`'s blue channel stops at 0.148 against the true 0.13.
- `lt-transport`'s path order and its orange volumetric path.
- $C$ and $E$ appear on `lt-transport` before `lt-matrix` defines them.
- The added question steps on `lt-matrix`, `lt-transport` and
  `lt-path-tracing`.
- $s_k$ next to the scattering $S$.
- Unused figures: `public/slides/nr-inverse/analysis-by-synthesis.jpg`
  and `public/slides/nr-cw-tof/*.png`.

## 2026-11-18 06:30 — cycle 1 (a): two of four section passes merged

Merged and pushed (6c7f1ee; the title's six media pushed to R2):

- adjoint and appendix: `adj-derivative` asks $\partial_\theta x \overset{?}{=}$
  before the answer; `adj-sensitivity` shows $y$ beside $\delta x$;
  `adj-radiative-backprop`'s Fig. 2 redrawn as three flatland rooms (light
  with image and reference strips, importance with
  $\partial\ell/\partial m$, the gradient), credited "after Fig. 2";
  symbol labels on `adj-quadrature`; notes for all 11 adjoint and 7
  appendix slides, with six questions and a closing pause.
- opening and Neumann series: the title as six credited figures (Veach
  Figs. 11.7 and 11.9, CMU 15-468 lecture 12 p. 19, Malik et al. 2024,
  TöRF, Flash Cache); `la-divider` shows the 2D updates; `la-fixed-point`
  without $A$'s entries; `la-spectral` asks $\sum_k A^k b \overset{?}{=}$;
  `la-apply` retitled "Large systems" and indexed from $x_0 = 0$; the
  summary in six rows matching the outline; notes for all twelve slides.

Not done, waiting for the user: the agent writing the title's provenance
lines into `assets/sources/README.md` was refused by its worktree guard;
the lines are in this session's transcript, to add once the user agrees.

Open questions for the user from these passes: the six title figures and
captions; "Large systems" for `la-apply`; the summary's subtitle; $v_1$
on `la-neumann`'s lines; a question step on `la-iteration`; the redrawn
backprop figure (three images in `public/slides/adj-radiative-backprop/`
now unused); `lt-radiance`'s "reflected 77%" column; whether six adjoint
questions are too many; `adj-quadrature`'s two symbol lines;
`lt-three-point`'s uncolored $S$ and $G$.

Running: the operator light transport and aside pass; the volume and
neural rendering pass. Next: vetting agents per section (cycle 1 (b)).

## 2026-11-18 04:00 — the user's section edits merged

Merged into `guest-lecture` and pushed (72bb3e6), each after check, the
deck tests, and a look at its frames:

- section 1 (agent): `la-fixed-point` with ten updates and the prompt;
  `la-neumann` with $(I - A)S_k \overset{?}{=}$, the answer, and the
  cancellation shown for one step; `la-spectral` rebuilt on the same
  vectors; `la-iteration` new; `la-apply` and `la-geometric` in the
  appendix; the outline's first picture is the 2D updates.
  `EquationStack` gained `rhs` (a question mark over the relation until
  the right side shows) and `justification` (a line shown for one step).
- section 2 (agent): `lt-rendering-equation` rebuilt term by term in the
  room, `lt-gather` merged into it and deleted; the explorer's share
  column replaced by the iteration ($x_0 \dots x_4$, the iterated
  rendering equation as a caption); `lt-path-tracing` from the scattering
  integral to one random direction to a random walk, without the chart
  and the error table; its 0.5 s entry block fixed (a cached table in
  `walk()`, the traced room prepared when idle).
- the aside (agent): `lt-matrix` and `lt-transport` written with
  $\mathbf{T} = C(I + A + A^2 + \cdots)E$; a column drawn as the pixels'
  rays under one element, a row as sampled paths to one pixel; readouts
  removed from `lt-relighting` and `lt-optical-computing`.
- volume (agent): order rte, operator, integrating factor, vre,
  emission–absorption, quadrature, sampling; `vol-inverse` to the
  appendix; "like G/S" replaced; the quadrature panel now draws the medium
  (the black band was the light reaching the camera, not the medium);
  readouts removed.
- mine: the neural rendering readouts; `adj-gradient` as the room with
  each surface lit by its derivative, in turn; `adj-sensitivity` without
  values; `adj-quadrature` drawing the medium; presenter notes render
  their math (remark-math, the slides' KaTeX options; `npm run check`
  renders every notes formula: 952, none broken); the agent files
  without quotes.

Open:

- The machine throttles sustained CPU work (a fixed loop runs 0.3 s per
  chunk, then up to 1.7 s after a few seconds), so a cold page load took
  85 s and captures time out. Capture now gives its first load 5 min;
  later frames still time out now and then. `npm run test:ui` gave
  unusable results (two runs overlapped and shared fixture files) and has
  to be rerun on an idle machine.
- From the agents: `la-apply` and `la-iteration` are both titled
  "Iteration" and index differently; `la-divider` still shows the scalar
  series; `la-fixed-point` shows $A$'s entries; G borrows the bounce-4
  crimson; $A^k e$ on `lt-iterate` against $L_k$ on `lt-neumann-sum`;
  `lt-divider`'s notes say "Section 2"; `lt-matrix`'s row view is busy;
  `lt-transport` shows the whole series at once; `vol-rte` does not define
  $f_p$ and $\omega'$; `public/slides/lt-rendering-equation/ray-tracing-function.png`
  is unused.
- The framework commits on this branch since `bca346f` are not on `main`.

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
