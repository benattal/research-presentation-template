Transition: We start with a linear system small enough to draw.

- Step 1: The system $(I - A)x = b$, for a $2 \times 2$ matrix $A$ and a vector $b$. Every vector is an arrow in the plane, and $b$ is the arrow from the origin. The whole section uses this $A$ and this $b$.
- Step 2: Move $Ax$ to the right side, $x = b + Ax$, and read the right side as a map. For a trial $x$, in black, draw $Ax$ from the tip of $b$. It ends at $b + Ax$, not at $x$: the dashed gap is the residual, $b - (I - A)x$. Drag the tip of $x$: the gap closes at only one point.
- Step 3: That point is the solution, the ring. There, $b$, $Ax$, and $x$ close a triangle. Solving the system means finding the fixed point of the map.
- Step 4: The question to the class, in this step's notes.
- Step 5: Apply the map again and again: $x_{k+1} = b + Ax_k$. Each update is drawn as in step 2, with $Ax_k$ from the tip of $b$. The dots approach the ring, and the last update nearly closes the triangle.

Remember: solving $(I - A)x = b$ means finding the fixed point of $x \mapsto b + Ax$, and applying the map again and again approaches it.

If asked:
- Why do the dots first jump, then approach the ring along one line? The error has a part along each eigenvector of $A$. One part shrinks by a factor 0.3 per update and is gone after two or three updates; the other shrinks by 0.8 per update. The spectral slide shows this.
- Does this always converge? No: only when every eigenvalue of $A$ has magnitude below 1. The next slide shows why.
- What are $A$ and $b$? $A = \begin{pmatrix} 0.7 & 0.2 \\ 0.2 & 0.4 \end{pmatrix}$ and $b = (0, 1)$.
