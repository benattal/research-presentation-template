Transition: a camera measures only $L(0)$, the integral form at the sensor. Without scattering, that integral is the model NeRF fits.

- With $\sigma_s = 0$, the in-scattering $K$ is zero, so $A = 0$ and the solution is the source itself, $x = b$. Nothing depends on $L$ anymore.
- Renaming for NeRF: one coefficient $\sigma = \sigma_t = \sigma_a$, the emitted color $L_e = c$, and the pixel $C = L(0)$, with a black background ($L(d) = 0$). Then $b = D^{-1}Q$ is $C = \int_0^d T\sigma c\,dt$.
- In NeRF, $c$ is fit to photographs of a real scene, so it includes every bounce of the real light: all of the scene's $x$ at that point, not only its emission. We come back to this when we relight.
- The panel is a 2D glowing cloud. The camera on the left is a column of 16 pixels, and each pixel is one horizontal ray.
- Step 1: $\sigma(t)$ along the highlighted ray: a wisp in front, then the core.
- Step 2: $T(t)$ falls as the ray crosses the wisp and then the core.
- Step 3: $T\sigma c$ is the light from each point that reaches the camera; the filled area takes the color $c(t)$, and its integral is the pixel. The panel now shows $T\sigma c$ at every point: the back of the cloud is dimmer, because the front absorbs its light.

The sentence to remember: a pixel is the light emitted along its ray, each point weighted by the transmittance in front of it.

Check: the weights integrate to the opacity, $\int_0^d T\sigma\,dt = 1 - T(d)$, since $T\sigma = -dT/dt$. So $T\sigma$ is the probability density of where the pixel's light comes from.

Source: Max, IEEE TVCG 1995.

Mouse: drag up and down on the figure to pick another pixel's ray.
