# The tutorial

A deck that teaches the template by having you change it. Each task slide
names a file and an edit; when you save, the page reloads and the slide
marks its task done. Each task also shows what to say to a coding agent
that makes the edit for you. About twenty minutes, with an editor beside
the browser.

```bash
npm install
npm run tutorial          # then open the address it prints
```

It is on every branch: a project branch keeps it. The other commands take
it by its id, like any presentation:

```bash
npm run check -- tutorial
npm run capture -- tutorial
npm run build -- tutorial        # then: npm run preview -- tutorial
```

[The second tutorial](../tutorial-agents/README.md) follows it: the same
kind of deck, completed by asking a coding agent.

## Assets

It has no media of its own and needs no asset store. The one picture is
the one you add in its "Add a picture" task, in its `public/` folder,
which git ignores. A deck with media fetches them from the store
([DATA.md](../../DATA.md)); for this one, `npm run assets -- pull tutorial`
has nothing to fetch.

## Starting over

```bash
git restore presentations/tutorial        # your edits
git clean -fdx presentations/tutorial     # the slide and the picture you added
```
