Transition: With the same 32 samples, where they go on the ray changes the error.

- Step 1: Random: independent positions anywhere on the ray. Some stretches get several samples and others none, so the thin surface is often missed.
- Step 2: Stratified: one random sample in each of 32 equal intervals. No stretch is empty, and the error is about half. NeRF trains this way.
- Step 3: Hierarchical, as in NeRF: 16 coarse samples, the rings, estimate the weights along the ray, and 16 fine samples, the dots, are drawn in proportion to them. The bars on the right are each sampler's error over 64 rays.

Remember: with a fixed number of samples, put them where the weights are.

Pause for questions: this ends the volume rendering section. In one line: light in a medium is $x = b + Ax$ again, and without scattering a pixel is the emission along its ray, weighted by transmittance and computed by alpha compositing.

If asked:
- Why not put every sample at the surface? Where the surface is is not known until some samples have been evaluated. Hierarchical sampling does it in two passes: the coarse samples give the weights, the fine samples follow them.
- Why does NeRF train with stratified samples? They move at every iteration, so over many iterations they cover the whole ray.
- Why does NeRF ignore scattering? Its color is fit to photographs, so it already includes the scattered light. The next section comes back to what that costs.
- Why not evenly spaced samples? They also beat random ones on one ray, but they evaluate the same points at every iteration.
- How are the coarse weights computed? As $T(t_{i-1}) - T(t_i)$ for each gap between coarse samples, so a surface between an empty sample and a dense one is assigned to the gap that contains it.
- Can we move the surface? Drag sideways; the slider sets its sharpness.
- Source? Mildenhall et al., ECCV 2020.
