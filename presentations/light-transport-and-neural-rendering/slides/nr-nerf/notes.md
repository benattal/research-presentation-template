Transition: The first example of the loop. A neural radiance field, NeRF, is the emission–absorption model, with the density and the color given by a network whose weights are fit to photographs.

- Step 1: Points are sampled along each camera ray, and the network maps each point and viewing direction to a density and a color. The samples are composited and compared with the photograph, and the weights are fit by gradient descent. In the figure, $(\theta, \phi)$ are the angles of the viewing direction. $c$ includes every bounce, because it is fit to real light. And the volume has no scattering.

Remember: NeRF is the emission–absorption quadrature, with $\sigma$ and $c$ from a network fit by gradient descent.

If asked:
- Is that $\theta$ the scene parameters of the last slide? No: in this figure, $\theta$ and $\phi$ are the two angles of the viewing direction. The network's weights are written $\Theta$.
- Why can it be fit by gradient descent? Every step, the sampling, the network, and the quadrature, is differentiable.
- Why does the color depend on the viewing direction and the density not? The density is the geometry, the same from every view. Shiny surfaces send different light in different directions.
- Source? Figure 2 of Mildenhall et al., ECCV 2020.
