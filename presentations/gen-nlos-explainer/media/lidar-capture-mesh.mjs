#!/usr/bin/env node
/**
 * Pack the Stanford bunny (assets/sources/lidar-capture/stanford-bunny.obj: the
 * Stanford Computer Graphics Laboratory's bun_zipper, 35,947 vertices,
 * 69,451 triangles) into the image the `lidarCapture` layout loads:
 *
 *   node media/lidar-capture-mesh.mjs      (from the presentation directory)
 *
 * writes public/slides/lidar-capture/stanford-bunny-mesh.png. The mesh is
 * stored as an image because the capture and record views wait for a
 * slide's images (and for nothing else a layout fetches) before a frame
 * is taken.
 *
 * Format: an opaque RGB image read as a byte stream, three bytes per
 * pixel, row by row:
 *   bytes 0-2    vertex count (24 bits, big-endian)
 *   bytes 3-5    triangle count (24 bits, big-endian)
 *   bytes 6-29   the bounding box: min x, y, z, max x, y, z (float32, little-endian)
 *   bytes 30-35  zero
 *   then         per vertex: x, y, z, each 16 bits big-endian, 0…65535 across the bounding box
 *   then         per triangle: three vertex indices, each 16 bits big-endian
 * No vertex is moved or removed: the layout scales and places the mesh.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { PNG } from 'pngjs';

const source = 'assets/sources/lidar-capture/stanford-bunny.obj';
const target = 'public/slides/lidar-capture/stanford-bunny-mesh.png';
const WIDTH = 512;
const HEADER_BYTES = 36;

const vertices = [];
const triangles = [];
for (const line of readFileSync(source, 'utf8').split('\n')) {
  const parts = line.trim().split(/\s+/);
  if (parts[0] === 'v') vertices.push(parts.slice(1, 4).map(Number));
  if (parts[0] === 'f') {
    if (parts.length !== 4) throw new Error(`not a triangle: ${line}`);
    triangles.push(parts.slice(1).map((part) => Number(part.split('/')[0]) - 1));
  }
}
if (vertices.length > 65536) throw new Error(`${vertices.length} vertices do not fit 16-bit indices`);

const min = [0, 1, 2].map((k) => vertices.reduce((m, v) => Math.min(m, v[k]), Infinity));
const max = [0, 1, 2].map((k) => vertices.reduce((m, v) => Math.max(m, v[k]), -Infinity));

const bytes = Buffer.alloc(HEADER_BYTES + 6 * vertices.length + 6 * triangles.length);
bytes.writeUIntBE(vertices.length, 0, 3);
bytes.writeUIntBE(triangles.length, 3, 3);
[...min, ...max].forEach((value, k) => bytes.writeFloatLE(value, 6 + 4 * k));
let offset = HEADER_BYTES;
for (const vertex of vertices) {
  for (let k = 0; k < 3; k++) {
    bytes.writeUInt16BE(Math.round(((vertex[k] - min[k]) / (max[k] - min[k])) * 65535), offset);
    offset += 2;
  }
}
for (const triangle of triangles) {
  for (const index of triangle) {
    bytes.writeUInt16BE(index, offset);
    offset += 2;
  }
}

const height = Math.ceil(bytes.length / 3 / WIDTH);
const png = new PNG({ width: WIDTH, height });
png.data.fill(255);
for (let i = 0; i < bytes.length; i++) png.data[4 * Math.floor(i / 3) + (i % 3)] = bytes[i];
mkdirSync(dirname(target), { recursive: true });
const file = PNG.sync.write(png, { colorType: 2, inputHasAlpha: true, deflateLevel: 9 });
writeFileSync(target, file);
console.log(`${vertices.length} vertices, ${triangles.length} triangles → ${target} (${WIDTH}×${height}, ${(file.length / 1024).toFixed(0)} KB)`);
console.log(`bounding box ${min.map((v) => v.toFixed(4))} … ${max.map((v) => v.toFixed(4))}`);
