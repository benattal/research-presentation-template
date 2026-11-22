# Example

The template's example presentation: a tour of the core layouts and
conventions. A project branch deletes it and adds its own presentations.

## Assets

This presentation references no assets, so there is nothing to fetch:

```bash
npm install
npm run dev -- example           # present it locally
```

A presentation with media keeps them (`public/`) and its source material
(`assets/`) out of git, in the asset store described in
[DATA.md](../../DATA.md), under `presentations/<id>/`, and its README says
which store that is and who gives access to it. For this one the commands
are the same and find nothing to copy:

```bash
npm run assets -- pull example   # needs rclone and access to the store (DATA.md, "Setup")
npm run check -- example         # lists any asset still missing
npm run assets -- push example   # copies only; never deletes anything in the store
```
