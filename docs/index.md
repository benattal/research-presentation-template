# Documentation

research-presentation-template renders slide decks written as data: a
presentation is a directory of JSON and Markdown, and one shared React
framework gives every presentation its views, navigation, presenter tools,
and checks.

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

## Workflows

- [Making a presentation](workflows/making-a-presentation.md): from a
  request to a finished deck: storyboard, draft, refinement cycles
- [Making a narrated video](workflows/narrated-video.md): slides, script,
  narration, recording, in gates
- [Working together](workflows/working-together.md): several people and
  sessions on one branch

## Environments

[Environments and setup](environments/index.md) is the authoritative setup
guide. Assets and the bucket are described in [DATA.md](../DATA.md).
[Narration environments](environments/narration.md) sets up the Python
tools for narrated videos.

## Plans and tracking

- [Plans](plans/README.md): intended multi-phase work
- [Live tracking](tracking/README.md): the status of active plans
- [Archive](archive/README.md): retired plans and trackers

Changing state belongs in `docs/tracking/`, not in agent, implementation, or
style documentation.
