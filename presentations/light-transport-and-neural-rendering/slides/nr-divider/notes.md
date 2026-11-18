This section reverses the problem. So far the scene was known and we computed the light; now the measurements are given and the scene is unknown. We render a guess of the scene with the models of the previous sections, compare the rendering with the measurements, and change the scene until they match.

The plan: the optimization loop itself; neural radiance fields, the first example; the same approach for sensors that measure the time light takes, and for structured light; and last, scenes where light bounces, which have to be rendered with every bounce inside the loop.

The render shows light in flight, a pulse partway across the room: time-of-flight measurements are among the sensors of this section.
