Since $m = \langle q, x \rangle = \langle y, e \rangle$, the importance on a surface is $y = \partial m / \partial e$: the change of the pixel per unit of light added leaving that surface.

- Step 1: the importance of the pixel. Bright cyan marks the surfaces where added light changes the pixel most.
- Step 2: add light $\delta e$ at one surface (click any surface). The forward solve gives $\delta x = (I - A)^{-1} \delta e$, and the pixel changes by $\langle q, \delta x \rangle$. The adjoint gives the same number as $\langle y, \delta e \rangle$, without a forward solve.

With a loss $\ell(m)$ instead of a pixel, the source of the adjoint is $(\partial \ell / \partial m)\, q$, and $y$ is the derivative of the loss with respect to light leaving each surface in each direction. The next slide uses this: a parameter changes the light leaving a surface by $(\partial_\theta A)\, x$, and $y$ gives the resulting change of the loss.
