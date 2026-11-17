We compute $x$ with one forward solve and $y$ with one adjoint solve. The derivative with respect to any parameter is $\partial_\theta m = \langle y, (\partial_\theta A)\, x \rangle$.

- Step 1: the light $x$.
- Step 2: the importance $y$ of the pixel.
- Step 3: for each surface, the derivative of the pixel with respect to that surface's albedo, $\langle y, (\partial_\rho A)\, x \rangle$, shown as the brightness of the surface. The numbers compare the adjoint value for the red wall with a finite difference.

With many parameters, each derivative is one dot product with the same $x$ and $y$.
