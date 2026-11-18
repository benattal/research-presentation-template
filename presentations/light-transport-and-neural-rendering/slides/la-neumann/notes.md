The same series for a matrix, with the same proof.

- $S_k = I + A + \cdots + A^k$ is the partial sum of the Neumann series.
- Multiplying by $I - A$, the middle terms cancel in pairs: $(I - A)S_k = I - A^{k+1}$.
- If $A^{k+1} \to 0$, then $(I - A)S_k \to I$, so $S_k \to (I - A)^{-1}$.
- $A^k \to 0$ exactly when every eigenvalue has $|\lambda| < 1$, that is, when the spectral radius $\rho(A) = \max_i |\lambda_i|$ is below 1. This holds for every matrix, through its Jordan form. From this step on, the dashed eigenvector lines carry their eigenvalues: here $\rho(A) = 0.8$.
- If $\rho(A) \ge 1$, the terms do not shrink and the series diverges, as for $|a| \ge 1$ on the last slide.
- A sufficient condition that is easy to check: any matrix norm with $\|A\| < 1$, since $\rho(A) \le \|A\|$.
- The picture uses the same $A$ as before. The gold circle is the set of unit vectors, the filled ellipse its image under $S_k$, and the dashed ellipse its image under $(I - A)^{-1}$.
- The gap between the two ellipses is the image under $S_\infty - S_k = A^{k+1}(I - A)^{-1}$, which shrinks to zero.
- The arrows are the unit eigenvectors $v_1, v_2$ and their images $S_k v_i = (1 + \lambda_i + \cdots + \lambda_i^k)\, v_i$: the scalar series with $a = \lambda_i$. The labels are these factors: 1.8 and 1.3 for $k = 1$, then 5 and 1.43 in the limit.

To remember: $(I - A)^{-1} = I + A + A^2 + \cdots$ whenever $\rho(A) < 1$, by the same telescoping as for numbers.

Clicks: $k = 1$, $k = 2$, $k = 6$, then the limit.
