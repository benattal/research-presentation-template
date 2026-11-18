Transition: in time of flight the source was at the camera. In structured light the source is a projector beside the camera, casting a known pattern.

- Step 1, the pattern: ten stripes from the projector. Where they cross the translucent blob, part of their light is scattered; behind the box, the floor is in shadow.
- Step 2, one sample of the camera ray. The dashed line runs from the sample to the projector's center of projection, through the projector pixel whose light reaches the sample: $P(\mathbf{x}_i)$ is that pixel's value in the pattern.
- Step 3, every sample: each term of the quadrature is NeRF's weight $T_i\alpha_i$, the sample's albedo $\rho_i$, and the projector's light at the sample: $P(\mathbf{x}_i)$ with the $1/r^2$ falloff, attenuated by $T^{\mathrm{p}}_i$, the transmittance from the sample toward the projector.
- Each dot's size, and each bar beside the panel, is one term; the pixel $m$ is their sum. The floor sample is most of it, and the blob's samples inside a bright stripe are the rest.

The sentence to remember: structured light is NeRF's quadrature, with the light at each sample given by the projected pattern.

What changes from NeRF: the color $c_i$, which included all the light, is replaced by the albedo times the known light from the projector. The network's output is the reflectance; the illumination is known.

The question it invites: what does $T^{\mathrm{p}}_i$ cost? A second transmittance, along the ray from each sample to the projector, so the terms have the shadows the picture has: move the camera ray onto the floor behind the box, and the floor sample's term drops to zero. It also means a second ray march per sample. Shandilya et al. leave the factor out, "the projector light casts no shadows, i.e., $T(\mathbf{x}_p, \mathbf{x}) = 1$", because it "would be a computational bottleneck in neural volume rendering"; this holds approximately for a small baseline between projector and camera. Without it the pixel here would be about 12% brighter, all of it from the blob, whose far side is in its own shadow. They note that their framework is "unable to accurately disambiguate geometry for edges near projector shadows".

Source: Shandilya et al. (Neural Fields for Structured Lighting, ICCV 2023). Their model also has a cosine term $\mathbf{n}\cdot\omega_p$, folded into $\rho_i$ here.

Next: so far the network's outputs were physical quantities, and the measurement was computed from them with a model. The measurement itself can also be the network's output.

Mouse: the stripes slider changes the pattern, and the camera ray slider moves the pixel along the floor.
