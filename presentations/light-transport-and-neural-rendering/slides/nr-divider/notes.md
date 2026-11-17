Section 4. In neural rendering the problem is reversed: the measurement $x$ is given, and the scene is unknown.

The scene is a learned field, a network that stores density and color. Rendering it with the models of the previous sections gives a predicted measurement, and the network's parameters are fit until the prediction matches. The render shows light in flight, a pulse partway across the room: time-of-flight measurements are one of the sensors this section covers.
