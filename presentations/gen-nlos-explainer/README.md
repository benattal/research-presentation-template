# Generative View Synthesis from Propagating Light

What this presentation is, for whom, and where it is given.

## Assets: pull them before presenting

The slides' media (`public/`) and source material (`assets/`) are not in
git. Their durable copy is the R2 bucket described in [DATA.md](../../DATA.md),
under `tcig-projects/research-presentation-template/presentations/gen-nlos-explainer/`.

On a fresh checkout:

```bash
npm install
npm run assets -- pull gen-nlos-explainer   # needs rclone and the `tcig` remote (DATA.md, "Setup")
npm run check -- gen-nlos-explainer         # lists any asset still missing
npm run dev -- gen-nlos-explainer           # present it locally
```

After adding or changing media, push them (this copies only; it never
deletes anything in the bucket):

```bash
npm run assets -- push gen-nlos-explainer
```
