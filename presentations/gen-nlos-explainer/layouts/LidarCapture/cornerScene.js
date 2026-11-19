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

/** The teapot's surface in world coordinates. */
export function teapotGeometry() {
  const geometry = new TeapotGeometry(1, 16);
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const scale = TEAPOT.height / (max.y - min.y);
  geometry.translate(0, -min.y, 0);
  geometry.scale(scale * TEAPOT.widthScale, scale, scale * TEAPOT.widthScale);
  geometry.rotateY(TEAPOT.yaw);
  geometry.translate(...TEAPOT.position);
  geometry.computeBoundingSphere();
  return geometry;
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

/** x_p: the visible point the slide's pulse illuminates, on the wall x = 0, and the wall's normal there. */
export const RELAY_POINT = [0, 0.62, 1.1];
export const RELAY_NORMAL = [1, 0, 0];

/** Path lengths (m): laser to mirrors, mirrors to detector, mirrors to x_p. */
const LASER_TO_MIRRORS = distance(BEAM.laser, BEAM.beamsplitter) + distance(BEAM.beamsplitter, BEAM.mirrors);
const MIRRORS_TO_DETECTOR = distance(BEAM.mirrors, BEAM.beamsplitter) + distance(BEAM.beamsplitter, BEAM.detector);
export const MIRRORS_TO_RELAY = distance(BEAM.mirrors, RELAY_POINT);

/**
 * Times of the measurement at x_p, in ns from the moment the pulse leaves
 * the laser: `hit` when it reaches x_p, `direct` when its direct return
 * reaches the detector. Indirect light that travels a distance r from x_p
 * to a hidden surface and back arrives 2r/c after `direct`.
 */
export const TIMES = {
  hit: (LASER_TO_MIRRORS + MIRRORS_TO_RELAY) / LIGHT_SPEED,
  direct: (LASER_TO_MIRRORS + 2 * MIRRORS_TO_RELAY + MIRRORS_TO_DETECTOR) / LIGHT_SPEED,
};

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

/**
 * Ray casting in the scene, against the room and the given meshes' surfaces
 * (`{ teapot, bunny }` geometries in world coordinates; the bunny may be
 * left out). Returns:
 *
 * - `cast(origin, direction)`: the first surface a ray along unit
 *   `direction` reaches, `{ point, normal, distance, surface }` with
 *   `surface` one of 'floor', 'wallX', 'wallZ', 'teapot', 'bunny' and the
 *   normal toward the ray's origin, or null when the ray leaves the scene;
 * - `clear(a, b)`: true when no mesh lies between the points a and b.
 */
export function createCaster(geometries) {
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const meshes = Object.entries(geometries).map(([surface, geometry]) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = surface;
    return mesh;
  });
  const raycaster = new THREE.Raycaster();

  function castMeshes(origin, direction, far) {
    raycaster.set(new THREE.Vector3(...origin), new THREE.Vector3(...direction));
    raycaster.far = far;
    return raycaster.intersectObjects(meshes, false)[0] ?? null;
  }

  return {
    cast(origin, direction) {
      let best = null;
      for (const { surface, axis, normal } of ROOM_PLANES) {
        if (direction[axis] >= 0) continue;
        const t = -origin[axis] / direction[axis];
        const point = origin.map((value, k) => value + t * direction[k]);
        point[axis] = 0;
        if (t > 1e-6 && inRoom(point) && (!best || t < best.distance)) best = { point, normal, distance: t, surface };
      }
      const hit = castMeshes(origin, direction, best ? best.distance : Infinity);
      if (hit) {
        const faceNormal = hit.face.normal.toArray();
        const facing = dot(faceNormal, direction) < 0 ? 1 : -1;
        best = { point: hit.point.toArray(), normal: faceNormal.map((value) => value * facing), distance: hit.distance, surface: hit.object.name };
      }
      return best;
    },
    clear(a, b) {
      const span = distance(a, b);
      const direction = sub(b, a).map((value) => value / span);
      return castMeshes(a, direction, span - 1e-4) === null;
    },
    dispose() {
      material.dispose();
    },
  };
}

/* ---------------------------------------------------------------------------
 * The scan.
 * ------------------------------------------------------------------------ */

/** The scan's grid of directions about the lidar's forward axis, in degrees: azimuth to the right, elevation up. */
const SCAN = {
  azimuths: [-40, -32, -24, -16, -8, 0, 8, 16, 24, 32, 40],
  elevations: [30, 22, 14, 6, -2, -10],
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
 * directions that leave the scene have no point.
 */
export function scanPoints(caster) {
  const points = [];
  for (let order = 0; order < SCAN_ROWS * SCAN_COLUMNS; order++) {
    const hit = caster.cast(BEAM.mirrors, scanBeamDirection((order + 0.5) / (SCAN_ROWS * SCAN_COLUMNS)));
    if (hit) points.push({ ...hit, order });
  }
  return points;
}

/* ---------------------------------------------------------------------------
 * Indirect light.
 * ------------------------------------------------------------------------ */

/** Bins of the indirect transient, in ns of delay after the direct return. */
const DELAY_STEP = 0.02;
const DELAY_BINS = 600;

/**
 * The indirect light of the measurement at x_p: light that leaves x_p,
 * reaches the bunny's surface (unless the teapot blocks it), and returns to
 * x_p, for Lambertian surfaces. A patch dA at distance r returns light in
 * proportion to cos²θₓ cos²θ_y dA / r⁴, a time 2r/c after the direct
 * return.
 *
 * Returns `at(delay)`, the transient blurred by the pulse and scaled to a
 * peak of 1, for a delay in ns after the direct return; `peakDelay`; the
 * `span` of delays where it exceeds 2% of its peak; and `nearest`, the
 * bunny point closest to x_p among those x_p illuminates, `{ point,
 * normal, distance }`.
 */
export function measureIndirect(bunny, caster) {
  const positions = bunny.getAttribute('position');
  const normals = bunny.getAttribute('normal');
  const histogram = new Float64Array(DELAY_BINS);
  let nearest = null;
  for (let i = 0; i < positions.count; i++) {
    const point = [positions.getX(i), positions.getY(i), positions.getZ(i)];
    const normal = [normals.getX(i), normals.getY(i), normals.getZ(i)];
    const r = distance(point, RELAY_POINT);
    const direction = sub(point, RELAY_POINT).map((value) => value / r);
    const cosRelay = dot(RELAY_NORMAL, direction);
    const cosBunny = -dot(normal, direction);
    if (cosRelay <= 0 || cosBunny <= 0 || !caster.clear(RELAY_POINT, point)) continue;
    if (!nearest || r < nearest.distance) nearest = { point, normal, distance: r };
    // The vertices are spread evenly over the surface, so each stands for the same area.
    const bin = Math.round((2 * r) / LIGHT_SPEED / DELAY_STEP);
    if (bin < DELAY_BINS) histogram[bin] += (cosRelay * cosBunny) ** 2 / r ** 4;
  }
  if (!nearest) throw new Error('lidarCapture: x_p does not illuminate the hidden object');

  const reach = Math.ceil((4 * PULSE_SIGMA) / DELAY_STEP);
  const transient = new Float32Array(DELAY_BINS);
  for (let bin = 0; bin < DELAY_BINS; bin++) {
    if (histogram[bin] === 0) continue;
    for (let k = Math.max(-reach, -bin); k <= reach && bin + k < DELAY_BINS; k++) {
      transient[bin + k] += histogram[bin] * pulse(k * DELAY_STEP);
    }
  }
  const peak = transient.reduce((m, v) => Math.max(m, v), 0);
  let peakBin = 0;
  let first = -1;
  let last = -1;
  for (let bin = 0; bin < DELAY_BINS; bin++) {
    transient[bin] /= peak;
    if (transient[bin] === 1) peakBin = bin;
    if (transient[bin] > 0.02) {
      if (first < 0) first = bin;
      last = bin;
    }
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
    span: [first * DELAY_STEP, last * DELAY_STEP],
    nearest,
  };
}
