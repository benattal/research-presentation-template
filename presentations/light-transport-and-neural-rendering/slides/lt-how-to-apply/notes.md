Every method in this lecture needs products $\mathbf{T}p$: the measurement for one illumination pattern $p$. With a megapixel camera and projector, $\mathbf{T}$ is a $10^6 \times 10^6$ matrix, so it is rarely stored in full. Three ways to get $\mathbf{T}p$:

- Click 1, stored: precompute $\mathbf{T}$ and compress it. Ng et al. store transport in a wavelet basis, keep only the largest terms of the lighting, and relight a scene with a sparse matrix–vector product in real time.
- Click 2, simulated: render the scene. The room here is a simulation of the full equation.
- Click 3, measured optically: project $p$ with a real projector and photograph the result. One exposure of the camera is $\mathbf{T}p$, because light adds. This setup, from the optical computing part of the CMU lecture, has a beam splitter between the projector and the camera.

The optical computing slide uses the third option to run numerical algorithms with photographs.
