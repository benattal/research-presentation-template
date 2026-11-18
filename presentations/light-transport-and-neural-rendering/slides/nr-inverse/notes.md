Transition: The example is the room again, with one unknown: the albedo $\theta$ of the left wall, three numbers for red, green, and blue. The first guess is grey, and the measurement $\tilde C$ is one simulated image.

- Step 1: Render: with the current $\theta$, compute the image $\hat C$, drawn as a strip of pixels. Rendering is the solve of the operator light transport section.
- Step 2: Compare: the strips differ where the camera sees the wall. The loss $\ell$ is the squared difference.
- Step 3: Ask the class for the gradient.
- Step 4: By the chain rule, the gradient sums each pixel's residual, weighted by how much that pixel changes with $\theta$: the strip $\partial_\theta \hat C$.
- Step 5: Step against the gradient and render again, 30 times. The wall turns red, and the swatches record $\theta$ after each step. Blue is slowest, because the lamp has the least blue light.

Remember: inverse rendering is rendering inside an optimization loop, and the loop needs the derivative of the rendering with respect to the scene.

If asked:
- Is the answer unique? Here it is: one wall, which the camera sees. In general it is not: a brighter light and a darker material can give the same image, so real problems use many views, several lights, or prior knowledge.
- How is $\partial_\theta \hat C$ computed? For this wall, by one more solve of the room. The adjoint section computes it for every parameter at once.
- Where is the figure from? It is redrawn after Gkioulekas's CMU 15-468 lecture, pp. 11–12, which recovers the material of a scattering medium the same way.
