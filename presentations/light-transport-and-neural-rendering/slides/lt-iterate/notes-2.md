$A^2 e$, after two bounces: the first indirect light, colored by the walls (red near the red wall, green near the green one), dimmer than $Ae$.

The line under the bounces states why they shrink: every albedo is below one, so $\rho(A) < 1$, and the Neumann series converges.

Question to the class: why does an albedo below one imply a spectral radius below one? Hint: on the Neumann series slide, any norm with $\|A\| < 1$ was enough, since $\rho(A) \le \|A\|$. Give them a moment.

Answer: measure light by its flux, the total power leaving all the surfaces. Under propagation $G$, the light leaving one surface arrives at another, and none of it is lost (the room is closed; light that escaped would only lower the flux). Under scattering $S$, each surface reflects the fraction albedo of the light arriving there. So for any light $x$, the flux of $Ax$ is at most the largest albedo times the flux of $x$. The flux of $|x|$ is a norm; in it, $\|A\|$ is at most the largest albedo, which is below one, so $\rho(A) \le \|A\| < 1$. Here each bounce has about two thirds of the flux of the one before, and after many bounces the ratio tends to $\rho(A) \approx 0.69$.

If asked why not exactly the albedo: the walls, floor, and box have different albedos, and the light of each bounce is spread over them in different proportions; the ratio settles to $\rho(A)$, the largest eigenvalue, as on the spectral-view slide.
