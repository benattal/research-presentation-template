Transition: The last slide inverted $D$ along each ray. Now we put the result in the form we have used all lecture.

- Step 1: From the integrating factor, the light at the camera has three terms: the background, attenuated by $T(d)$; the emission along the ray, $D^{-1}Q$; and the in-scattered light, $D^{-1}KL$. Each is an integral we can evaluate. But the unknown $L$ appears on both sides.
- Step 2: So this is a fixed-point equation, $x = b + Ax$, with $x = L$. The source $b$ collects the terms without $L$: the background and the emission. It takes the place of $e$ in $x = e + Ax$ from the operator light transport section.
- Step 3: $A = D^{-1}K$ is one bounce in the medium: scattering at a point, $K$, then propagation with attenuation to the next point, $D^{-1}$. Between surfaces, $A$ was also one scattering and one propagation.
- Step 4: So everything we know about $x = b + Ax$ applies, including the series: the light after zero, one, two, and more scattering events. The renders show juice with single scattering only, the series cut after $Ab$, and with every order. Dense media get much of their color from the higher orders.

Remember: volume rendering is $x = b + Ax$ again, with $A$ one scattering event in the medium.

Stop (optional), at step 4: what is left of this equation with no scattering, $\sigma_s = 0$? Answer: $K = 0$, so $A = 0$ and $x = b$: the emission along the ray and the attenuated background. That is the next slide.

If asked:
- Does the series converge? For the same reason as between surfaces. Each scattering event keeps at most the fraction $\sigma_s / \sigma_t$ of the light, the single-scattering albedo, and light also leaves through the boundary.
- Why is $A$ scattering then propagation here, but $SG$, propagation then scattering, between surfaces? Both are one scattering and one propagation. The order depends on where $x$ is defined: on the light leaving surfaces there, on the light along rays here.
- How are the terms evaluated? Each is an integral along the ray or over directions, so quadrature or Monte Carlo applies, with no derivative of $L$.
- Where are the renders from? Gkioulekas's CMU 15-468 lecture, after Jarosz, p. 122.
