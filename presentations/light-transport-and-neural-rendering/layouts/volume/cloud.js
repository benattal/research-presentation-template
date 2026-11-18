/**
 * The glowing cloud of the volume rendering slides: a smooth 2D density
 * field made of blobs, each emitting its own color, seen by an orthographic
 * camera at x = 0 that looks along +x, so every row is one ray and t = x.
 *
 * World units: x from 0 (the camera) to `CLOUD_EXTENT.far`, y from 0 to
 * `CLOUD_EXTENT.height`. Densities are per world unit; colors are linear RGB.
 */

/** The part of the world the panels show. */
export const CLOUD_EXTENT = { near: 0, far: 4, height: 1 };

/** Where the core's center sits unless a slide moves it (world units). */
export const CORE_X = 2.47;

/** Thickness of the core's surface layer, in world units. */
const SKIN = 0.07;

/**
 * The lecture's cloud: a thin wisp in front, a core, and a faint tail the
 * core hides from the camera. The core glows in one color in a layer
 * `SKIN` thick and in another inside, with `coreDensity` in that layer and
 * three times it inside: a translucent cloud at a few per unit, a surface
 * whose color the camera must resolve at tens. `edge` is the width of its
 * surface (world units) and `coreX` the x of its center. `role` names the
 * light color (0–4, `--light-<role>`) each blob glows in.
 */
export function cloudBlobs({ edge, coreDensity, coreX = CORE_X }) {
  const core = { x: coreX, y: 0.46, rx: 0.56, ry: 0.32 };
  return [
    { name: 'wisp', shape: 'soft', x: 1.05, y: 0.56, rx: 0.3, ry: 0.2, density: 0.8, role: 3 },
    { name: 'core', shape: 'solid', ...core, density: coreDensity, edge, role: 1 },
    {
      name: 'heart', shape: 'solid', x: core.x, y: core.y, rx: core.rx - SKIN, ry: core.ry - SKIN,
      density: 2 * coreDensity, edge, role: 4,
    },
    { name: 'tail', shape: 'soft', x: 3.35, y: 0.62, rx: 0.3, ry: 0.2, density: 1.6, role: 2 },
  ];
}

function blobProfile(blob, x, y) {
  const u = (x - blob.x) / blob.rx;
  const v = (y - blob.y) / blob.ry;
  const r = Math.hypot(u, v);
  if (blob.shape === 'soft') return Math.exp(-(r * r) / 2);
  // Elliptical level sets, with the surface `edge` wide along x, the direction of the camera's rays.
  if (blob.shape === 'solid') return 1 / (1 + Math.exp(-((1 - r) * blob.rx) / blob.edge));
  throw new Error(`Unknown blob shape "${blob.shape}"`);
}

/**
 * A cloud from blobs `{ shape: 'soft' | 'solid', x, y, rx, ry, density,
 * edge?, color }`, color in linear RGB. A soft blob is a Gaussian with
 * standard deviations rx, ry; a solid blob is an ellipse of radii rx, ry
 * whose surface is a logistic step `edge` world units wide along x.
 *
 * `sample(x, y)` returns `{ density, color }`: the blobs' densities add, and
 * the color is their density-weighted mix, so the emission σc adds too.
 */
export function createCloud(blobs) {
  for (const blob of blobs) {
    if (!Array.isArray(blob.color)) throw new Error(`Blob "${blob.name}" has no color`);
  }
  const sample = (x, y) => {
    let density = 0;
    const color = [0, 0, 0];
    for (const blob of blobs) {
      const sigma = blob.density * blobProfile(blob, x, y);
      density += sigma;
      color[0] += sigma * blob.color[0];
      color[1] += sigma * blob.color[1];
      color[2] += sigma * blob.color[2];
    }
    if (density > 0) for (let k = 0; k < 3; k += 1) color[k] /= density;
    return { density, color };
  };
  return { blobs, sample };
}

/** The ray field (see ray.js) of the camera row at height y. */
export function cloudRay(cloud, y) {
  return {
    near: CLOUD_EXTENT.near,
    far: CLOUD_EXTENT.far,
    density: (t) => cloud.sample(t, y).density,
    color: (t) => cloud.sample(t, y).color,
  };
}

/**
 * The cloud on a grid of `columns` × `rows` cells covering the extent (row
 * 0 at the top): per cell the light it emits, σc, and the part of it that
 * reaches the camera, Tσc, with T the transmittance from the camera to the
 * cell's center along its row. Both are linear RGB per world unit, in
 * Float32Arrays of length columns × rows × 3; `density` holds σ per cell.
 */
export function renderCloud(cloud, columns, rows) {
  const { near, far, height } = CLOUD_EXTENT;
  const dx = (far - near) / columns;
  const emitted = new Float32Array(columns * rows * 3);
  const seen = new Float32Array(columns * rows * 3);
  const density = new Float32Array(columns * rows);
  for (let row = 0; row < rows; row += 1) {
    const y = height * (1 - (row + 0.5) / rows);
    let depth = 0;
    for (let column = 0; column < columns; column += 1) {
      const cell = row * columns + column;
      const { density: sigma, color } = cloud.sample(near + (column + 0.5) * dx, y);
      const transmittance = Math.exp(-(depth + sigma * dx / 2));
      density[cell] = sigma;
      for (let k = 0; k < 3; k += 1) {
        emitted[cell * 3 + k] = sigma * color[k];
        seen[cell * 3 + k] = transmittance * sigma * color[k];
      }
      depth += sigma * dx;
    }
  }
  return { columns, rows, emitted, seen, density };
}

/**
 * The cloud as a medium rather than as the light the camera receives, for
 * a panel that shows where samples fall in it: per cell of `image` (from
 * `renderCloud`), the emission–absorption integral over a stretch `length`
 * long of the cell's σ and c, c(1 − e^{−σ·length}), per unit length. A thin
 * medium gives σc, as `emitted` does; a dense region gives c / length, its
 * own color, where σc would grow with σ and tone map to white. Unlike
 * `seen`, nothing is hidden behind a dense region. Returns a grid laid out
 * like `emitted`.
 */
export function mediumImage(image, length) {
  const values = new Float32Array(image.emitted.length);
  for (let cell = 0; cell < image.density.length; cell += 1) {
    const depth = image.density[cell] * length;
    const factor = depth > 1e-6 ? (1 - Math.exp(-depth)) / depth : 1;
    for (let k = 0; k < 3; k += 1) values[cell * 3 + k] = factor * image.emitted[cell * 3 + k];
  }
  return values;
}
