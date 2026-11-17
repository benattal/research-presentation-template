The partial sums are an iteration, and the iteration needs only products with $A$.

- $x_0 = b$ and $x_{k+1} = b + Ax_k$ give $x_k = b + Ab + \cdots + A^k b$: the partial sums of the series.
- Each step needs one product $Av$. Neither $(I - A)^{-1}$ nor $A$ as a stored array is needed; a function that returns $Av$ is enough.
- The example has $N = 10^6$. Stored densely, $A$ has $10^{12}$ entries, 4 TB in single precision, and its inverse is dense too. Here $(Av)_i = 0.45\,(v_{i-1} + v_{i+1})$: two numbers per row, computed when needed.
- The iteration stores $b$, $x_k$, and $Ax_k$: three vectors, 12 MB.
- $b$ is a single 1 in the middle of the vector. The bars are the 25 entries of $x_k$ around the middle, split into the terms $A^j b$; the black ticks are the exact solution $x_i = c\,r^{|i|}$ with $r \approx 0.63$.
- The error bound: $x - x_k = A^{k+1}b + A^{k+2}b + \cdots$, so $\|x - x_k\| \le (\|A\|^{k+1} + \|A\|^{k+2} + \cdots)\|b\| = \frac{\|A\|^{k+1}}{1 - \|A\|}\|b\|$.
- Here $\|A\|_\infty = 0.9$ (the largest row sum) and $\|b\|_\infty = 1$, so the bound is $10 \cdot 0.9^{k+1}$ (dashed). The measured error (solid) stays below it: 0.40 against 3.9 at $k = 8$, and 0.025 against 0.38 at $k = 30$.
- The bound needs only $\|A\|$, so it says in advance how many products reach a given accuracy.

To remember: the Neumann series is computed with repeated products $Av$, and its error falls like $\|A\|^k$.

Clicks: $k = 0$, 2, 8, then 30. The slider sets any $k$ up to 60.
