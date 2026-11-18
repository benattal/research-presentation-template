Transition: The Neumann series applies $A$ to all of the light at once. Path tracing estimates the same sum one random direction at a time, and never forms $A$.

- Step 1: $\mathbf{x}$ is the point one camera pixel sees, along the dashed ray. Its reflected light is the scattering integral: the incident rays, weighted by the cosine lobe.
- Step 2: Instead, sample one direction $\omega_i$ from a density $p(\omega_i)$, here the cosine lobe, and divide by that density.
- Step 3: On average, the one-sample estimate is the integral.
- Step 4: The light arriving along $\omega_i$ is unknown too, so it is estimated the same way, until a ray reaches the lamp. This walk scatters three times, so it is a sample of $A^3 e$, and each segment is labelled with its term.
- Steps 5 to 7: walks from every pixel, each in the color of the term it samples; the faint ones found no light. One path per pixel is mostly black, 64 is noisy, and 4,096 matches the exact image. The error falls as $1/\sqrt{n}$: 64 times more paths, 8 times less error.

Remember: path tracing averages random walks, and a walk that reaches the light after $k$ scatterings is a sample of $A^k e$.

Stop (planned): at step 2, why divide by $p(\omega_i)$? Answer, shown on step 3: the expected value is $\int \frac{f_r L_i \cos\theta_i}{p(\omega_i)}\, p(\omega_i)\, d\omega_i$, the integral itself. The density cancels, for any $p$ that is positive wherever the integrand is.

Pause for questions: after step 7, on operator light transport, before the aside.

If asked:
- Why only one direction per bounce? With several at every point, the number of rays grows exponentially with depth, and the deep bounces, which carry the least light, get the most samples (CMU 15-468, pp. 36–37).
- How does a walk end? At each surface it stops with probability one minus the albedo, Russian roulette, or continues in a direction sampled from the BRDF and the cosine.
- Which density is best? The variance is smallest when $p$ follows the integrand. With the cosine lobe on this diffuse floor, the estimate is the albedo times the light along $\omega_i$.
- Why are the long walks all one color? Walks of three or more scatterings share the color of $A^3 e$, as the terms after it share the color of the dots.
- Why start the walks at the camera? A pixel needs $x$ only along its own ray, so walks from the camera estimate each term $A^k e$ for that pixel alone. The adjoint section returns to this.
