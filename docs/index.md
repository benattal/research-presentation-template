# Documentation

research-presentation-template renders slide decks written as data: a
presentation is a directory of JSON and Markdown, and one shared React
framework gives every presentation its views, navigation, presenter tools,
and checks.

The documents have two readers. **Guides** are for the person using the
template: what to type, what to ask an agent for, what to expect.
**Workflows** are for coding agents: the procedure behind each skill, with
its rules. The rest is reference for both.

## Guides (for people)

- [Getting started](guides/getting-started.md): a new presentation, from
  an empty clone to a deck you can present
- [Walkthroughs](guides/walkthroughs.md): joining a project, starting from
  PowerPoint, a slide with a missing picture, a recorded run-through, a
  narrated video, two people on one branch, taking the framework's updates
- [The skills](guides/skills.md): what each agent skill is for, how to ask
  for it, what it does, and what comes back
- [Reviewing on a tablet or phone](guides/reviewing-on-a-tablet.md): the
  deck on an iPad or iPhone while it is edited, and marked-up screenshots
  sent back

## Workflows (for agents)

- [Making a presentation](workflows/making-a-presentation.md): from a
  request to a finished deck: storyboard, draft, refinement cycles
- [Making a narrated video](workflows/narrated-video.md): slides, script,
  narration, recording, in gates
- [Reviewing a deck while it is edited](workflows/reviewing-on-a-tablet.md):
  the editing session, the inbox session, and how a screenshot passes
  between them
- [Working together](workflows/working-together.md): several people and
  sessions on one branch

The skills in `.claude/skills/` are the short form of these, loaded by the
agent when a task calls for one.

## Implementation

- [Architecture](implementation/architecture.md): who owns what, and how a
  presentation becomes a page
- [Presentation format](implementation/presentations.md): manifest, slides,
  notes, assets, themes, custom layouts
- [Layouts](implementation/layouts.md): every core layout and its fields
- [Hosting](implementation/hosting.md): local mode, live mode, deployment
- [Visual validation](implementation/visual-validation.md): capturing and
  reviewing every slide
- [Recording](implementation/recording.md): a run-through video of a
  presentation, with or without narration
- [Testing](implementation/testing.md): unit, repository, and browser tests
- [Narration](implementation/narration.md): notes as a script, local
  text-to-speech, and checking it by transcription

## Style

- [Code style and organization](style/code.md)
- [Writing style](style/writing.md)
- [Slide style](style/slides.md)
- [Slide review checklist](style/slide-review.md): the user's feedback, generalized, for every review cycle
- [Presentation types](style/presentation-types.md): lecture, research talk, workshop, explainer video, and what differs between them

## Environments

[Environments and setup](environments/index.md) is the authoritative setup
guide. Assets and the store that holds them are described in
[DATA.md](../DATA.md). [Narration environments](environments/narration.md)
sets up the Python tools for narrated videos.

## Plans and tracking

- [Plans](plans/README.md): intended multi-phase work
- [Live tracking](tracking/README.md): the status of active plans
- [Archive](archive/README.md): retired plans and trackers

Changing state belongs in `docs/tracking/`, not in agent, implementation, or
style documentation.
