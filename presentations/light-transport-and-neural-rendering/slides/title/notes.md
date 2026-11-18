Welcome. This lecture is about light transport, the equations a renderer solves to compute how light moves through a scene, and about neural rendering, which recovers a scene from measurements by rendering a model of it and fitting the model.

The top row is rendered light transport:

- **Indirect light.** All of the light in this room comes through a slightly open door from the room next to it. To render it, a renderer has to find the few light paths through that gap (Veach's thesis, Fig. 11.7).
- **Caustics.** Light focused by the ripples on the water onto the floor of a pool, seen through the water surface (Veach, Fig. 11.9).
- **Participating media.** Light inside the wine, the juice, and the liquid in the pitcher, which absorb and scatter it as it passes through; the glass around them refracts it (a render from Gkioulekas's rendering course, after Jarosz).

The bottom row is neural rendering, scenes reconstructed from measurements and rendered again:

- **Light in flight.** A pulse of light travelling through a bottle, rendered from new, moving viewpoints. The scene was fit to videos captured with picosecond time resolution (Malik et al., ECCV 2024).
- **Depth from time of flight.** Depth of a moving person, rendered from a radiance field fit to color and time-of-flight video (TöRF, Attal et al., NeurIPS 2021).
- **Relighting.** An object whose geometry and materials were recovered from images, rendered under new lighting (Flash Cache, Attal et al., ECCV 2024).

The whole lecture is built on one linear equation for light, $x = b + Ax$: we solve it, measure it, fit it to data, and differentiate it.

To remember: rendering solves an equation for light, and neural rendering fits a scene so that the solution matches what was measured.

If asked how the top row was made: with Monte Carlo methods that sample light paths (the first two with Metropolis light transport, in Veach's thesis). The operator light transport section shows the sum over light paths that such methods estimate.
