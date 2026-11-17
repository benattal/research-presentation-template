Transition: section 3 ended with the emission–absorption model and its quadrature. A neural radiance field (NeRF) is that model with a neural network inside, fit to photographs.

Left to right:

- (a) Points are sampled along each camera ray.
- (b) A network $F_\Theta$ maps each point and viewing direction to a density $\sigma$ and a color $c$.
- (c) The samples are composited into a pixel color with the quadrature of the last section.
- (d) The loss is the squared difference between the rendered pixel and the photograph. Every step is differentiable, so the network weights are fit by gradient descent.

The labels under the figure:

- $\sigma_s = 0$: NeRF's volume does not scatter, so $A = 0$ and the solution is the source, $x = b$. No bounce is simulated.
- $c$ includes every bounce: $c$ is fit to photographs of the real scene, in which light did bounce. So the learned color at a point is all of the real light leaving it toward the camera, every bounce of the real scene included. We come back to this when we relight.

The sentence to remember: NeRF is the emission–absorption quadrature, with $\sigma$ and $c$ given by a network and fit by gradient descent.

Figure 2 of Mildenhall et al., ECCV 2020.
