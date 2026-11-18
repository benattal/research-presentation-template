/**
 * Seeded randomness for the volume visuals, so the same build step always
 * draws the same samples and photons.
 */

/**
 * A uniform random number generator on [0, 1) (mulberry32). The same seed
 * gives the same sequence; seeds are 32-bit integers.
 */
export function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}
