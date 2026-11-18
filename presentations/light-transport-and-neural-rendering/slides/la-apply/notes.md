Transition: For questions about scale: the section's iteration on a system with a million unknowns, where $A$ is never stored.

- Step 1: $k = 1$, so $x_1 = b$: a single 1 in the middle of the vector. The bars are the entries of $x_k$ around the middle, each split into its terms $A^j b$, in the colors of the key. The black ticks are the exact solution.
- Step 2: $k = 3$. Each update needs one product with $A$, computed when needed: $(Av)_i = 0.45\,(v_{i-1} + v_{i+1})$, two numbers per row.
- Step 3: $k = 10$. The error is the tail of the series, so $\|x - x_k\| \le \frac{\|A\|^k}{1 - \|A\|}\|b\|$. Here $\|A\|_\infty = 0.9$, the largest row sum, so the bound is $10 \cdot 0.9^k$, dashed. The measured error is the solid line.
- Step 4: $k = 30$: the error is 0.03, below the bound of 0.4. The bound needs only $\|A\|$, so the number of products for a given accuracy is known in advance. The slider sets any $k$ up to 60.

Remember: the Neumann series is summed with repeated products by $A$, and its error falls like $\|A\|^k$.

If asked:
- How large would $A$ be as an array? $10^{12}$ entries, 4 TB in single precision, and its inverse is dense too. The iteration stores three vectors, $b$, $x_k$, and $Ax_k$: 12 MB.
- What is the exact solution? $x_i = c\,r^{|i|}$ with $r \approx 0.63$, the root below 1 of $0.45\,r^2 - r + 0.45 = 0$, and $c$ set by the middle row.
