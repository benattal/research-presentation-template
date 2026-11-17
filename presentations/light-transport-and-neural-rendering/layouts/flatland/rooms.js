/**
 * The flatland rooms the slides show, built once per floor finish and
 * cached: the room, its operators, the shared fluence table, the steady
 * state of light, and the measured pixel with its importance.
 */
import { createRoom } from './scene.js';
import {
  bounce, bounceAdjoint, buildFluenceTable, buildTransport, pixelResponse, solve,
} from './transport.js';

/**
 * The pixel the adjoint visuals differentiate, as image coordinates
 * [s0, s1] of the room's camera: a patch of floor beside the red wall,
 * lit mostly by light that bounced off that wall.
 */
export const MEASURED_PIXEL = [0.425, 0.455];

const rooms = new Map();
const tables = new Map();

/**
 * The room with `floorFinish`, `light` ('lamp' or 'spot'), and the box
 * moved right by `boxOffset` room units, built once.
 */
export function flatlandRoom(floorFinish = 'diffuse', light = 'lamp', boxOffset = 0) {
  const key = `${floorFinish}:${light}:${boxOffset}`;
  if (!rooms.has(key)) {
    const room = createRoom({ floorFinish, light, boxOffset });
    const transport = buildTransport(room);
    // The table depends only on geometry, which every finish shares.
    const geometry = `${light}:${boxOffset}`;
    if (!tables.has(geometry)) tables.set(geometry, buildFluenceTable(room));
    const steady = solve(transport.emission, (x) => bounce(transport, x));
    const sensor = pixelResponse(transport, ...MEASURED_PIXEL);
    const importance = solve(sensor, (y) => bounceAdjoint(transport, y));
    rooms.set(key, { room, transport, table: tables.get(geometry), steady, sensor, importance });
  }
  return rooms.get(key);
}
