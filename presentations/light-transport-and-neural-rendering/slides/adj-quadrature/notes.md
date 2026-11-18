Transition: the same idea for NeRF, on one ray. The cloud and the ray are those of the quadrature slide of the volume section, and the parameters are the densities of the samples.

The symbols, as on the quadrature slide (the two lines under the equations): sample $i$ has density $\sigma_i$, color $c_i$, and interval length $\delta_i$. Its opacity is $\alpha_i = 1 - e^{-\sigma_i \delta_i}$, and its transmittance $T_i$ is the fraction of light that passes the samples in front of it.

- Step 1, the forward march: the samples are composited front to back, $\hat C = \sum_i T_i \alpha_i c_i$. The bars are the terms $T_i \alpha_i c_i$, each in its sample's color; their sum is the pixel, the square on the left.

Question for the class, at step 1: if the density of one sample in front of the bright surface increases, does the pixel get brighter or darker? And for a sample at the surface? (Darker in front: the sample hides more of the bright surface behind it. Brighter at the surface: the sample's own bright color gets more weight. The next step shows both.)

- Step 2, differentiate with respect to one density $\sigma_i$. Two things change. Sample $i$ becomes more opaque, so its own color gets more weight: $\delta_i T_{i+1} c_i$. And every sample behind it is dimmed: each $T_k$ with $k > i$ loses the fraction $\delta_i$, which removes $\delta_i$ times the color behind sample $i$, $\hat C - \hat C_{\le i} = \sum_{k > i} T_k \alpha_k c_k$. The blue bars are $\partial \hat C / \partial \sigma_i$ (luminance): negative in front of the bright surface and positive just at it. The bars in front are equal: with equal spacing $\delta$, consecutive bars differ by $\delta\, T_{i+1} (c_{i+1} - c_i)$, which is zero where the color does not change.
- Step 3, the second march: the color behind sample $i$ is the final color minus the running sum, $\hat C - \hat C_{\le i}$. In a second march from the front, $\hat C_{\le i}$ is accumulated and each sample's gradient is computed on the way. Nothing is stored per sample, so memory does not grow with the number of samples. The black staircase is the color behind each sample, drawn as the march passes. For a loss, each gradient is multiplied by $\partial \ell / \partial \hat C$, the loss gradient for the pixel.

This is the adjoint method on one ray. Written as $\partial \hat C / \partial \sigma_i = \delta_i\, T_{i+1} (c_i - L_{i+1})$, with $L_{i+1} = (\hat C - \hat C_{\le i}) / T_{i+1}$ the light arriving at sample $i$ from behind, the transmittance $T_{i+1}$ from there to the camera has the role of the importance $y$, and $c_i - L_{i+1}$ the role of $(\partial_\theta A)\, x$: with a larger $\sigma_i$, more of $c_i$ is emitted there and more of $L_{i+1}$ is absorbed.

The sentence to remember: the backward pass needs only the final color and a second march, not a record of the forward pass.

The question it invites: is the formula right? The deck's volume tests check it against central finite differences of $\hat C$ for every sample. By hand, for one sample, $\hat C = (1 - e^{-\sigma\delta})\, c$, and the formula gives $\delta e^{-\sigma\delta} c$, its derivative.

Next: the same for a whole renderer.
