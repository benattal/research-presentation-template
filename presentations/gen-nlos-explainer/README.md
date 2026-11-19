# Generative View Synthesis from Propagating Light

A narrated explainer of 4 to 5 minutes for the supplemental material of the
anonymous CVPR submission of the same name, recorded from this deck. Each
build step's notes are its narration. The deck and the video must stay
anonymous. The plan is [docs/plans/gen-nlos-explainer.md](../../docs/plans/gen-nlos-explainer.md).

## Assets: pull them before presenting

The slides' media (`public/`) and source material (`assets/`: narration,
the recorded video, source clips) are not in git. Their durable copy is the
R2 bucket `presentations` (not the `tcig-projects` bucket of DATA.md),
folder `presentations/gen-nlos-explainer/`. The asset commands reach it
with `ASSETS_REMOTE=tcig:`.

On a fresh checkout:

```bash
npm install
ASSETS_REMOTE=tcig: npm run assets -- pull gen-nlos-explainer   # needs rclone and the `tcig` remote (DATA.md, "Setup")
npm run check -- gen-nlos-explainer                              # lists any asset still missing
npm run dev -- gen-nlos-explainer                                # present it locally
```

After adding or changing media, push them (this copies only; it never
deletes anything in the bucket):

```bash
ASSETS_REMOTE=tcig: npm run assets -- push gen-nlos-explainer
```
