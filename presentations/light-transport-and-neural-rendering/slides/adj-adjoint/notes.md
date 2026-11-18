Transition: two slides ago, the derivative of the light was $\partial_\theta x = (I - A)^{-1} (\partial_\theta A)\, x$, and the pixel is the inner product $m = \langle q, x \rangle$ of its sensor $q$ with the light $x$.

- Step 1: so $\partial_\theta m = \langle q, (I - A)^{-1} z \rangle$, with $z = (\partial_\theta A)\, x$ the source for parameter $\theta$. Evaluated from the right: build the source $z$, solve the transport equation for it, and take the inner product with $q$. That is one light transport solve per parameter; automatic differentiation calls this order forward mode. The diagram: $N$ parameters, $N$ solves, one thick arrow each. With a million parameters (a texture, a density grid, a network), a million solves.

Question for the class, at step 1: the solves differ only in their source $z$. The operator $(I - A)^{-1}$ and the sensor $q$ are the same for every parameter. Can you rearrange $\langle q, (I - A)^{-1} z \rangle$ so that one solve serves every $\theta$? Hint, if needed: how does a matrix move from one side of an inner product to the other? The next step is the answer.

- Step 2: move the operator to the other side. The adjoint $A^\top$ is defined by $\langle u, Az \rangle = \langle A^\top u, z \rangle$ for all $u$ and $z$; for a matrix, it is the transpose. Expand the inverse as the Neumann series, $(I - A)^{-1} = \sum_k A^k$. Moving $A$ across $k$ times gives $\langle q, A^k z \rangle = \langle (A^\top)^k q, z \rangle$, and the sum over $k$ on the left side of the inner product is the Neumann series of $A^\top$: $\sum_k (A^\top)^k q = (I - A^\top)^{-1} q$. The solve now acts on $q$, which does not depend on $\theta$.
- Step 3: call that vector $y = (I - A^\top)^{-1} q$, the importance of the pixel. It takes one solve with the adjoint operator, with the sensor $q$ as its source: the blue arrow in the diagram.
- Step 4: then every derivative is an inner product, $\partial_\theta m = \langle y, (\partial_\theta A)\, x \rangle$: one thin arrow per parameter, each cheap.

The sentence to remember: one adjoint solve per measurement instead of one forward solve per parameter.

The question it invites: is this backpropagation? Yes, in the same sense. Reverse-mode automatic differentiation evaluates a chain of products from the output side, because there is one output and many inputs. Here the chain is the Neumann series, and the output is the pixel.

Next: what $y$ is, and how it is computed bounce by bounce.
