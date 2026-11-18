Transition: So far the network output physical quantities, and a measurement model computed the pixel from them. The network can also output the measurement itself. Both columns show the ray of the transient quadrature.

- Step 1: A scene field, as in Transient NeRF. The network $F_\theta$ is queried at each sample $\mathbf{x}_i$ along the ray, with the viewing direction, and outputs a density and an albedo, in green. The transient comes from the measurement model, which assumes light reflected once, so it has only that light.
- Step 2: A measurement field, as in Flying with Photons. The same kind of network outputs, at each sample, a density and a whole transient $h_i$: the light leaving that point toward the camera over time, drawn under a few samples. Each $h_i$ is delayed to the camera and composited. It can hold light that bounced more than once: the orange part.

Remember: in both, a network is queried at every sample. A scene field outputs physical quantities and computes the measurement through a model; a measurement field outputs the measurement itself.

Stop (optional), at step 2: which one can show interreflections or caustics? Answer: the measurement field. Its transients can hold any light transport, because no model of it is imposed.

If asked:
- What does each cost? In the scene field, each sample adds to one time bin. In the measurement field, each sample carries a whole transient of many bins.
- What can the scene field do that the measurement field cannot? Its outputs are physical, density and albedo, so they can be edited. The measurement field has only the light as captured.
- Is the orange part computed? No, it is an illustration of later light. The figures are redrawn after Fig. 2 of each paper (Malik et al., NeurIPS 2023 and ECCV 2024).
