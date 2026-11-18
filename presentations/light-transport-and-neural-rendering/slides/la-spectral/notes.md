Transition: The series converges when $\rho(A) < 1$. To see why, and why its sum is $(I - A)^{-1}b$, we write it in the eigenvectors of $A$.

- Step 1: Along an eigenvector, $A$ only scales: $A^k v_i = \lambda_i^k v_i$. The dots are the powers $\lambda_i^k v_i$: on $v_1$ they shrink by 0.8 per power, on $v_2$ by 0.3.
- Step 2: Split $b$ along the eigenvectors: $b = c_1 v_1 + c_2 v_2$, the dashed parallelogram. The $c_i$ are the coordinates of $b$ in the eigenbasis.
- Step 3: An optional question, in this step's notes.
- Step 4: The Neumann series is one geometric series per eigenvector, $c_i(1 + \lambda_i + \lambda_i^2 + \cdots)v_i$, drawn tip to tail along each line. The faded path is the series of the last slide: each of its arrows is the sum of the matching arrows on the two lines.
- Step 5: Each geometric series sums to $\frac{c_i}{1 - \lambda_i}v_i$, at the ticks, and their parallelogram closes at the ring. So the sum is $(I - A)^{-1}b$: in the eigenbasis, $(I - A)^{-1}$ divides each coordinate by $1 - \lambda_i$, because $(I - A)v_i = (1 - \lambda_i)v_i$.

Remember: in the eigenbasis, the Neumann series is one geometric series per eigenvector, and their sums add up to $(I - A)^{-1}b$.

If asked:
- Which direction converges slowest? The one whose eigenvalue is closest to 1. After $k$ terms, the error along $v_i$ is $\frac{c_i \lambda_i^k}{1 - \lambda_i}v_i$: amplified most by $\frac{1}{1 - \lambda_i}$, and falling slowest. That is why the fixed-point iterates approached the ring along $v_1$.
- Does this need a basis of eigenvectors? This picture does. The condition $\rho(A) < 1$ is enough without one, through the Jordan form.
