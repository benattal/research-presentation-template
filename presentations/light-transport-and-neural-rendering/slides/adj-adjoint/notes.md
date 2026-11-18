Transition: we have $\partial_\theta x = (I - A)^{-1} (\partial_\theta A)\, x$, and the pixel is the inner product $m = \langle q, x \rangle$.

- Step 1: so $\partial_\theta m = \langle q, (I - A)^{-1} z \rangle$, with $z = (\partial_\theta A)\, x$. Evaluated from the right, this is forward mode (the automatic-differentiation name for propagating derivatives from the inputs to the output): build the source $z$, transport it with $(I - A)^{-1}$, and take its inner product with $q$. That is one light transport solve per parameter. The diagram's upper half: $N$ parameters, $N$ solves (thick arrows). With a million parameters (a texture, a density grid), that is a million solves.
- Step 2: the first line is the key step. The adjoint $A^\top$ is the operator with $\langle u, Az \rangle = \langle A^\top u, z \rangle$ for all $u$ and $z$, so $A$ can be moved to the other side of the inner product as $A^\top$. Then expand the inverse as its Neumann series, $(I - A)^{-1} = \sum_k A^k$. Applied $k$ times, $\langle q, A^k z \rangle = \langle (A^\top)^k q, z \rangle$. Summed over $k$, the series is on the other side of the inner product, where it is the Neumann series of $A^\top$: $\sum_k (A^\top)^k q = (I - A^\top)^{-1} q$. With it, the solve is on the pixel side instead of the source side, and the vector $(I - A^\top)^{-1} q$ does not depend on $\theta$.
- Step 3: call it $y = (I - A^\top)^{-1} q$: one solve with the adjoint operator, with the pixel's $q$ as the source. The diagram's lower half: one solve, in blue.
- Step 4: then every derivative is an inner product, $\partial_\theta m = \langle y, (\partial_\theta A)\, x \rangle$: the thin arrows, one per parameter, each cheap.

The sentence to remember: one adjoint solve per measurement instead of one forward solve per parameter.

With $z = e$, the same identity is the measurement computed both ways: $m = \langle q, x \rangle = \langle y, e \rangle$.

Backpropagation is cheap for the same reason, associativity: with many inputs and one output, the product is evaluated from the output side.

Next: what $y$ is physically, and how it is computed bounce by bounce, with the Neumann series $y = q + A^\top q + (A^\top)^2 q + \cdots$.
