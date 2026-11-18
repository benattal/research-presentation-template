Transition: on every slide so far, the network gave physical quantities (density, albedo), and a measurement model computed the pixel from them. The network can also give the measurement itself.

- Top, a scene field (Transient NeRF, Malik et al., NeurIPS 2023): the network gives density $\sigma$ and color $c$. The time-resolved measurement is computed from them with the measurement model: each sample's contribution goes into the time bin of its round-trip distance, and the result is convolved with the laser pulse. The physics is in the model, so the result can only be what the model allows: here, light reflected once.
- Bottom, a measurement field (Flying with Photons, Malik et al., ECCV 2024): at every point the network gives a whole transient, the light leaving that point over time, along with a density. The transients are shifted by the travel time to the camera and composited. This field can represent any light transport, interreflections and caustics included, because no model of it is imposed.

The sentence to remember: a scene field needs a measurement model and generalizes through it; a measurement field is the measurement itself, with any effect represented, but has no physical parameters to edit.

The question it invites: which would you use to relight the scene? The scene field: it has the physical quantities a new light acts on. The measurement field has only the light as captured. The cost differs too: in the scene field each sample adds to one time bin; in the measurement field each sample carries a transient of $N$ bins.

Both papers state what the figures show: Transient NeRF assumes light reflected once, with a laser and sensor on the same axis; Flying with Photons models interreflections, refraction, and caustics, which Transient NeRF cannot.

Next: what a NeRF's color contains, and why changing the light is hard.

Figure 2 of each paper.
