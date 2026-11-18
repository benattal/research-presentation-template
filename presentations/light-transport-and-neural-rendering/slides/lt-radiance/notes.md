Appendix slide, for a question about radiance or BRDFs. It belongs with the transport operator slide: the two facts behind propagation $G$ and scattering $S$.

- Click 1, beam: one beam from the spotlight on the left wall. In empty space, radiance is the same at every point along a ray, so the beam has the same brightness from the wall to the floor. This is why propagation $G$ only maps the light leaving one surface to the light arriving at the next.
- Clicks 2 to 4: where the reflected light goes is set by the floor's BRDF. From a diffuse floor, light leaves in every direction; from a glossy floor, in a lobe around the mirror direction; from a mirror, in a single beam toward the ceiling.

The numbers beside the finishes are the fraction of the beam's power that leaves the floor. It is 77% for all three, the floor's albedo: where the reflected light goes depends on the BRDF, and how much of it there is depends on the albedo.

The sentence to remember: radiance changes only at surfaces, where the BRDF redistributes it and the albedo scales it.
