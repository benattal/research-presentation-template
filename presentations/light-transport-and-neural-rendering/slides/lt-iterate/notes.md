One bounce of light at a time: $A^k e$ is the light that has bounced exactly $k$ times.

- $e$, light leaving the lamp. The room shows it crossing to the walls, the floor, and the box, with hard shadows; none of it has scattered yet.
- $Ae$, after one bounce: the light leaving the surfaces the lamp lights. Light from the lamp reaches a camera from a surface only after this one scattering, so the "direct illumination" image of the opening slide is $Ae$ (plus the lamp itself, $e$).
- $A^2 e$: the first indirect bounce, colored by the walls.
- $A^3 e$, $A^4 e$: each bounce has about two thirds of the light of the one before, because every albedo is below one.

The line under the room is the rendering equation's integral applied to the previous bounce: the light after $k + 1$ bounces leaving $\mathbf{x}$ is the light after $k$ bounces leaving the surfaces $\mathbf{x}$ sees, weighted by the BRDF and the cosine. There is no $L_e$ term: emission enters only once, in $e$.

The line under the bounces is why they shrink: every albedo is below one, so $\rho(A) < 1$. By flux, each of the first bounces has about 0.64 of the light of the one before; after many bounces the ratio tends to the spectral radius, $\rho(A) = 0.69$, as on the spectral-view slide: successive terms shrink by the largest eigenvalue. Here it belongs to the red channel, where the white surfaces and the red wall reflect the most.

All frames use the same exposure, so the dimming is real.
