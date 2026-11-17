The problem this section solves, in plain linear algebra.

- We want the vector $x$ with $(I - A)x = b$, for a square matrix $A$ and a vector $b$.
- Moving $Ax$ to the right gives $x = b + Ax$: $x$ is a fixed point of the map $x \mapsto b + Ax$.
- The example is $2 \times 2$: $A = \begin{pmatrix} 0.7 & 0.2 \\ 0.2 & 0.4 \end{pmatrix}$ and $b = (0, 1)$. The next slides use the same $A$.
- Step 2, a trial $x$: drawn from the tip of $b$, the arrow $Ax$ ends at $b + Ax$, which is not $x$. The dashed gap is the residual $b - (I - A)x$.
- Step 3, the solution: $b + Ax$ ends exactly at $x$, and the three arrows close a triangle.
- So $x = (I - A)^{-1}b$. The rest of the section computes it without inverting $I - A$.

To remember: solving $(I - A)x = b$ means finding the fixed point of $x \mapsto b + Ax$.

Clicks: $b$, a trial $x$, then the solution. Mouse: in the last two steps, drag the tip of $x$; the gap closes only at the solution.
