# Core layouts

Layouts every presentation can use, registered in
`core/client/layouts/index.js`. Each takes the common slide fields
(`sectionLabel`, `footnote`, `transition`, `buildSteps`) from
[the presentation format](presentations.md) as well as the fields below. A
media item is `{ type: "image" | "gif" | "video", src, alt? }`. Text fields
render math written as `$…$` and `$$…$$`, and color terms with
`\htmlClass` ([math in text](presentations.md#math-in-text)).

A slide appears through its slide transition, and what it shows on arrival
comes with it: headings, lists, and media do not fade in again on their
own. Inside a slide only changes animate: an item a build step reveals, a
poll's bars as votes arrive.

## Structure

| Layout | Fields | Notes |
|---|---|---|
| `title` | `title`, `subtitle`?, `background`? (image path) | title and closing slides |
| `outline` | `activeSection` (a section id) | lists every section; earlier ones show as done, the active one highlighted |
| `content` | `title`, `subtitle`?, `bullets`?, `media`? | the title with its subtitle line (the slide's point, [slide style](../style/slides.md)), a bullet list, and an optional row of media |
| `progressiveBuild` | `title`, `buildSteps`: `[{ label, description?, media? }]`, `className`? | step k shows the first k + 1 entries |
| `diagram` | `title`, `description`?, `media`? (each with `caption`?), `example`? `{ positive, negative }` | an explanation beside figures |
| `media` | `title`, `media` (up to four) | 2×2 grid; videos get controls |
| `illustratedPoints` | `title`, `points`: `[{ text, visual }]`, `buildSteps` | each point appears with an illustration; `visual.type` is `imageCompare` (`fakeImg`, `realImg`), `chatCompare` (`bad`, `good`, each `{ messages }`), `chatConversation` (`messages`), or `image` (`src`); `**bold**` works in `text` |
| `discussion` | `title`, `prompts` | numbered discussion prompts |
| `colabLink` | `title`, `description`, `colabUrl`?, `steps`? `[{ text, url? }]`, `imageSrc`?, `note`? | button and QR code for a notebook; without `colabUrl` the button reads "Link Coming Soon" |
| `credits` | `title`, `subtitle`? | every source the presentation cites (`credits` on its slides, text from `sources.json`), in order of first use, in three columns |
| `presentationLinks` | `title`, `subtitle`?, `qrCode`? `{ url, label? }`, `links`: `[{ href, title, description?, icon? }]` | a menu of other presentations, for a landing presentation served at the gateway root; `href` is relative (`"../filtering/"`) |

## Live audience

These need the live server ([hosting](hosting.md)). In local mode they show
their question and a "Local mode: no live voting" badge.

| Layout | Fields | Notes |
|---|---|---|
| `poll` | `pollId`, `title`, `question`, `options` | audience members vote from their devices; clicking another option changes the vote |
| `pollResults` | `pollId`, `options`, `title`, `question`? | live bar chart of the poll with the same `pollId` and `options` |
| `numericPoll` | `pollId`, `title`, `subtitle`? | each browser submits one number; answers appear as a histogram |

A poll's vote and results slides share `pollId` and `options`. Changing a
poll's options in the content starts that poll over on the server. The
presenter resets the current slide's poll with **C**.

## Presentation-specific layouts

Layouts used by one presentation live in that presentation's `layouts/` and
are listed in its `layouts/index.js`; their fields are documented in the
component's docstring. [The presentation format](presentations.md#custom-layouts)
explains how to write one. A custom layout renders its heading with
`SlideTitle` (`@core/stage/SlideTitle.jsx`, taking `title` and an optional
`subtitle`), so its header matches the core `content` layout's, and passes
other text fields through `Text` (`@core/stage/Text.jsx`).

## Widgets for layouts

`core/client/stage/` also holds the widgets custom layouts share. Each
module's docstring gives its fields; this table says what to reach for.

| Module | Exports | Use |
| --- | --- | --- |
| `canvas.js` | `useStageCanvas`, `useAnimation`, `useStepTransition`, `stillFrames`, `ease` | a canvas drawn sharp at the stage's scale; animations that play only for a change made on the slide, not on arriving at it or in the capture view |
| `EquationStack.jsx` | `EquationStack` (default) | equations revealed one per build step, earlier ones dimmed; a line can ask before its right side (`rhs`), show a one-step justification under it, or grow term by term (`parts`) |
| `Controls.jsx` | `Slider`, `Readout` | a range input for exploring with the mouse that gives the arrow keys back to the slides; named values side by side |
| `Chart.jsx` | `Chart` (default) | a plot with thin axes and lines, dots, bars, or areas, colored by class names; optionally a scrubber |
| `playback.js` | `useStepClock`, `SETTLED_MS` | an animation that runs over time on a build step (`draw(ms)` from the step's start, on every frame); one still frame in the capture view; a virtual clock for recording |

A layout restyles a widget from its own stylesheet, scoped under its own
class (`.my-layout .slider input`); the widgets' colors are core tokens.
