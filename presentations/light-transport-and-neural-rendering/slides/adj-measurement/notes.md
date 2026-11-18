Transition: to differentiate a pixel, we first write it in terms of the light. This is the room of the operator section, and $x$ is its light, the solution of $x = e + Ax$.

- Step 1: The pixel is a weighted sum of the light, $m = \langle q, x \rangle = \sum_j q_j x_j$, where $j$ runs over every surface element and direction. The weights $q$ are the pixel's sensor. They are nonzero only for the light leaving the floor inside the cyan wedge, toward the camera. In inverse rendering, $m$ is compared with a photograph, so we need its derivative with respect to every scene parameter: each albedo, each object's position, or each weight of a network.

Remember: a pixel is the inner product of its sensor $q$ with the light $x$.

If asked:
- Why an inner product, and not any function of $x$? A sensor's reading is linear in the light: twice the light, twice the reading. Nonlinear steps, such as a tone curve or a loss, come after the measurement and are handled by the chain rule, as on the last slide of the section.
