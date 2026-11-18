The problem this section solves, in plain linear algebra.

- We want the vector $x$ with $(I - A)x = b$, for a square matrix $A$ and a vector $b$.
- Moving $Ax$ to the right gives $x = b + Ax$: $x$ is a fixed point of the map $x \mapsto b + Ax$.
- The example is $2 \times 2$: $A = \begin{pmatrix} 0.7 & 0.2 \\ 0.2 & 0.4 \end{pmatrix}$ and $b = (0, 1)$. The rest of the section uses the same $A$ and $b$, and the ring always marks the solution $(I - A)^{-1}b$.

Clicks:

1. $b$.
2. A trial $x$: drawn from the tip of $b$, the arrow $Ax$ ends at $b + Ax$, which is not $x$. The dashed gap is the residual $b - (I - A)x$.
3. The solution (the ring): $b + Ax$ ends exactly at $x$, and the three arrows close a triangle. So $x = (I - A)^{-1}b$.
4. A question to the class: the trial point is now $x_0$; how do we get from $x_0$ to the ring without computing $(I - A)^{-1}$? Let them propose. The answer on the next click: apply the map again and again.
5. $x_{k+1} = b + Ax_k$ from $x_0$, ten updates. Each update is the construction of click 2: $Ax_k$ from the tip of $b$, ending at $x_{k+1}$; earlier updates are faded. The iterates (dots) approach the ring, and the last update nearly closes the triangle of click 3. The next slides show why the iterates converge and what they compute.

If asked why the dots first jump and then approach the ring along one direction: the error has a part along each eigenvector of $A$. The part with eigenvalue 0.3 shrinks by 0.3 per update and is gone after two or three; the part with eigenvalue 0.8 shrinks by 0.8 per update and remains. The spectral slide shows this.

To remember: solving $(I - A)x = b$ means finding the fixed point of $x \mapsto b + Ax$, and applying the map repeatedly approaches it.

Mouse: from click 2 on, drag the tip of $x$ (on the last two clicks, $x_0$). The gap closes only at the solution, and the iterates follow a moved $x_0$.
