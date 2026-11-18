Transition: the transfer equation is $DL = KL + Q$, and the last slide inverted $D$: $L = D^{-1}(KL + Q) + T(d)\,L(d)$. Written term by term, as Gkioulekas's 15-468 lecture (after Jarosz) builds it:

- Step 1: the light from the surface behind the medium, $L(d)$, attenuated by the transmittance of the whole ray, $T(d)$.
- Step 2: the emission along the ray, $D^{-1}Q$: the emission at each point, weighted by the transmittance between that point and the camera.
- Step 3: the in-scattered light, $D^{-1}KL$, attenuated the same way. The three terms together are the volume rendering equation. Each is an integral, along the ray ($D^{-1}$) or over directions ($K$), which quadrature or Monte Carlo can evaluate; no derivative of $L$ is needed.
- Step 4: this is the fixed-point equation of the whole lecture, $x = b + Ax$, with $x = L$. The source $b = D^{-1}Q + T(d)\,L(d)$ is the light that has not scattered: emission plus the attenuated surface behind. Equivalently, $(I - A)x = b$.
- Step 5: $A = D^{-1}K$ is one bounce in the medium: scattering at a point ($K$), then propagation with attenuation to the next point ($D^{-1}$), as the braces say. Between surfaces it was $A = SG$, propagation then scattering. Here the order is scattering then propagation; each is still one interaction and one transport step.
- Step 6: the terms of the series are the light after 0, 1, 2, … scattering events. $b$ has none, $Ab$ is single scattering, $A^2 b$ double scattering, and so on: the series of bounces of the surfaces section, with scattering events in place of bounces. It converges for the same reason. Each scattering event keeps at most the fraction $\sigma_s / \sigma_t$ of the light, the single-scattering albedo, which is below 1 when the medium absorbs, as albedos below 1 did at surfaces; light leaving through the boundary makes the terms shrink faster still.

The renders on the right: glasses of juice with single scattering only (the series cut after $Ab$) and with every order. Dense media such as juice or milk get much of their brightness and color from the higher orders.

The sentence to remember: volume rendering is $x = b + Ax$ again, with $A$ one scattering event, and its terms are the orders of scattering.

Question to the class, to end the slide: what is left of this equation with no scattering, $\sigma_s = 0$? Answer: $K = 0$, so $A = 0$ and $x = b$: the emission along the ray and the attenuated background, with no unknown on the right side. The next slide is that model.

Render from Gkioulekas's CMU 15-468 lecture (after Jarosz), p. 122.
