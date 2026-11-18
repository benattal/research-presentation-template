Transition: with the same number of samples, where they go on the ray changes the error.

All three samplers are random and use the same budget of 32 samples, so the comparison is fair.

- Step 1, random: independent, uniformly random positions anywhere on the ray. Some stretches get several samples and others none, and the thin surface is often missed.
- Step 2, stratified: the ray is cut into 32 equal intervals with one random sample in each. No stretch is left empty, and the error is about half. NeRF trains with stratified samples: they move at every iteration, so over many iterations they cover every point of the ray.
- Step 3, hierarchical, as in NeRF: 16 stratified coarse samples (rings) locate the light; the dashed steps are their weights, one per gap between coarse samples. 16 fine samples (dots) are drawn in proportion to those weights, and the estimate uses all 32.
- The bars on the right are each sampler's error, the root mean square over 64 rays across the cloud, so the luck of one ray's samples averages out.

The question it invites: why not put every sample at the surface? Because where the surface is is not known until some samples have found it. Hierarchical sampling is that idea in two passes: coarse samples find it, fine samples refine it.

The sentence to remember: with a fixed number of samples, put them where the weights are.

Pause for questions: this ends the volume rendering section. In one line: light in a medium is $x = b + Ax$ again, with $A$ one scattering event; without scattering, a pixel is the emission along its ray weighted by transmittance, computed by alpha compositing samples. Two questions to expect. Why does NeRF ignore scattering? Its color $c$ is fit to photographs, so it already includes the scattered light; the next section comes back to what that costs. How are samples chosen in practice? As on this slide.

Background: evenly spaced samples, which are not random, also do better than random ones on one ray. They are not used for training because they evaluate the same points at every iteration.

Detail: the coarse weights here are $T(t_{i-1}) - T(t_i)$ for each gap between coarse samples, so the weight of a surface between an empty sample and a dense one is assigned to the gap that contains it. With weights per sample, as in the quadrature, it is assigned one interval too deep about half of the time.

Source: hierarchical sampling, Mildenhall et al., ECCV 2020.

Mouse: drag sideways to move the surface; the sharpness slider sets its width.
