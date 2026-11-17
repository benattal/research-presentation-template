Section 4. In neural rendering the problem is reversed: the measurement $x$ is given, and the scene is unknown.

The scene is a learned field, a network that stores density and color. We render it with the models of the previous sections to predict a measurement, and fit the network's parameters until the prediction matches. The render shows light in flight, a pulse partway across the room: time-of-flight measurements are one of the sensors this section covers.
