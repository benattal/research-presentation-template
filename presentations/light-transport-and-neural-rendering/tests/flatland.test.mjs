/**
 * The flatland room's operators: propagation conserves light in the closed
 * room, scattering conserves energy up to the albedo, the Neumann series
 * converges to the steady state, and the adjoint gives the same
 * measurement and the same gradient as the forward solve.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BINS, binCosine, createRoom, stateIndex } from '../layouts/flatland/scene.js';
import {
  addVectors, bounce, bounceAdjoint, buildFluenceTable, buildTransport, fluence, outgoingFlux, pixelResponse,
  propagate, scatter, scatterAdjoint, seriesTerms, solve,
} from '../layouts/flatland/transport.js';

const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);

describe('flatland transport', () => {
  const transport = buildTransport(createRoom());
  const { room, emission } = transport;

  it('propagation gathers every direction in the closed room', () => {
    const { rowStart, values } = transport.propagation;
    for (let row = 0; row < room.size; row += 1) {
      let sum = 0;
      for (let k = rowStart[row]; k < rowStart[row + 1]; k += 1) sum += values[k];
      assert.ok(Math.abs(sum - 1) < 1e-9, `row ${row} sums to ${sum}`);
    }
  });

  it('scattering reflects albedo × incident flux, for every finish', () => {
    for (const floorFinish of ['diffuse', 'glossy', 'mirror']) {
      const t = buildTransport(createRoom({ floorFinish }));
      const floor = t.room.patches.find((patch) => patch.group === 'floor');
      for (let bin = 0; bin < BINS; bin += 1) {
        const incident = new Float64Array(t.room.size * 3);
        incident[stateIndex(floor.index, bin) * 3] = 1;
        const outgoing = scatter(t, incident);
        let flux = 0;
        for (let out = 0; out < BINS; out += 1) flux += outgoing[stateIndex(floor.index, out) * 3] * binCosine(out);
        const expected = floor.albedo[0] * binCosine(bin);
        assert.ok(Math.abs(flux - expected) < 1e-9, `${floorFinish} bin ${bin}: ${flux} vs ${expected}`);
      }
    }
  });

  it('bounce is scattering after propagation', () => {
    const viaParts = scatter(transport, propagate(transport, emission));
    assert.deepEqual(Array.from(bounce(transport, emission)), Array.from(viaParts));
  });

  it('each bounce carries less light, and the partial sums converge to the steady state', () => {
    const terms = seriesTerms(emission, 60, (x) => bounce(transport, x));
    const fluxes = terms.map((term) => outgoingFlux(transport, term));
    for (let k = 1; k < fluxes.length; k += 1) assert.ok(fluxes[k] < fluxes[k - 1]);
    const x = solve(emission, (v) => bounce(transport, v));
    const partial = terms.reduce((sum, term) => addVectors(sum, term));
    const error = Math.max(...partial.map((value, i) => Math.abs(value - x[i])));
    assert.ok(error < 1e-3 * Math.max(...x), `error ${error}`);
    const residual = addVectors(emission, bounce(transport, x)).map((value, i) => value - x[i]);
    assert.ok(Math.max(...residual.map(Math.abs)) < 1e-8 * Math.max(...x));
  });

  it('the adjoint solve reads the same pixel: qᵀ(I − A)⁻¹e = ((I − Aᵀ)⁻¹q)ᵀe', () => {
    const q = pixelResponse(transport, 0.42, 0.46);
    const x = solve(emission, (v) => bounce(transport, v));
    const y = solve(q, (v) => bounceAdjoint(transport, v));
    const forward = dot(q, x);
    const adjoint = dot(y, emission);
    assert.ok(Math.abs(forward - adjoint) < 1e-8 * forward, `${forward} vs ${adjoint}`);
  });

  it('the adjoint gradient yᵀ(∂A)x matches a finite difference of the pixel', () => {
    const q = pixelResponse(transport, 0.42, 0.46);
    const x = solve(emission, (v) => bounce(transport, v));
    const y = solve(q, (v) => bounceAdjoint(transport, v));
    // ∂A/∂ρ for the red wall's red albedo: S is linear in the albedo, so ∂A = (S/ρ restricted to the wall) G.
    const wall = room.patches.filter((patch) => patch.group === 'left wall').map((patch) => patch.index);
    const incident = propagate(transport, x);
    const masked = new Float64Array(incident.length);
    for (const p of wall) {
      for (let bin = 0; bin < BINS; bin += 1) masked[stateIndex(p, bin) * 3] = incident[stateIndex(p, bin) * 3];
    }
    const rho = room.patches[wall[0]].albedo[0];
    const gradient = dot(y, scatter(transport, masked)) / rho;

    const h = 1e-4;
    const bumped = createRoom();
    for (const p of wall) bumped.patches[p].albedo = [rho + h, ...bumped.patches[p].albedo.slice(1)];
    const t2 = buildTransport(bumped);
    const x2 = solve(t2.emission, (v) => bounce(t2, v));
    const finiteDifference = (dot(q, x2) - dot(q, x)) / h;
    assert.ok(Math.abs(gradient - finiteDifference) < 1e-3 * Math.abs(finiteDifference), `${gradient} vs ${finiteDifference}`);
  });

  it('the fluence table sees light everywhere in the room and nothing inside the box', () => {
    const table = buildFluenceTable(room, { width: 40, height: 24, directions: 64 });
    const phi = fluence(table, emission);
    let lit = 0;
    for (let cell = 0; cell < table.width * table.height; cell += 1) {
      if (table.solid[cell]) assert.equal(phi[cell * 3], 0);
      else if (phi[cell * 3] > 0) lit += 1;
    }
    assert.ok(lit > 0.6 * table.width * table.height);
  });

  it('importance leaving the floor, drawn from the rays\' ends, stays within its extent of the floor', () => {
    const table = buildFluenceTable(room, { width: 80, height: 48, directions: 96 });
    const q = pixelResponse(transport, 0.425, 0.455);
    const leaving = scatterAdjoint(transport, q);
    const floor = new Set();
    for (let i = 0; i < q.length; i += 1) if (q[i]) floor.add(Math.floor(i / 3 / BINS));
    const ends = [...floor].map((p) => room.patches[p]);
    const [left, right] = [Math.min(...ends.map((p) => p.a[0])), Math.max(...ends.map((p) => p.b[0]))];
    const extent = 2;
    const phi = fluence(table, leaving, extent, { from: 'destination', at: 'destination' });
    let near = 0;
    for (let cell = 0; cell < table.width * table.height; cell += 1) {
      const x = ((cell % table.width) + 0.5) / table.width * 10;
      const y = 6 - (Math.floor(cell / table.width) + 0.5) / table.height * 6;
      const distance = Math.hypot(Math.max(0, left - x, x - right), y);
      if (distance > extent + 0.1) assert.equal(phi[cell * 3], 0, `importance at (${x.toFixed(2)}, ${y.toFixed(2)})`);
      else if (phi[cell * 3] > 0) near += 1;
    }
    assert.ok(near > 0);
  });
});

describe('flatland albedo gradients', () => {
  it('the adjoint gradient of a wall matches a finite difference', async () => {
    const { albedoGradients, finiteDifference } = await import('../layouts/flatland/gradients.js');
    const transport = buildTransport(createRoom());
    const q = pixelResponse(transport, 0.425, 0.455);
    const x = solve(transport.emission, (v) => bounce(transport, v));
    const y = solve(q, (v) => bounceAdjoint(transport, v));
    const gradients = albedoGradients(transport, x, y);
    const wall = transport.room.patches.filter((patch) => patch.group === 'left wall');
    const adjoint = wall.reduce((sum, patch) => sum + gradients[patch.index], 0);
    const difference = finiteDifference('diffuse', q, 'left wall');
    assert.ok(Math.abs(adjoint - difference) < 1e-3 * Math.abs(difference), `${adjoint} vs ${difference}`);
  });
});
