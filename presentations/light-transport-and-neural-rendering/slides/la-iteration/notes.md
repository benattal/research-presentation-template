The section's conclusion: the fixed-point iteration and the Neumann series are one computation.

- Left: the update $x_{k+1} = b + Ax_k$ from $x_0 = 0$, drawn as on the fixed-point slide: $Ax_k$ from the tip of $b$, ending at $x_{k+1}$.
- Right: the same iterates as partial sums, $x_{k+1} = b + Ab + \cdots + A^k b$, drawn as on the Neumann series slide.
- The dots are the same on both planes. By induction: $x_1 = b$, and if $x_k = b + \cdots + A^{k-1}b$, then $b + Ax_k = b + Ab + \cdots + A^k b$. Each update adds one term.
- Each update costs one product $Av$. Neither $(I - A)^{-1}$ nor $A$ as a stored array is needed: a function that returns $Av$ is enough. In the next section, $Av$ is one bounce of light.

Clicks:

1. $k = 1$: $x_2 = b + Ab$.
2. $k = 2$: $x_3$ adds $A^2 b$.
3. $k = 3$: $x_4$ adds $A^3 b$.
4. The remaining updates: the iterates reach the ring on both planes, and the line under them states the result.

To remember: iterating $x \leftarrow b + Ax$ from 0 sums the Neumann series, one term per product $Av$.

For questions about scale and accuracy: the appendix slide on iteration with $10^6$ unknowns shows the same iteration and an error bound that needs only $\|A\|$.
