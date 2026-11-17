/**
 * The numbers the "Multiple bounces" slide (lt-iterate) labels: each
 * bounce of the lamp's light in the flatland room has about 0.64 of the
 * light of the one before, and that ratio tends to the spectral radius of
 * the bounce operator, rho(A) = 0.69 (power iteration), which is below 1.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { flatlandRoom } from '../layouts/flatland/rooms.js';
import { bounce, outgoingFlux } from '../layouts/flatland/transport.js';

const norm = (v) => Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));

describe('bounce ratio of the lamp-lit room', () => {
  const { transport } = flatlandRoom('diffuse', 'lamp');

  // A is nonnegative, so power iteration from a positive vector finds its dominant eigenvalue.
  let v = new Float64Array(transport.emission.length).fill(1);
  let rho = 0;
  for (let i = 0; i < 200; i += 1) {
    const w = bounce(transport, v);
    rho = norm(w) / norm(v);
    v = w.map((x) => x / norm(w));
  }

  const fluxes = [outgoingFlux(transport, transport.emission)];
  let term = transport.emission;
  for (let k = 1; k <= 80; k += 1) {
    term = bounce(transport, term);
    fluxes.push(outgoingFlux(transport, term));
  }
  const ratio = (k) => fluxes[k] / fluxes[k - 1];

  it('has spectral radius 0.69, below 1', () => {
    assert.ok(Math.abs(rho - 0.69) < 0.005, `rho(A) = ${rho}`);
  });

  it('shrinks each of the first four bounces by about 0.64', () => {
    for (let k = 1; k <= 4; k += 1) assert.ok(Math.abs(ratio(k) - 0.64) < 0.015, `ratio ${k} = ${ratio(k)}`);
  });

  it('has a bounce ratio that tends to rho(A)', () => {
    assert.ok(Math.abs(ratio(80) - rho) < 0.002, `ratio 80 = ${ratio(80)}, rho = ${rho}`);
  });
});
