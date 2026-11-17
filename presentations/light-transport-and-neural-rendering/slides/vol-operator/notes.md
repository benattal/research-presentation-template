Transition: the transfer equation has the same structure as the rendering equation. Grouping its terms into operators makes that visible.

- Step 1: both loss terms move to the left, with the extinction $\sigma_t = \sigma_a + \sigma_s$.
- Step 2: $D = \omega\cdot\nabla + \sigma_t$ collects streaming and extinction. It is a differential operator, and it is local along each ray: $(DL)(\mathbf{x}, \omega)$ depends on $L$ only at and next to $\mathbf{x}$, on the ray through $\mathbf{x}$ in direction $\omega$ (top drawing).
- Step 3: $K L = \sigma_s \int f_p\, L\, d\omega'$ is in-scattering. It is an integral over directions, local in space: $(KL)(\mathbf{x}, \omega)$ depends on the light arriving at $\mathbf{x}$ from every direction, and on nothing at other points (bottom drawing).
- Step 4: with the emission $Q = \sigma_a L_e$, the equation is $(D - K)L = Q$.
- Next slides: inverting $D$ along each ray gives the integral form $L = D^{-1}Q + D^{-1}KL$, which is $x = b + Ax$ with $A = D^{-1}K$ and $b = D^{-1}Q + T(d)\,L(d)$ (the surface light behind the medium), so $(I - A)x = b$.

The sentence to remember: the transfer equation is $(D - K)L = Q$, with $D$ a derivative along each ray and $K$ an integral over directions.
