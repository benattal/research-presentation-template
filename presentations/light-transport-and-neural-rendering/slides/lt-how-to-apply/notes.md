Appendix slide, for a question about how a product with the transport matrix is computed in practice. It belongs with the transport matrix slides of the aside.

Every method of the aside needs products $\mathbf{T}p$: the camera image $c$ for one projector pattern $p$, with $\mathbf{T} = C(I - A)^{-1}E$. With a megapixel camera and projector, $\mathbf{T}$ is a $10^6 \times 10^6$ matrix, so it is rarely stored in full. Three ways to get $\mathbf{T}p$:

- Click 1, stored: precompute $\mathbf{T}$ and compress it. Ng et al. store transport in a wavelet basis, keep only the largest terms of the lighting, and relight a scene with a sparse matrix–vector product in real time.
- Click 2, simulated: render the scene. The emission is $e = Ep$, the light is the solution of $x = e + Ax$ (the Neumann series, or path tracing), and the image is $c = Cx$. The room is this simulation.
- Click 3, measured optically: project $p$ with a real projector and photograph the result. One exposure of the camera is $\mathbf{T}p$, because light adds. This setup, from the optical computing part of the CMU lecture, has a beam splitter between the projector and the camera.

The sentence to remember: $\mathbf{T}$ is used through its products, and a product can be looked up, simulated, or photographed.

The optical computing slide uses the third option to run numerical algorithms with photographs.
