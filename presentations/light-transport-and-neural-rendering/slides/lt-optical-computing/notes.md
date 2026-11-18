Relighting and dual photography need the whole matrix $\mathbf{T}$. Many computations need only products with it, and a product needs no matrix: light the scene with pattern $p$ and take a photograph, and the photograph is $\mathbf{T}p$. One product is one photo. Any algorithm that only needs products, like the iteration $x_{k+1} = e + Ax_k$ of the Neumann series, can run optically, one photograph per product. O'Toole and Kutulakos (SIGGRAPH Asia 2010) ran power iteration and Arnoldi iteration this way with a projector and a camera.

Why this matters: for a projector and a camera with a million pixels each, $\mathbf{T}$ is $10^6 \times 10^6$, $10^{12}$ entries (CMU 15-463, pp. 36 and 57). Measuring it entry by entry is out of reach; a few products are not.

The example is power iteration. An eigenvector of $\mathbf{T}$ is a pattern that, projected onto the scene, comes back in the photograph unchanged up to a scale: $\mathbf{T}v_1 = \lambda_1 v_1$. Power iteration computes the one with the largest eigenvalue: project $p$, photograph $\mathbf{T}p$, normalize, and project the result again. As on the spectral-view slide, each product multiplies the part of $p$ along each eigenvector by its eigenvalue, so the part along the largest one dominates after a few products.

The setup here: each light element is both a light and a pixel, like a projector and a camera that share pixels. Then $\mathbf{T}$ is square, and $\mathbf{T}_{jk}$ is the light element $j$ receives when element $k$ is lit. The bars hanging from the ceiling are the pattern lighting the room, scaled to its largest entry; the profiles beside the room are the patterns of every step, drawn the same way.

- **$p_0$**: one element on, at the left.
- **$p_1$**: one photograph. The light returned to the ceiling is spread out, brightest near the first element.
- **$p_2$**, **$p_4$**: the pattern approaches the dominant eigenvector $v_1$ of $\mathbf{T}$: a broad bump, highest above the middle of the room, where the floor and the box reflect the most light back to the ceiling.

The profile labeled $v_1$ is the dominant eigenvector computed from the full matrix, which takes one photograph per element. After four photographs the pattern has its shape.

The question this slide invites: what else needs only products? Krylov methods, which build their answer from $p, \mathbf{T}p, \mathbf{T}^2 p, \ldots$: Arnoldi iteration for several eigenvectors at once, GMRES for solving $\mathbf{T}x = c$, and the Neumann series itself.

To remember: when only products are needed, a few photographs replace measuring the whole matrix.

Mouse: click an element on the ceiling to start from it instead; every start approaches the same $v_1$.
