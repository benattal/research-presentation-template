Transition: $D$ acts along each ray, so inverting it means solving an ordinary differential equation along each ray. The tool is the integrating factor, from a first course on differential equations.

The ray that reaches the camera at $\mathbf{x}$ is $\mathbf{x} - t\omega$, with $t$ the distance from the camera and $\omega$ the direction the light travels, toward the camera. Along it, $\omega\cdot\nabla = -d/dt$.

- Step 1: along this ray, $DL = KL + Q$ reads $-dL/dt + \sigma_t L = KL + Q$, with the in-scattered light and the emission on the right, as the braces say.
- Step 2: multiply by the transmittance $T(t) = e^{-\int_0^t \sigma_t\,ds}$, the fraction of the light from distance $t$ that reaches the camera. On the transfer equation slide it was $e^{-(\sigma_a + \sigma_s)\, d}$ for a uniform slab; here $\sigma_t$ can vary along the ray. Since $T' = -\sigma_t T$, the product rule makes the left side one derivative: $\frac{d}{dt}(TL) = -T\,(KL + Q)$.
- Step 3: integrate from the camera, $t = 0$, where $T = 1$, to the far end, $t = d$. The light at the camera, $L(0)$, is the source along the ray weighted by transmittance, plus the light from behind, $L(d)$, attenuated by $T(d)$.
- Step 4: the integral is $D^{-1}$ applied to the source. Inverting $D$ is an integral along each ray, with no derivative of $L$ left.

The figure: the strip is $L(t)$, the light travelling toward the camera from a lamp at $t = d$, dimming across the bump of medium; the square on the left is $L(0)$. The plot shows $\sigma_t$ (purple) and $T$ (black). $T$ falls fastest where $\sigma_t$ is largest.

The sentence to remember: along a ray, $D^{-1}$ is an integral of the source, weighted by transmittance.

Background: the strip is computed by stepping the differential equation from the lamp to the camera, and its $L(0)$ agrees with the formula of step 3 (the deck's tests check this). In this figure the source $KL + Q$ is proportional to $\sigma_t$.

Next: with $D^{-1}$ known, the transfer equation becomes a fixed-point equation.

Mouse: drag the purple handle to move the bump (sideways) and change its height (up and down).
