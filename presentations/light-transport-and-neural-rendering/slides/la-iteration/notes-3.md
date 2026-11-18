The remaining updates: on both planes the iterates reach the ring. The line under them is the section's result: $x_k \to (I - A)^{-1}b$, and each update costs one product $Av$. Neither $(I - A)^{-1}$ nor $A$ as a stored array is needed: a function that returns $Av$ for any $v$ is enough. In the next section, that function is one bounce of light.

To remember: iterating $x \leftarrow b + Ax$ from 0 sums the Neumann series, one term per product $Av$, and converges to $(I - A)^{-1}b$ when $\rho(A) < 1$.

Pause here for questions on the section before moving on to light. Questions that may come up:

- How many updates are needed? The error after $k$ updates is the tail of the series, $A^k b + A^{k+1} b + \cdots$, so it falls like $\rho(A)^k$: about $\log(1/\varepsilon) / \log(1/\rho(A))$ updates for a relative error $\varepsilon$. With any norm, $\|x - x_k\| \le \frac{\|A\|^k}{1 - \|A\|}\|b\|$, which needs only $\|A\|$ (the appendix slide "Large systems" shows this bound on a system with $10^6$ unknowns).
- Why not a faster solver, such as GMRES? It also needs only products $Av$, and for the same number of products its residual is never larger: it minimizes the residual over every combination of $b, Ab, \ldots, A^{k-1}b$, and the iterate $x_k$ is one of them. In light transport, the plain iteration has a physical meaning, one bounce of light per update, and its sum is what path tracing estimates with random samples.
- What if $\rho(A)$ is close to 1? Convergence is slow: a scene of white, highly reflective surfaces needs many bounces.
