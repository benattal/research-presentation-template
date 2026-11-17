# Slide style

Conventions for what goes on a slide. [Writing style](writing.md) governs
words everywhere, including its lists of words, phrases, and prose tics to
avoid; this guide governs the slide as a whole and the rules specific to
words on a slide.

Reviews check these rules with the [slide review checklist](slide-review.md),
which keeps the user's feedback in general form.

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
- **Short labels, not explanations.** Label a figure or a state of an
  interactive visual with a symbol or a few words ("bounce 2", $Ge$); the
  speaker explains, and the explanation goes in the notes. No line of text
  on a slide runs long.
- **Every slide has a visual.** An equation-only slide gets a figure or
  larger equations.
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
- Define a necessary technical term and spell out an abbreviation at first
  use, on the slide or in the notes.

## Figures and media

- A figure shows one thing; crop away what the point does not need.
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
- Size media for the 1280×720 stage. Re-encode large videos before pushing
  them to the bucket; a slide rarely needs more than 1280 pixels of width.
- Name files for what they show, and keep them under the slide that uses
  them (`public/slides/<slide-id>/`).

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

## Checking a slide

A slide is done when its capture frames show it as intended at every step,
with no warnings ([visual validation](../implementation/visual-validation.md)).
