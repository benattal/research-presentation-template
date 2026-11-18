One random direction. Instead of every direction, sample one, $\omega_i$, from a probability density $p(\omega_i)$: here the cosine lobe, the dashed circle. The light of the surface in that direction arrives at $\mathbf{x}$, and the estimate is $f_r L_i \cos\theta_i / p(\omega_i)$: one term of the integrand, divided by the density of the direction drawn.

Question to the class: why divide by $p(\omega_i)$? Why is one random direction, weighted this way, a fair estimate of the whole integral? Give them a moment; a hint is to compute its expected value.

Answer (on the next click): the expected value of a function of a random direction is its integral against the density, so

$$\mathbb{E}\Big[\frac{f_r L_i \cos\theta_i}{p(\omega_i)}\Big] = \int_{H^2} \frac{f_r L_i \cos\theta_i}{p(\omega_i)}\, p(\omega_i)\, d\omega_i = \int_{H^2} f_r L_i \cos\theta_i \, d\omega_i.$$

The density cancels: the estimate is unbiased, whatever $p$ is, as long as $p$ is positive wherever the integrand is not zero. Directions drawn often are divided by a large density, rare ones by a small one. Its variance depends on $p$: it is smallest when $p$ follows the integrand. Here $p$ is the cosine lobe, $p(\theta) = \cos\theta / 2$ in flatland, so for the diffuse floor the estimate is the albedo times the light arriving along $\omega_i$.
