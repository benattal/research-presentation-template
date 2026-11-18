Transition: Now integrals, then two identities the adjoint section uses.

- Steps 1–2: To estimate an integral, draw samples $x_i$ with a density $p$ and average $f(x_i)/p(x_i)$. This is Monte Carlo integration.
- Steps 3–4: Why is it right? In expectation, the density cancels: $\int \frac{f}{p}\, p\, dx = \int f\, dx$.
- Steps 5–6: Its error falls as one over the square root of the number of samples: four times the samples, half the error.
- Steps 7–8: Light along a ray decays at rate $\sigma_t$, so the fraction left after a distance $t$ is $e^{-\int_0^t \sigma_t}$: the transmittance of the volume rendering section.
- Steps 9–10: Moving an operator to the other side of an inner product transposes it. The adjoint section is built on this.
- Steps 11–12: And the derivative of an inverse: the inverse, the derivative of $A$, and the inverse again.

Remember: Monte Carlo is right on average because the density cancels, and its error falls as $1/\sqrt{N}$.

Stop (planned): at step 3, why is the estimate right on average? Answer: its expectation is $\int \frac{f(x)}{p(x)}\, p(x)\, dx$, so $p$ cancels, for any $p$ that is positive where $f$ is not zero.

Stop (optional): at step 11, what is the derivative of $(I - A)^{-1}$? Answer: $(I - A)^{-1}(\partial_\theta A)(I - A)^{-1}$, from differentiating $(I - A)(I - A)^{-1} = I$.

If asked:
- Where is each used? Monte Carlo in path tracing; the decay in volume rendering; the transpose and the derivative of the inverse in adjoint light transport.
- Why does the error fall as $1/\sqrt{N}$? The samples are independent, so the variance of their mean is the variance of one divided by $N$.
