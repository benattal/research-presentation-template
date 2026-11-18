Transition: Now integrals, then one identity the adjoint section uses.

- Steps 1–2: To estimate an integral, draw samples $x_i$ with a density $p$ and average $f(x_i)/p(x_i)$. This is Monte Carlo integration.
- Steps 3–4: Why is it right? In expectation, the density cancels: $\int \frac{f}{p}\, p\, dx = \int f\, dx$.
- Steps 5–6: Its error falls as one over the square root of the number of samples: four times the samples, half the error.
- Steps 7–8: Moving a matrix to the other side of an inner product transposes it. The adjoint section is built on this.

Remember: Monte Carlo is right on average because the density cancels, and its error falls as $1/\sqrt{N}$.

Stop (planned): at step 3, why is the estimate right on average? Answer: its expectation is $\int \frac{f(x)}{p(x)}\, p(x)\, dx$, so $p$ cancels, for any $p$ that is positive where $f$ is not zero.

Stop (optional): at step 7, what is $\langle Ax, y \rangle$ with the matrix moved to $y$? Answer: $\langle x, A^\top y \rangle$; both are $y^\top A x$.

If asked:
- Where is each used? Monte Carlo in path tracing; the transpose in adjoint light transport.
- Why does the error fall as $1/\sqrt{N}$? The samples are independent, so the variance of their mean is the variance of one divided by $N$.
