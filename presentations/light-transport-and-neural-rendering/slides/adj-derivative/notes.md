Here $\theta$ is the albedo of the red wall.

- Step 1: the light $x$, the solution of $x = e + Ax$.
- Step 2: differentiate both sides with respect to $\theta$. The emission does not depend on $\theta$, so $\partial_\theta x = (\partial_\theta A)\, x + A\, \partial_\theta x$.
- Step 3: move $A\, \partial_\theta x$ to the left: $(I - A)\, \partial_\theta x = (\partial_\theta A)\, x$. This is the light transport equation again, with a new source, $(\partial_\theta A)\, x$: the extra light leaving the red wall when its albedo increases. It is nonzero only on the wall (the render).
- Step 4: solve: $\partial_\theta x = (I - A)^{-1} (\partial_\theta A)\, x$. The derivative of the light is transported by the same operator as light, from a source on the wall, and it is nonzero in the whole room.

The sentence to remember: the derivative of the light satisfies the light transport equation, with $(\partial_\theta A)\, x$ as its source.

Next: what $\partial_\theta A$ is for a material and for geometry.
