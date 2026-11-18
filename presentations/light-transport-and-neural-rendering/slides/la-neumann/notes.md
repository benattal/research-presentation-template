Why the iterates of the last slide converge, and what they compute.

- $S_k = I + A + \cdots + A^k$ is the partial sum of the Neumann series. Applied to $b$, it is the path of the terms $b, Ab, A^2b, \ldots$ tip to tail, in the colors of $I, A, A^2$ in the equation; the dot is $S_k b$ (here $k = 2$). The ring is the solution $(I - A)^{-1}b$ of the last slide.
- Multiplying by $I - A$, the middle terms cancel in pairs: $(I - A)S_k = I - A^{k+1}$. The two lines under it show the cancellation; they disappear on the next click.
- Applied to $b$: $b - (I - A)S_k b = A^{k+1}b$. The residual of $S_k b$ is the next term, drawn dashed from the dot: the dashed gap of the fixed-point slide, for $x = S_k b$.
- If $A^{k+1} \to 0$, then $(I - A)S_k \to I$, so $S_k \to (I - A)^{-1}$.
- $A^k \to 0$ exactly when every eigenvalue has $|\lambda| < 1$, that is, when the spectral radius $\rho(A) = \max_i |\lambda_i|$ is below 1. This holds for every matrix, through its Jordan form. The dashed lines are the eigenvectors of $A$, labelled with their eigenvalues: here $\rho(A) = 0.8$. The terms shrink, and their direction approaches the eigenvector of the largest eigenvalue.
- If $\rho(A) \ge 1$, the terms do not shrink and the series diverges.
- A sufficient condition that is easy to check: any matrix norm with $\|A\| < 1$, since $\rho(A) \le \|A\|$.
- From $x_0 = 0$, the fixed-point iterates are these partial sums, $x_{k+1} = S_k b$; the section's last slide shows the two side by side.

Clicks:

1. $S_k$, and the path $b + Ab + A^2b$ ending at $S_k b$.
2. $(I - A)\,S_k \stackrel{?}{=}$: a question to the class (see the notes of this click).
3. The answer $I - A^{k+1}$, with the cancellation under it; the next term $A^{k+1}b$, dashed, from $S_k b$.
4. $A^{k+1} \to 0$ if $\rho(A) < 1$: seven terms, shrinking, and the eigenvalues on the eigenvector lines.
5. $(I - A)^{-1} = I + A + A^2 + \cdots$: the path reaches the ring.

To remember: $(I - A)^{-1} = I + A + A^2 + \cdots$ whenever $\rho(A) < 1$, and $S_k b$ misses the solution by the terms not yet added.
