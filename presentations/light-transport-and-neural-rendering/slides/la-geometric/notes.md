Transition: For questions about the Neumann series: the same series for a number instead of a matrix.

- Step 1: $a = 0.5$. Left: $\frac{1}{1-a}$ in black, and its Taylor polynomials $S_k(a) = 1 + a + \cdots + a^k$ in grey. Between the dashed lines, where $|a| < 1$, they approach the curve as $k$ grows. Right: the partial sums at this $a$ against $k$. Each bar is one term $a^k$, and the dashed line is the limit, 2.
- Step 2: $a = 0.9$: the limit is 10, and the sums approach it slowly.
- Step 3: $a = -0.8$: the terms alternate in sign, and the sums oscillate around the limit, about 0.56.
- Step 4: $a = 1.05$: the terms grow, and the sums have no limit. The triangles on the top edge are sums above the plot. The slider sets any $a$ from −1.2 to 1.2.

Remember: the series converges when $|a| < 1$, and slowly when $|a|$ is close to 1. For a matrix, its eigenvalues play the role of $a$.

If asked:
- Why is every coefficient 1? The $k$-th derivative of $\frac{1}{1-a}$ at 0 is $k!$.
- Why does it converge? $(1 - a)(1 + a + \cdots + a^k) = 1 - a^{k+1}$, and $a^{k+1} \to 0$ exactly when $|a| < 1$. The Neumann series slide uses the same identity, with the matrix $A$ in place of $a$.
- How fast? After $k + 1$ terms the error is $\frac{a^{k+1}}{1-a}$. At $a = 0.5$, $S_6$ is within 1% of the limit; at $a = 0.9$, only $S_{43}$ is.
