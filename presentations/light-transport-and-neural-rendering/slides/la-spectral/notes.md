Why the series converges, and why its sum is the inverse, in the eigenbasis of $A$.

The same $A$ and $b$. The dashed lines are the eigenvectors of $A$: $v_1$ with $\lambda_1 = 0.8$ and $v_2$ with $\lambda_2 = 0.3$.

Clicks:

1. $A^k v_i = \lambda_i^k v_i$: $A$ scales each eigenvector by its eigenvalue. The dots are $\lambda_i v_i, \lambda_i^2 v_i, \ldots$, in the colors of the terms $Ab, A^2b, \ldots$: on $v_1$ they shrink by 0.8 per power, on $v_2$ by 0.3.
2. $b = c_1 v_1 + c_2 v_2$: $b$ split along the eigenvectors (the dashed parallelogram). The coefficients $c_i$ are the coordinates of $b$ in the eigenbasis.
3. $\sum_k A^k b = \sum_i c_i (1 + \lambda_i + \lambda_i^2 + \cdots) v_i$: since $A^k b = c_1 \lambda_1^k v_1 + c_2 \lambda_2^k v_2$, the Neumann series is one geometric series along each eigenvector. On each line, the terms $c_i \lambda_i^k v_i$ are drawn tip to tail in the colors of $1, \lambda_i, \lambda_i^2$ in the equation. The faded path is the series of the last slide: its $k$-th term is the sum of the $k$-th terms on the two lines.
4. $= \sum_i \frac{c_i}{1 - \lambda_i} v_i$: each geometric series sums to $\frac{c_i}{1 - \lambda_i} v_i$ (the ticks), and the parallelogram of the two sums closes at the ring. So the series computes $(I - A)^{-1}b$: in the eigenbasis, $(I - A)^{-1}$ divides each coordinate by $1 - \lambda_i$.

- The series along $v_1$ needs many terms (ratio 0.8), the one along $v_2$ few (ratio 0.3). After a few terms the remaining error lies along $v_1$, which is why the iterates of the fixed-point slide approach the ring along one direction.
- Components along eigenvalues close to 1 are amplified most, by $\frac{1}{1 - \lambda_i}$, and converge slowest: after $k$ terms, the error along $v_i$ is $\frac{c_i \lambda_i^{k+1}}{1 - \lambda_i} v_i$.
- The argument needs a basis of eigenvectors; the condition $\rho(A) < 1$ suffices without one (Jordan form).

To remember: in the eigenbasis, the Neumann series is one geometric series per eigenvector, and their sums add up to $(I - A)^{-1}b$.
