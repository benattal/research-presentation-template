Transition: the answer to the last question. With no scattering, $\sigma_s = 0$, the in-scattering $K$ is zero, so $A = 0$ and $x = b$: emission and absorption along the ray, and nothing that depends on $L$. This is the model of neural radiance fields (NeRF), in the next section.

- The names on the right are NeRF's: one coefficient, the density $\sigma = \sigma_t = \sigma_a$; the emitted color $c = L_e$; and the pixel color $C = L(0)$, with a black background, $L(d) = 0$. Then $b = D^{-1}Q$ reads $C = \int_0^d T\sigma c\,dt$.
- The panel is a 2D glowing cloud. The camera on the left is a column of 16 pixels; each pixel is one horizontal ray.
- Step 1: the density $\sigma(t)$ along the highlighted ray: a wisp in front, then the core.
- Step 2: the transmittance $T(t)$ falls across the wisp, then across the core.
- Step 3: $T\sigma c$, the light from each point that reaches the camera. Its area is colored by $c(t)$, and its integral is the pixel (outlined on the left). The panel now shows $T\sigma c$ at every point: the back of the cloud is dimmer, because its light is absorbed in front.

The sentence to remember: a pixel is the light emitted along its ray, each point weighted by the transmittance in front of it.

The question it invites: what do the weights $T\sigma$ add up to? Since $T\sigma = -dT/dt$, $\int_0^d T\sigma\,dt = 1 - T(d)$, the opacity of the ray. Divided by the opacity, $T\sigma$ is a probability density over depth: where along the ray the pixel's light comes from. The sampling slide uses this.

Looking ahead: in NeRF, $c$ is fit to photographs of a real scene, so it includes every bounce of the real light, not only emission. The neural rendering section comes back to this.

Next: computing the integral from samples.

Source: Max, IEEE TVCG 1995.

Mouse: drag up and down on the figure to pick another pixel's ray.
