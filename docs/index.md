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
- [Testing](implementation/testing.md): unit, repository, and browser tests

## Style

- [Code style and organization](style/code.md)
- [Writing style](style/writing.md)
- [Slide style](style/slides.md)
- [Slide review checklist](style/slide-review.md): the user's feedback, generalized, for every review cycle

## Environments

[Environments and setup](environments/index.md) is the authoritative setup
guide. Assets and the bucket are described in [DATA.md](../DATA.md).

## Plans and tracking

- [Plans](plans/README.md): intended multi-phase work
- [Live tracking](tracking/README.md): the status of active plans
- [Archive](archive/README.md): retired plans and trackers

Changing state belongs in `docs/tracking/`, not in agent, implementation, or
style documentation.
