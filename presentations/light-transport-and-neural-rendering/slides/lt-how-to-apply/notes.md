Transition: an appendix slide, for a question about computing products with the transport matrix. Every method in the aside needs $\mathbf{T}p$, the camera image for a projector pattern $p$, but $\mathbf{T}$ is rarely stored: for a megapixel camera and projector, it has $10^6 \times 10^6$ entries.

- Step 1: Precomputed: compute $\mathbf{T}$ once and compress it. Ng et al. store transport in wavelets and keep only the largest terms of the lighting, to relight in real time. On the left, spherical harmonics; on the right, their wavelets, with the same number of terms: only the wavelets keep the sharp shadow.
- Step 2: Simulated: render the scene. The emission is $e = Ep$, the light solves $x = e + Ax$, and the image is $c = Cx$, as in the room.
- Step 3: Measured: project $p$ and photograph the result. One exposure is $\mathbf{T}p$, because light adds. The setup is from the optical computing part of the CMU lecture.

Remember: $\mathbf{T}$ is used through its products, which can be precomputed, simulated, or photographed.

If asked:
- Whose spherical harmonics? Sloan et al. 2002, the method Ng et al. compare with, at as many terms as the wavelets.
- What is in the setup? A projector and a camera, with a beam splitter between them.
- What uses the third way? The optical computing slide, which runs numerical algorithms with photographs.
