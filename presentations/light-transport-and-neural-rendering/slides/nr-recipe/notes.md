Transition: every method on the last slide is built in the same three steps. NeRF is the first example.

- Step 1, model the measurement: write what the sensor measures as an integral along the ray. For a photograph it is the emission–absorption integral $C = \int T \sigma c \, dt$, with $T(t) = e^{-\int_0^t \sigma}$. The green quantities, $\sigma$ and $c$, are network outputs with weights $\theta$.
- Step 2, discretize: replace the integral with the quadrature of section 3, $\hat C = \sum_i T_i (1 - e^{-\sigma_i \delta_i}) c_i$, exact for piecewise-constant $\sigma$ and $c$.
- Step 3, differentiate: compare $\hat C$ with the measured pixel $\tilde C$ and take a gradient step on $\theta$. Automatic differentiation computes $\nabla_\theta$ through the quadrature.

The sentence to remember: model, discretize, differentiate. For a new sensor, only step 1 changes.

The next slides redo step 1 for time-of-flight sensors and structured light.
