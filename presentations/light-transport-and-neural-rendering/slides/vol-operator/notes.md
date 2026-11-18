Transition: the rendering equation became $x = e + Ax$ once its operators had names. The transfer equation can be written the same way.

- Step 1: both loss terms move to the left side, as one extinction coefficient $\sigma_t = \sigma_a + \sigma_s$.
- Step 2: $D = \omega\cdot\nabla + \sigma_t$, the derivative along the ray plus extinction. It is local along each ray: $DL$ at a point $\mathbf{x}$ in direction $\omega$ depends only on $L$ at and next to $\mathbf{x}$, on the ray through it (top drawing).
- Step 3: $K L = \sigma_s \int f_p\, L\, d\omega'$, the in-scattering, with the phase function $f_p$ of the last slide. It is an integral over directions at one point: $KL$ at $\mathbf{x}$ depends on the light arriving at $\mathbf{x}$ from every direction, and on nothing at other points (bottom drawing).
- Step 4: with the emission written $Q = \sigma_a L_e$, the equation is $(D - K)L = Q$. Compare $(I - A)x = e$ between surfaces.

Question to the class: of $D$ and $K$, which is easier to invert, and how? Answer: $D$. It acts along one ray at a time, so inverting it means solving an ordinary differential equation along each ray, and that equation has a closed-form solution. That is the next slide.

The sentence to remember: the transfer equation is $(D - K)L = Q$, with $D$ a derivative along each ray and $K$ an integral over directions.
