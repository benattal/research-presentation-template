Transition: the derivative of the pixel is $\partial_\theta m = \langle q, \partial_\theta x \rangle$, so we need the derivative of the light, $\partial_\theta x$. Here the parameter $\theta$ is the albedo of the red wall.

- Step 1: the light $x$, the solution of $x = e + Ax$, with emission $e$ and one bounce $A$.
- Step 2, a question for the class: differentiate both sides with respect to $\theta$. What is $\partial_\theta x$? Give them a moment. Hints, if needed: the emission does not depend on the wall's albedo, and $Ax$ is a product in which both factors depend on $\theta$.
- Step 3, the answer: $\partial_\theta x = (\partial_\theta A)\, x + A\, \partial_\theta x$, by the product rule. The first term is the change of the operator, applied to the light we already have. The second is the change of the light, carried one more bounce.
- Step 4: move $A\, \partial_\theta x$ to the left: $(I - A)\, \partial_\theta x = (\partial_\theta A)\, x$. This is the light transport equation again, with a new source, $(\partial_\theta A)\, x$: the extra light leaving the red wall when its albedo increases. The render shows that source. It is nonzero only on the wall.
- Step 5: solve: $\partial_\theta x = (I - A)^{-1} (\partial_\theta A)\, x$. The derivative of the light is that source, transported by the same operator as light. It is nonzero in the whole room, because every surface that receives light from the red wall changes.

The sentence to remember: the derivative of the light satisfies the light transport equation, with $(\partial_\theta A)\, x$ as its source.

The question it invites: what does this cost? Each parameter has its own source $(\partial_\theta A)\, x$, so each derivative of the light takes one more light transport solve. The adjoint method, two slides from now, removes that cost.

Next: what $\partial_\theta A$ is for a material and for geometry.
