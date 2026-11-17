$A = SG$, so its derivative has two terms, $\partial_\theta A = (\partial_\theta S)\, G + S\, (\partial_\theta G)$ (the line at the top): one for materials, one for geometry.

- Material, $\theta$ the red wall's albedo: only $S$ changes, so $(\partial_\theta A)\, x = (\partial_\theta S)\, G\, x$, the light arriving at the wall and reflected by the change of its albedo. It is the source of the last slide, drawn the same way.
- Geometry, $\theta$ the box's position: moving an object changes $G$, which surfaces are visible from each other. Warm is light gained, blue is light lost when the box moves right: the shadow edges move. The render shows the change of the direct light, the largest part of $S\, (\partial_\theta G)\, x$.

The geometry term is where visibility changes; it is the hard part of differentiable rendering.

Next: the derivatives of a pixel with respect to every parameter at once.
