The section's last step: the iteration of the fixed-point slide and the Neumann series are the same computation.

- Left: the update $x_{k+1} = b + Ax_k$ from $x_0 = 0$, drawn as on the fixed-point slide: $Ax_k$ from the tip of $b$, ending at $x_{k+1}$.
- Right: the same iterates as partial sums of the series, $x_{k+1} = b + Ab + \cdots + A^k b$, drawn as on the Neumann series slide.
- The dots are the same on both planes. Unroll the update to see why: $x_1 = b$, $x_2 = b + Ab$, $x_3 = b + A(b + Ab) = b + Ab + A^2b$. Each update multiplies the sum so far by $A$ and adds $b$, which appends one more term.

Clicks:

1. $x_2 = b + Ab$, on both planes.
2. $x_3$ adds $A^2 b$.
3. $x_4$ adds $A^3 b$.
4. The remaining updates: the iterates reach the ring on both planes, and the line under them states the result (see the notes of this click).

To remember: iterating $x \leftarrow b + Ax$ from 0 sums the Neumann series, one term per product $Av$.
