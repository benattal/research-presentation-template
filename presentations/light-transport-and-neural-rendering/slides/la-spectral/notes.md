What $(I - A)^{-1}$ does to different vectors, and why the convergence depends on the eigenvalues.

- The same $A$: eigenvalues $\lambda_1 = 0.8$ and $\lambda_2 = 0.3$, eigenvectors on the dashed lines.
- First line: $A$ scales each eigenvector by its eigenvalue, so $A^k v_i = \lambda_i^k v_i$. For $b$ along one eigenvector (steps 1 and 2), the Neumann series is the geometric series with $a = \lambda_i$, and $x = b / (1 - \lambda_i)$.
- Second line (from step 3): write $b = c_1 v_1 + c_2 v_2$. Then $\sum_k A^k b = \sum_i c_i (1 + \lambda_i + \lambda_i^2 + \cdots)\, v_i$, one geometric series per eigenvector, so $x = (I - A)^{-1}b = \frac{c_1}{1-\lambda_1} v_1 + \frac{c_2}{1-\lambda_2} v_2$: each component of $b$ is scaled by $\frac{1}{1-\lambda_i}$, the factors under the sliders.
- On each eigenvector line, the thin segment is $b$'s component and the wide one is $x$'s.
- The arrows from $b$'s tip are $Ab, A^2b, \ldots$, tip to tail; their end is the partial sum $x_k$. The black circle is $x$ from the direct solve.
- The plot is the error $\|x - x_k\|$ after $k$ terms. The dashed lines are the errors of the two components, $|c_i|\,\frac{\lambda_i^{k+1}}{1-\lambda_i}$: straight lines on the log scale, steeper for smaller $\lambda_i$.

Steps:

1. $b$ along $v_1$ ($\lambda_1 = 0.8$): $x = 5b$, and many terms are needed.
2. $b$ along $v_2$ ($\lambda_2 = 0.3$): $x = 1.43b$, and three terms come close.
3. A general $b$: the $v_1$ component is amplified most, so $x$ lies close to the $v_1$ line, and the error falls like $0.8^k$.
4. $\lambda_1 = 0.97$, with $b$ mostly along $v_2$ ($c_1 = 0.1$): the small $v_1$ component is amplified 33 times, so $x$ lies far out along $v_1$, and after 8 terms the chain has covered only about a quarter of it. The error falls like $0.97^k$.
5. Optional; skip it when time is short. A complex pair $0.85\,e^{\pm i\,35°}$: each power of $A$ rotates by 35° and shrinks by 0.85, so the chain spirals into $x$. The series converges because $|\lambda| < 1$. Light transport matrices are nonnegative, so by the Perron–Frobenius theorem their dominant eigenvalue is real and nonnegative: the slowest component never spirals.

To remember: components along eigenvalues close to 1 are amplified most and converge slowest.

Mouse: drag the tip of $b$; the sliders set $\lambda_1$, $\lambda_2$ (or $|\lambda|$ and $\arg\lambda$), and $k$.
