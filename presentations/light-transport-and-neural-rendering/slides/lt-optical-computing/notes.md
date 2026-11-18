We never need $\mathbf{T}$ itself to multiply by it: light the scene with pattern $p$ and take a photograph, and the photograph is $\mathbf{T}p$. One product is one photo. Any algorithm that only needs products, like the iteration $x_{k+1} = e + Ax_k$ of the Neumann series, can run optically, one photograph per product. O'Toole and Kutulakos (SIGGRAPH Asia 2010) ran power iteration and Arnoldi iteration this way with a projector and a camera.

Why this matters: for a real projector and camera with a million pixels each, $\mathbf{T}$ is $10^6 \times 10^6$, $10^{12}$ entries (CMU 15-463, pp. 36 and 57). Measuring it entry by entry is out of reach; a few products are not.

An eigenvector of $\mathbf{T}$ is a pattern that, projected onto the scene, comes back in the photograph unchanged up to a scale: $\mathbf{T}v_1 = \lambda_1 v_1$. The principal eigenvector is the fixed point of the sequence $p, \mathbf{T}p, \mathbf{T}^2 p, \ldots$ after normalizing (15-463, p. 44): the fixed-point view of the first linear algebra slide. Power iteration converges to the one with the largest eigenvalue: project $p$, capture $\mathbf{T}p$, normalize, and project the result again. As on the spectral-view slide, the component along the largest eigenvalue dominates after a few products.

The setup here: each of the 19 light elements is both a light and a pixel, like a projector and a camera that share pixels. Then $\mathbf{T}$ is square (19 × 19), and $\mathbf{T}_{jk}$ is the light element $j$ receives when element $k$ is lit.

The bars hanging from the ceiling are the pattern lighting the room, one bar per element, scaled to its largest entry; the bars beside the room are the patterns of every step, drawn the same way.

- **$p_0$**: one element on, at the left.
- **$p_1$**: one photograph. The light returned to the ceiling is spread out, brightest near the first element.
- **$p_2$**, **$p_4$**: the pattern converges to the dominant eigenvector $v_1$ of $\mathbf{T}$: a broad bump, highest above the middle of the room, where the floor and the box reflect the most light back to the ceiling.

The numbers are the angle between each pattern and $v_1$ (computed from the full matrix, which takes 19 photographs): 77.7° for the single element, then 17.0° after one photograph, 3.9° after two, 0.2° after four.

One sentence: with products measured optically, a few photographs replace measuring the whole matrix.

Mouse: click an element on the ceiling to start from it instead; every start converges to the same $v_1$.
