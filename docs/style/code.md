# Code style and organization

Code structure and visual quality are part of correctness in this
repository. The goal is a tree whose names and ownership let a contributor
find behavior without guessing; [architecture](../implementation/architecture.md)
is the map.

## Semantic ownership

- Put presentation-specific behavior under `presentations/<id>/`: its
  layouts, their styles, and the components only its layouts use
  (`presentations/<id>/components/`).
- Put behavior under `core/` when every presentation gets it (views,
  navigation, presenter tools, live features) or when two or more
  presentations use it.
- Inside `core/client/`, organize by what the code owns (`presentation/`,
  `navigation/`, `stage/`, `audience/`, `presenter/`, `live/`, `capture/`,
  `layouts/`), not by kind of file (`hooks/`, `components/`, `utils/`).
- A deeper directory must represent a real multi-file subdomain. Fold
  one-file directories and wrappers into their owner.
- Never create generic `common`, `shared`, `helpers`, `utils`, or `misc`
  catch-alls when a concrete domain name exists.

## Cohesive files

Long files are encouraged when the enclosed behavior shares one state or
lifecycle. Do not split code merely to meet a line target. Treat these as
refactoring prompts:

- a file whose only job is importing and re-exporting or calling another;
- one hook split across a component file and a sibling `use<Name>.js` that
  nothing else imports;
- the same logic copied into several layouts (vote bookkeeping, media
  rendering, image loading): extract it once, under the owner that all
  copies share.

Split a file only when the extracted part has its own consumers, its own
state, or a contract worth testing on its own.

## Data over branches

- Differences between presentations are data in their slides and manifests,
  consumed by one implementation. A layout does not branch on a
  presentation id or a slide id.
- Select among implementations with a table resolved once: views by mode
  (`App.jsx`), layouts by name (layout registries), presenter access by
  hosting mode (`presenterAccess.jsx`).
- Pure logic (validation, positions, notes files, poll state) lives in
  modules without React, Vite, or DOM imports, so `node --test` can run it.

## Naming and layout

- Files, directories, components, variables, and content fields must be
  self-explanatory in their local context. Use domain nouns for state and
  domain verbs for operations; avoid anonymous `data`, `result`, `thing`, or
  `mode` when the quantity has a name.
- React components and their files are `PascalCase`; hooks are `useName`;
  other modules are `camelCase.js`. A layout lives in
  `layouts/<Name>Slide/<Name>Slide.jsx` with its stylesheet beside it, and
  its CSS classes start with its name.
- Keep imports grouped and deduplicated: packages, then framework (`@core`),
  then relative imports, then the stylesheet.
- Comments explain invariants, ownership, or non-obvious browser behavior.
  Keep them short and beside the step they explain; say why, not what the
  code already says.
- A docstring opens with a one-line summary, then states only what the
  signature does not: units (CSS pixels at the 1280×720 stage, seconds,
  0-based steps), side effects, and gotchas.

## Interfaces and configuration

- Internal interfaces fail explicitly when a required value is absent. Do
  not hide an ownership error behind a passive alias, an optional-chaining
  chain on required data, or a placeholder render.
- One field owns one behavior. No flag may silently rewrite, infer, or
  reinterpret another field; no setting is kept in two places that must
  agree (a server variable and a client variable for the same switch).
- Do not add compatibility aliases, forwarding modules, or flags kept "just
  in case". Delete dead code after checking that nothing reaches it.

## React and the browser

- Every effect that starts something stops it: timers, intervals, animation
  frames, event listeners, event sources, media loads.
- An effect that loads media or data ignores results that arrive after a
  newer request or after unmount (a `cancelled` flag set in the cleanup).
  Never use a fixed `setTimeout` to wait for something to load.
- Do not call `setState` of one component inside another state updater;
  updaters may run twice.
- Browser storage keys and channel names include the presentation id
  (`PRESENTATION_ID`): every presentation of the live gateway shares one
  origin.
- Layouts are designed for the 1280×720 stage. No viewport media queries in
  layout CSS.

## Editing discipline

1. Read the owning implementation document.
2. Capture the affected presentations before a change that renders
   differently.
3. Move callers directly; do not leave forwarding modules.
4. Run `npm run check` and `npm test`.
5. Capture again and review the changed frames.
6. Update durable documentation and remove stale text.

## Review checklist

- Can a new contributor find this functionality from the tree alone?
- Is this the only implementation of the behavior?
- Does the file name its actual concern?
- Is every additional directory layer justified?
- Does every effect clean up, and does every load ignore stale results?
- Do storage keys and channels include the presentation id?
- Did the change delete the old path and update every caller and document?
