Transition: Relighting and dual photography need all of $\mathbf{T}$. Many computations need only products with it, and a product is one photograph: light the scene with $p$, and the photo is $\mathbf{T}p$.

- Step 1: With a million pixels each, $\mathbf{T}$ has $10^{12}$ entries, too many to measure. So any algorithm that needs only products with $\mathbf{T}$ (power iteration, Arnoldi, GMRES) can run optically; O'Toole and Kutulakos (2010) ran all three. Here each element is both a light and a pixel, so $\mathbf{T}$ is square. Power iteration seeks the dominant eigenvector, the pattern that comes back unchanged up to scale, starting from $p_0$, one element on.
- Step 2: $p_1$, one photograph later, normalized: brightest near the first element.
- Steps 3 and 4: $p_2$ and $p_4$. Each product scales the part along each eigenvector by its eigenvalue, so the largest takes over: a broad bump over the middle of the room, close to $v_1$.

Remember: when only products are needed, a few photographs replace measuring the whole matrix.

Stop (optional): what else needs only products? Answer: the Krylov methods, which build their answer from $p, \mathbf{T}p, \mathbf{T}^2 p, \ldots$: Arnoldi for several eigenvectors at once, and GMRES for the pattern $p$ that gives a target photo, $\mathbf{T}p = c$.

If asked:
- Can a projector show negative values? No. A product with a vector that has negative entries takes two photographs, of its positive and its negative parts, subtracted.
- What is the profile labelled $v_1$? The dominant eigenvector computed from the full matrix, which takes one photograph per element.

Mouse: click an element on the ceiling to start from it instead; every start approaches the same $v_1$.
