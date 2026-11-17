Since $m = \langle q, x \rangle = \langle y, e \rangle$, the importance on a surface is $y = \partial m / \partial e$: the change of the pixel per unit of light added leaving that surface.

- Step 1: the importance of the pixel. Bright cyan: the surfaces where added light changes the pixel most.
- Step 2: add light $\delta e$ at one surface (click any surface to move it). The render is the light it adds everywhere, $\delta x = (I - A)^{-1} \delta e$, and the pixel changes by $\langle q, \delta x \rangle$. With the adjoint, the same number is $\langle y, \delta e \rangle$, without a forward solve; the two numbers on the right agree.

With a loss $\ell(m)$ instead of a pixel, the source of the adjoint is $(\partial \ell / \partial m)\, q$, and $y$ is the derivative of the loss with respect to the light leaving each surface in each direction. This is used on the next slide: when a parameter changes, the light leaving a surface changes by $(\partial_\theta A)\, x$, and the resulting change of the loss is $\langle y, (\partial_\theta A)\, x \rangle$.
