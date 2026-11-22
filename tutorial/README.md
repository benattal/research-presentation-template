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

It lives here, outside `presentations/`, so it is on every branch and no
project has to delete it. The other commands take it by its folder:

```bash
npm run check -- ./tutorial
npm run capture -- ./tutorial
npm run build -- ./tutorial      # then: npm run preview -- ./tutorial
```

## Assets

It has no media of its own and needs no asset store. The one picture is the
one you add in its "Add a picture" task, in `tutorial/public/`, which git
ignores. A project's presentation fetches its media with
`npm run assets -- pull <id>` ([DATA.md](../DATA.md)).

## Starting over

```bash
git restore tutorial          # your edits
git clean -fdx tutorial        # the slide and the picture you added
```
