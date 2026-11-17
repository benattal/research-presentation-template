# Slide review checklist

What to check on every review cycle of a deck, distilled from the user's
feedback. Each item gives the user's words (2026-11-17, while building
"Light transport and neural rendering") and the general rule to apply
beyond the case that prompted it. [Slide style](slides.md) states the rules
themselves; this list is how a reviewer finds where they are broken. When
the user gives new feedback, add it here, generalized, in the same commit
as the fix.

## Structure and flow

- **Each part teaches what the next one needs, in its own terms.** "You do
  not need to frame Neumann series in terms of light transport yet." A
  background section is self-contained; the application comes in the
  section that applies it.
- **Side topics are framed as asides.** "I think the "computational
  imaging" applications of operator light transport should be framed as a
  bit more of an aside". Material off the main thread gets its own short
  divider and a visible tag, and is cut first.
- **Nothing interrupts a sequence.** "I don't think the aside to "scenes
  and measurement fields" is in the right place. it interrupts transient
  quadrature and phasor quadrature." Slides that build one idea stay
  together; a digression goes before or after them.
- **Related measurements follow one model.** "The time of flight section is
  out of order." Order topics so each builds on the previous one (a
  transient before its Fourier coefficient).
- **Cut what does not help understanding.** "I don't find the "paths and
  random walks" slides useful", "The equations/memory slide for flash
  cache is not that useful", "This can be stated without a visualization I
  think". A slide earns its place by making one idea clearer; a point that
  is one sentence is a bullet, not an interactive.
- **Derivations convince.** "I don't really find the neumann series
  derivation convincing right now ... something more like a taylor series
  expansion could be useful ... intuitive spectral analysis". Prefer the
  argument a student can check (a telescoping sum, a scalar analogy, an
  eigenvector picture) over a statement.
- **Compare with real courses.** "incl. checking flow against slides from
  other real courses". Each cycle checks order, explanations, and visuals
  against the professors' decks on the same topics.

## Titles, subtitles, and text

- **Titles name topics.** "Weird phrases rather than single words/clear
  phrases encapsulating the content of a section".
- **Subtitles state high-level goals, readable without the symbols.** "way
  too specific", "High level goals instead of something super specific e.g.
  "The scene in e and A is learned from measurements" -- that's so hard to
  interpret without re-introducing context." Formulas and symbols go in the
  visual, where they are introduced.
- **Plain statements.** "No weird phrases like "one equation, read five
  ways"." No taglines or wordplay.
- **No agency or metaphor for things.** "Try not to use active verbs for
  things that don't have agency", "Avoid weird anthropomorphizing metaphors
  like "the gradient is where the light and importance meet"", "this
  guidance can be applied a bit more broadly". Quantities, operators,
  cameras, and networks do not see, meet, give, turn, or carry. Repeated
  later ("all bounces together give the lit room"), with: ""X gives Y" is
  not something that I like unless it is an implication in a set of
  equations". Write "the lit room is the sum of all bounces", not "the
  bounces give the lit room"; "gives" only between equations.
  Sensors are not subjects either: "I don't like the phrase "what a pixel
  measures" for the same reason"; the user's wording was "Describing the
  measurement at a camera pixel". Name the quantity or the act of
  describing it, not a camera, pixel, pattern, or method doing something.
- **Little text.** "too busy with text. Sometimes having just a short label
  (which I can explain) is better", "Some lines of text are far too long",
  "you should try not make more than one point per bullet". Explanations go
  in the notes.
- **The simplest natural wording.** ""each bounce of light, one at a time"
  can just be "one bounce of light at a time"". Prefer the shortest phrase
  that reads naturally; no restated subject or appended clause.
- **No awkward stock phrases.** "Try to avoid things like "the lit room".
  That's an awkward phrase. Just say "The sum of all bounces" for this
  slide." Name the quantity ("the sum of all bounces"), not a scene
  description of it.
- **A summary gives the talk's takeaways.** "The final summary slide looks
  too disorganzed. The bullets aren't really the key takeaways here
  either. Again, too low level." and "The subtitle for summary is also bad,
  again." A few high-level takeaways, one per part, plain and organized; no
  method details, symbols, or clever subtitle.
- **Keep only details that help understand the method.** "The statement
  about the shadow ray is also kind of too specific a detail to be useful".

## Math and notation

- **Math renders.** "Math isn't rendering correctly." Every formula is
  KaTeX; no formula breaks across lines or runs past an edge.
- **One notation for the whole deck.** A symbol means one thing everywhere;
  a reviewer lists every symbol that changes meaning between slides.
- **Inner products for measurements and adjoints.** "write ... as an inner
  product rather than something transpose something else ... wherever the
  measurement equation is written". $m = \langle q, x \rangle$,
  $\langle y, A x \rangle = \langle A^\top y, x \rangle$.
- **Show the operator form where it illuminates.** "there should also be a
  way to write the integro-differential equation as operator light
  transport (I - A)x = b", "The integral equation ... does not require
  differentiation". Connect each new equation to the deck's main equation,
  and say plainly what each form costs to evaluate.

## Visuals and layout

- **Pictures of light look like light.** "I don't know about a heatmap.
  Things should look like real light transport."
- **Visualizations are correct and legible.** "Mirror/glossy don't seem to
  be correct?", "severely aliased rays not aligned with the projector, which
  is confusing", "visualizing the light propagating can be done more
  effectively". Check the physics of every render, draw rays from where
  they start, antialias, and make the change being shown easy to see.
- **White slides, black text, pretty.** "use a plain white background ...
  and black text (mostly)", "Make sure it looks pretty!", "The outline slide
  can look far prettier".
- **Use the space well and align things.** "White space is not used
  effectively", "Some of the slides are a bit oddly organized, with
  whitespace used weirdly, images in images in unaligned weird places." The
  visual fills the space under the title; figures and captions align; no
  empty quadrant; nothing placed inside another figure.
- **No awkward decorations.** "The numbers before the new sections (e.g. the
  3 before volume rendering) is awkwardly placed."
- **Consistent from slide to slide.** The same kind of element has the same
  size and position on consecutive slides (room renders, titles, dividers).

## Animation and interaction

- **Nothing jumps or shifts.** "Between slide changes, sometimes an element
  shifts location", "Transient light transport visualization are still
  broken (they jump)". Elements keep their place between build steps and
  slides; an animation runs once from the previous state to the new one.
- **Equations keep their places while they build up.** "When you're
  building equations up, try not to have their locations change between
  slides (e.g. when you're building up the equations in the neumann series
  section)" and "This can be an option for the equation stack object, but
  it should be default on". A stack of equations reserves the space of all
  its lines from the first step (the deck's `EquationStack`, with
  `keepPlaces` on by default), and a stack that continues on the next slide
  starts at the same position.
- **No repeated animations.** "it's a bit awkward when animations repeat
  when cycling from one slide to the next".
- **Controls work.** "The selection for different items in the demo (e.g.
  reset, ...) is buggy." Every button, slider, and click target is tried in
  a browser; controls never keep keyboard focus from the clicker.

## Process

- **Validate the UI every cycle.** "Remember to validate UI components",
  "Again, check UI components", "The slide navigator seems to be off-center.
  And things don't get resizsed appropriately". Drive the deck in a browser
  at several window sizes, not only in captures.
- **Vetting agents each cycle.** "Please make sure there are some subagents
  handling vetting tasks like this". Reviewers who did not build the slides
  check content and flow, layout and text, and the UI.
- **Keep this record and extrapolate.** "It might be useful to keep a record
  of some of this feedback, so that you can extrapolate from it/make better
  edits in the next few iteration cycles". Apply each item deck-wide, not
  only where it was noticed.
