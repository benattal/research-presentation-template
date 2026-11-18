Transition: In time of flight, the source was at the camera. In structured light, it is a projector, here at the other side of the room, casting a known pattern.

- Step 1: Ten stripes from the projector. Part of their light scatters in the translucent blob, and the floor behind the box is in shadow.
- Step 2: One sample of the camera ray. The dashed line runs to the projector through the projector pixel that lights the sample: $P(\mathbf{x}_i)$ is that pixel's value.
- Step 3: Each term is NeRF's weight, the albedo, and the projector's light at the sample, attenuated on its way. The bars are the terms: the floor sample is most of the pixel.

Remember: structured light is NeRF's quadrature, with the light at each sample given by the projected pattern.

If asked:
- What changes from NeRF? The color $c_i$, which included all the light, is replaced by the albedo times the known light from the projector. The network learns reflectance; the illumination is known.
- What does $T^{\mathrm{p}}_i$ cost? A second ray march per sample. Shandilya et al. set it to 1, no projector shadows, which holds approximately when the projector is close to the camera. Here the pixel would be about 12% brighter without it.
- Can we change it? The sliders set the number of stripes and move the camera ray along the floor.
- Source? Shandilya et al., ICCV 2023. Their model also has a cosine term, folded into $\rho_i$ here.
