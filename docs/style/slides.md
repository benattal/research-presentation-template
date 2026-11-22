# Slide style

Conventions for what goes on a slide. [Writing style](writing.md) governs
words everywhere, including its lists of words, phrases, and prose tics to
avoid; this guide governs the slide as a whole and the rules specific to
words on a slide.

Reviews check these rules with the [slide review checklist](slide-review.md),
which keeps the user's feedback in general form.

## Storyboard

A presentation is planned as a storyboard before any slide is built. The
user (2026-11-19), of a deck started as a skeleton of placeholder slides:
"The slide titles don't really make sense", "The content on the slides
don't really make sense either", and "take a step back, and plan out an
effective presentation"; then "Could you also update the storyboard as
the slides evolve so that I can provide comments?" and "add docs and
instructions making storyboarding a requirement for future
presentations".

The storyboard is a table in the presentation's plan
(`docs/plans/<stem>.md`), one row per slide in order, with a row for
each section between them:

| # | Slide (title) | Steps: what appears | Source | Status |
|---|---|---|---|---|
| 3 | Video of propagating light | (1) the captured video with a time readout; (2) direct light marked; (3) indirect light marked | the capture's light video | drafted |

- **Title**: what the slide will be titled, by the rules below.
- **Steps**: what each key press puts on screen. One beat of the talk is
  one build step, and every step changes the screen: a step that changes
  nothing reads as a dead key.
- **Source**: where each visual comes from (a result file, a dataset, a
  visualization to write), specific enough to find. A row without a source
  is not ready to build.
- **Status**: planned, building, drafted, or refined.

Write it from the material the user gave (reference decks, results,
instructions), following their structure where the user asked for it, and
state the deck's order in a sentence above the table. The user reads the
storyboard before slides are built and comments against it afterwards, so
it is kept current: a change to a slide's title, steps, or source changes
its row in the same commit. Build to the storyboard one section at a time,
each to a good draft before it is shown; a deck of placeholder slides is
not a draft.

## Titles and subtitles

The user (2026-11-17): "The slide titles are not great. Weird phrases
rather than single words/clear phrases encapsulating the content of a
section". And (2026-11-17): "No weird phrases like "one equation, read five
ways". Just state things plainly."

- **The title names the topic** in a word or a short noun phrase
  ("Neumann series", "Rendering equation", "Relighting"), or names the
  slide's role ("Motivation", "Challenge", "Prior work", "Approach",
  "Results", "Summary"). A background or key-idea slide takes its topic's
  name, never "Background" or "Key idea".
- **A title is never a claim, an action, or an ad hoc label.** Not
  "Adjoints put every sensor in scene space", not "Three threads". It has
  no trailing period and fits on one line, the title slide's included.
- **State things plainly.** Titles, subtitles, captions, and section names
  carry no taglines, wordplay, or dramatic phrasing ("one equation, read
  five ways", "at the speed of light", "the same trick in miniature",
  "fun with …"). An outline slide is titled "Outline" and lists each part
  in a plain line ("Linear algebra: $x = e + Ax$ for a matrix $A$"); a
  closing summary is titled "Summary".
- **A section's title slide** takes the section's name.
- **The subtitle states the slide's point**: one short line under the
  title (about 70 characters at most), one statement in plain words, with
  math as `$…$`. A long formula goes in the visual.
- **Subtitles state high-level goals, not specifics.** The user
  (2026-11-17): "I don't like the volume rendering subtitle it's way too
  specific. this can be applied elsewhere as well I'm sure." and "Same
  thing for most of the section subtitles honestly. High level goals
  instead of something super specific e.g. "The scene in e and A is
  learned from measurements" -- that's so hard to interpret without
  re-introducing context." A subtitle must be readable without knowing the
  symbols: "Light inside scattering media", not "$x$ is radiance in a
  medium, and $A = D^{-1}K$ one bounce". Symbols and formulas belong in the
  visual, where they are introduced. The core `content` layout
  and every layout that renders `SlideTitle` show it
  ([layouts](../implementation/layouts.md)).
- **Orient with the outline and section dividers, not with numbers.** One
  outline slide lists the parts; each part opens with a divider slide
  (its name, a plain one-line goal, and a picture). Titles do not say
  "Part 2" or "Thread 1", and dividers carry no section numbers (the user,
  2026-11-17: "The numbers before the new sections (e.g. the 3 before
  volume rendering) is awkwardly placed").

## One message per slide

A slide makes one point. A slide with several ideas becomes several slides;
more slides beat denser slides. A reader skimming only the subtitles should
get the talk's argument.

A research talk runs each section in the same order: its title slide, the
challenge (the broad problem, then the specific one), prior work in the
same order, the slides that build the approach, then results. A lecture
follows its derivation instead.

## Layout

The user (2026-11-17): "The bounces demo (and I imagine many other sldies)
are too busy with text. Sometimes having just a short label (which I can
explain) is better.", "Some lines of text are far too long", and "White
space is not used effectively in these slides".

- **Plain layouts.** A slide carries a title at the top left, one short
  subtitle under it, the visual, and short labels. No colored boxes,
  cards, pills, banners, or shapes with text in them.
- **Separate parts are visibly separate.** A collaborator's review, passed
  on by the user (2026-11-19): "add background behind things that are
  separate (... theres so much on there it gets a bit chaotic to look at
  ...) they could be better compartmentalized". A slide with several
  distinct parts (inputs, a 3D view, a plot, a diagram) groups each part
  so the eye finds them at once: by spacing and alignment first, and
  where that is not enough, by a quiet panel behind each part (a shade
  off the slide's background, one shade for the whole deck, no border).
  This is grouping, not decoration: the rule above still bars colored
  boxes and shapes around a line of text.
- **Slides that follow one another share a grid.** The user (2026-11-19):
  "That way, it looks better when we transition to the next slide which
  also has 4 columns", "the same layout can be used (the images don't jump
  from one place to another)", and, of a 16 px difference, "Still a
  slight shift in content from the first captured slide to the second."
  Consecutive slides that show the same kind of content use the same
  columns, tile sizes, and top line, and an element that stays between
  them stays at the same pixel.
- **Nothing points at nothing, and a label sits on its thing.** The user
  (2026-11-19): "there's a hanging arrow from RGB image in the first
  slide which doesn't lead to anything until the later slides" and
  "Bring the "occluder" label closer to the teapot. It's not clear if
  it's labeling the teapot or the floor." An arrow is drawn when both of
  its ends are on screen; a label is nearer to what it names than to
  anything else.
- **Short labels, not explanations.** Label a figure or a state of an
  interactive visual with a symbol or a few words ("bounce 2", $Ge$); the
  speaker explains, and the explanation goes in the notes. No line of text
  on a slide runs long.
- **Every slide has a visual.** An equation-only slide gets a figure or
  larger equations.
- **Every slide serves a purpose.** The user (2026-11-17): "This light
  paths slide is also not particularly useful by itself, each slide should
  serve a purpose." A slide that shows a picture without making a point
  the talk needs is cut.
- **The visual shows what the equations say.** The user (2026-11-17): "If
  you could relate the content & equations more effectively to the visuals
  that would be good." and "the visuals are again disconnected from the
  content (this is a theme)". Each equation or label has a counterpart in
  the visual, drawn in the same color and appearing at the same build
  step; a part of the visual that nothing on the slide refers to is cut.
  An own visual beats a borrowed one that makes the idea clunkier ("You
  don't always need to borrow from existing decks if it makes it clunkier
  to explain a concept").
- **Numbers only when the speaker uses them.** The user (2026-11-17): "I
  think the specific numerical values in many of these demos are
  unnecessary". A demo shows a value, chart, or readout only when the
  explanation refers to it.
- **The visual fills the free space.** Size it to the space under the
  subtitle, with no awkward whitespace; a row of small images becomes a
  grid.

## Text

- **Equations over explanation.** A constraint, estimator, or identity
  that can be an equation is one. Text says only what the equation does
  not: what the symbols are and why it matters. Write math as `$…$` inline
  and `$$…$$` on its own line
  ([presentation format](../implementation/presentations.md#math-in-text)).
- **One statement per line.** A subtitle, caption, or bullet says one
  thing: no two claims joined by a semicolon, and no line that describes two
  methods. On a prior-work or challenge slide the subtitle states the one
  shared point; what each method does and its limitation go on their own
  lines under that method's figure.
- **Precise verbs.** A method uses, estimates, maps, or transports
  something, tied to what it does; it does not "follow", "push", "land",
  "snap", or "put" it.
- **No agency for things without it.** The user (2026-11-17): "Try not to
  use active verbs for things that don't have agency (e.g. "transmittance
  turns the equation into...")". Quantities, operators, and equations do
  not act: write "with transmittance $T(t)$, the equation becomes …" or
  "multiplying by $T(t)$ gives …", not "transmittance turns …"; "light
  arrives in order of path length", not "the pulse paints the room".
- **No metaphors or anthropomorphism.** The user (2026-11-17): "Avoid
  weird anthropomorphizing metaphors like "the gradient is where the light
  and importance meet". Just state things plainly." and "I feel like this
  guidance can be applied a bit more broadly". Quantities, operators,
  cameras, pixels, and networks do not "meet", "see", "want", "carry", or
  "run backwards". State the relation itself, in words or as an equation:
  "the gradient is $y^\top (\partial_\theta A)\, x$", "importance satisfies
  $y = q + A^\top y$", "the pixel measures light from these surfaces".
- **Keep established terms.** The user (2026-11-18), of "the brightest
  value along each ray, and its depth" proposed for "maximum-intensity
  projection": "what you have is too verbose and reads clearly as AI.
  again, sort of anthropomorphising the ray by giving it something
  (through "its depth")." A field's term (maximum-intensity projection,
  time of flight, relay) is used as is, not replaced by a longer
  plain-language paraphrase, and a possessive that gives an inanimate
  thing something ("the ray ... its depth") counts as anthropomorphism.
- **Follow the source's wording.** The user (2026-11-18): "I'm also not
  asking you to change the language from what's in the paper, unless it
  helps with clarity". A talk about a paper takes the paper's terms and
  phrasing of its claims, and departs from them only to be clearer.
- **State a method in its general form,** then name the special case the
  figure uses.
- **Keep claims within what each method supports,** and match names,
  numbers, and method descriptions to the sources; when they disagree, ask.
- **Summary points are takeaways** at the level of the talk's argument,
  not method details.
- **One point per bullet.** The user (2026-11-17): "you should try not
  make more than one point per bullet." A bullet that makes two points
  becomes two bullets, or one bullet and a note.
- Bullets, when a slide needs them, are short phrases of one line each, a
  few per slide. What does not fit belongs in the notes.
- Text is legible from the back of the room: nothing on the stage smaller
  than the framework's body size without a reason.
- **One type scale per deck.** A collaborator's review, passed on by the
  user (2026-11-19): "Font sizes (maybe types too not sure) all over the
  place, id probably pick 2/3 font sizes and use those and only those
  consistently throughout the pres"; the user: "The font sizing
  feedback/feedback about visual consistency should probably apply to
  other decks too". Besides its titles, a deck uses at most three text
  sizes and one typeface, declared once as custom properties in its
  `theme.css` (for example `--type-statement`, `--type-label`,
  `--type-small`). A layout's stylesheet takes its sizes from those
  properties and never writes a literal size, so a new layout cannot
  add a fourth. (The core layouts were written before this rule and still
  use literal sizes; a deck's own layouts follow it.) The same kind of text (a panel label, an axis tick, a
  caption) has the same size on every slide.
- Define a necessary technical term and spell out an abbreviation at first
  use, on the slide or in the notes.
- **Terms are clear where they are used.** The user (2026-11-17): "When
  you say "like G" and "like S" on the volume rendering slides, students
  will not remember what these are. You have to make sure that terms you
  use are clear." A symbol from an earlier slide is named in words where
  it reappears ("propagation $G$"), unless the slide just before used it.

## Figures and media

- A figure shows one thing; crop away what the point does not need.
- **Redesign a borrowed figure that does not fit.** The user (2026-11-17):
  "If a figure is simply cut from a paper or presentation, and doesn't
  exactly fit, you are welcome to (and should) re-design while
  citing/attributing." Draw it again for the slide's point and credit the
  original ("after Gkioulekas, CMU 15-468").
- **Each image shows the point it sits under.** Before placing a figure,
  read its own caption and panel labels in the source, and caption it with
  what it shows, not with what the method does. An image standing in for
  something else is labeled as an illustration.
- **Images match the words.** When a slide lists items (methods, sensors),
  each item gets its own image. Prefer the speaker's own results, where
  they exist, to generic images.
- **Captions** say what the figure shows and its setting, and only what the
  audience needs: no seeds, step counts, error values, or hardware model
  names (those go in the notes). Simulated and preliminary results are
  labeled as such.
- Label axes, units, and the compared methods directly on the figure.
- **Videos are short loops:** trim a long clip to one representative
  segment and crop away headers. Videos that must play in step are one
  file: stitch a side-by-side comparison into one video, with a caption
  under each panel, because separate video elements drift apart.
- **A video starts with what it shows, and holds where the point is.** The
  user (2026-11-19): "The video may also just start a little bit too
  late" and "maybe pause the indirect video to highlight the indirect
  difference". Trim a clip to the frames in which something happens;
  hold the frame that makes the point (the final view of a trajectory,
  the frame in which two captures differ most) for a few seconds; mark a
  region only while the view is held.
- **A video shows a frame from the moment its slide appears.** The user
  (2026-11-19): "Some strange thin outlines where videos *will* appear,
  before they do appear. Also sometimes the content is not fully loaded
  when I change slides". Every video names a `poster` (its first frame),
  and a cell of a stitched video that is not revealed yet is covered a
  little past its edges.
- **A picture of a method is that method's output.** The user
  (2026-11-19): "more visual examples of methods should be shown. The
  visuals should also ideally be tied to a concrete technique". When a
  slide names methods (related work, baselines), each picture or clip is
  the result of the method named under it, with its citation. Find out
  which method produced a file before labeling it; do not label a result
  with a method that did not produce it.
- **A render obeys the scene it draws.** The user (2026-11-19): "the
  reflected light highlight looks strange (like it's not aligned with the
  normal or something?)". A glow on a surface lies in the surface; light
  travels at one speed; times and distances agree with the geometry on
  screen.
- Size media for the 1280×720 stage. Re-encode large videos before pushing
  them to the bucket; a slide rarely needs more than 1280 pixels of width.
- Name files for what they show, and keep them under the slide that uses
  them (`public/slides/<slide-id>/`).

## Comparisons

The user (2026-11-19): "Internal consistency in storytelling is very
important", "For the comparisons, I would also try to be consistent
about which method is shown first/in particular when our method appears.
In one slide it appears last in another first", and "If you use captured
scenes: comparison, use consistent naming for the simulated slide title
too".

- **One order, everywhere.** A deck fixes the order of the things it
  compares (for example: reference, ours, then each baseline in a fixed
  order) and keeps it in every grid, in the order steps reveal them, and
  in the notes.
- **Parallel slides have parallel titles** and the same row and column
  names. One thing has one name in the whole deck (a figure called the
  input view on one slide is not the RGB image on the next without the
  slide saying so).
- **One meaning per color.** The color that marks our method marks
  nothing else; the color of a hidden region is not also the color of a
  limitation or of scan points. A deck's `theme.css` lists each color's
  one meaning.
- **Say what a mark means, and what a number counts.** A box that marks a
  region is explained once where it first appears ("Red: hidden in the
  input view"); a count says what it counts ("Correct object: 20/20
  seeds"); an asterisk has its footnote on every slide that shows it.
- **The reference comes first.** A comparison shows the ground truth or
  the scene itself where one exists, so the viewer can judge the claim on
  screen.

## Citations

- Every borrowed figure, slide, photograph, and video is credited on its
  slide. When a borrowed slide credits someone else, both appear.
- Nothing is cited from memory: a work is cited only for a claim checked
  against the work, its abstract, or its project page.
- Citations read "Authors et al., Venue Year". An unverified venue is left
  out rather than guessed.

## Build steps

Use build steps to pace an argument: each click adds one idea the speaker is
about to talk about. A slide's last step is what the audience sees when the
speaker moves on, so it must stand on its own.

**Every key press changes the screen, at once.** The user (2026-11-19), of
steps that changed nothing and of steps that faded in: "The navigation
doesn't work (arrow keys are broken)", "I cannot use the arrow keys to
navigate until an animation is finished", and "an arrow press should
reveal content. but it gets loaded in slowly/visibly". A build step
exists only when it shows something new; the new state is on screen in the
frame after the press; a key pressed during an animation moves on without
waiting for it; arriving on a slide backward shows its settled state.

An equation can be a question: its left side first, with a question mark
over the equals sign, and its right side one step later, so the speaker can
ask the audience before showing it. Use it where the step is worth working
out, not on every equation. The user (2026-11-17): "Putting a question mark
over the equality before showing the RHS could also be an option."
Motion shows something new or not at all. The user (2026-11-17): "it's a
bit awkward when animations repeat when cycling from one slide to the next.
Sometimes this is legitimate but please just watch out for it" and, of an
animation that restarted midway, "they jump". An element that is the same
on two consecutive slides (a title in the same place, a room render of the
same size) does not animate in again; an animation runs once, from the
previous step's state to the new one, without restarting.

## Notes

Notes carry the explanation the slide leaves out. They say what the speaker
says, not what the slide shows: the transition into the slide, the one
sentence the audience must remember, and the answer to the question the
slide invites. Per-step notes (`notes-<step>.md`) are for steps that change
what the speaker says.

In a narrated deck (a video with a voiceover: see
[presentation types](presentation-types.md)) the notes are the narration,
one file per build step, and two more rules hold. The user (2026-11-19):
"narration is too long without supporting visuals/animations at times"
and "When say that we capture a video, I might show the video."

- **The screen shows what the voice says, while it says it.** Each
  sentence has its own visual beat (something appears or moves); a step's
  motion lasts about as long as its sentences; a sentence that names a
  thing shows that thing. Measure both: seconds of narration against
  seconds of change, per step.
- **Each step's note is one or more complete sentences.** A voice reads
  each step on its own, so a sentence is never split across two steps.

## Checking a slide

A slide is done when its capture frames show it as intended at every step,
with no warnings ([visual validation](../implementation/visual-validation.md)).
