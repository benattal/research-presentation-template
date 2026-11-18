The iterates of the last slide approached the solution. Why, and what exactly do they compute? To answer, we look at sums of powers of $A$.

Clicks:

1. $S_k = I + A + A^2 + \cdots + A^k$ is the partial sum of the Neumann series. Applied to $b$, it is a path: $b$, then $Ab$, then $A^2b$, tip to tail, in the colors of $I$, $A$, $A^2$ in the equation. Here $k = 2$, and the dot is $S_k b$. The ring is still the solution $(I - A)^{-1}b$.
2. A question to the class (see the notes of this click).
3. The answer, $(I - A)S_k = I - A^{k+1}$. The two lines under it show why: $S_k$ and $AS_k$ share every power from $A$ to $A^k$, so the difference keeps only $I$ and $-A^{k+1}$. Applied to $b$, $b - (I - A)S_k b = A^{k+1}b$: the residual of $S_k b$ is the next term of the series, drawn dashed from the dot. It is the dashed gap of the fixed-point slide, for $x = S_k b$.
4. So if $A^{k+1} \to 0$, then $(I - A)S_k \to I$, and $S_k \to (I - A)^{-1}$. And $A^{k+1} \to 0$ exactly when every eigenvalue of $A$ has magnitude below 1, that is, when the spectral radius $\rho(A) = \max_i |\lambda_i|$ is below 1. The dashed lines are the eigenvectors of $A$, labelled with their eigenvalues: here $\rho(A) = 0.8$. With more terms drawn, the terms shrink, and their direction approaches the eigenvector with the larger eigenvalue.
5. $(I - A)^{-1} = I + A + A^2 + \cdots$: the path reaches the ring.

To remember: $(I - A)^{-1} = I + A + A^2 + \cdots$ whenever $\rho(A) < 1$, and the partial sum $S_k b$ misses the solution by exactly the terms not yet added.

If asked:

- What if $\rho(A) \ge 1$? The terms do not shrink and the series diverges, even when $I - A$ is invertible.
- Is $\rho(A) < 1$ easy to check? Any matrix norm with $\|A\| < 1$ is enough, since $\rho(A) \le \|A\|$. For light, $\|A\| < 1$ because every surface absorbs some of the light it receives.
- Does this need a basis of eigenvectors? No: $A^k \to 0$ exactly when $\rho(A) < 1$ holds for every square matrix (through its Jordan form).
- How are these partial sums related to the iterates of the last slide? That is the section's last slide.
