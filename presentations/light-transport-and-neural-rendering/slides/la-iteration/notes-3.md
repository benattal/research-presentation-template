- Step 4: The remaining updates reach the ring on both planes. The line under them is the section's result: $x_k \to (I - A)^{-1}b$ when the spectral radius of $A$ is below 1. Each update costs one matrix–vector product. So we never need $(I - A)^{-1}$, or even $A$ stored as an array: a function that applies $A$ to a vector is enough. In the next section, light satisfies this fixed-point equation, with the source $b$ written as $e$, the emitted light.

Remember: from $x_0 = 0$, iterating $x \leftarrow b + Ax$ sums the Neumann series, one term per matrix–vector product, and converges to $(I - A)^{-1}b$ when $\rho(A) < 1$.

Pause for questions, at step 4, on the section. To start: does the starting point matter? Answer: not for the limit. From any $x_0$, $x_k = b + Ab + \cdots + A^{k-1}b + A^k x_0$, and $A^k x_0 \to 0$; the fixed-point slide started away from 0 and still reached the ring.

If asked:
- How many updates are needed? The error after $k$ updates is the tail of the series, $A^k b + A^{k+1} b + \cdots$, so it falls like $\rho(A)^k$. With any norm, $\|x - x_k\| \le \frac{\|A\|^k}{1 - \|A\|}\|b\|$. The appendix slide "Large systems" shows this bound with a million unknowns.
- Why not a faster solver, such as GMRES? GMRES also needs only products with $A$, and for the same number of them its residual is never larger. But in light transport, each product with $A$ is a noisy Monte Carlo estimate, and $x$ is never stored. Krylov methods such as GMRES need stored basis vectors and exact inner products. Path tracing estimates the sum of the series one pixel at a time.
- What if $\rho(A)$ is close to 1? Convergence is slow: a scene of white, highly reflective surfaces needs many bounces.
