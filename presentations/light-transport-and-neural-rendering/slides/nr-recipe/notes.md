Transition: every method on the last slide is built from the same pieces around one network. NeRF is the first example.

- Step 1, the scene: a network $F_\theta$ maps a point $\mathbf{x}$ and a direction $\omega$ to a density $\sigma$ and a color $c$. The green quantities are the network's outputs, and $\theta$ its weights.
- Step 2, model the measurement: write what the sensor records along a camera ray $\mathbf{r}$ as an integral along that ray. For a photograph it is the emission–absorption integral $C(\mathbf{r}) = \int T \sigma c \, dt$, with $T(t) = e^{-\int_0^t \sigma}$.
- Step 3, discretize: replace the integral with the quadrature of the volume rendering section, $\hat C(\mathbf{r}) = \sum_i T_i (1 - e^{-\sigma_i \delta_i}) c_i$, exact for piecewise-constant $\sigma$ and $c$.
- Step 4, differentiate: compare $\hat C(\mathbf{r})$ with the measured pixel $\tilde C(\mathbf{r})$, summed over the rays of a batch, and take a gradient step on $\theta$. The gradient through the quadrature is computed by automatic differentiation.

The sentence to remember: model, discretize, differentiate. For a new sensor, only the measurement model changes.

The question it invites: what has to be true of the measurement model for this to work? It must be differentiable in $\sigma$ and $c$, and cheap enough to evaluate for thousands of rays at every iteration. The quadrature is both.

Next: the measurement model of a time-of-flight sensor, starting from what light does in time.
