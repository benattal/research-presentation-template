Transition: the first example of the loop. A neural radiance field (NeRF) is the emission–absorption model of the volume rendering section, with the density and the color given by a neural network, and the network's weights are the scene parameters fit to photographs.

Left to right, as the caption says (sample, query, composite, compare):

- Points are sampled along each camera ray.
- A network $F_\Theta$ maps each point and viewing direction to a density $\sigma$ and a color $c$.
- The samples are composited into a pixel color with the quadrature of the volume rendering section.
- The loss is the squared difference between the rendered pixel and the photograph. Every step is differentiable, so the network's weights are fit by gradient descent: the loop of the last slide, with $\theta$ the weights.

The labels under the figure, each under the part it is about:

- Figure's $(\theta, \phi)$: direction. In the figure, $(\theta, \phi)$ are the two angles of the viewing direction; on the slides around this one $\theta$ is the scene parameters, so the direction is $\omega$ here.
- $c$: all bounces (under "Output"). $c$ is fit to photographs of the real scene, in which light did bounce, so the learned color at a point is all of the real light leaving it toward the camera, every bounce included. We come back to this at the end of the section.
- $\sigma_s = 0$: $A = 0$, $x = b$ (under "Volume Rendering"): there is no scattering in NeRF's volume, so the solution is the source itself. No bounce is simulated.

The sentence to remember: NeRF is the emission–absorption quadrature, with $\sigma$ and $c$ given by a network fit by gradient descent.

The question it invites: why does the color depend on the viewing direction and the density not? The density is the geometry, which is the same from every view. The color is the light leaving a point toward the camera, and shiny surfaces send different light in different directions.

Figure 2 of Mildenhall et al., ECCV 2020.
