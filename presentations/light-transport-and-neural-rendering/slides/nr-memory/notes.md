Transition: with secondary rays and bounces, backpropagation has many more values to store.

- With automatic differentiation, every intermediate value of the forward pass is stored for the backward pass. In a volume renderer, these values are the network's activations at every sample.
- An estimate: $M \approx R \cdot N \cdot (1 + N_b N_s) \cdot \text{bytes}$, with $R$ rays per batch, $N$ samples per camera ray, $N_b$ bounces, $N_s$ samples on each secondary ray, and the bytes stored per sample.
- NeRF simulates no bounce ($N_b = 0$): 4,096 rays × 128 samples × 4 KB = 2 GB.
- One bounce with a 64-sample secondary ray from every sample, such as a shadow ray or a projector ray: 65 times more, 130 GB, above one GPU's 80 GB.
- Eight bounces: 513 times NeRF's memory, about 1 TB.
- An adjoint method recomputes each sample in the backward pass instead of storing it, and keeps one sample per ray at a time: $R \cdot \text{bytes}$ = 16 MB, whatever $N$, $N_s$, and $N_b$ are.
- Adjoint methods are derived in the next section.

The sentence to remember: with automatic differentiation, memory grows with the number of samples the renderer evaluates.

Assumptions of the estimate: every sample's activations are stored, with no checkpointing; 4 KB per sample is about 8 layers of 128 single-precision activations; each bounce adds one secondary ray per camera sample; the network's weights and the images are not counted.
