Transition: rendering solves $(D - K)L = Q$ for $L$. The operator itself maps $L$ to $Q$.

- Integral form: $L = D^{-1}Q + D^{-1}KL$ (no surface behind the medium here), that is $x = b + Ax$. It is evaluated with integrals along rays ($D^{-1}$) and over directions ($K$), by quadrature or Monte Carlo. No derivatives are needed.
- The solution operator $(D - K)^{-1} = (I - A)^{-1}D^{-1}$ is global: $L$ at one point depends on sources along whole rays and, through scattering, on every scattering order.
- Differential form: $Q = (D - K)L = \omega\cdot\nabla L + \sigma_t L - \sigma_s\int f_p L\,d\omega'$. It is local: it needs the derivative of $L$ along each ray and an integral over directions at each point.
- The figure is one ray without scattering, so $Q = -dL/dt + \sigma_t L$ ($t$ runs from the camera).
- Step 1: three sources (the glowing spots) and the radiance $L(t)$ from them, from stepping the ODE. $L$ near the camera depends on all three.
- Step 2: $-d/dt + \sigma_t$ is applied to $L$ with central differences (400 samples), and the sources are recovered (black curve on the shaded true sources). Each recovered value depends on only two neighbouring samples of $L$. Without noise, the error is the finite-difference error.
- Step 3: 0.5% noise in $L$. In the derivative, the noise is divided by the sample spacing, and the recovered sources are noisy: 38% error. This is why the differential form is rarely used to invert measurements in practice: measured radiance is noisy, and noise is amplified by differentiation.
- Step 3 is also the bridge to the next section: a camera measures $L$ only at the sensor, $L(0)$, not along the ray, so there is no $dL/dt$ to take. Neural radiance fields (NeRF) therefore fit the sources through the integral form, $L(0) = \int_0^d T\,Q\,dt$ on this ray.

The sentence to remember: the integral form needs only integrals, evaluated by Monte Carlo; the differential form is local, but needs derivatives of $L$, and noise in measurements is amplified by differentiation.

Check: the relative error $\|DL - Q\|/\|Q\|$ over the samples.

Mouse: the noise slider sets the noise in $L$ from 0 to 3% of its maximum; the line above it updates.
