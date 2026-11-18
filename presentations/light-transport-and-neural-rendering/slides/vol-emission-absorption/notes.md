Transition: The answer to the last question: with no scattering, $x = b$. This is the model of neural radiance fields, NeRF.

- Step 1: The names on the right are NeRF's: a density $\sigma$, an emitted color $c$, and the pixel color $C$. Each pixel on the left is one horizontal ray, and the plot is the density along the highlighted one: a wisp, then the core.
- Step 2: The transmittance $T$ falls across the wisp, then across the core.
- Step 3: $T\sigma c$ is the light from each point that reaches the camera, and its area is the pixel. The back of the cloud is dimmer, because its light is absorbed in front.

Remember: a pixel is the light emitted along its ray, each point weighted by the transmittance in front of it.

If asked:
- What do the weights $T\sigma$ add up to? Since $T\sigma = -dT/dt$, they integrate to $1 - T(d)$, the opacity of the ray. Divided by it, $T\sigma$ is a probability density over depth, which the sampling slide uses.
- Does NeRF's color include scattering? Yes. $c$ is fit to photographs, so it includes every bounce of the real light. The neural rendering section comes back to this.
- What about the background? It is black here, $L(d) = 0$.
- Other pixels? Drag up and down on the figure.
- Source? Max, IEEE TVCG 1995.
