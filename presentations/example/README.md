# Example Presentation

The template's example: it demonstrates the presentation format and is the
target of the template's own checks and captures. A project branch deletes
it and adds its own presentations.

## Assets: pull them before presenting

The slides' media (`public/`) and source material (`assets/`) are not in
git. Their durable copy is the R2 bucket described in [DATA.md](../../DATA.md),
under `tcig-projects/research-presentation-template/presentations/example/`.

On a fresh checkout:

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
