The last slide showed that the series converges when $\rho(A) < 1$. Here is a picture of why, and of why its sum is the inverse: we look at the series in the eigenbasis of $A$.

The same $A$ and $b$. The dashed lines are the eigenvectors of $A$: $v_1$ with eigenvalue $\lambda_1 = 0.8$, and $v_2$ with $\lambda_2 = 0.3$.

Clicks:

1. $A^k v_i = \lambda_i^k v_i$: along an eigenvector, $A$ only scales, by its eigenvalue. The dots are $\lambda_i v_i, \lambda_i^2 v_i, \ldots$, in the colors of the terms $Ab, A^2b, \ldots$: on $v_1$ they shrink by 0.8 per power, on $v_2$ by 0.3.
2. $b = c_1 v_1 + c_2 v_2$: $b$ split along the eigenvectors (the dashed parallelogram). The coefficients $c_i$ are the coordinates of $b$ in the eigenbasis.
3. A question to the class (see the notes of this click).
4. The answer: $\sum_k A^k b = \sum_i c_i (1 + \lambda_i + \lambda_i^2 + \cdots) v_i$. The Neumann series is one geometric series along each eigenvector. On each line, the terms $c_i \lambda_i^k v_i$ are drawn tip to tail in the colors of $1, \lambda_i, \lambda_i^2$ in the equation. The faded path is the series of the last slide: its $k$-th arrow is the sum of the $k$-th arrows on the two lines.
5. $= \sum_i \frac{c_i}{1 - \lambda_i} v_i$: each geometric series sums to $\frac{c_i}{1 - \lambda_i} v_i$ (the ticks), and the parallelogram of the two sums closes at the ring. So the series computes $(I - A)^{-1}b$: in the eigenbasis, $(I - A)^{-1}$ divides each coordinate by $1 - \lambda_i$.

Two consequences worth saying:

- The series along $v_1$ needs many terms (ratio 0.8), the one along $v_2$ only a few (ratio 0.3). After a few terms the remaining error lies along $v_1$, which is why the iterates of the fixed-point slide approached the ring along one direction.
- An eigenvalue close to 1 is the slow direction twice over: its component is amplified most, by $\frac{1}{1 - \lambda_i}$, and its error after $k$ terms, $\frac{c_i \lambda_i^{k+1}}{1 - \lambda_i} v_i$, falls slowest.

To remember: in the eigenbasis, the Neumann series is one geometric series per eigenvector, and their sums add up to $(I - A)^{-1}b$.

If asked whether this needs a basis of eigenvectors: this picture does; the condition $\rho(A) < 1$ is enough without one (the Jordan form, as on the last slide).
