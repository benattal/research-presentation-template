Transition: to differentiate a measurement, we first write it down. We go back to the room of the operator section. The light $x$ is the radiance leaving every surface element in every direction, the solution of $x = e + Ax$: emission $e$ plus one bounce $A$ of the light.

The measurement at one camera pixel is a weighted sum of that light: $m = \langle q, x \rangle = \sum_j q_j x_j$. The index $j$ runs over every surface element and direction. The weights $q_j$ are the pixel's response, which we call its sensor: nonzero only for the light leaving the surfaces inside the pixel's wedge toward the camera (the cyan wedge, labelled $q$).

In inverse rendering, $m$ is compared with a photograph, and we need its derivative with respect to every scene parameter $\theta$: the albedo of each surface, the position of each object, or the weights of a network, millions of them for a neural scene representation.

The sentence to remember: a measurement is the inner product of a sensor $q$ with the light $x$.

The question it invites: why an inner product and not a general function of $x$? A sensor's reading is linear in the light: twice the light, twice the reading. The nonlinear steps, such as a camera's tone curve or a loss, come after the measurement, and the chain rule handles them (the last slide of the section).
