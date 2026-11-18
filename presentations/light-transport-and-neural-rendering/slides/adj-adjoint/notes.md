Transition: two slides ago, the derivative of the light was $\partial_\theta x = (I - A)^{-1} (\partial_\theta A)\, x$, and the pixel $m$ is $\langle q, x \rangle$, with $q$ its sensor.

- Step 1: So $\partial_\theta m = \langle q, (I - A)^{-1} z \rangle$, with the source $z = (\partial_\theta A)\, x$. Evaluated from the right, each parameter takes one transport solve; in automatic differentiation, this order is called forward mode. The diagram counts the solves: $N$ parameters, $N$ solves. A texture, a density grid, or a network has millions of parameters.
- Step 2: The adjoint $A^\top$ is defined by $\langle u, Az \rangle = \langle A^\top u, z \rangle$; for a matrix, it is the transpose. Expand the inverse as the Neumann series, and move each $A$ to the other side of the inner product. The sum becomes the Neumann series of $A^\top$, applied to $q$. The solve is now applied to $q$, which does not depend on $\theta$.
- Step 3: Call that vector $y = (I - A^\top)^{-1} q$, the importance of the pixel. It takes one solve, with the adjoint operator and the sensor as its source: the blue arrow. For a loss over all pixels, it is still one solve, as the last slide of the section shows.
- Step 4: Then every derivative is one inner product, $\partial_\theta m = \langle y, (\partial_\theta A)\, x \rangle$: the thin arrows, each cheap.

Remember: one adjoint solve per measurement replaces one forward solve per parameter.

Stop (planned): at step 1, point out that the $N$ solves differ only in their source $z$. Ask: can you rearrange $\langle q, (I - A)^{-1} z \rangle$ so that a single solve is shared by every $\theta$? Hint, if needed: how does a matrix move from one side of an inner product to the other? Answer: onto $q$, as $\langle (I - A^\top)^{-1} q, z \rangle$, on the next two clicks.

If asked:
- Is this backpropagation? Yes. Reverse-mode automatic differentiation evaluates a chain of products from the output side, because there is one output and many inputs. Here the chain is the Neumann series, and the output is the pixel.
