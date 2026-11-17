We never need $\mathbf{T}$ itself to multiply by it: light the scene with pattern $p$ and take a photograph, and the photograph is $\mathbf{T}p$. Any algorithm that only needs products, like the iterative solvers of section 1, can run optically, one photograph per product. O'Toole and Kutulakos (SIGGRAPH Asia 2010) ran power iteration and Arnoldi iteration this way with a projector and a camera.

An eigenvector of $\mathbf{T}$ is a pattern that, projected onto the scene, comes back in the photograph unchanged up to a scale: $\mathbf{T}v_1 = \lambda_1 v_1$. Power iteration finds the one with the largest eigenvalue: project $p$, capture $\mathbf{T}p$, normalize, and project the result again.

The setup here: each of the 19 light elements also measures the light that arrives back at it, like a projector and a camera that share pixels. Then $\mathbf{T}$ is square (19 × 19), and $\mathbf{T}_{jk}$ is the light element $j$ receives when element $k$ is lit.

- **$p_0$**: one element on, at the left.
- **$p_1$**: one photograph. The light returned to the ceiling is spread out, brightest near the first element.
- **$p_2$**, **$p_4$**: the pattern converges to the dominant eigenvector $v_1$ of $\mathbf{T}$: a broad bump, highest above the middle of the room, where the floor and the box reflect the most light back to the ceiling.

The numbers are the angle between each pattern and $v_1$ (computed from the full matrix, which takes 19 photographs): 77.7° for the single element, then 17.0° after one photograph, 3.9° after two, 0.2° after four.

One sentence: with products measured optically, a few photographs replace measuring the whole matrix.

Mouse: click an element on the ceiling to start from it instead; every start converges to the same $v_1$.
