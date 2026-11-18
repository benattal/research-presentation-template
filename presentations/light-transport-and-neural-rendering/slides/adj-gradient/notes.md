$x$ is computed with one forward solve and $y$ with one adjoint solve. The derivative with respect to any parameter is then $\partial_\theta m = \langle y, (\partial_\theta A)\, x \rangle$.

- Step 1: the light $x$.
- Step 2: the importance $y$ of the pixel, beside it.
- Step 3: for each surface, the derivative of the pixel with respect to that surface's albedo, $\langle y, (\partial_\theta A)\, x \rangle$: the bars under the light. It is large where a surface is both lit (large $x$) and important (large $y$): the floor in the pixel's wedge most, the green wall, far from the pixel, least. Under the importance, the red wall's value from the adjoint is checked against a finite difference (0.86906 against 0.86909).

With many parameters, each derivative is one inner product with the same $x$ and $y$.

In the check, $\theta$ scales the albedo, $\rho \to (1 + \theta)\rho$, so the numbers are $\rho\, \partial m / \partial \rho$; the finite difference uses $\theta = 10^{-4}$.

Next: the same computation for NeRF's quadrature along one ray.
