Transition: in time of flight, the source was at the camera. In structured light, the source is a projector away from the camera, casting a known pattern.

- Step 1, the pattern: ten stripes from the projector. Where they cross the translucent blob, the blob scatters them; the box casts a shadow on the floor.
- Step 2, one sample of the camera ray. The dashed line runs from the sample to the projector's center of projection, through the projector pixel that lights the sample: $P(\mathbf{x}_i)$ is that pixel's value in the pattern.
- Step 3, every sample: each term of the quadrature is NeRF's weight $T_i\alpha_i$, the sample's albedo $a_i$, and the projector's light at the sample, $P(\mathbf{x}_i)$ with the $1/r^2$ falloff. The glowing samples are the large terms; the pixel $I$ is their sum.

The sentence to remember: structured light is NeRF's quadrature with the light at each sample given by the projected pattern.

What changes from NeRF: the color $c_i$, which included all the light, is replaced by the albedo times the known light from the projector, so the network learns the scene's reflectance and the pattern supplies the illumination.

Source: Shandilya et al. (Neural Fields for Structured Lighting, ICCV 2023). Their model also has a cosine term $\mathbf{n}\cdot\omega_p$, folded into $a_i$ here. It ignores shadowing of the projector light, which would need a transmittance toward the projector for every sample.

Next: so far the network output physical quantities and a model computed the measurement; it can also output the measurement itself.

Mouse: use the stripes slider to change the pattern, and the camera ray slider to move the pixel along the floor.
