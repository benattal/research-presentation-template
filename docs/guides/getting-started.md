# Getting started: a new presentation

For the person using this template. It goes from an empty clone to a deck
you can present, in the order the work is done, with what to type and, if
you work with a coding agent, what to say to it. Agents follow the stricter
version of the same procedure in
[making a presentation](../workflows/making-a-presentation.md).

Everything here can be done by hand, and nearly everything can be asked
for instead: the parts marked **With an agent** give the sentence that has
Claude Code (or another agent that reads `AGENTS.md`) do the step for you.

## 1. Install, and take the tutorial

You need git and Node.js 22.12 or newer.

```bash
git clone <this repository's address>
cd research-presentation-template
npm install
npm run tutorial
```

Open the address it prints (http://localhost:5173/), with an editor beside
the browser. The tutorial is a deck about the template that you complete
by editing it: it asks you to change a title, add a bullet, a build step,
a picture, and a slide of your own, and each slide marks its task done
when you save. Twenty minutes with it covers everything this page assumes
you know. `git restore presentations/tutorial` puts it back afterwards.

A second tutorial, `npm run tutorial:agents`, does the same for working
with a coding agent: each of its slides gives you words to say, and the
agent changes the deck. Take it once you have an agent's session open in
the repository.

Arrow keys move through any deck, **O** shows every slide, **P** opens the
presenter window with the notes, **F** is fullscreen. `npm run dev --
example` opens the other deck that comes with the template, the example:
one slide per core layout.

A presentation is a folder of small text files:

```text
presentations/example/
  presentation.json            the title, the sections, the order of the slides
  slides/<slide-id>/
    content.json               which layout the slide uses, and its text and media
    notes.md                   what you say on that slide
```

Change a word in `presentations/example/slides/title/content.json` and save:
the page updates by itself.

## 2. Make your branch and your presentation

`main` is the template. Your work lives on a branch of its own.

```bash
git switch -c my-talk
npm run new -- my-talk --title "My Talk"
git rm -r presentations/example
npm test
```

`npm run new` writes a five-slide starter (a title, two outlines, one
content slide, a closing) and a `README.md` for the presentation. The
example is deleted because a project branch holds its own presentations
(the two tutorials stay, for whoever joins the project). `npm test` should pass.

Then say what the branch is, in the "This branch" section of `CLAUDE.md`
and `AGENTS.md` (the same text in both; a test checks that they match): one
or two sentences on what the presentation is, for whom, and how it is
hosted.

```bash
npm run dev -- my-talk
```

**With an agent:** "Start a new presentation with id `my-talk` on a new
branch from main, delete the example, and fill in the 'This branch'
section." It does the steps above. It should also offer the two review
skills (step 7).

## 3. Decide where the media will live

Images and videos do not go in git. They go in an asset store, and
`npm run assets` copies them back and forth. A deck of text and equations
needs none, so this can wait until the first image.

The README's [Large assets](../../README.md#large-assets) section sets one
up: a Cloudflare R2 bucket (which needs access tokens), a Dropbox folder, or
a folder a sync client already keeps. Once `ASSETS_REMOTE` names it, write
that name in `presentations/my-talk/README.md`, so that the next person
knows where the media are.

## 4. Plan before slides

A deck that starts as slides ends up rebuilt. Start with a **storyboard**:
one row per slide, with its title, what each key press shows, and where
each picture comes from. It goes in a plan, `docs/plans/my-talk.md`.

First name the type of presentation, because the type decides the rest:
a lecture, a research talk, an interactive workshop, or an explainer video
([presentation types](../style/presentation-types.md)).

**With an agent:** this is the `start-presentation` skill. Give it what you
have and what you want:

> Use the start-presentation skill. This is a 20-minute research talk for a
> vision audience on our paper (PDF in `assets/paper.pdf`). I have the
> figures from the paper and four result videos in `assets/results/`. Draft
> the plan and the storyboard; do not build slides yet.

It names the type, reads the material, writes `docs/plans/my-talk.md` and
`docs/tracking/my-talk.md`, and stops at the storyboard. Read the table.
Correct it in words ("merge rows 4 and 5", "the method needs a diagram
before the equation") until it is the talk you want to give. Then:

> The storyboard is right. Build the introduction section.

**By hand:** write the table yourself; its columns are described in
[slide style](../style/slides.md#storyboard).

## 5. Write the slides

One section at a time. A slide is a directory with a `content.json`:

```json
{
  "layout": "content",
  "sectionLabel": "Method",
  "title": "Radiance caching",
  "subtitle": "A cache ends the series after one bounce",
  "bullets": ["Sample paths", "Fit a cache", "Render"],
  "media": [{ "type": "image", "src": "/slides/pipeline/overview.png" }]
}
```

- Put the slide's directory under `presentations/my-talk/slides/`, and add
  its name to a section in `presentation.json`. A slide that no section
  lists is a draft and is not shown.
- Its image goes in `presentations/my-talk/public/slides/pipeline/`, and is
  written in the JSON as `/slides/pipeline/overview.png`.
- `notes.md` beside `content.json` is what you say. `$…$` in text is math.
- [Layouts](../implementation/layouts.md) lists every layout and its
  fields; [presentation format](../implementation/presentations.md) covers
  build steps (several clicks on one slide), themes, citations, and
  layouts of your own.

**With an agent:** it builds each section to the storyboard and shows it.
Say what is wrong in your own words; it records each direction you give
under "Standing directions" in the tracker, so that nothing you said is
lost between sessions.

## 6. Check the deck

```bash
npm run check -- my-talk       # does it load; is every image and video there
npm run capture -- my-talk     # a screenshot of every slide and step
```

`capture` prints the path of a contact sheet (`index.html`): open it and
look at every frame. It also lists text that overflows a slide, media that
did not load, and frames that changed since the last run. It needs a
browser once: `npx playwright install chromium`.

**With an agent:** "Validate the slides" (the `validate-slides` skill). It
runs both, reads the frames itself, fixes layout problems, and brings
wording problems to you instead of rewording.

## 7. Watch and comment while it is edited

Keep the deck open on a second screen while the agent works: every saved
change appears by itself. To read it on an iPad or iPhone and send back
marked-up screenshots, see
[reviewing on a tablet](reviewing-on-a-tablet.md). In short:

> I will watch on my iPad and send screenshots.

The agent serves the deck on your network and gives you an address
(the `live-feedback` skill).

## 8. Save your work

```bash
git add -A
git commit -m "My talk: introduction and method"
git push -u origin my-talk
npm run assets -- push my-talk       # the media, to the store
```

Push the media whenever you push slides that use them. A slide whose
picture stayed on your computer shows a gap for everyone else.

## 9. Present

- **From this computer:** `npm run dev -- my-talk`, press **P** for the
  presenter window and drag it to the laptop screen, put the other window
  on the projector, press **F**.
- **From a build**, with no file watching: `npm run build -- my-talk`, then
  `npm run preview -- my-talk`. The folder `dist/my-talk/` can be copied to
  any web host. (It needs a web server; opening `index.html` from the disk
  does not work.)
- **With live polls** from the audience's phones, or with the audience's
  screens following yours: [hosting](../implementation/hosting.md), "Live
  mode".

## Where to go next

- [Walkthroughs](walkthroughs.md): joining someone's project, starting from
  a PowerPoint deck, recording a video, fixing a slide with a missing
  picture.
- [The skills](skills.md): what each one does and how to ask for it.
- [Working together](../workflows/working-together.md): several people on
  one branch.
