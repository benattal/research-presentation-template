Transition: The iterates approached the solution. To see why, and what they compute, we look at sums of powers of $A$.

- Step 1: $S_k = I + A + \cdots + A^k$ is a partial sum of the Neumann series. Applied to $b$, its terms $b$, $Ab$, $A^2b$ are drawn tip to tail, in the colors of the equation. The dot is $S_2 b$, and the ring is still the solution.
- Step 2: The question to the class, in this step's notes.
- Step 3: $(I - A)S_k = I - A^{k+1}$. The reason is under it: $S_k$ and $AS_k$ share every power from $A$ to $A^k$, so only $I$ and $-A^{k+1}$ remain. In the picture, the residual of $S_2 b$ is the next term, $A^3 b$, dashed.
- Step 4: So $S_k \to (I - A)^{-1}$ when $A^{k+1} \to 0$. That holds exactly when every eigenvalue of $A$ has magnitude below 1, that is, when the spectral radius $\rho(A)$ is below 1. The dashed lines are the eigenvectors, labelled with their eigenvalues; here $\rho(A) = 0.8$. The terms shrink, and their direction approaches the eigenvector with eigenvalue 0.8.
- Step 5: The whole series: $(I - A)^{-1} = I + A + A^2 + \cdots$, and the path reaches the ring.

Remember: when $\rho(A) < 1$, $(I - A)^{-1} = I + A + A^2 + \cdots$, and $S_k b$ misses the solution by the terms not yet added.

If asked:
- What if $\rho(A) \ge 1$? The terms do not shrink, and the series diverges, even when $I - A$ is invertible.
- Is $\rho(A) < 1$ easy to check? Any matrix norm with $\|A\| < 1$ is enough, since $\rho(A) \le \|A\|$.
- Does this need a basis of eigenvectors? No: $A^k \to 0$ exactly when $\rho(A) < 1$, for every square matrix, through its Jordan form.
