Transition: the transfer equation is $(D - K)L = Q$, and the last slide showed that $D^{-1}$ is an integral along each ray, weighted by transmittance, plus the light from behind.

From $DL = KL + Q$ and the last slide, $L = D^{-1}(KL + Q) + T(d)\,L(d)$. Written term by term, as Gkioulekas's 15-468 lecture (after Jarosz) builds it:

- Step 1: the light from the surface behind the medium, $L(d)$, attenuated by the transmittance of the whole ray, $T(d)$.
- Step 2: the emission along the ray, $D^{-1}Q$: each point's emission, weighted by the transmittance between it and the camera.
- Step 3: the in-scattered light, $D^{-1}KL$, attenuated the same way. The three terms together are the volume rendering equation. Every term is an integral, along the ray ($D^{-1}$) or over directions ($K$), evaluated by quadrature or Monte Carlo. No derivatives of $L$ are needed.
- Step 4: this is the fixed-point equation of the whole lecture, $x = b + Ax$, with $x = L$. The source $b = D^{-1}Q + T(d)\,L(d)$ is the emission plus the attenuated surface light behind the medium: the light that has not scattered. Equivalently $(I - A)x = b$.
- Step 5: $A = D^{-1}K$ is one bounce in the medium: scattering at a point ($K$), then propagation with attenuation to the next point ($D^{-1}$), as the braces say. Between surfaces, one bounce was propagation, then scattering ($A = SG$); here the order is reversed, which does not change the series.
- Step 6: the terms of the series are the light after 0, 1, 2, … scattering events: $b$ has none, $Ab$ is single scattering, $A^2 b$ double scattering, and so on. This is the series of bounces from the surfaces section, with scattering events in place of bounces. It converges for the same reason: each scattering event keeps at most the fraction $\sigma_s / \sigma_t$ of the light, the single-scattering albedo, which is below 1 when the medium absorbs, as the albedo below 1 did at surfaces. In a bounded medium light also leaves through the boundary, so the terms shrink faster still.

The renders on the right: the same glasses of juice with single scattering only (truncated after $Ab$) and with all orders. Dense media like juice or milk get much of their brightness and color from the higher orders.

The sentence to remember: volume rendering is $x = b + Ax$ again, with $A$ one scattering event, and its terms are the orders of scattering.

Next: dropping scattering altogether leaves only $b$, the model neural radiance fields use.

Render from Gkioulekas's CMU 15-468 lecture (after Jarosz), p. 122.
