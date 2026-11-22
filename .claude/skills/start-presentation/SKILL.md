---
name: start-presentation
description: Start a new presentation, or a new section of one, the way this repository requires: name its type, read the user's references, write a plan with a storyboard, and only then build slides. Use when asked to create, make, draft, or plan a deck, talk, lecture, workshop, slides, an explainer, or a video from slides, and before adding more than a slide or two to an existing presentation.
---

# Start a presentation

`docs/workflows/making-a-presentation.md` is the full procedure and
`docs/style/presentation-types.md` the glossary of types. This skill is the
order of the first steps, which is where a deck goes wrong.

## 1. Before any slide

1. **Name the type** (lecture, research talk, interactive workshop,
   explainer video) from the glossary, and say what follows: who drives the
   deck, its length, what the notes are, how it is hosted, what is
   delivered. Ask the user only if the request does not settle it.
2. **Read what the user gave** (reference decks, papers, result folders,
   websites). `npm run extract-pptx -- <deck.pptx>` turns a PowerPoint deck
   into text, media, and notes. Write in the plan what each source is for.
3. **Work on the project's own branch, in the main checkout.** Create it
   from `main` (`git switch -c <project> main`), or from the current branch
   when the project needs what is there. No side folders; no junctions or
   symlinks.
4. **Create the presentation, its plan, and its tracker:**

   ```bash
   npm run new -- <id>
   ```

   It writes a five-slide starter (a title, two outlines, one content
   slide, a closing). That is scaffolding to replace from the storyboard,
   not a draft to show: remove from `presentation.json` whatever the
   storyboard does not have.

   Then `docs/plans/<id>.md` and `docs/tracking/<id>.md`, linked to each
   other and listed in the two `README.md` indexes. Quote every direction
   the user gives, dated, under "Standing directions" at the top of the
   tracker, when it is given.
5. **Write the storyboard** in the plan: one row per slide with its title,
   what each key press shows, the source of each visual, and its status
   (`docs/style/slides.md`, "Storyboard"). State the deck's order in a
   sentence above the table. Stop here and show it.

## 2. Build to the storyboard

- One section at a time, each to a good draft before it is shown. A slide
  enters `presentation.json` only when it loads. Never serve placeholder
  slides.
- Slides are composed from result media and visuals made for them; a
  paper's figure is a source, not a slide.
- Scripts that build media go in the presentation's `media/` directory and
  are committed; the media go to the bucket (`sync-assets` skill).
- After each section: `npm run check`, then the `validate-slides` skill,
  and update the storyboard rows in the same commit.
- Later stages (narration, recording) wait until the slides exist.

## 3. Refine in cycles

Three or four times: a pass; a capture; the animations vetted frame by
frame; reviewers who did not build the deck, each with one question
(content, layout, motion), using `docs/style/slide-review.md`; findings
consolidated against the user's directions; commit, and push git and media
together when the user has asked for pushes.

## Report

Tell the user the type you assumed, where the plan and storyboard are, and
what you need from them before building. Afterwards, report at each
decision point what was found, what changed, and what is next, and say
plainly what was not verified.

Ask once whether the user wants to watch the deck while it is built and
send marked-up screenshots from a tablet or phone: the `live-feedback`
skill for this session, and `feedback-inbox` for the session they open on
the device (`docs/guides/reviewing-on-a-tablet.md` is what to show them).
