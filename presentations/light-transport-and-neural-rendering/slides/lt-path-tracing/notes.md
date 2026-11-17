Path tracing is the random-walk estimator of section 1, run on the room's operator $A = SG$.

Each path starts at the camera, through one pixel. At every surface it collects the emission there, then either stops (with probability one minus the albedo: Russian roulette) or takes one bounce: it picks an incoming direction by the BRDF and cosine, which is $S$, and traces a ray to the surface that direction sees, which is $G$. A path that reaches the lamp after $k$ bounces adds a sample of the $k$-th term of $x = e + Ae + A^2 e + \cdots$. The average over paths is an unbiased estimate of $x$, without ever storing $A$.

- **1 path per pixel.** Most paths (faint lines) never find the lamp and carry no light; the few that do are drawn in the color of the light they carry (white from the lamp, orange after the red wall, green after the green wall). The image is mostly black with a few bright pixels.
- **16, 256, 4096 paths per pixel.** The estimate (dots) settles onto the exact image (line), the solve of $x = e + Ax$ read by the camera.

The check is the relative error against that exact image: 196 %, 74 %, 18 %, 4 %. Each step has 16 times more paths and about a 4 times smaller error: the $1/\sqrt{n}$ of section 1.

The paths here take exactly the rays the operator $G$ was built from, so the estimate converges to the solve itself, not to a slightly different answer.

One sentence: path tracing estimates the Neumann series by averaging random walks through the scene.

No mouse interaction; the paths are seeded, so every showing is the same.
