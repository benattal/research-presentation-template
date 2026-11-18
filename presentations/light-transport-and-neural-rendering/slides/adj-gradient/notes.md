Transition: now every derivative at once. The light $x$ takes one forward solve and the importance $y$ one adjoint solve. Then the derivative of the pixel with respect to any parameter is one inner product, $\partial_\theta m = \langle y, (\partial_\theta A)\, x \rangle$.

- Step 1: the light $x$, from one forward solve.
- Step 2: the importance $y$ of the pixel, from one adjoint solve. The light moves to the side; both are reused for every derivative.
- Step 3: $\theta$ is the red wall's albedo, as on the derivative slides. $(\partial_\theta A)\, x$ is the light the red wall reflects, and in the inner product it is weighted by the importance on the wall. The amber band along the wall shows the derivative: the more opaque, the larger.

Question for the class, at step 3: every surface's albedo is a parameter. Which surface's albedo changes this pixel most, and which least? (Answer on the next click.)

- Step 4: the other surfaces light up one after another, largest derivative first, each by its own inner product with the same $x$ and $y$; only $\partial_\theta A$ changes. The floor is first, and brightest inside the wedge: it is lit by the lamp and it is inside the pixel's wedge, so both the light and the importance are large there. The ceiling and the box follow. The green wall is last: it is lit, but its light reaches the pixel only by way of other surfaces.

Five derivatives took two solves. With finite differences, each derivative takes one more forward solve, with that albedo changed: five here, and millions for a scene with a texture or a network.

The sentence to remember: with many parameters, each derivative is one inner product with the same $x$ and $y$.

Next: the same computation for NeRF's quadrature along one ray.
