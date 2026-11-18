Transition: the first example of inverse rendering. A neural radiance field (NeRF) is the emission–absorption model of the volume rendering section, with the density and color output by a neural network that is fit to photographs.

Left to right, as the caption says (sample, query, composite, compare):

- Points are sampled along each camera ray.
- A network $F_\Theta$ maps each point and viewing direction to a density $\sigma$ and a color $c$.
- The samples are composited into a pixel color with the quadrature of the volume rendering section.
- The loss is the squared difference between the rendered pixel and the photograph. Every step is differentiable, so the network weights are fit by gradient descent.

The labels under the figure, each under the part it is about:

- Figure's $(\theta, \phi)$: direction. In the figure, $(\theta, \phi)$ are the two angles of the viewing direction; on the slides around this one, $\theta$ is the scene parameters, so here they are named $\omega$.
- $c$: all bounces (under "Output"). $c$ is fit to photographs of the real scene, in which light did bounce. So the learned color at a point is all of the real light leaving it toward the camera, every bounce of the real scene included. We come back to this when we relight.
- $\sigma_s = 0$ (under "Volume Rendering"): in NeRF's volume there is no scattering, so $A = 0$ and the solution is the source, $x = b$. No bounce is simulated.

The sentence to remember: NeRF is the emission–absorption quadrature, with $\sigma$ and $c$ output by a network and fit by gradient descent.

Figure 2 of Mildenhall et al., ECCV 2020.
