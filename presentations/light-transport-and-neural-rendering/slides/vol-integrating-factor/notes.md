Transition: $D = \omega\cdot\nabla + \sigma_t$ acts along each ray, so inverting it means solving an ordinary differential equation along each ray.

- Step 1: the ray reaching the camera at $\mathbf{x}$ is $\mathbf{x} - t\omega$, with $t$ the distance from the camera and $\omega$ the direction light travels, toward the camera. Along it $\omega\cdot\nabla = -d/dt$, so $DL = g$ reads $-dL/dt + \sigma_t L = g$. For the transfer equation, $g = KL + Q$.
- Step 2: the integrating factor is the transmittance $T(t) = e^{-\int_0^t \sigma_t\,ds}$, the fraction of light from $t$ that reaches the camera. Because $T' = -\sigma_t T$, the product rule gives $\frac{d}{dt}(TL) = -Tg$.
- Step 3: integrating from $0$ to $d$ gives $L(0)$: the source along the ray, weighted by transmittance, plus the light from behind, $L(d)$, attenuated by $T(d)$.
- Step 4: the first term is $D^{-1}g$, an integral along each ray. The boundary term $T(d)\,L(d)$ stays apart: on the next slide it is the surface light behind the medium, and the transfer equation becomes $L = T(d)\,L(d) + D^{-1}Q + D^{-1}KL$.
- The strip shows $L(t)$, the light travelling toward the camera: the lamp at $t = d$ is bright, and the beam dims across the bump of medium. The square on the left is $L(0)$.
- The plot shows $\sigma_t$ and $T$. $T$ falls fastest where $\sigma_t$ is largest.

The sentence to remember: along a ray, $D^{-1}$ is an integral of the source weighted by transmittance.

Check: $L(0)$ from stepping the ODE (fourth-order Runge–Kutta, 2000 steps, from the lamp to the camera) agrees with the formula (trapezoid rule) to four decimals. In this model $g = 0.35\,\sigma_t$ and $L(d) = 1$.

Mouse: drag the purple handle to move the bump (sideways) and change its height (up and down).
