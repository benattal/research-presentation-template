We start with the problem itself, on the smallest example we can draw.

$A$ is a $2 \times 2$ matrix and $b$ a vector in the plane, so every vector on this slide is an arrow. The whole section uses this same $A$ and $b$, and the ring always marks the solution $(I - A)^{-1}b$.

Clicks:

1. $(I - A)x = b$: the system to solve. $b$ is the arrow from the origin.
2. Move $Ax$ to the right side: $x = b + Ax$. Read the right side as a map, $x \mapsto b + Ax$. For a trial $x$ (the black arrow), draw $Ax$ from the tip of $b$: it ends at $b + Ax$. That is not $x$. The dashed gap between the two tips is the residual $b - (I - A)x$.
3. At the solution, the ring, $b + Ax$ ends exactly at $x$, and $b$, $Ax$, and $x$ close a triangle. So $x = b + Ax$ holds exactly when $x = (I - A)^{-1}b$: the solution is the fixed point of the map.
4. A question to the class (see the notes of this click).
5. $x_{k+1} = b + Ax_k$: ten updates from $x_0$. Each update is the construction of click 2, $Ax_k$ drawn from the tip of $b$ and ending at $x_{k+1}$; earlier updates are faded. The iterates, the dots, approach the ring, and the last update nearly closes the triangle of click 3. The next slides show why they converge and what they compute.

To remember: solving $(I - A)x = b$ is finding the fixed point of $x \mapsto b + Ax$, and applying the map again and again approaches it.

If asked why the dots first jump and then approach the ring along one direction: the error has a part along each eigenvector of $A$. One part shrinks by a factor 0.3 per update and is gone after two or three updates; the other shrinks by 0.8 per update and remains. The spectral slide shows this.

If asked whether this always converges: no. It converges when every eigenvalue of $A$ has magnitude below 1, which the next slide shows.

For reference, if asked: $A = \begin{pmatrix} 0.7 & 0.2 \\ 0.2 & 0.4 \end{pmatrix}$ and $b = (0, 1)$.

Mouse: from click 2 on, drag the tip of $x$ (on the last two clicks, $x_0$). The gap closes only at the solution, and the iterates follow a moved $x_0$.
