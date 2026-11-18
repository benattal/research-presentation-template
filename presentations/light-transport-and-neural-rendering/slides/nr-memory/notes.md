Transition: every method in this section takes gradients through a renderer. With bounces and secondary rays, the renderer evaluates many more samples, and each one has to be kept for the backward pass.

- Step 1, automatic differentiation: every intermediate value of the forward pass is stored for the backward pass. In a volume renderer these are the network's activations at every sample.
- Step 2, how much: memory is about $R \cdot N \cdot (1 + N_b N_s)$ times the bytes stored per sample, with $R$ rays per batch, $N$ samples per camera ray, $N_b$ bounces, and $N_s$ samples on each secondary ray.
  - NeRF simulates no bounce ($N_b = 0$): 4,096 rays × 128 samples × 4 KB = 2 GB.
  - One bounce, with a 64-sample secondary ray from every sample (a shadow ray, or a ray toward the projector): 65 times more, 130 GB, above one GPU's 80 GB.
  - Eight bounces: 513 times NeRF's memory, about 1 TB.
- Step 3, the adjoint method: each sample is recomputed in the backward pass instead of stored, and one sample per ray is kept at a time: $R$ times the bytes per sample, 16 MB, whatever $N$, $N_s$, and $N_b$ are.

The sentence to remember: with automatic differentiation, memory grows with the number of samples the renderer evaluates; the adjoint method recomputes instead of storing.

Assumptions of the estimate: every sample's activations are stored, with no checkpointing; 4 KB per sample is about 8 layers of 128 single-precision activations; each bounce adds one secondary ray per camera sample; the network's weights and the images are not counted.

Pause for questions: this ends the neural rendering section. In one line: inverse rendering is rendering inside an optimization loop; NeRF does it with the emission–absorption model, other sensors change only the measurement model, and light that bounces makes the loop expensive, in time (caches) and in memory. Questions to expect: how a NeRF is trained in practice (stratified and hierarchical samples, a batch of rays per step), and how the adjoint method gets gradients without storing the forward pass, which is the next section.

Next: the adjoint method, derived for light transport.
