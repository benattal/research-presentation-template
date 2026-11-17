Start with one number instead of a matrix.

- For a number $a$, $\frac{1}{1-a}$ is the inverse of $1 - a$.
- Its Taylor series at 0 is $1 + a + a^2 + \cdots$: the $k$-th derivative of $\frac{1}{1-a}$ at 0 is $k!$, so every coefficient is 1.
- Why it converges: $(1 - a)(1 + a + \cdots + a^k) = 1 - a^{k+1}$, and $a^{k+1} \to 0$ exactly when $|a| < 1$. The next slide uses the same identity for matrices.
- Left: $\frac{1}{1-a}$ (black) and the Taylor polynomials $S_k(a) = 1 + a + \cdots + a^k$ (grey, degrees 1 to 20). Between the dashed lines, $|a| < 1$, they approach the curve as $k$ grows; outside, they move away from it.
- The vertical line is the chosen $a$; its dots are $S_0(a), S_1(a), \ldots$
- Right: the same partial sums against $k$. Each bar is one term $a^k$; the dashed line is the limit.
- The error after $k$ terms is $\frac{1}{1-a} - S_k = \frac{a^{k+1}}{1-a}$.
- $a = 0.5$: the limit is 2, and $S_6$ is within 1% of it.
- $a = 0.9$: the limit is 10, and only $S_{43}$ is within 1% of it.
- $a = -0.8$: the terms alternate in sign, and the sums oscillate around $\frac{1}{1.8} \approx 0.56$.
- $a = 1.05$: the terms grow, and the sums have no limit.

To remember: the series converges when $|a| < 1$, and slowly when $|a|$ is close to 1.

Clicks: four values of $a$. The slider sets any $a$ between −1.2 and 1.2.
