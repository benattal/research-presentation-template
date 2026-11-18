For questions about the Neumann series: the same series for one number instead of a matrix.

- For a number $a$, $\frac{1}{1-a}$ is the inverse of $1 - a$.
- Its Taylor series at 0 is $1 + a + a^2 + \cdots$: the $k$-th derivative of $\frac{1}{1-a}$ at 0 is $k!$, so every coefficient is 1.
- It converges because $(1 - a)(1 + a + \cdots + a^k) = 1 - a^{k+1}$, and $a^{k+1} \to 0$ exactly when $|a| < 1$. The Neumann series slide uses the same identity with the matrix $A$ in place of $a$.
- Left: $\frac{1}{1-a}$ (black) and the Taylor polynomials $S_k(a) = 1 + a + \cdots + a^k$ (grey, degrees 1 to 20). Between the dashed lines, where $|a| < 1$, they approach the curve as $k$ grows; outside, they move away from it. The vertical line is the chosen $a$; its dots are $S_0(a), S_1(a), \ldots$
- Right: the same partial sums against $k$. Each bar is one term $a^k$; the dashed line is the limit.
- The error after $k + 1$ terms is $\frac{1}{1-a} - S_k = \frac{a^{k+1}}{1-a}$: for $a$ close to 1 it is large and falls slowly.

Clicks, one value of $a$ each:

1. $a = 0.5$: the limit is 2, and $S_6$ is within 1% of it.
2. $a = 0.9$: the limit is 10, and only $S_{43}$ is within 1% of it.
3. $a = -0.8$: the terms alternate in sign, and the sums oscillate around $\frac{1}{1.8} \approx 0.56$.
4. $a = 1.05$: the terms grow, and the sums have no limit.

To remember: the series converges when $|a| < 1$, and slowly when $|a|$ is close to 1. For a matrix, the eigenvalues play the role of $a$.

The slider sets any $a$ between −1.2 and 1.2.
