Since $m = \langle q, x \rangle = \langle y, e \rangle$, the importance on a surface is $y = \partial m / \partial e$: the change of the pixel per unit of light added leaving that surface.

- Step 1: the importance of the pixel. Bright cyan: the surfaces where added light changes the pixel most.
- Step 2: add light $\delta e$ at one surface (click any surface to move it). The render is the light it adds everywhere, $\delta x = (I - A)^{-1} \delta e$, and the pixel changes by $\langle q, \delta x \rangle$: one forward solve per surface tried. With the adjoint, the same change is $\langle y, \delta e \rangle$: the importance at that surface, read off the picture of step 1, with no new solve.

Question for the class, at step 2: click a surface the pixel cannot see. Does the pixel still change? (Yes: light from it reaches surfaces the pixel sees, so its importance is not zero. Try the green wall behind the box.)

With a loss $\ell(m)$ instead of a pixel, the source of the adjoint is $(\partial \ell / \partial m)\, q$, and $y$ is the derivative of the loss with respect to the light leaving each surface in each direction. The next slide uses it: when a parameter changes, the light leaving a surface changes by $(\partial_\theta A)\, x$, and the change of the loss is $\langle y, (\partial_\theta A)\, x \rangle$.
