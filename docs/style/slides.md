# Slide style

Conventions for what goes on a slide. [Writing style](writing.md) governs
the words; this guide governs the slide as a whole.

## One point per slide

Each slide makes one point, stated in its title as a sentence or a short
claim ("Build steps reveal a slide one click at a time"), not a topic label
("Build steps"). A reader skimming only the titles should get the talk's
argument.

## Text

- Bullets are short phrases, at most about six per slide and two lines each.
  What does not fit belongs in the notes.
- Text is legible from the back of the room: nothing on the stage smaller
  than the framework's body size without a reason.
- Spell out abbreviations at first use, on the slide or in the notes.

## Figures and media

- A figure shows one thing; crop away what the point does not need.
- Label axes, units, and the compared methods directly on the figure.
- Size media for the 1280×720 stage. Re-encode large videos before pushing
  them to the bucket; a slide rarely needs more than 1280 pixels of width.
- Name files for what they show, and keep them under the slide that uses
  them (`public/slides/<slide-id>/`).

## Build steps

Use build steps to pace an argument: each click adds one idea the speaker is
about to talk about. A slide's last step is what the audience sees when the
speaker moves on, so it must stand on its own.

## Notes

Notes say what the speaker says, not what the slide shows: the transition
into the slide, the one sentence the audience must remember, and the answer
to the question the slide invites. Per-step notes (`notes-<step>.md`) are for
steps that change what the speaker says.

## Checking a slide

A slide is done when its capture frames show it as intended at every step,
with no warnings ([visual validation](../implementation/visual-validation.md)).
