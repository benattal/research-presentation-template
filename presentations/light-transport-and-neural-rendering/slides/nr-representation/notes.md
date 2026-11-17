Transition: on every slide so far, the network output physical quantities (density, albedo) and a measurement model computed the pixel from them. The measurement itself can also be the network's output.

- Top, a scene field (Transient NeRF, Malik et al., NeurIPS 2023): the network outputs physical quantities, density $\sigma$ and color $c$. The time-resolved measurement is computed from them with the measurement model: each sample's contribution goes into the time bin of its round-trip distance, and the result is convolved with the laser pulse. The physics is in the model, so the result can only be what the model allows, for example direct reflection only.
- Bottom, a measurement field (Flying with Photons, Malik et al., ECCV 2024): the network outputs, at every point, a whole transient (the light leaving that point over time) along with a density. The transients are shifted by the travel time to the camera and composited. This field can represent any light transport, including interreflections and caustics, because no model of it is imposed.

The sentence to remember: a scene field needs a measurement model and generalizes through it; a measurement field is the measurement itself, with any effect represented, but has no physical parameters to edit.

Cost: in the scene field each sample contributes to one time bin; in the measurement field each sample has a full transient of $N$ bins.

Both papers assume what the figures show: Transient NeRF assumes single-bounce transport with a coaxial laser and sensor; Flying with Photons models interreflections, refraction, and caustics, which Transient NeRF cannot.

Next: what a NeRF's color contains, and why changing the light is hard.

Figure 2 of each paper.
