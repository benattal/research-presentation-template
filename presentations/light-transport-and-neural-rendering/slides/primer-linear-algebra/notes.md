Transition: Before we start, a quick warm-up on the math the lecture uses. Each line is a question: tell me the right side before I show it.

- Steps 1–2: What does $A$ do to an eigenvector? It only scales it: $A v_i = \lambda_i v_i$.
- Steps 3–4: Stack the eigenvectors as the columns of $V$ and the eigenvalues on the diagonal of $\Lambda$: $A = V \Lambda V^{-1}$, for a diagonalizable $A$.
- Steps 5–6: Write $x$ in the eigenvectors, $x = \sum_i c_i v_i$. Then $A$ scales each component by its eigenvalue.
- Steps 7–8: So the inverse divides each component by its eigenvalue, as long as none is zero.
- Steps 9–10: The geometric series: $1 + \lambda + \lambda^2 + \cdots = 1/(1 - \lambda)$ when $|\lambda| < 1$.
- Steps 11–12: Put the two together. $(I - A)^{-1}$ divides each component by $1 - \lambda_i$, and that is one geometric series per eigenvector: the sum of the powers of $A$. This is the Neumann series, the first section.

Remember: along its eigenvectors a matrix only scales, so its inverse, and $(I - A)^{-1}$, only divide.

Stop (planned): at step 11, what is $(I - A)^{-1} x$ in the eigenvectors? Answer: $\sum_i c_i/(1 - \lambda_i)\, v_i$, which is $\sum_k A^k x$ when every $|\lambda_i| < 1$.

Stop (optional): at step 1, what is $A v_i$? Answer: $\lambda_i v_i$.

If asked:
- What if $A$ is not diagonalizable? The Neumann series still converges when the spectral radius is below 1; the eigenvector picture is the easiest case to see why.
- Where is this used? The Neumann series section, and the spectral view slide in particular.
