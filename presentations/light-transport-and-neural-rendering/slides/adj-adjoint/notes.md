Transition: we have $\partial_\theta x = (I - A)^{-1} (\partial_\theta A)\, x$, and the pixel is the inner product $m = \langle q, x \rangle$.

- Step 1: so $\partial_\theta m = \langle q, (I - A)^{-1} (\partial_\theta A)\, x \rangle$. Read right to left, this is one forward solve per parameter: build the source $(\partial_\theta A)\, x$, transport it with $(I - A)^{-1}$, and take its inner product with $q$. The diagram's upper half: $N$ parameters, $N$ solves (thick arrows). With a million parameters (a texture, a density grid), that is a million light transport solves.
- Step 2: the adjoint $A^\top$ is the operator with $\langle y, Az \rangle = \langle A^\top y, z \rangle$ for all $y$ and $z$. Applied to $(I - A)^{-1}$, whose adjoint is $(I - A^\top)^{-1}$, it moves the solve from the source side to the pixel side. The vector $(I - A^\top)^{-1} q$ does not depend on $\theta$.
- Step 3: call it $y = (I - A^\top)^{-1} q$: one solve with the adjoint operator, with the pixel's $q$ as the source. The diagram's lower half: one solve, in blue.
- Step 4: then every derivative is an inner product, $\partial_\theta m = \langle y, (\partial_\theta A)\, x \rangle$: the thin arrows, one per parameter, each cheap.

The sentence to remember: one adjoint solve per measurement instead of one forward solve per parameter.

The same identity with $\theta$ removed gives the measurement both ways: $m = \langle q, x \rangle = \langle y, e \rangle$.

This is the same associativity that makes backpropagation cheap: for many inputs and one output, multiply from the output side.

Next: what $y$ is physically, and how to compute it by bounces.
