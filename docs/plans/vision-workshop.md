# Vision workshop

[Latest status](../tracking/vision-workshop.md) ·
[Hosting](../implementation/hosting.md)

Four interactive workshops on computer vision for high-school students
(image manipulation, image filtering, face and hand tracking, generative AI
and diffusion), served together by the live gateway with a landing
presentation (`home`) at the site root. Done means each workshop runs from
the live deployment with working polls and Colab links, its slides capture
without errors or warnings, and the open content questions below are
settled by the user.

## Immediate todos

Work these in order, one at a time.

### Open

1. **Deployment with assets from the bucket.** Media no longer live in git.
   The Railway build must pull them (`npm run assets -- pull --all`, which
   needs rclone and the bucket credentials in the build environment) or the
   deployment must be built where the assets are. Build command
   `npm run build:live`, start command `npm start`, variable
   `PRESENTER_PASSWORD`. Gate: the deployed site shows every slide's media
   and a poll records a vote.
2. **Content questions found in the audit.** For the user to decide:
   - `filtering`, slide `blur-spatial-demo`: the panel labelled
     "3×3 Averaging" draws a box blur of radius 4 (9×9) in
     `SpatialBlurDemoSlide.jsx`. Relabel it or use radius 1.
   - `filtering`, `blur-poll-spatial-results` and
     `blur-poll-temporal-results`: the results ask "What do you think caused
     the blur in this image?", while their polls asked "Which image is more
     blurry?".
   - `tracking`, `cv-applications`: the source deck orders the card labels
     "Landmark detection", "Virtual character creation", "Personal
     assistants"; the slide shows `personal-assistant.jpeg` captioned
     "Virtual character creation from images". The labels of cards 2 and 3
     look swapped.
   - `filtering`, draft slide `edge-convolution-anim`: the filtered image
     divides by the kernel sum instead of `kernelScale` and clips negative
     responses, so a Sobel kernel renders mostly black. Fix before adding
     the slide to the deck.
3. **Colab links.** From the earlier task list: a read-only ("non edit")
   mode for the Colab notebooks, and slides with empty Colab links filled
   in.
4. **Edge detection slides (filtering).** From the earlier task list:
   - Sobel x and y as the lead into why filtering is useful in computer
     vision;
   - deep neural networks as stacks of filtering operations;
   - edge detection: what else filters do, and why edges are useful (ask
     the students, then examples).
   The draft slides `edge-*` in `presentations/filtering/slides/` are the
   starting point.
5. **Uploading and sharing results.** From the earlier task list: a way for
   students to upload and share what they made.

## Rules

- Slide wording and order are the user's; the content questions above are
  proposals until the user settles them.
- Framework changes land on `main` first (see "Branches and projects" in
  `CLAUDE.md`).
- Capture every workshop after a change that renders
  (`npm run capture -- <id>`).

## Design as deployed

One live gateway serves `home`, `image-manipulation`, `filtering`,
`tracking`, and `diffusion` at `/<id>/`; `home` has `"servedAtRoot": true`
and a `presentationLinks` slide with the site's QR code, and every workshop
has `"backLink": "../"`. Students follow the presenter when
`PRESENTER_CONTROLLED=true`. The notebooks for the hands-on parts are in
`presentations/<id>/notebooks/`; `environment.yml` describes their conda
environment.

## Completion criteria

- The deployed site serves every workshop with its media.
- Every workshop captures with no errors or warnings.
- The content questions are settled.
