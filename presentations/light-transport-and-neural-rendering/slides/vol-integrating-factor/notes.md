Transition: $D$ acts along each ray, so inverting it means solving an ordinary differential equation along each ray. The tool is the integrating factor.

- Step 1: On the strip, $t$ is the distance from the camera, and the light travels the other way, toward the camera. So the derivative along the light's direction is $-d/dt$, and $DL = KL + Q$ reads $-dL/dt + \sigma_t L = KL + Q$.
- Step 2: Multiply by the transmittance $T(t)$, the fraction of the light from distance $t$ that reaches the camera: the black curve. It falls fastest where $\sigma_t$ is largest. Since $T' = -\sigma_t T$, the left side becomes one derivative, $-\frac{d}{dt}(TL)$.
- Step 3: Integrate from the camera, where $T = 1$, to the far end $d$. The light at the camera is the source weighted by transmittance, the shaded area, plus the light from behind, $L(d)$, attenuated by $T(d)$: the dot.
- Step 4: That integral is $D^{-1}$ applied to the source. Inverting $D$ is an integral along each ray, with no derivative of $L$ left.

Remember: along a ray, $D^{-1}$ is the integral of the source, weighted by transmittance.

If asked:
- What is the strip? $L(t)$, the light travelling toward the camera from a lamp at $t = d$, computed by stepping the differential equation. Its value at the camera, the square on the left, agrees with step 3.
- Why does the shaded curve look like $\sigma_t$? In this figure the source $KL + Q$ is proportional to $\sigma_t$. It is drawn on its own vertical scale.
- Can we move the medium? Drag the purple handle: sideways moves the bump, up and down changes its height.
