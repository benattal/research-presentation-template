Path tracing is a random-walk (Monte Carlo) estimate of the sum over bounces, run on the room's operator $A = SG$.

The equation is the one-sample estimate of the rendering equation (CMU 15-468, p. 31): replace the integral over directions by one direction $\omega_i$, sampled with probability density $p(\omega_i)$, and divide by that density. The estimate is unbiased. The $L$ on the right is the same unknown at the hit point $r(\mathbf{x}, \omega_i)$, so it is estimated the same way, with one direction there: a path.

Why one direction per bounce: with several directions at every hit point, the number of rays increases exponentially with the depth, and the deep bounces, which contribute least, get the most samples (15-468, pp. 36–37). One direction per bounce and many paths per pixel keeps the cost per bounce constant.

Each path starts at the camera, through one pixel. At every surface the emission there is added to the path's value; then the path either stops (with probability one minus the albedo: Russian roulette) or continues for one bounce: an incoming direction is sampled from the BRDF and cosine, which is $S$, and a ray is traced to the first surface in that direction, which is $G$. A path that reaches the lamp after $k$ bounces is a sample of the $k$-th term of $x = e + Ae + A^2 e + \cdots$. The average over paths is an unbiased estimate of $x$, and $A$ is never stored.

A pixel is $\langle q, x \rangle = \sum_k \langle q, A^k e \rangle$. A walk from the camera evaluates the same terms in the other order, starting from $q$ instead of $e$; the adjoint section returns to this.

- **1 path per pixel.** Most paths (faint lines) never reach the lamp and contribute no light; the few that do are drawn in the color of their light (white from the lamp, orange after the red wall, green after the green wall). The image is mostly black with a few bright pixels.
- **16, 256, 4,096 paths per pixel.** The estimate (dots) converges to the exact image (line): the camera's image of the solution of $x = e + Ax$.

The check is the relative error against that exact image: 196 %, 74 %, 18 %, 4 %. Each step has 16 times more paths and about a 4 times smaller error: the error of a Monte Carlo average falls as $1/\sqrt{n}$.

The paths here are traced along exactly the rays the operator $G$ was built from, so the estimate converges to the solve itself, not to a slightly different answer.

One sentence: path tracing estimates the Neumann series by averaging random walks through the scene.

No mouse interaction; the paths are seeded, so every showing is the same.
