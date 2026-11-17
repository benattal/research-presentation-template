What $(I - A)^{-1}$ does to different vectors, and why the convergence depends on the eigenvalues.

- The same $A$: eigenvalues $\lambda_1 = 0.8$ and $\lambda_2 = 0.3$, eigenvectors on the dashed lines.
- Write $b = c_1 v_1 + c_2 v_2$. Then $A^k b = c_1 \lambda_1^k v_1 + c_2 \lambda_2^k v_2$, so along each eigenvector the Neumann series is the geometric series with $a = \lambda_i$.
- So $x = (I - A)^{-1}b = \frac{c_1}{1-\lambda_1} v_1 + \frac{c_2}{1-\lambda_2} v_2$: each component of $b$ is scaled by $\frac{1}{1-\lambda_i}$.
- On each eigenvector line, the thin segment is $b$'s component and the wide one is $x$'s.
- The arrows from $b$'s tip are $Ab, A^2b, \ldots$, tip to tail; their end is the partial sum $x_k$. The black circle is $x$ from the direct solve.
- The plot is the error $\|x - x_k\|$ after $k$ terms. The dashed lines are the errors of the two components, $|c_i|\,\frac{\lambda_i^{k+1}}{1-\lambda_i}$: straight lines on the log scale, steeper for smaller $\lambda_i$.

Steps:

1. $b$ along $v_1$ ($\lambda_1 = 0.8$): $x = 5b$, and many terms are needed.
2. $b$ along $v_2$ ($\lambda_2 = 0.3$): $x = 1.43b$, and three terms come close.
3. A general $b$: the $v_1$ component is amplified most, so $x$ lies close to the $v_1$ line, and the error falls like $0.8^k$.
4. $\lambda_1 = 0.97$: the amplification is 33, and after 8 terms the chain is far from $x$.
5. A complex pair $0.85\,e^{\pm i\,35°}$: each power of $A$ rotates by 35° and shrinks by 0.85, so the chain spirals into $x$. The series converges because $|\lambda| < 1$.

To remember: components along eigenvalues close to 1 are amplified most and converge slowest.

Mouse: drag the tip of $b$; the sliders set $\lambda_1$, $\lambda_2$ (or $|\lambda|$ and $\arg\lambda$), and $k$.
