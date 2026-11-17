/**
 * The derivative of the volume rendering quadrature with respect to each
 * sample's density, computed as the adjoint method does: from the final
 * color and one more march along the ray, with nothing stored per sample.
 *
 * For Ĉ = Σᵢ Tᵢ αᵢ cᵢ with αᵢ = 1 − e^{−σᵢδᵢ} and Tᵢ = e^{−Σⱼ<ᵢ σⱼδⱼ}:
 *
 *   ∂Ĉ/∂σᵢ = δᵢ (Tᵢ₊₁ cᵢ − (Ĉ − Ĉ≤ᵢ)),
 *
 * where Tᵢ₊₁ = Tᵢ e^{−σᵢδᵢ} and Ĉ≤ᵢ = Σₖ≤ᵢ Tₖ αₖ cₖ. The first term is
 * sample i becoming more opaque; the second is everything behind it, which
 * a larger σᵢ dims by the fraction δᵢ. Colors are linear RGB.
 */

/**
 * Per term of a `composite` result (volume/ray.js): the running sum from
 * the front `front` (Ĉ≤ᵢ), the color behind the sample `behind`
 * (Ĉ − Ĉ≤ᵢ, the running sum from the back), and `gradient` (∂Ĉ/∂σᵢ), each
 * an RGB array. One march from the front, using only the final color Ĉ.
 */
export function densityGradients(result) {
  const front = [0, 0, 0];
  return result.terms.map((term) => {
    for (let k = 0; k < 3; k += 1) front[k] += term.weight * term.color[k];
    const next = term.transmittance * (1 - term.alpha);
    const behind = result.color.map((total, k) => total - front[k]);
    const gradient = term.color.map((c, k) => term.delta * (next * c - behind[k]));
    return { front: [...front], behind, gradient };
  });
}

/** Luminance of linear RGB, for plotting a color as one number. */
export function luminance([r, g, b]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
