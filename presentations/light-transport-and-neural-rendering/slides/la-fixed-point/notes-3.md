Question to the class: the trial point is now $x_0$, and the ring is the solution. How do we get from $x_0$ to the ring without computing $(I - A)^{-1}$? Give them a minute to propose something.

Likely proposals, and what to say:

- Gaussian elimination: it works for this $2 \times 2$ matrix, but it needs every entry of $A$ stored, and its cost grows as $n^3$. In light transport, $A$ is too large to store.
- Minimizing the residual $\|b - (I - A)x\|^2$ by gradient descent: also works, and also uses only products with $A$ and $A^\top$.
- Apply the map again: from $x_0$, compute $b + Ax_0$, then apply the map to that, and so on.

Answer, on the next click: apply the map $x \mapsto b + Ax$ again and again, $x_{k+1} = b + Ax_k$. Each update needs one product with $A$, and the dots approach the ring.
