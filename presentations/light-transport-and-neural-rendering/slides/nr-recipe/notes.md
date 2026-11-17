Transition: every method on the last slide is built in the same three steps around one network. NeRF is the first example.

- Step 1, the network: $F_\theta$ maps a point $\mathbf{x}$ and a direction $\omega$ to a density $\sigma$ and a color $c$. The green quantities are network outputs; $\theta$ are its weights.
- Step 2, model the measurement: write what the sensor measures as an integral along the ray. For a photograph it is the emission–absorption integral $C = \int T \sigma c \, dt$, with $T(t) = e^{-\int_0^t \sigma}$.
- Step 3, discretize: replace the integral with the quadrature of the volume rendering section, $\hat C = \sum_i T_i (1 - e^{-\sigma_i \delta_i}) c_i$, exact for piecewise-constant $\sigma$ and $c$.
- Step 4, differentiate: compare $\hat C$ with the measured pixel $\tilde C$ and take a gradient step on $\theta$. The gradient $\nabla_\theta$ through the quadrature is computed by automatic differentiation.

The sentence to remember: model, discretize, differentiate. For a new sensor, only the measurement model changes.

The next slides redo the measurement model for time-of-flight sensors and structured light.
