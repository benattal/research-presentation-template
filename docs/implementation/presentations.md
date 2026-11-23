# Presentation format

A presentation is a directory `presentations/<id>/`. The directory name is
the presentation's id: its URL segment behind the live gateway
(`/<id>/`), its namespace for browser storage, and its prefix in the asset
bucket. Ids use lowercase letters, digits, and hyphens.
`npm run new -- <id>` creates a working skeleton.

A directory anywhere else with the same contents is a presentation too,
and every command takes it by its path, with a leading `./`
(`npm run dev -- ./tests/fixtures/ui-showcase`); its id is the
directory's name. Such a deck is left out of what lists presentations:
`npm run check` without arguments, the live gateway, and `pull --all`.
The test fixtures are such decks.

A file that is not valid JSON does not stop the page blank: the load-error
screen, and `npm run check`, name the file and the line and column of the
mistake (`parseJsonFile` in `core/client/presentation/model.js`).

```text
presentations/<id>/
  README.md                           what it is; how to pull and push its assets
  presentation.json
  layouts/index.js
  slides/<slide-id>/content.json
  slides/<slide-id>/notes.md          optional
  slides/<slide-id>/notes-<step>.md   optional
  public/slides/<slide-id>/...        assets (DATA.md)
  assets/...                          assets (DATA.md)
  theme.css                           optional
  sources.json                        optional: citations of borrowed material
  pronunciation.json                  optional: how a narration voice says a term
  recording.json                      optional: how long npm run record holds each step
  layouts/<LayoutName>/...            optional, registered in layouts/index.js
  media/...                           optional: the scripts that build the media
```

Every presentation has a `README.md` saying what it is and how to fetch
its assets on a fresh checkout (`npm run assets -- pull <id>`) and push new
ones; `npm run new` writes one, and `npm test` fails when one is missing.

## `media/`: the scripts that build the media

The files in `public/` are not in git, but the way they were made is
code, and belongs in git. A presentation keeps the scripts that produce
its media (trimming and stitching clips with ffmpeg, rendering a volume,
decimating a mesh) in `media/`, one per slide or section, named for what
it builds. Each script:

- is run by hand from the presentation's directory
  (`bash media/results.sh`, `python media/light-videos.py`), and says so
  in its first lines, with what it needs installed;
- names its sources at the top (a results folder, a bucket path, files
  under `assets/sources/`), reads them without changing them, and writes
  only under `public/slides/<slide-id>/`;
- states the geometry it encodes for (cell sizes and gaps of the slide's
  grid, at 1.5× the stage) next to the slide's `content.json` values it
  must agree with;
- writes a poster (the first frame) beside every video.

Sources that exist nowhere else (a downloaded mesh, a collaborator's
clip) go in `assets/sources/<slide-id>/`, which is synced to the bucket.
The framework never runs these scripts: they are provenance, and
`npm run build` does not depend on them.

## `presentation.json`

```json
{
  "title": "Learning Light Transport",
  "defaultTransition": "fade",
  "sections": [
    { "id": "intro", "title": "Introduction", "slides": ["title", "outline-intro", "motivation"] },
    { "id": "method", "title": "Method", "slides": ["outline-method", "pipeline"] }
  ]
}
```

| Field | Meaning |
|---|---|
| `title` | required; the page title and the presentation's name in listings |
| `sections` | required; ordered sections, each with an `id`, a `title`, and its slide ids in order |
| `defaultTransition` | `fade` (default), `slide`, `zoom`, or `none`; a slide's own `transition` wins |
| `progressBar` | optional; `false` hides the progress bar at the top of the audience view (default `true`) |
| `backLink` | optional URL for a "back" button in the toolbar, relative to the presentation (`"../"` returns to the gateway's root) |
| `servedAtRoot` | optional; `true` makes the live gateway redirect `/` to this presentation (at most one per branch) |

A slide directory that no section lists is a draft: it is not shown, and
`npm run check` names it.

## `slides/<slide-id>/content.json`

Every slide names a layout and supplies that layout's fields:

```json
{
  "layout": "content",
  "sectionLabel": "Method",
  "title": "Radiance caching",
  "subtitle": "A cache ends the series after one bounce: $x \\approx e + A \\hat{x}$",
  "bullets": ["Sample paths", "Fit a cache", "Render"],
  "media": [{ "type": "image", "src": "/slides/pipeline/overview.png" }]
}
```

Fields every slide may use, whatever its layout:

| Field | Meaning |
|---|---|
| `layout` | required; a core layout ([layouts](layouts.md)) or one in `layouts/index.js` |
| `sectionLabel` | small label above the layout |
| `footnote` | small italic line at the bottom of the slide |
| `credits` | sources of borrowed material on the slide, as keys of `sources.json` or `{ "source": key, "what": "Fig. 3" }`; shown as a small credit line at the bottom right |
| `transition` | overrides `defaultTransition` for this slide |
| `buildSteps` | an array whose length is the number of clicks the slide takes; layouts that reveal content read their step from it |

Media paths start with `/slides/<slide-id>/` and name a file in
`public/slides/<slide-id>/`. They are resolved against the deployment's base
URL when the presentation loads, so they work at `/`, under `/<id>/`, and in
a static build served under any path. (A build needs a web server: a browser
does not load its scripts from a `file://` address.) A media item is
`{ "type": "image" | "gif" | "video", "src": "...", "alt"?: "...", "poster"?: "..." }`;
a video's `poster` image shows until the video has a frame.

## Math in text

Text fields render math typeset with KaTeX: `$…$` is inline math,
`$$…$$` is a formula on its own line, and `\$` is a literal dollar sign. In
JSON, each backslash is doubled: `"$\\partial_\\theta m = y^\\top x$"`.
A single backslash before `t`, `b`, `f`, `r`, or `n` is a JSON escape
(`"\theta"` is a TAB followed by "heta"), so loading a presentation reports
any string in slide content with a control character, and any inline
formula with a newline, along with every formula KaTeX cannot render.

`core/client/stage/math.js` owns the parsing and the KaTeX options, so the
browser and `npm run check` render alike. `core/client/stage/Text.jsx`
renders one string with its math; the core layouts pass their titles,
subtitles, bullets, descriptions, captions, discussion prompts, the
question of `pollResults`, and the outline's section titles through it, and
the slide frame passes the footnote and the credit line. Shown as plain
text: `sectionLabel`, a `poll`'s question and options, the `text` of
`illustratedPoints` (which renders `**bold**` only), the `example` of
`diagram`, the steps and note of `colabLink`, and the cards of
`presentationLinks`.

When a presentation loads, every string in each listed slide's
`content.json`, and every section title, is typeset once. A formula that
KaTeX cannot parse is a load error naming the slide and the formula: the
presentation shows it with every other problem instead of rendering, and
`npm run check` reports it.

KaTeX trusts one command beyond its defaults: `\htmlClass{name}{…}` wraps a
term in a CSS class, so a presentation's `theme.css` owns the colors of its
terms instead of the slide text (`\htmlClass{term-adjoint}{y}`, with
`.term-adjoint { color: … }` in the theme).

## Credits

A slide that shows borrowed material (a figure, a photograph, a video, a
slide adapted from someone's lecture) names its sources in `credits`. The
citation text lives once, in the presentation's `sources.json`:

```json
{
  "nayar2006": {
    "authors": "Nayar et al.",
    "title": "Fast separation of direct and global components ...",
    "venue": "SIGGRAPH",
    "year": 2006,
    "url": "https://..."
  }
}
```

The slide shows "Nayar et al., SIGGRAPH 2006, Fig. 6" for
`"credits": [{ "source": "nayar2006", "what": "Fig. 6" }]`
(`formatCredit` in `core/client/presentation/model.js` owns the format).
The core `credits` layout lists every cited source in the order the talk
first uses it, so a credits slide never drifts from the slides. A credit to
a key that `sources.json` lacks is a load error. When a borrowed slide
credits someone else, keep the chain in `authors` ("Gkioulekas, after
Jarosz").

## Presenter notes

`notes.md` holds a slide's notes, in Markdown, with math written as in
slide text (`$…$` inline, `$$…$$` on its own lines). The presenter window
finds formulas with the Markdown parser's math extension (remark-math), so
Markdown escapes and emphasis never reach inside a formula, and renders
them with the slides' KaTeX options
(`core/client/presentation/notesMath.js`); `npm run check` reports a
formula that does not render. A slide with build steps can add
`notes-<step>.md` (0-based) for a step that needs its own notes; every
other step shows `notes.md`. Under the development server the presenter
window can edit notes and saves them to the file that was on screen; saving
does not reload the audience view.

## Pronunciation map

The notes are also the script of a narrated video
([narration](narration.md)). An optional `pronunciation.json` maps a term
as the notes write it to the spelling a text-to-speech voice should read:

```json
{ "NLOS": "en-loss", "Lyra 2": "Lyra two" }
```

It is a flat object of non-empty strings; `npm run check` reports anything
else. `npm run narration -- <id>` copies it into the narration directory,
where the synthesis applies it; the notes and the slides keep the real
spelling.

## Custom layouts

A layout is a React component that receives
`{ slide, buildStep, sections, slides, citations }` and renders inside the 1280×720
stage:

```jsx
// presentations/<id>/layouts/BigNumberSlide/BigNumberSlide.jsx
export default function BigNumberSlide({ slide, buildStep }) {
  return (
    <div className="slide--big-number">
      <div className="big-number-value">{slide.value}</div>
      {buildStep >= 1 && <p>{slide.explanation}</p>}
    </div>
  );
}
```

Register it in `layouts/index.js` under the name slides use:

```js
import BigNumberSlide from './BigNumberSlide/BigNumberSlide.jsx';
export default { bigNumber: BigNumberSlide };
```

A presentation's layout may not reuse a core layout's name; wrap the core
layout under a new name instead (a `workshopTitle` that renders the core
`TitleSlide` with its own background, for example). Layouts import the framework as `@core/...`; for example
`@core/stage/Media.jsx` for a media item, `@core/live/polls.js` for a live
poll, and `@core/presentation/assetUrl.js` to resolve an asset path built in
code.

A layout with a heading renders it with `@core/stage/SlideTitle.jsx`
(`<SlideTitle title={slide.title} subtitle={slide.subtitle} />`), so every
slide's title and subtitle look the same and render their math. Any other
text field goes through `@core/stage/Text.jsx`
(`<Text>{slide.caption}</Text>`), which renders [math](#math-in-text) and
throws if given anything but a string.

Conventions for layouts:

- Design for the 1280×720 stage. Never use viewport media queries; the stage
  is scaled as a whole.
- Prefix CSS classes with the layout's name (`slide--big-number`,
  `big-number-value`): all layout styles share one page.
- Read build steps from `buildStep` and declare the matching `buildSteps`
  count in the slide's data.
- Clean up timers, animation frames, and listeners, and ignore media loads
  that finish after a newer request or after unmount.
- Stop drawing when nothing changes. An animation that ends gives
  `useStepClock` the time it ends at (`until`), so a slide left on screen
  after its animation costs no frames.
- Do slow work before the slide is reached, not on the key press that
  arrives at it. A layout that builds something slow before its first
  frame (a WebGL scene and its compiled shaders, a decoded mesh, a solved
  model) gives its component a `prepare(slide)` function, which may be
  async, and keeps what it builds for the page's lifetime, in its module;
  the component uses what was kept, or builds it when `prepare` has not run
  (the capture view, a slide opened directly). The audience view and the
  presenter's preview call `prepare` for every slide once the media are in
  memory, one slide at a time while the page is idle (`preloadSlides` in
  `@core/presentation/preload.js`). Between parts that each take more than
  a few tens of milliseconds, `await whenIdle()` (same module), so no part
  holds up a key press for longer than itself. Keep a WebGL context for the
  page instead of creating one per visit: compiling its shaders again is
  what makes arriving slow.
- Mark a deliberately full-bleed or overflowing decoration with
  `data-overflow-ok`.
- Mark every region that takes drags (a point to move on a canvas, a plot
  to scrub, a handle in an SVG) with `data-no-swipe`, on the element or on
  a box around it. On a touch screen a sideways drag anywhere else on the
  slide is a swipe and changes the slide, including on a canvas, an SVG,
  or a video without controls: media that only show something let the
  swipe through. Form controls, links, and videos with controls keep their
  touches without the attribute (`useSwipeNavigation.js`).

## Themes

The framework's colors, fonts, and radii are CSS custom properties at the
top of `core/client/index.css`. An optional `theme.css` in the presentation
directory overrides them for that presentation only:

```css
:root {
  --bg-primary: #ffffff;
  --bg-slide: #ffffff;
  --text-primary: #1a1a2e;
  --accent: #b5121b;
}
```

## `recording.json`

`npm run record -- <id>` films the presentation step by step
([recording](recording.md)), and has to know how long to stay on each
step. Without this file it stays 5 seconds on each. A slide whose build
steps animate needs longer, or shorter, and only the presentation knows
how long its animations take:

```json
{
  "defaultHold": 6.5,
  "silentHold": 2.5,
  "holds": {
    "lidar-capture": [
      { "seconds": 3.5, "oneShot": true },
      { "seconds": 11, "oneShot": true }
    ],
    "comparison": [{ "seconds": 6.3 }]
  }
}
```

| Field | Meaning |
|---|---|
| `defaultHold` | seconds a step without an entry in `holds` is held in a silent recording (default 5) |
| `silentHold` | seconds a step without narration is held in a narrated recording (default 2.5) |
| `holds` | slide id → one entry per build step of that slide, in order |
| `seconds` | in an entry, required: how long that step's own motion takes |
| `oneShot` | in an entry, optional: `true` for an animation that plays once and must be shown in full even when its narration is shorter; a loop leaves it out |

Every field is optional, and `holds` lists only the slides that need an
entry. A slide it lists gets an entry for each of its build steps: one for
a slide without `buildSteps`. The [recording](recording.md#how-long-each-step-is-held)
document says how these become the time each step is held.

`npm run check` reports, with every other problem: a slide id that
`presentation.json` does not list, a slide whose number of entries differs
from its number of build steps, a `seconds` or a hold that is not a
positive number, an `oneShot` that is not `true` or `false`, and any field
not named above.

## Checks

`npm run check -- <id>` loads the presentation the way the browser does and
reports every problem, plus missing assets. `npm run capture -- <id>`
renders every slide and step and reports what only a browser can see
([visual validation](visual-validation.md)).
