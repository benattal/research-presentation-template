The Neumann series applies $A$ to the whole light field, bounce after bounce: every point, every direction, the full integral each time. Path tracing estimates the same sum without forming $A$, one random direction at a time.

- **Scattering integral.** At $\mathbf{x}$, the point imaged by one camera pixel (the gray ray), the reflected light is the integral over every direction: the rays, weighted by the cosine lobe, as on the rendering equation slide.
- **One random direction.** Sample one direction $\omega_i$ with probability density $p(\omega_i)$ and divide by that density. A question for the class here (see the notes of this click).
- **Why it is right on average.** The line under it: the expected value of the one-sample estimate is the integral, so the estimate is unbiased. Here $p$ is the cosine lobe itself, so the estimate is the albedo times the light arriving along $\omega_i$.
- **Random walk.** $L_i(\mathbf{x}, \omega_i)$ is the light leaving the surface point $r(\mathbf{x}, \omega_i)$, itself unknown, so it is estimated the same way: one direction sampled there, then at the next surface, until a ray of the walk ends on the lamp. The walk is traced from the camera (gray); its value is the lamp's light times the weights of its scatterings. This walk ends on the lamp after three scatterings (at $\mathbf{x}$, the red wall, and the floor), so its light is a sample of the term $A^3 e$; each ray has the color of its term, $e$ leaving the lamp, then $Ae$, $A^2 e$, and $A^3 e$ toward the camera. A walk that ends on the lamp after $k$ scatterings is a sample of $A^k e$, so the average over walks estimates the whole sum, and $A$ is never stored.
- **Paths per pixel.** Walks from every camera pixel: bright where they ended on the lamp (in the color of their light), faint where they ended without light. With 1 path per pixel the image is mostly black with a few bright pixels; with 64 it is noisy; with 4,096 it matches the exact image, the camera's image of the solution of $x = e + Ax$. The error of a Monte Carlo average falls as $1/\sqrt{n}$: 16 times more paths, 4 times less error.

To remember: path tracing estimates the Neumann series by averaging random walks through the scene.

If asked why one direction per bounce: with several directions at every surface point, the number of rays increases exponentially with the depth, and the deep bounces, which contribute the least light, get the most samples (CMU 15-468, pp. 36–37). One direction per bounce and many paths per pixel keep the cost per bounce constant.

If asked how a walk ends: at every surface it either stops, with probability one minus the albedo (Russian roulette), or continues in a direction sampled from the BRDF and cosine. The walks here are on the room's discrete operator, so their average converges to the solution of the slides before, not to a slightly different answer.

If asked about the order of the terms: a pixel is $\langle q, x \rangle = \sum_k \langle q, A^k e \rangle$. A walk from the camera evaluates the same terms starting from $q$ instead of $e$; the adjoint section returns to this.

End of the section: pause for questions on operator light transport before the aside.

No mouse interaction; the paths are seeded, so every showing is the same.
