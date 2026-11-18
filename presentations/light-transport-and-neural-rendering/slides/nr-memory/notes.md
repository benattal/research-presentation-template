Transition: Every method in this section takes gradients through a renderer, and with bounces, the renderer evaluates many more samples.

- Step 1: Automatic differentiation stores every intermediate value of the forward pass: in a volume renderer, the network's activations at every sample.
- Step 2: So memory grows with samples and bounces. NeRF needs about 2 GB for a batch of 4,096 rays of 128 samples. One bounce, with a 64-sample ray from each sample, needs 65 times more, more than one GPU has.
- Step 3: The adjoint method recomputes each sample in the backward pass instead of storing it, so memory no longer grows with the samples.

Remember: with automatic differentiation, memory grows with the samples the renderer evaluates; the adjoint method recomputes instead of storing.

Pause for questions: this ends the neural rendering section. In one line: inverse rendering is rendering inside an optimization loop; other sensors change only the measurement model, and bounces make the loop expensive in time and in memory.

If asked:
- How is the memory estimated? About $R \cdot N \cdot (1 + N_b N_s)$ times the bytes per sample, with $R$ rays per batch, $N$ samples per camera ray, $N_b$ bounces, and $N_s$ samples per secondary ray. 4 KB per sample is about 8 layers of 128 single-precision activations, with no checkpointing; the weights and images are not counted.
- And with eight bounces? About a terabyte.
- How much does the adjoint method need? One sample per ray at a time: about 16 MB here, whatever the number of samples and bounces.
- How does it get gradients without storing the forward pass? That is the next section.
