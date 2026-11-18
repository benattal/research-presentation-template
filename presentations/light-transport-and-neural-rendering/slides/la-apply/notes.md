For questions about scale: the iteration of the Neumann series section on a system with a million unknowns, where $A$ is never stored.

- The iteration is the section's: $x_0 = 0$ and $x_{k+1} = b + Ax_k$, so $x_k = b + Ab + \cdots + A^{k-1}b$, the first $k$ terms of the series.
- Each update needs one product $Av$. Neither $(I - A)^{-1}$ nor $A$ as a stored array is needed; a function that returns $Av$ is enough.
- Here $N = 10^6$. Stored as a dense array, $A$ would have $10^{12}$ entries (4 TB in single precision), and its inverse is dense too. This $A$ is $(Av)_i = 0.45\,(v_{i-1} + v_{i+1})$: two numbers per row, computed when needed. The iteration stores $b$, $x_k$, and $Ax_k$: three vectors, 12 MB.
- $b$ is a single 1 in the middle of the vector. The bars are the 25 entries of $x_k$ around the middle, each split into its terms $A^j b$ (colors in the key); the black ticks are the exact solution $x$.
- The error is the tail of the series: $x - x_k = A^k b + A^{k+1} b + \cdots$, so $\|x - x_k\| \le (\|A\|^k + \|A\|^{k+1} + \cdots)\|b\| = \frac{\|A\|^k}{1 - \|A\|}\|b\|$.
- Here $\|A\|_\infty = 0.9$ (the largest row sum, $2 \times 0.45$) and $\|b\|_\infty = 1$, so the bound is $10 \cdot 0.9^k$ (dashed). The measured error (solid, the dot at the current $k$) stays below it: after 30 updates the error is 0.03 and the bound 0.4.
- The bound needs only $\|A\|$, so it says in advance how many products reach a given accuracy.

Clicks: $k = 1$ ($x_1 = b$), 3, 10, then 30 updates. The slider sets any $k$ up to 60.

To remember: the Neumann series is computed with repeated products $Av$, and its error falls like $\|A\|^k$.

If asked about the exact solution: $x_i = c\,r^{|i|}$ with $r \approx 0.63$, the root of $0.45\,r^2 - r + 0.45 = 0$ below 1, and $c$ set by the middle row.
