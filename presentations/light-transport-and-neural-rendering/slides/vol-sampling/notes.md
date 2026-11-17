Transition: the same 32 samples can go anywhere on the ray. Where they go changes the error.

All three samplers are random and use the same budget of 32 samples, so the comparison is fair.

- Step 1, random: 32 independent, uniformly random positions. Some stretches of the ray get several samples, others none, and the surface is often missed.
- Step 2, stratified: the ray is cut into 32 equal intervals with one random sample in each. No stretch is left empty, and the error halves. NeRF trains with stratified samples: they move at every iteration, so over many iterations the samples cover every point of the ray.
- Step 3, hierarchical, as in NeRF: 16 stratified coarse samples (rings) are used to locate the light; the dashed steps are the coarse weights per gap between samples. 16 fine samples (dots) are drawn from those weights, and the estimate is computed from all 32.
- The bars on the right are the RMS error over 64 rays across the cloud, so the luck of one ray's sample positions averages out.

The sentence to remember: with a fixed number of samples, put them where the weights are.

Numbers at the default sharpness: random about 10%, stratified about 5%, hierarchical about 1%. For comparison (not on the slide): the error with evenly spaced midpoints, which are not random, is about 2.7%. Evenly spaced samples are not used for training because they evaluate the same points at every iteration.

Detail: the coarse weights here are $T(t_{i-1}) - T(t_i)$ for each gap between coarse samples, so the weight of a surface between an empty sample and a dense one is assigned to the gap that contains it. With weights per sample, as in the quadrature, it is assigned one interval too deep about half of the time.

Source: hierarchical sampling, Mildenhall et al., ECCV 2020.

Mouse: drag sideways to move the surface; the sharpness slider sets its width.
