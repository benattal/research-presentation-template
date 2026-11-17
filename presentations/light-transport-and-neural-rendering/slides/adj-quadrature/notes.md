Transition: the adjoint idea, applied to NeRF's quadrature on one ray.

- Step 1: in the forward march the samples are composited front to back, $\hat C = \sum_i T_i \alpha_i c_i$ with $T_i = e^{-\sum_{j<i} \sigma_j \delta_j}$.
- Step 2: differentiate with respect to one density $\sigma_i$. Two things change. Sample $i$ itself becomes more opaque, which adds $\delta_i T_{i+1} c_i$ (since $\partial \alpha_i / \partial \sigma_i = \delta_i e^{-\sigma_i \delta_i}$ and $T_{i+1} = T_i e^{-\sigma_i \delta_i}$). And every sample behind it is dimmed: each $T_k$ with $k > i$ loses a fraction $\delta_i$, which removes $\delta_i$ times the color behind sample $i$, $\hat C - \hat C_{\le i} = \sum_{k > i} T_k \alpha_k c_k$.
- Step 3: the color behind sample $i$ is known from the final color $\hat C$ and the running sum $\hat C_{\le i}$. In a second march from the front, $\hat C_{\le i}$ is accumulated and each sample's gradient is computed on the way, so nothing is stored per sample: memory is constant in the number of samples. Multiplying by $\partial \mathcal{L} / \partial \hat C$, the gradient of the loss with respect to the pixel, gives the gradient of the loss.

The sentence to remember: the backward pass needs only the final color and a second march, not a record of the forward pass. This is radiative backpropagation for a single ray without scattering.

Check by hand: for one sample, $\hat C = (1 - e^{-\sigma\delta}) c$ and the formula gives $\delta e^{-\sigma\delta} c$, the derivative.

Optional slide: skip it if the talk runs long.
