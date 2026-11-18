Transition: the memory slide ended with two ways to differentiate a renderer. Automatic differentiation stores every intermediate value of the forward pass; the adjoint method recomputes them instead. This section derives the adjoint method for light transport.

The problem: inverse rendering needs the derivative of each measurement with respect to every scene parameter, and a scene can have millions of parameters. The result of the section: all of these derivatives cost one extra solve of the same transport equation, with the transposed operator $A^\top$, whatever the number of parameters.

The picture shows the solution of that transposed equation, called importance, drawn in cyan. It leaves one camera pixel and spreads through the room along the same rays as light.

The bolt refers to the title of the paper the section ends with: Nimier-David et al., SIGGRAPH 2020, "Radiative backpropagation: an adjoint method for lightning-fast differentiable rendering".

The sentence to remember: gradients of light transport cost one extra transport solve.
