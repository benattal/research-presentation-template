$x$ is computed with one forward solve and $y$ with one adjoint solve. The derivative of the pixel with respect to any parameter is then one inner product, $\partial_\theta m = \langle y, (\partial_\theta A)\, x \rangle$.

- Step 1: the light $x$.
- Step 2: the importance $y$ of the pixel; the light moves to the side.
- Step 3: $\theta$ is the red wall's albedo, as on the derivative slides. $(\partial_\theta A)\, x$ is the light the red wall reflects, and the inner product weighs it by the importance there. The amber band on the wall is that derivative.
- Step 4: every surface's albedo is a parameter, and each lights up in turn, largest derivative first. Each band is the same inner product with the same $x$ and $y$; only $\partial_\theta A$ changes. The floor inside the pixel's wedge is brightest: it is lit, and the pixel sees it directly, so its importance is largest. The ceiling, the red wall, and the box follow; the green wall, lit and seen only indirectly, is faintest.

Question for the class, at step 4: how many solves would finite differences need for these derivatives? (One more forward solve per parameter: five here, millions for a scene of textures or a network. The adjoint needs one, whatever the number of parameters.)

The sentence to remember: with many parameters, each derivative is one inner product with the same $x$ and $y$.

Next: the same computation for NeRF's quadrature along one ray.
