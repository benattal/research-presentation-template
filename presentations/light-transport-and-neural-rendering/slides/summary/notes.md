What to take away, one line per part of the lecture, in the order of the outline. Click once per row.

- **Light transport.** Light in steady state is the solution of a linear fixed-point equation, $x = e + Ax$, and the solution is the sum over bounces $\sum_k A^k e$. Path tracing estimates the same sum with random walks.
- **Computational imaging.** With a projector and a camera, light transport $\mathbf{T}$ can be measured and probed optically: relighting, dual photography, optical computing, direct and global separation.
- **Volume rendering.** In a participating medium the equation keeps the same form: in-scattering plays the role of scattering, and propagation includes attenuation.
- **Neural rendering.** A scene representation is fit to measurements through this model, for photographs, time of flight, and structured light.
- **Adjoint light transport.** The gradient of a loss with respect to every parameter costs one extra solve, with $A^\top$: importance, transported like light.

One sentence: one linear equation for light, and three things we do with it: solve it, measure it, and differentiate it.
