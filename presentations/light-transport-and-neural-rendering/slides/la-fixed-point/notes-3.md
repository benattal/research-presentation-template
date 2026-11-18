- Step 4: The trial $x$ is now the start, $x_0$, and the ring is the solution.

Stop (planned), at step 4: any ideas for how to solve $x = b + Ax$ without knowing the inverse $(I - A)^{-1}$? Give them a minute. Answer, on the next click: apply the map again and again, $x_{k+1} = b + Ax_k$, at one product with $A$ per update.

If asked:
- What about Gaussian elimination? It works for this $2 \times 2$ matrix, but it needs every entry of $A$ stored, and its cost grows as $n^3$. In light transport, $A$ is too large to store.
- What about gradient descent on the residual $\|b - (I - A)x\|^2$? It also works, with products by $A$ and $A^\top$.
