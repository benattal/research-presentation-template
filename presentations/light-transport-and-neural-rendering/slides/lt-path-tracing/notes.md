Path tracing is a random-walk (Monte Carlo) estimate of the sum over bounces, run on the room's operator $A = SG$.

Each path starts at the camera, through one pixel. At every surface the path adds the emission there, then either stops (with probability one minus the albedo: Russian roulette) or continues for one bounce: an incoming direction is sampled from the BRDF and cosine, which is $S$, and a ray is traced to the first surface in that direction, which is $G$. A path that reaches the lamp after $k$ bounces contributes a sample of the $k$-th term of $x = e + Ae + A^2 e + \cdots$. The average over paths is an unbiased estimate of $x$, and $A$ is never stored.

- **1 path per pixel.** Most paths (faint lines) never reach the lamp and contribute no light; the few that do are drawn in the color of their light (white from the lamp, orange after the red wall, green after the green wall). The image is mostly black with a few bright pixels.
- **16, 256, 4,096 paths per pixel.** The estimate (dots) converges to the exact image (line): the camera's image of the solution of $x = e + Ax$.

The check is the relative error against that exact image: 196 %, 74 %, 18 %, 4 %. Each step has 16 times more paths and about a 4 times smaller error: the error of a Monte Carlo average falls as $1/\sqrt{n}$.

The paths here use exactly the rays the operator $G$ was built from, so the estimate converges to the solve itself, not to a slightly different answer.

One sentence: path tracing estimates the Neumann series by averaging random walks through the scene.

No mouse interaction; the paths are seeded, so every showing is the same.
