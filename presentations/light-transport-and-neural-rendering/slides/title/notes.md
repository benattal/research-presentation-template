Transition: Welcome. This lecture is about light transport, the equations a renderer solves to compute how light moves through a scene, and about neural rendering, which recovers a scene from measurements.

- Step 1: The top row is rendered light transport: light through a slightly open door, caustics on the floor of a pool, and light scattered inside liquids. The bottom row is neural rendering, scenes reconstructed from measurements and rendered again: a pulse of light travelling through a bottle, depth from time-of-flight video, and an object relit under new lighting. The whole lecture is built on one linear equation for light. We solve it, measure its solution, fit it to data, and differentiate it.

Remember: rendering solves an equation for light, and neural rendering fits a scene so that the solution matches the measurements.

If asked:
- How was the top row made? With Monte Carlo methods that sample light paths, the first two with Metropolis light transport in Veach's thesis (Figs. 11.7 and 11.9). The operator light transport section shows the sum over paths that these methods estimate.
- Where is the bottom row from? Light in flight: Malik et al., ECCV 2024, fit to videos with picosecond time resolution. Depth: TöRF, NeurIPS 2021, a radiance field fit to color and time-of-flight video. Relighting: Flash Cache, ECCV 2024, geometry and materials recovered from images.
