Transition: an appendix slide, for a question about the differential form. Rendering solves $(D - K)L = Q$ for the radiance $L$; applying $D - K$ to $L$ gives back the sources $Q$.

- Step 1: The integral form, $L = D^{-1}Q + D^{-1}KL$, our $x = b + Ax$, evaluated by quadrature or Monte Carlo. The figure is one ray without scattering, from the camera at $t = 0$: three sources, the glowing spots and the shaded bumps, and the radiance $L(t)$ they produce, which near the camera depends on all three.
- Step 2: The differential form, $Q = (D - K)L$; on this ray, $Q = -dL/dt + \sigma_t L$. Applied to $L$ with central differences, it recovers the sources: the black curve $DL$, since $K$ is zero without scattering, on the shaded true ones. Each recovered value depends only on two neighbouring samples of $L$, so the form is local. Without noise, the only error is the finite-difference error.
- Step 3: A little noise in $L$. In the derivative, the noise is divided by the sample spacing, so the recovered sources are much noisier than $L$. Measurements are noisy, so the differential form is rarely used to invert them. A camera also measures $L$ only at its sensor, so NeRF fits the sources through the integral form.

Remember: the integral form needs only integrals; the differential form is local, but needs derivatives of $L$, which amplify noise.

If asked:
- What does NeRF fit, on this ray? $L(0) = \int_0^d T\, Q\, dt$, with the transmittance $T$ from the camera.
- What is the full differential form? $(D - K)L = \omega\cdot\nabla L + \sigma_t L - \sigma_s\int f_p L\,d\omega'$: a derivative along each ray and an integral over directions at each point.
- Why is the integral form global? With the solution operator $(D - K)^{-1} = (I - A)^{-1}D^{-1}$, $L$ at one point depends on sources along whole rays and, through scattering, on every scattering order.
- What does the slider do? It sets the noise in $L$, up to a few percent of its maximum.
