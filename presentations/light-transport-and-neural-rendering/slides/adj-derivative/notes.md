Transition: since $m = \langle q, x \rangle$, the derivative of the pixel is $\langle q, \partial_\theta x \rangle$, so we need the derivative of the light. Here $\theta$ is the albedo of the red wall.

- Step 1: The light $x$ is the solution of $x = e + Ax$, with emission $e$ and one bounce $A$.
- Step 2: Now differentiate both sides with respect to $\theta$. What is $\partial_\theta x$? Take a minute to work it out.
- Step 3: By the product rule, $\partial_\theta x = (\partial_\theta A)\, x + A\, \partial_\theta x$. The emission does not depend on the albedo. The first term is the change of the operator, applied to the light we already have. The second is the change of the light, after one more bounce.
- Step 4: Move $A\, \partial_\theta x$ to the left: $(I - A)\, \partial_\theta x = (\partial_\theta A)\, x$. This is the transport equation again, with a new source: the extra light leaving the red wall when its albedo increases. The render shows that source in amber, the color of derivatives in this section. It is nonzero only on the wall.
- Step 5: Solve: $\partial_\theta x = (I - A)^{-1} (\partial_\theta A)\, x$. The derivative of the light is that source, transported like light. It is nonzero in the whole room, because every surface that receives light from the red wall changes.

Remember: the derivative of the light satisfies the transport equation, with $(\partial_\theta A)\, x$ as its source.

Stop (planned): at step 2, ask the class to differentiate $x = e + Ax$ with respect to $\theta$, and give them a minute. Hints, if needed: $e$ does not depend on the wall's albedo, and $Ax$ is a product. Answer: $\partial_\theta x = (\partial_\theta A)\, x + A\, \partial_\theta x$, on the next click.

If asked:
- What does this cost? Each parameter has its own source $(\partial_\theta A)\, x$, so each derivative of the light takes one more transport solve. The adjoint method, two slides on, removes that cost.
