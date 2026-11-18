Transition: until now the scene was known and we computed the light. Inverse rendering reverses the problem: the measurements are known, and the scene is not.

The example is the room of the earlier sections with one unknown: the albedo $\theta$ of the left wall, three numbers for red, green, and blue. The first guess is a grey wall. The measurement $\tilde C$ is one image from the camera in the top right. In flatland an image is a row of pixels, drawn as a strip; the dashed lines are the edges of the camera's view. Here $\tilde C$ is simulated: it is the room rendered with the wall's true albedo.

- Step 1, render: with the current $\theta$, compute the image the camera would record, $\hat C = \mathrm{render}(\theta)$. In this room, rendering is the solve of the operator light transport section, $x = (I - A)^{-1}e$, read out at the camera's pixels. The strip $\hat C$ is that image.
- Step 2, compare: the measured image $\tilde C$ appears under it. The two differ where the camera sees the wall: red in $\tilde C$, grey in $\hat C$. The loss $\ell(\theta)$ is the squared difference, summed over pixels and colors. (A question for this step is in its own notes.)
- Step 3: what is the gradient $\nabla_\theta \ell$? A question to the class (see the notes of this step).
- Step 4, the answer: by the chain rule, $\nabla_\theta \ell = 2\,(\partial_\theta \hat C)^\top (\hat C - \tilde C)$, the residual of each pixel weighted by how much that pixel changes with $\theta$. The strip $\partial_\theta \hat C$ is that derivative: brightest where the camera sees the wall, dimmer where the wall's light arrives after another bounce.
- Step 5, update: step against the gradient, $\theta \leftarrow \theta - \eta\, \nabla_\theta \ell$, with a fixed step size $\eta$, and render again. The loop runs 30 times. The wall turns red, $\hat C$ becomes $\tilde C$, and the swatches under the strips record $\theta$ after each step. Red settles within a few steps and green within about ten. Blue is the slowest, because the image depends least on the wall's blue albedo: the lamp has the least blue light.

The sentence to remember: inverse rendering is rendering inside an optimization loop, and the loop needs the derivative of the rendering with respect to the scene.

The question it invites: is the answer unique? Here it is: one unknown wall, which the camera sees. In general it is not. A brighter light and a darker material can give the same image, so real problems use many views, several lights, or prior knowledge of the scene.

The visual is redrawn after Gkioulekas's CMU 15-468 lecture (pp. 11–12), which recovers the material of a scattering medium the same way: the image of a material $m$ and its derivative $\partial\,\mathrm{image}(m)/\partial m$, both computed by Monte Carlo rendering, inside gradient descent. Here $\theta$ plays the role of his $m$. The adjoint section computes the derivative for this same wall.

Next: neural radiance fields, where $\theta$ is the weights of a network and the renderer is the emission–absorption quadrature of the volume rendering section.
