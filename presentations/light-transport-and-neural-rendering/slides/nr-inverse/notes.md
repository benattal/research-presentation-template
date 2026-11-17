Transition: so far the scene was known and the light was computed. In inverse rendering the measurements are known and the scene is not.

- Step 1, render: the scene parameters $\theta$ (geometry, materials, light, or the weights of a network) are rendered with a model of the measurement, $\hat C = \mathrm{render}(\theta)$.
- Step 2, compare: the rendering is compared with the measurements $\tilde C$, here with a squared error.
- Step 3, update: the parameters are updated by a gradient step on the loss, and the loop is repeated until the renderings match the measurements. This is analysis by synthesis.

The figure (Gkioulekas, CMU 15-468, p. 12): recovering the material $m$ of a scattering medium (the figure's $m$ is our $\theta$). Rendering every candidate material and searching would take hours per rendering; instead the derivative of the image with respect to the material, $\partial\,\mathrm{image}(m)/\partial m$, is computed by Monte Carlo rendering, for gradient descent.

The sentence to remember: inverse rendering is rendering inside an optimization loop, and it needs the derivative of the rendering with respect to the scene.

Next: NeRF, the first example, with the emission–absorption model as the renderer and a neural network as the scene.
