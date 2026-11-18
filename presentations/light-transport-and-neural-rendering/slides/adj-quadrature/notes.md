Transition: the same computation for NeRF, on one ray: the cloud and the ray of the quadrature slide in the volume section. The parameters are the densities $\sigma_i$ of the samples.

- Step 1: The forward march composites the samples front to back, $\hat C = \sum_i T_i \alpha_i c_i$. The bars are the terms, each in its sample's color, and their sum is the pixel, the square on the left.
- Step 2: Differentiate with respect to one density $\sigma_i$. Sample $i$ becomes more opaque, so its own color gets more weight, $\delta_i T_{i+1} c_i$, and the color behind it, $\hat C - \hat C_{\le i}$, loses the fraction $\delta_i$. The amber bars are $\partial \hat C / \partial \sigma_i$: negative in front of the bright surface, positive at it. This is the adjoint method on one ray: $T_{i+1}$ has the role of importance, and $c_i$ minus the light from behind has the role of $(\partial_\theta A)\, x$.
- Step 3: The color behind each sample, the black staircase, is the final color minus the running sum. A second march from the front accumulates $\hat C_{\le i}$ and computes each sample's gradient on the way, so nothing is stored per sample.

Remember: the backward pass needs only the final color and a second march, not a record of the forward pass.

Stop (optional): at step 1, ask: if the density of a sample in front of the bright surface increases, does the pixel get brighter or darker? And for a sample at the surface? Answer: darker in front, because more of the bright surface's light is absorbed before it reaches the camera; brighter at the surface, because the sample's own bright color gets more weight. Step 2 shows both.

If asked:
- Is the formula right? For one sample, $\hat C = (1 - e^{-\sigma\delta})\, c$, and the formula gives $\delta e^{-\sigma\delta} c$, its derivative.
- Why are the bars in front equal? With equal spacing, consecutive bars differ by $\delta\, T_{i+1} (c_{i+1} - c_i)$, which is zero where the color does not change.
- And for a loss? Each sample's gradient is multiplied by $\partial \ell / \partial \hat C$, the loss gradient of the pixel.
