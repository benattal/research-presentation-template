Transition: in time of flight, the source was at the camera. In structured light, the source is a projector away from the camera, casting a known pattern.

- Step 1, the pattern: ten stripes from the projector. Where they cross the translucent blob, part of their light is scattered; behind the box, the floor is in shadow.
- Step 2, one sample of the camera ray. The dashed line runs from the sample to the projector's center of projection, through the projector pixel whose light reaches the sample: $P(\mathbf{x}_i)$ is that pixel's value in the pattern.
- Step 3, every sample: each term of the quadrature is NeRF's weight $T_i\alpha_i$, the sample's albedo $\rho_i$, and the projector's light at the sample, $P(\mathbf{x}_i)$ with the $1/r^2$ falloff.
- Each dot's size, and each bar beside the panel, is one term; the pixel $I$ is their sum. Here the floor sample is about 80% of $I$, and the blob's samples inside a bright stripe are most of the rest.

The sentence to remember: structured light is NeRF's quadrature with the light at each sample given by the projected pattern.

What changes from NeRF: the color $c_i$, which included all the light, is replaced by the albedo times the known light from the projector. The network's output is the reflectance; the illumination is the known pattern.

Source: Shandilya et al. (Neural Fields for Structured Lighting, ICCV 2023). Their model also has a cosine term $\mathbf{n}\cdot\omega_p$, folded into $\rho_i$ here. Shadowing of the projector light is left out of the model; it would need a transmittance toward the projector for every sample.

Next: so far the network's outputs were physical quantities, and the measurement was computed from them with a model. The measurement itself can also be the network's output.

Mouse: use the stripes slider to change the pattern, and the camera ray slider to move the pixel along the floor.
