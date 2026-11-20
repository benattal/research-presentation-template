/**
 * The corner scene of the lidar slide and the light transport it shows:
 * two relay walls meeting in a corner on a floor, a teapot (the occluder),
 * a bunny hidden behind it in the corner, and a confocal lidar in front.
 * Room, teapot, and bunny follow the supplemental website's light
 * transport figure (its Blender scene, with x, y, z there being z, x, y
 * here). Lengths are meters (y up, the floor at y = 0, the walls on the
 * planes x = 0 and z = 0), times are nanoseconds, points are [x, y, z].
 *
 * No DOM: the renderer (lidarRender.js), the timeline, and the measurement
 * plot read the same numbers.
 */
import * as THREE from 'three';
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';

/** The speed of light, in m/ns. */
export const LIGHT_SPEED = 0.3;
/** The standard deviation of the laser pulse as drawn and as measured, in ns. */
const PULSE_SIGMA = 0.17;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const radians = (degrees) => (degrees * Math.PI) / 180;

/* ---------------------------------------------------------------------------
 * The room and what stands in it.
 * ------------------------------------------------------------------------ */

/**
 * The floor is `size` × `size` from the corner, the walls are `height`
 * tall, and slabs are `thickness` thick. The website's room is 2 m wide;
 * this one ends past the teapot, so the lidar stands in front of the floor.
 */
export const ROOM = { size: 1.3, height: 1.1, thickness: 0.03 };

/** The occluder: the Utah teapot, its base centered at `position`, the spout along +x before `yaw` (about +y). */
export const TEAPOT = { position: [0.759, 0, 0.857], height: 0.4186, widthScale: 0.85, yaw: radians(-135) };

/** The hidden object: the Stanford bunny, its base centered at `position`, the head along -x before `yaw`. */
export const BUNNY = { position: [0.36, 0, 0.36], height: 0.46, yaw: radians(145) };

/** The teapot's surface in world coordinates: built once for the page and shared. */
let teapot = null;
export function teapotGeometry() {
  if (teapot) return teapot;
  const geometry = new TeapotGeometry(1, 16);
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const scale = TEAPOT.height / (max.y - min.y);
  geometry.translate(0, -min.y, 0);
  geometry.scale(scale * TEAPOT.widthScale, scale, scale * TEAPOT.widthScale);
  geometry.rotateY(TEAPOT.yaw);
  geometry.translate(...TEAPOT.position);
  geometry.computeBoundingSphere();
  teapot = geometry;
  return teapot;
}

/** Bytes of the bunny's mesh image before its vertices (make-bunny-mesh.mjs, among the slide's sources, documents the format). */
const MESH_HEADER_BYTES = 36;

/**
 * The bunny's surface in world coordinates, from the pixels (RGBA bytes)
 * of its mesh image: three bytes per pixel hold the vertex and triangle
 * counts, the bounding box, the vertices as 16-bit fractions of the box,
 * and the triangles as 16-bit indices.
 */
export function bunnyGeometry(rgba) {
  const bytes = new Uint8Array((rgba.length / 4) * 3);
  for (let pixel = 0; pixel < rgba.length / 4; pixel++) {
    bytes[3 * pixel] = rgba[4 * pixel];
    bytes[3 * pixel + 1] = rgba[4 * pixel + 1];
    bytes[3 * pixel + 2] = rgba[4 * pixel + 2];
  }
  const view = new DataView(bytes.buffer);
  const uint24 = (offset) => (bytes[offset] << 16) | (bytes[offset + 1] << 8) | bytes[offset + 2];
  const vertexCount = uint24(0);
  const triangleCount = uint24(3);
  const box = Array.from({ length: 6 }, (_, k) => view.getFloat32(6 + 4 * k, true));
  if (MESH_HEADER_BYTES + 6 * (vertexCount + triangleCount) > bytes.length || !box.every(Number.isFinite)) {
    throw new Error('lidarCapture: the hidden object\'s mesh image does not hold a mesh');
  }

  const positions = new Float32Array(3 * vertexCount);
  for (let i = 0; i < positions.length; i++) {
    const axis = i % 3;
    positions[i] = box[axis] + (view.getUint16(MESH_HEADER_BYTES + 2 * i) / 65535) * (box[axis + 3] - box[axis]);
  }
  const indices = new Uint16Array(3 * triangleCount);
  for (let i = 0; i < indices.length; i++) indices[i] = view.getUint16(MESH_HEADER_BYTES + 6 * vertexCount + 2 * i);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  const scale = BUNNY.height / (box[4] - box[1]);
  geometry.translate(-(box[0] + box[3]) / 2, -box[1], -(box[2] + box[5]) / 2);
  geometry.scale(scale, scale, scale);
  geometry.rotateY(BUNNY.yaw);
  geometry.translate(...BUNNY.position);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/* ---------------------------------------------------------------------------
 * The lidar: a pulsed laser, a beamsplitter, a pair of scanning mirrors,
 * and a single-photon detector behind an objective lens, on a breadboard.
 * The lidar's frame has its origin at the center of the board's top, -z
 * toward the scene, +x to the right of that; it is turned by `yaw` about
 * +y and drawn `scale` times the size of its parts' dimensions (larger
 * than life beside the scene, as hardware is in such renders, so that its
 * parts read). The laser's light passes the beamsplitter to the mirrors
 * and leaves for the scene; light from the scene returns by the mirrors
 * and the beamsplitter sends it to the detector.
 * ------------------------------------------------------------------------ */

/** Height of the beam above the board, in the lidar's frame. */
const BEAM_HEIGHT = 0.11;
const LIDAR_SCALE = 1.45;
/** Where the scanning mirrors stand (x, z): on the line from the bunny through the teapot, in front of the floor. */
const MIRRORS_AT = [1.349, 1.592];

const LIDAR_YAW = radians(45);
const LIDAR_PARTS = {
  mirrors: [0.14, BEAM_HEIGHT, -0.15],
  beamsplitter: [-0.03, BEAM_HEIGHT, -0.15],
  laser: [-0.125, BEAM_HEIGHT, -0.15],
  detector: [-0.03, BEAM_HEIGHT, 0.045],
};

function turn([x, y, z], yaw) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [x * c + z * s, y, -x * s + z * c];
}

const mirrorsOffset = turn(LIDAR_PARTS.mirrors, LIDAR_YAW).map((value) => value * LIDAR_SCALE);

/**
 * The lidar: `board` is the breadboard's size, `origin`, `yaw`, and
 * `scale` place the lidar's frame in the world, and `parts` are points of
 * the beam's path in that frame: the laser's aperture, the centers of the
 * beamsplitter and of the scanning mirrors, and the detector's face.
 */
export const LIDAR = {
  board: [0.66, 0.03, 0.5],
  yaw: LIDAR_YAW,
  scale: LIDAR_SCALE,
  origin: [MIRRORS_AT[0] - mirrorsOffset[0], 0, MIRRORS_AT[1] - mirrorsOffset[2]],
  beamHeight: BEAM_HEIGHT,
  parts: LIDAR_PARTS,
};

/** A point of the lidar's frame in world coordinates. */
export function lidarPoint(local) {
  const turned = turn(local, LIDAR.yaw);
  return LIDAR.origin.map((value, axis) => value + LIDAR.scale * turned[axis]);
}

/** The beam's path inside the lidar, in world coordinates. */
export const BEAM = {
  laser: lidarPoint(LIDAR_PARTS.laser),
  beamsplitter: lidarPoint(LIDAR_PARTS.beamsplitter),
  mirrors: lidarPoint(LIDAR_PARTS.mirrors),
  detector: lidarPoint(LIDAR_PARTS.detector),
};

/** Path lengths inside the lidar (m): laser to mirrors, mirrors to detector. */
const LASER_TO_MIRRORS = distance(BEAM.laser, BEAM.beamsplitter) + distance(BEAM.beamsplitter, BEAM.mirrors);
const MIRRORS_TO_DETECTOR = distance(BEAM.mirrors, BEAM.beamsplitter) + distance(BEAM.beamsplitter, BEAM.detector);

/**
 * When the direct return from a visible `point` reaches the detector, in
 * ns from the moment the pulse leaves the laser: the time of flight.
 */
export function directTime(point) {
  return (LASER_TO_MIRRORS + 2 * distance(BEAM.mirrors, point) + MIRRORS_TO_DETECTOR) / LIGHT_SPEED;
}

/**
 * The visible points whose measurements the slide shows one at a time, in
 * the order it shows them: x_p on the wall x = 0 first (the measurement
 * drawn in full), then points on the floor and on both walls. Each has the
 * surface's `normal` there, and `indirectEnd`: a delay (ns after the direct
 * return) by which the indirect light of the point has passed, which the
 * timeline needs before the hidden object's mesh has loaded
 * (`measureIndirect` checks it).
 */
const MEASURED = [
  { point: [0, 0.62, 1.1], normal: [1, 0, 0], indirectEnd: 9 },
  { point: [0.12, 0, 1], normal: [0, 1, 0], indirectEnd: 5.5 },
  { point: [0.95, 0.3, 0], normal: [0, 0, 1], indirectEnd: 4.95 },
  { point: [0, 0.85, 0.6], normal: [1, 0, 0], indirectEnd: 6.1 },
];

/**
 * The measured points with the times of their measurements, in ns from the
 * moment the pulse leaves the laser: `hit` when it reaches the point,
 * `direct` when the direct return reaches the detector. Indirect light
 * that travels a distance r from the point to a hidden surface and back
 * arrives 2r/c after `direct`. `strength` is how much direct light the
 * point returns, cos θ / d² for the beam's angle to the normal and the
 * point's distance from the mirrors (to compare measurements).
 */
export const RELAYS = MEASURED.map((relay) => {
  const reach = distance(BEAM.mirrors, relay.point);
  return {
    ...relay,
    hit: (LASER_TO_MIRRORS + reach) / LIGHT_SPEED,
    direct: directTime(relay.point),
    strength: dot(relay.normal, sub(BEAM.mirrors, relay.point)) / reach ** 3,
  };
});

/** The pulse's shape at time offset `t` (ns): 1 at its peak. */
export function pulse(t) {
  return Math.exp(-(t * t) / (2 * PULSE_SIGMA * PULSE_SIGMA));
}

/* ---------------------------------------------------------------------------
 * Rays.
 * ------------------------------------------------------------------------ */

/** The room's surfaces as planes `axis = 0`, bounded by the room's size and, for the walls, its height. */
const ROOM_PLANES = [
  { surface: 'floor', axis: 1, normal: [0, 1, 0] },
  { surface: 'wallX', axis: 0, normal: [1, 0, 0] },
  { surface: 'wallZ', axis: 2, normal: [0, 0, 1] },
];

function inRoom([x, y, z]) {
  const margin = 1e-9;
  return x >= -margin && x <= ROOM.size && z >= -margin && z <= ROOM.size && y >= -margin && y <= ROOM.height;
}

/** The first of the room's surfaces a ray reaches, as `cast` returns it, or null. */
function castRoom(origin, direction) {
  let best = null;
  for (const { surface, axis, normal } of ROOM_PLANES) {
    if (direction[axis] >= 0) continue;
    const t = -origin[axis] / direction[axis];
    const point = origin.map((value, k) => value + t * direction[k]);
    point[axis] = 0;
    if (t > 1e-6 && inRoom(point) && (!best || t < best.distance)) best = { point, normal, distance: t, surface };
  }
  return best;
}

/** Edge of the cells the teapot's surface is sorted into, in m: how closely `castCells` and `clear` follow it. */
const OCCLUDER_CELL = 0.008;

/**
 * The cells of a grid that a surface passes through, for the many rays
 * that need the surface only to a cell (testing every triangle for each
 * of them takes seconds). `reach(ox, oy, oz, dx, dy, dz, from, to)`
 * returns the distance along the ray (origin o, unit direction d) to the
 * first such cell between the distances `from` and `to`, or -1;
 * `normal(direction)` is then the surface's normal in that cell (the mean
 * of its vertex normals there), toward the origin of a ray along
 * `direction`.
 */
function surfaceCells(geometry, cell) {
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const low = [min.x - cell, min.y - cell, min.z - cell];
  const size = [max.x, max.y, max.z].map((value, axis) => Math.ceil((value - low[axis]) / cell) + 1);
  const high = low.map((value, axis) => value + size[axis] * cell);
  /** Whether the surface passes through each cell, and the sum of its normals there. */
  const filled = new Uint8Array(size[0] * size[1] * size[2]);
  const normals = new Float32Array(3 * filled.length);
  const positions = geometry.getAttribute('position').array;
  const vertexNormals = geometry.getAttribute('normal').array;
  const index = geometry.getIndex().array;
  const corner = (values, face, k) => [0, 1, 2].map((axis) => values[3 * index[3 * face + k] + axis]);
  const cellAt = (x, y, z) => {
    const i = Math.floor((x - low[0]) / cell);
    const j = Math.floor((y - low[1]) / cell);
    const k = Math.floor((z - low[2]) / cell);
    return (k * size[1] + j) * size[0] + i;
  };

  for (let face = 0; face < index.length / 3; face++) {
    const a = corner(positions, face, 0);
    const ab = sub(corner(positions, face, 1), a);
    const ac = sub(corner(positions, face, 2), a);
    const n = corner(vertexNormals, face, 0);
    const nb = sub(corner(vertexNormals, face, 1), n);
    const nc = sub(corner(vertexNormals, face, 2), n);
    // Points of the triangle no farther apart than half a cell.
    const steps = Math.max(1, Math.ceil((2 * Math.max(Math.hypot(...ab), Math.hypot(...ac), Math.hypot(...sub(ab, ac)))) / cell));
    for (let i = 0; i <= steps; i++) {
      for (let j = 0; j <= steps - i; j++) {
        const [u, v] = [i / steps, j / steps];
        const point = [0, 1, 2].map((axis) => a[axis] + u * ab[axis] + v * ac[axis]);
        const normal = [0, 1, 2].map((axis) => n[axis] + u * nb[axis] + v * nc[axis]);
        // The cell of the point and the one behind it: a shell one cell thick lets a ray through between cells that touch at an edge.
        for (const depth of [0, 0.75 * cell]) {
          const at = cellAt(point[0] - depth * normal[0], point[1] - depth * normal[1], point[2] - depth * normal[2]);
          filled[at] = 1;
          for (let axis = 0; axis < 3; axis++) normals[3 * at + axis] += normal[axis];
        }
      }
    }
  }

  let found = -1;
  return {
    reach(ox, oy, oz, dx, dy, dz, from, to) {
      // The part of the ray inside the grid.
      const origin = [ox, oy, oz];
      const direction = [dx, dy, dz];
      let near = from;
      let far = to;
      for (let axis = 0; axis < 3; axis++) {
        if (Math.abs(direction[axis]) < 1e-12) {
          if (origin[axis] <= low[axis] || origin[axis] >= high[axis]) return -1;
          continue;
        }
        const t0 = (low[axis] - origin[axis]) / direction[axis];
        const t1 = (high[axis] - origin[axis]) / direction[axis];
        near = Math.max(near, Math.min(t0, t1));
        far = Math.min(far, Math.max(t0, t1));
      }
      for (let t = near + 1e-6; t < far; t += cell / 2) {
        const at = cellAt(ox + t * dx, oy + t * dy, oz + t * dz);
        if (filled[at]) {
          found = at;
          return t;
        }
      }
      return -1;
    },
    normal(direction) {
      const normal = [normals[3 * found], normals[3 * found + 1], normals[3 * found + 2]];
      const length = Math.hypot(...normal);
      // Where the surface folds within the cell and its normals cancel, the surface is taken to face the ray.
      if (length < 1e-6) return direction.map((value) => -value);
      const facing = dot(normal, direction) < 0 ? 1 : -1;
      return normal.map((value) => (facing * value) / length);
    },
  };
}

/**
 * Ray casting in the scene, against the room and the teapot: the surfaces
 * the lidar sees. Built once for the page and shared. Returns:
 *
 * - `cast(origin, direction)`: the first surface a ray along unit
 *   `direction` reaches, `{ point, normal, distance, surface }` with
 *   `surface` one of 'floor', 'wallX', 'wallZ', 'teapot' and the normal
 *   toward the ray's origin, or null when the ray leaves the scene;
 * - `castCells(origin, direction)`: the same with the teapot's surface
 *   known to a cell (`OCCLUDER_CELL`), for the thousands of rays of the
 *   lidar's view;
 * - `clear(ax, ay, az, dx, dy, dz, span)`: true when the teapot, to a
 *   cell, does not lie on the segment of length `span` from the point a
 *   along the unit direction d. The segment may start on the teapot.
 */
let caster = null;
export function sceneCaster() {
  if (caster) return caster;
  const occluder = new THREE.Mesh(teapotGeometry(), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const raycaster = new THREE.Raycaster();
  const cells = surfaceCells(teapotGeometry(), OCCLUDER_CELL);

  caster = {
    cast(origin, direction) {
      let best = castRoom(origin, direction);
      raycaster.set(new THREE.Vector3(...origin), new THREE.Vector3(...direction));
      raycaster.far = best ? best.distance : Infinity;
      const hit = raycaster.intersectObject(occluder, false)[0];
      if (hit) {
        const faceNormal = hit.face.normal.toArray();
        const facing = dot(faceNormal, direction) < 0 ? 1 : -1;
        best = { point: hit.point.toArray(), normal: faceNormal.map((value) => value * facing), distance: hit.distance, surface: 'teapot' };
      }
      return best;
    },
    castCells(origin, direction) {
      const best = castRoom(origin, direction);
      const reached = cells.reach(...origin, ...direction, 0, best ? best.distance : Infinity);
      if (reached < 0) return best;
      return {
        point: origin.map((value, axis) => value + reached * direction[axis]),
        normal: cells.normal(direction),
        distance: reached,
        surface: 'teapot',
      };
    },
    clear(ax, ay, az, dx, dy, dz, span) {
      return cells.reach(ax, ay, az, dx, dy, dz, 3 * OCCLUDER_CELL, span) < 0;
    },
  };
  return caster;
}

/* ---------------------------------------------------------------------------
 * The scan.
 * ------------------------------------------------------------------------ */

/** The scan's grid of directions about the lidar's forward axis, in degrees: azimuth to the right, elevation up. */
const SCAN = {
  azimuths: [-37, -29, -21, -13, -5, 3, 11, 19, 27, 35, 43],
  elevations: [28, 20, 12, 4, -4, -12],
};
export const SCAN_COLUMNS = SCAN.azimuths.length;
export const SCAN_ROWS = SCAN.elevations.length;

const FORWARD = turn([0, 0, -1], LIDAR_YAW);
const RIGHT = turn([1, 0, 0], LIDAR_YAW);

/** The unit direction at `azimuth` and `elevation` (degrees) from the scanning mirrors. */
function scanDirection(azimuth, elevation) {
  const [a, e] = [radians(azimuth), radians(elevation)];
  return [0, 1, 2].map((k) => Math.cos(e) * (Math.cos(a) * FORWARD[k] + Math.sin(a) * RIGHT[k]) + (k === 1 ? Math.sin(e) : 0));
}

/**
 * The direction of the scanning beam at `progress` through the raster scan
 * (0 to 1): rows from the top, alternating direction, each row swept at
 * constant angular speed, so the beam is at grid point k of the scan
 * order when `progress · (rows · columns) = k + 0.5`.
 */
export function scanBeamDirection(progress) {
  const cells = Math.min(SCAN_ROWS * SCAN_COLUMNS - 1e-6, Math.max(0, progress * SCAN_ROWS * SCAN_COLUMNS));
  const row = Math.floor(cells / SCAN_COLUMNS);
  const along = cells - row * SCAN_COLUMNS - 0.5;
  const column = row % 2 === 0 ? along : SCAN_COLUMNS - 1 - along;
  const { azimuths, elevations } = SCAN;
  const azimuth = azimuths[0] + (column * (azimuths.at(-1) - azimuths[0])) / (SCAN_COLUMNS - 1);
  return scanDirection(azimuth, elevations[row]);
}

/**
 * The points the scan reaches, in scan order: each `{ point, normal,
 * surface, order }`, where `order` is the grid point's place in the scan
 * (the beam is there at progress `(order + 0.5) / (rows · columns)`). Grid
 * directions that leave the scene have no point. Cast once for the page.
 */
let scanned = null;
export function scanPoints() {
  if (scanned) return scanned;
  scanned = [];
  for (let order = 0; order < SCAN_ROWS * SCAN_COLUMNS; order++) {
    const hit = sceneCaster().cast(BEAM.mirrors, scanBeamDirection((order + 0.5) / (SCAN_ROWS * SCAN_COLUMNS)));
    if (hit) scanned.push({ ...hit, order });
  }
  return scanned;
}

/* ---------------------------------------------------------------------------
 * Indirect light.
 * ------------------------------------------------------------------------ */

/**
 * Add to `histogram`, whose bins are `step` ns of delay after the direct
 * return, the indirect light of a measurement at a visible point: light
 * that leaves the point (`relayPoint`, on a surface with `relayNormal`),
 * reaches the bunny's surface unless the teapot blocks it, and returns to
 * the point, for Lambertian surfaces. A patch dA at distance r returns
 * light in proportion to cos²θₓ cos²θ_y dA / r⁴, a time 2r/c after the
 * direct return. Every `stride`-th vertex of `bunny` stands for the
 * surface: the vertices are spread evenly over it, so each stands for the
 * same area. Returns the vertex nearest to the point among those the point
 * illuminates and its distance, `{ vertex, distance }`, with `vertex` -1
 * when there is none.
 */
function gatherIndirect(bunny, stride, relayPoint, relayNormal, histogram, step) {
  const { clear } = sceneCaster();
  const positions = bunny.getAttribute('position').array;
  const normals = bunny.getAttribute('normal').array;
  const [px, py, pz] = relayPoint;
  const [nx, ny, nz] = relayNormal;
  const nearest = { vertex: -1, distance: Infinity };
  for (let i = 0; i < positions.length; i += 3 * stride) {
    const dx = positions[i] - px;
    const dy = positions[i + 1] - py;
    const dz = positions[i + 2] - pz;
    const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const cosRelay = (nx * dx + ny * dy + nz * dz) / r;
    if (cosRelay <= 0) continue;
    const cosBunny = -(normals[i] * dx + normals[i + 1] * dy + normals[i + 2] * dz) / r;
    if (cosBunny <= 0 || !clear(px, py, pz, dx / r, dy / r, dz / r, r)) continue;
    if (r < nearest.distance) {
      nearest.vertex = i / 3;
      nearest.distance = r;
    }
    const bin = Math.round((2 * r) / LIGHT_SPEED / step);
    if (bin < histogram.length) histogram[bin] += (cosRelay * cosBunny) ** 2 / r ** 4;
  }
  return nearest;
}

/** Write to `transient` the `histogram` blurred by the laser pulse (both in bins of `step` ns), and return its largest value. */
function blurByPulse(histogram, transient, step) {
  const reach = Math.ceil((4 * PULSE_SIGMA) / step);
  transient.fill(0);
  let largest = 0;
  for (let bin = 0; bin < histogram.length; bin++) {
    if (histogram[bin] === 0) continue;
    for (let k = Math.max(-reach, -bin); k <= reach && bin + k < histogram.length; k++) {
      transient[bin + k] += histogram[bin] * pulse(k * step);
    }
  }
  for (let bin = 0; bin < transient.length; bin++) largest = Math.max(largest, transient[bin]);
  return largest;
}

/** Bins of a measured point's indirect transient, in ns of delay after the direct return. */
const DELAY_STEP = 0.02;
const DELAY_BINS = 600;

/**
 * The indirect light of the measurement at `relay` (one of `RELAYS`), from
 * every vertex of the bunny (`gatherIndirect`).
 *
 * Returns `at(delay)`, the transient blurred by the pulse and scaled to a
 * peak of 1, for a delay in ns after the direct return; `peakDelay`; the
 * `span` of delays where it exceeds 2% of its peak; `strength`, the peak
 * before scaling (to compare measurements); and `nearest`, the bunny point
 * closest to the relay point among those it illuminates, `{ point,
 * distance }`.
 */
export function measureIndirect(bunny, relay) {
  const histogram = new Float64Array(DELAY_BINS);
  const { vertex, distance: reach } = gatherIndirect(bunny, 1, relay.point, relay.normal, histogram, DELAY_STEP);
  if (vertex < 0) throw new Error(`lidarCapture: the visible point ${relay.point} does not illuminate the hidden object`);
  const positions = bunny.getAttribute('position');
  const nearest = { point: [positions.getX(vertex), positions.getY(vertex), positions.getZ(vertex)], distance: reach };

  const transient = new Float32Array(DELAY_BINS);
  const strength = blurByPulse(histogram, transient, DELAY_STEP);
  let peakBin = 0;
  let first = -1;
  let last = -1;
  for (let bin = 0; bin < DELAY_BINS; bin++) {
    transient[bin] /= strength;
    if (transient[bin] === 1) peakBin = bin;
    if (transient[bin] > 0.02) {
      if (first < 0) first = bin;
      last = bin;
    }
  }
  const span = [first * DELAY_STEP, last * DELAY_STEP];
  if (span[1] > relay.indirectEnd) {
    throw new Error(`lidarCapture: the indirect light of the visible point ${relay.point} lasts ${span[1].toFixed(2)} ns, past its indirectEnd`);
  }

  return {
    at(delay) {
      const position = delay / DELAY_STEP;
      const bin = Math.floor(position);
      if (bin < 0 || bin + 1 >= DELAY_BINS) return 0;
      const f = position - bin;
      return transient[bin] * (1 - f) + transient[bin + 1] * f;
    },
    peakDelay: peakBin * DELAY_STEP,
    span,
    strength,
    nearest,
  };
}

/* ---------------------------------------------------------------------------
 * The video of propagating light: what the scan measures, as the lidar
 * sees it. One pixel is one direction of the beam, and its values over
 * time are the measurement at the visible point in that direction.
 * ------------------------------------------------------------------------ */

/** Pixels of the video across one step of the scan's grid: the scan the slide draws is far coarser than a capture's. */
const VIEW_CELL = 16;
/** The video's size in pixels. A block of `cell` × `cell` pixels surrounds each direction of the scan's grid. */
export const VIEW = { columns: SCAN_COLUMNS * VIEW_CELL, rows: SCAN_ROWS * VIEW_CELL, cell: VIEW_CELL };

/** Degrees between neighboring directions of the scan's grid: to the right, and down the rows. */
const SCAN_STEP = [SCAN.azimuths[1] - SCAN.azimuths[0], SCAN.elevations[1] - SCAN.elevations[0]];

/** The unit direction of the beam at the video's pixel position (x, y); a pixel's center is at half-integers. */
function viewDirection(x, y) {
  return scanDirection(
    SCAN.azimuths[0] + (x / VIEW_CELL - 0.5) * SCAN_STEP[0],
    SCAN.elevations[0] + (y / VIEW_CELL - 0.5) * SCAN_STEP[1],
  );
}

/** Where a point of the scene is in the video: its pixel position [x, y]. */
export function viewPixel(point) {
  const toward = sub(point, BEAM.mirrors);
  const [forward, right] = [dot(toward, FORWARD), dot(toward, RIGHT)];
  const azimuth = Math.atan2(right, forward) / radians(1);
  const elevation = Math.atan2(toward[1], Math.hypot(forward, right)) / radians(1);
  return [
    ((azimuth - SCAN.azimuths[0]) / SCAN_STEP[0] + 0.5) * VIEW_CELL,
    ((elevation - SCAN.elevations[0]) / SCAN_STEP[1] + 0.5) * VIEW_CELL,
  ];
}

/**
 * What `viewPixel` works from, for a shader that finds a surface's pixel
 * in the video: the scanning mirrors, the lidar's forward and right (unit
 * vectors), `angles` = [first azimuth, azimuth step, first elevation,
 * elevation step] in degrees, and the pixels across one step (`cell`).
 */
export const VIEW_PROJECTION = {
  mirrors: BEAM.mirrors,
  forward: FORWARD,
  right: RIGHT,
  angles: [SCAN.azimuths[0], SCAN_STEP[0], SCAN.elevations[0], SCAN_STEP[1]],
  cell: VIEW_CELL,
};

/** The place in the scan's order (`scanPoints`) of the grid direction whose block holds the video pixel in `column`, `row`. */
export function viewScanOrder(column, row) {
  const [gridColumn, gridRow] = [Math.floor(column / VIEW_CELL), Math.floor(row / VIEW_CELL)];
  return gridRow * SCAN_COLUMNS + (gridRow % 2 === 0 ? gridColumn : SCAN_COLUMNS - 1 - gridColumn);
}

/** How much of the light that reaches it each surface returns, for the video's direct light. */
const REFLECTANCE = { floor: 0.56, wallX: 0.7, wallZ: 0.72, teapot: 0.3 };

/** Bins of a pixel's indirect transient, in ns of delay after the direct return, and the bunny vertices it is gathered from. */
const VIDEO_DELAY_STEP = 0.08;
const VIDEO_DELAY_BINS = 112;
const VIDEO_STRIDE = 80;

/**
 * Times of the video (ns from the moment a pulse leaves the laser): it
 * plays from `start`, when the first direct light, from the floor in front
 * of the lidar, has arrived, and comes to rest at `rest`, when the direct
 * light is on the far corner and the indirect light shows around the
 * occluder.
 */
export const VIDEO_SPAN = { start: 7.4, rest: 17.4 };

/**
 * The scene's video of propagating light, worked out one row of pixels at
 * a time: a generator that yields after each row, so the caller chooses
 * when to go on, and returns the video. Pixels are in rows from the top:
 *
 * - `direct`: when the direct return of each pixel arrives (ns from the
 *   moment the pulse leaves the laser), Infinity where the beam leaves
 *   the scene;
 * - `shade`: how bright the pixel's direct light is, 0 to 1;
 * - `indirectAt(pixel, delay)`: the pixel's indirect light a delay (ns)
 *   after its direct return, 0 to 1 over the video and compressed, so the
 *   weak light far from the hidden object shows beside the strong light
 *   near it.
 */
export function* lightVideoRows(bunny) {
  const caster = sceneCaster();
  const pixels = VIEW.columns * VIEW.rows;
  const direct = new Float32Array(pixels).fill(Infinity);
  const shade = new Float32Array(pixels);
  const indirect = new Float32Array(pixels * VIDEO_DELAY_BINS);
  const histogram = new Float64Array(VIDEO_DELAY_BINS);
  let strongest = 0;
  let nearest = Infinity;

  for (let row = 0; row < VIEW.rows; row++) {
    for (let column = 0; column < VIEW.columns; column++) {
      const direction = viewDirection(column + 0.5, row + 0.5);
      const hit = caster.castCells(BEAM.mirrors, direction);
      if (!hit) continue;
      const pixel = row * VIEW.columns + column;
      direct[pixel] = directTime(hit.point);
      shade[pixel] = (REFLECTANCE[hit.surface] * Math.max(0, -dot(hit.normal, direction))) / hit.distance ** 2;
      nearest = Math.min(nearest, hit.distance);
      histogram.fill(0);
      gatherIndirect(bunny, VIDEO_STRIDE, hit.point, hit.normal, histogram, VIDEO_DELAY_STEP);
      const transient = indirect.subarray(pixel * VIDEO_DELAY_BINS, (pixel + 1) * VIDEO_DELAY_BINS);
      strongest = Math.max(strongest, blurByPulse(histogram, transient, VIDEO_DELAY_STEP));
    }
    yield row;
  }

  // For display: the direct light relative to a white surface facing the lidar at the nearest distance, and both compressed.
  for (let pixel = 0; pixel < pixels; pixel++) shade[pixel] = Math.min(1, Math.sqrt(shade[pixel] * nearest ** 2));
  for (let i = 0; i < indirect.length; i++) indirect[i] = (indirect[i] / strongest) ** 0.4;

  return {
    direct,
    shade,
    indirectAt(pixel, delay) {
      const position = delay / VIDEO_DELAY_STEP;
      const bin = Math.floor(position);
      if (bin < 0 || bin + 1 >= VIDEO_DELAY_BINS) return 0;
      const f = position - bin;
      const at = pixel * VIDEO_DELAY_BINS + bin;
      return indirect[at] * (1 - f) + indirect[at + 1] * f;
    },
  };
}
