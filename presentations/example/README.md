# Example

The template's example presentation: a tour of the core layouts and
conventions. A project branch deletes it and adds its own presentations.

## Assets: pull them before presenting

This presentation references no assets. A presentation that does keeps its
slides' media (`public/`) and source material (`assets/`) out of git, in
the R2 bucket described in [DATA.md](../../DATA.md), under
`tcig-projects/research-presentation-template/presentations/<id>/`. On a
fresh checkout:

```bash
npm install
npm run assets -- pull example   # needs rclone and the `tcig` remote (DATA.md, "Setup")
npm run check -- example         # lists any asset still missing
npm run dev -- example           # present it locally
```

After adding or changing media, push them (this copies only; it never
deletes anything in the bucket):

```bash
npm run assets -- push example
```
