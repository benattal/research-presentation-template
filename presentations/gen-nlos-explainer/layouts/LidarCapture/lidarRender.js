/**
 * The lidar slide's render: the corner scene of cornerScene.js as clean CG
 * on black (matte materials, soft shadows, a fixed three-quarter view from
 * above), and the light of a frame of timeline.js drawn into it: the pulse
 * and its returns along the beam, the wavefronts between x_p and the
 * hidden object, and the points of the raster scan.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  BEAM, BUNNY, LIDAR, LIGHT_SPEED, RELAY_NORMAL, RELAY_POINT, ROOM, SCAN_COLUMNS, SCAN_ROWS, TEAPOT, TIMES,
  createCaster, distance, measureIndirect, pulse, scanBeamDirection, scanPoints, teapotGeometry,
} from './cornerScene.js';

/**
 * The camera: a three-quarter view from above, on the side of the room's
 * diagonal from which the bunny shows behind the teapot. It looks at
 * `target` from `distance` (m), at `azimuth` from +x toward +z and
 * `elevation` above the floor (degrees); `shift` moves the picture on the
 * canvas (fractions of its width and height, right and down).
 */
const CAMERA = { target: [0.85, 0.3, 1.15], azimuth: 24, elevation: 32, distance: 7.15, fov: 20, shift: [0.11, 0.03] };

/** Surface colors (linear RGB triples as in the website's scene, or sRGB strings) and roughness. */
const SURFACES = {
  wallX: { color: [0.66, 0.69, 0.74], roughness: 0.9 },
  wallZ: { color: [0.74, 0.71, 0.67], roughness: 0.9 },
  floor: { color: [0.55, 0.55, 0.56], roughness: 0.85 },
  teapot: { color: [0.19, 0.28, 0.34], roughness: 0.48 },
  bunny: { color: [0.82, 0.58, 0.24], roughness: 0.5 },
  board: { color: '#3d4148', roughness: 0.6, metalness: 0.3 },
  hole: { color: '#0b0c0e', roughness: 0.9 },
  anodized: { color: '#454a53', roughness: 0.5, metalness: 0.3 },
  body: { color: '#7d838e', roughness: 0.45, metalness: 0.25 },
  plate: { color: '#a3a8b1', roughness: 0.4, metalness: 0.4 },
  steel: { color: '#c3c6cb', roughness: 0.3, metalness: 0.9 },
  laser: { color: '#d6d8dc', roughness: 0.4, metalness: 0.35 },
  ring: { color: '#c22a30', roughness: 0.4, metalness: 0.4 },
  window: { color: '#0a0c11', roughness: 0.06 },
  glass: { color: '#cfe6f2', roughness: 0.05, opacity: 0.3 },
  coating: { color: '#e8f4fa', roughness: 0.1, opacity: 0.45 },
};

/** Radii of the beam's bright core and of its glow (m). */
const BEAM_CORE = 0.0032;
const BEAM_GLOW = 0.019;
/** Samples of light along a beam segment, and the largest light value a sample stores (as a byte). */
const PROFILE_SAMPLES = 256;
const PROFILE_RANGE = 4;
/** Brightness of a pulse at its peak, and of the faint trace the beam leaves along its path. */
const PULSE_LEVEL = 1.8;
const TRACE_LEVEL = 0.12;
/** Brightness of the beam while it scans: faint, since its glow is added to the pale walls behind it. */
const SCAN_LEVEL = 0.06;
/** Radius of a scan dot (m). */
const DOT_RADIUS = 0.015;

const toVector = (p) => new THREE.Vector3(p[0], p[1], p[2]);

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function smoothstep(from, to, v) {
  const t = clamp01((v - from) / (to - from));
  return t * t * (3 - 2 * t);
}

function standard(name) {
  const { color, roughness, metalness = 0, opacity = 1 } = SURFACES[name];
  const material = new THREE.MeshStandardMaterial({ roughness, metalness });
  if (typeof color === 'string') material.color.set(color);
  else material.color.setRGB(...color);
  if (opacity < 1) {
    material.transparent = true;
    material.opacity = opacity;
    material.depthWrite = false;
  }
  return material;
}

/* ---------------------------------------------------------------------------
 * Light on the scene's surfaces: the rings where the wavefronts cross them
 * and the hidden object's faint glow, and darkening where surfaces meet
 * (along the seams of the room, and on the floor around what stands on
 * it). The rings tint a surface toward the indirect color rather than add
 * to it, so they read on the pale walls as well as on the dark teapot.
 * ------------------------------------------------------------------------ */

const WAVE_DECLARATIONS = /* glsl */ `
varying vec3 vWaveWorld;
varying vec3 vWaveNormal;
uniform vec3 uWaveColor;
uniform vec3 uWaveCenter0;
uniform float uWaveRadius0;
uniform float uWaveStrength0;
uniform vec3 uWaveCenter1;
uniform float uWaveRadius1;
uniform float uWaveStrength1;
uniform float uWaveWidth;
uniform float uHiddenGlow;
uniform float uIsHidden;
uniform vec3 uSeams;
uniform vec4 uContacts[2];
uniform float uIsFloor;
`;

const CONTACT_SHADING = /* glsl */ `
{
  vec3 seams = 1.0 - 0.4 * uSeams * exp(-max(vWaveWorld, 0.0) / 0.075);
  float occlusion = seams.x * seams.y * seams.z;
  for (int i = 0; i < 2; i++) {
    float reach = length(vWaveWorld.xz - uContacts[i].xy) / uContacts[i].z;
    occlusion *= 1.0 - uIsFloor * uContacts[i].w * exp(-reach * reach * reach * reach);
  }
  diffuseColor.rgb *= occlusion;
}
`;

const WAVE_LIGHT = /* glsl */ `
float waveTint = 0.0;
{
  vec3 waveNormal = normalize(vWaveNormal);
  vec3 toCenter0 = uWaveCenter0 - vWaveWorld;
  float d0 = length(toCenter0);
  float facing0 = max(0.0, dot(waveNormal, toCenter0 / max(d0, 1e-4)));
  float ring0 = exp(-pow((d0 - uWaveRadius0) / uWaveWidth, 2.0)) * uWaveStrength0 * (0.35 + 0.65 * sqrt(facing0));
  vec3 toCenter1 = uWaveCenter1 - vWaveWorld;
  float d1 = length(toCenter1);
  float facing1 = max(0.0, dot(waveNormal, toCenter1 / max(d1, 1e-4)));
  float ring1 = exp(-pow((d1 - uWaveRadius1) / uWaveWidth, 2.0)) * uWaveStrength1 * (0.35 + 0.65 * sqrt(facing1));
  float hiddenLit = uIsHidden * uHiddenGlow * smoothstep(0.0, 0.05, uWaveRadius0 - d0) * (0.3 + 0.7 * pow(facing0, 0.6));
  waveTint = clamp(ring0 + (1.0 - uIsHidden) * ring1 + hiddenLit, 0.0, 1.0);
}
`;

const WAVE_TINT = /* glsl */ `
outgoingLight = mix(outgoingLight, uWaveColor * (0.85 + 0.6 * waveTint) * (1.0 + 0.9 * uIsHidden), waveTint);
`;

/**
 * Give a standard material the wave uniforms (shared, one object for the
 * whole scene) and its own flags: `seams`, how much it darkens toward the
 * planes x = 0, y = 0, z = 0; `floor`, whether it darkens around what
 * stands on it; `hidden`, whether it is the hidden object. Every such
 * material compiles the same shader, so they share one program.
 */
function addLightWaves(material, waves, { seams = [0, 0, 0], floor = false, hidden = false } = {}) {
  const own = {
    uSeams: { value: new THREE.Vector3(...seams) },
    uIsFloor: { value: floor ? 1 : 0 },
    uIsHidden: { value: hidden ? 1 : 0 },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, waves, own);
    shader.vertexShader = `varying vec3 vWaveWorld;\nvarying vec3 vWaveNormal;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvWaveWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWaveNormal = normalize(mat3(modelMatrix) * objectNormal);',
    );
    shader.fragmentShader = `${WAVE_DECLARATIONS}\n${shader.fragmentShader}`
      .replace('#include <color_fragment>', `#include <color_fragment>\n${CONTACT_SHADING}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${WAVE_LIGHT}`)
      .replace('#include <opaque_fragment>', `${WAVE_TINT}\n#include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => 'light-waves';
  return material;
}

/* ---------------------------------------------------------------------------
 * Glowing light: beams, wavefront shells, sprites.
 * ------------------------------------------------------------------------ */

const BEAM_VERTEX = /* glsl */ `
varying float vAlong;
varying vec3 vNormalView;
varying vec3 vToCamera;
void main() {
  vAlong = position.y;
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vToCamera = -viewPosition.xyz;
  vNormalView = normalMatrix * normal;
  gl_Position = projectionMatrix * viewPosition;
}
`;

const BEAM_FRAGMENT = /* glsl */ `
uniform sampler2D uProfile;
uniform vec3 uDirect;
uniform vec3 uIndirect;
uniform float uGlow;
uniform float uRange;
varying float vAlong;
varying vec3 vNormalView;
varying vec3 vToCamera;
void main() {
  vec2 light = texture2D(uProfile, vec2(vAlong, 0.5)).rg * uRange;
  float total = light.r + light.g;
  if (total < 0.002) discard;
  vec3 hue = (uDirect * light.r + uIndirect * light.g) / total;
  if (uGlow > 0.5) {
    // The glow adds light, brightest along the beam's axis.
    float facing = abs(dot(normalize(vNormalView), normalize(vToCamera)));
    gl_FragColor = vec4(hue * total * 0.5 * pow(facing, 4.0), 1.0);
  } else {
    // The core keeps its color over pale surfaces.
    gl_FragColor = vec4(hue, clamp(total, 0.0, 1.0));
  }
  #include <colorspace_fragment>
}
`;

/**
 * A straight beam between two points: a thin bright core and a soft glow,
 * both colored by a light profile along the beam (direct light in the red
 * channel and indirect light in the green channel of a byte texture, from
 * the beam's start to its end).
 */
function createBeam(colors) {
  const data = new Uint8Array(PROFILE_SAMPLES * 4);
  const texture = new THREE.DataTexture(data, PROFILE_SAMPLES, 1, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  const makePart = (radius, glow) => {
    const geometry = new THREE.CylinderGeometry(radius, radius, 1, glow ? 16 : 10, 1, true);
    geometry.translate(0, 0.5, 0);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uProfile: { value: texture },
        uDirect: { value: colors.direct },
        uIndirect: { value: colors.indirect },
        uGlow: { value: glow ? 1 : 0 },
        uRange: { value: PROFILE_RANGE },
      },
      vertexShader: BEAM_VERTEX,
      fragmentShader: BEAM_FRAGMENT,
      blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending,
      transparent: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 4;
    return mesh;
  };
  const group = new THREE.Group();
  group.add(makePart(BEAM_CORE, false), makePart(BEAM_GLOW, true));
  const up = new THREE.Vector3(0, 1, 0);
  let span = 0;
  return {
    group,
    /** Place the beam from `start` to `end` (points, m). */
    place(start, end) {
      const a = toVector(start);
      const along = toVector(end).sub(a);
      span = along.length();
      group.position.copy(a);
      group.quaternion.setFromUnitVectors(up, along.normalize());
      group.scale.set(1, span, 1);
    },
    get length() {
      return span;
    },
    /** Fill the profile from `light(u)` → [direct, indirect], u the distance from the start (m). */
    fill(light) {
      let any = false;
      for (let i = 0; i < PROFILE_SAMPLES; i++) {
        const [direct, indirect] = light((i / (PROFILE_SAMPLES - 1)) * span);
        data[4 * i] = Math.min(255, Math.round((direct / PROFILE_RANGE) * 255));
        data[4 * i + 1] = Math.min(255, Math.round((indirect / PROFILE_RANGE) * 255));
        any ||= data[4 * i] > 0 || data[4 * i + 1] > 0;
      }
      group.visible = any;
      texture.needsUpdate = true;
    },
  };
}

const SHELL_VERTEX = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormalWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormalWorld = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const SHELL_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
uniform vec3 uRoom;
varying vec3 vWorld;
varying vec3 vNormalWorld;
void main() {
  // Only the part of the wavefront inside the room, fading out above the walls.
  if (any(lessThan(vWorld, vec3(0.0))) || any(greaterThan(vWorld.xz, uRoom.xz))) discard;
  vec3 toCamera = normalize(cameraPosition - vWorld);
  float rim = 1.0 - abs(dot(normalize(vNormalWorld), toCamera));
  float alpha = uStrength * (0.07 + 0.55 * pow(rim, 2.5)) * (1.0 - smoothstep(0.85 * uRoom.y, 1.05 * uRoom.y, vWorld.y));
  gl_FragColor = vec4(uColor, alpha);
  #include <colorspace_fragment>
}
`;

/**
 * A translucent spherical wavefront about `center`, cut to the room;
 * alpha-blended, so it tints the pale walls behind it instead of washing
 * them out.
 */
function createShell(color) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uStrength: { value: 0 },
      uRoom: { value: new THREE.Vector3(ROOM.size, ROOM.height, ROOM.size) },
    },
    vertexShader: SHELL_VERTEX,
    fragmentShader: SHELL_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), material);
  mesh.renderOrder = 3;
  mesh.visible = false;
  return {
    mesh,
    /** Show the wavefront at `radius` (m) about `center` with `strength` in [0, 1]. */
    set(center, radius, strength) {
      mesh.visible = strength > 0.003 && radius > 0;
      if (!mesh.visible) return;
      mesh.position.set(...center);
      mesh.scale.setScalar(radius);
      material.uniforms.uStrength.value = strength;
    },
  };
}

/** A soft round glow: a radial falloff texture shared by every sprite. */
function createGlowTexture() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const r = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2);
      const falloff = Math.max(0, Math.exp(-r * r * 5) - Math.exp(-5)) / (1 - Math.exp(-5));
      const i = 4 * (y * size + x);
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(falloff * 255);
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createGlow(texture, color) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    color,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  }));
  sprite.renderOrder = 5;
  sprite.visible = false;
  return sprite;
}

function placeGlow(sprite, position, size, level) {
  sprite.visible = level > 0.003;
  if (!sprite.visible) return;
  sprite.position.set(...position);
  sprite.scale.setScalar(size);
  sprite.material.opacity = Math.min(1, level);
}

/* ---------------------------------------------------------------------------
 * The scene.
 * ------------------------------------------------------------------------ */

function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** The room: the floor and the two relay walls, as slabs. */
function buildRoom(scene, waves) {
  const { size, height, thickness } = ROOM;
  const slab = (name, min, max, options) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(max[0] - min[0], max[1] - min[1], max[2] - min[2]),
      addLightWaves(standard(name), waves, options),
    );
    mesh.position.set((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
    scene.add(shadowed(mesh));
  };
  slab('floor', [0, -thickness, 0], [size, 0, size], { seams: [1, 0, 1], floor: true });
  slab('wallX', [-thickness, -thickness, -thickness], [0, height, size], { seams: [0, 1, 1] });
  slab('wallZ', [0, -thickness, -thickness], [size, height, 0], { seams: [1, 1, 0] });
}

/**
 * The lidar on its breadboard, in the lidar's frame: the laser on the left,
 * the beamsplitter cube, the scanning mirrors' housing with its window
 * toward the scene, and behind the beamsplitter the objective lens and the
 * single-photon detector.
 */
function buildLidar(scene) {
  const lidar = new THREE.Group();
  lidar.position.set(...LIDAR.origin);
  lidar.rotation.y = LIDAR.yaw;
  lidar.scale.setScalar(LIDAR.scale);
  const add = (geometry, material, [x, y, z], rotation = [0, 0, 0]) => {
    const mesh = shadowed(new THREE.Mesh(geometry, material));
    mesh.position.set(x, y, z);
    mesh.rotation.set(...rotation);
    lidar.add(mesh);
    return mesh;
  };
  const anodized = standard('anodized');
  const body = standard('body');
  const steel = standard('steel');
  const ring = standard('ring');
  const plate = standard('plate');
  const quarter = Math.PI / 2;
  const h = LIDAR.beamHeight;

  const [boardWidth, boardHeight, boardDepth] = LIDAR.board;
  add(new RoundedBoxGeometry(boardWidth, boardHeight, boardDepth, 3, 0.006), standard('board'), [0, -boardHeight / 2, 0]);
  const pitch = 0.05;
  const columns = Math.floor((boardWidth - 0.04) / pitch / 2);
  const rows = Math.floor((boardDepth - 0.04) / pitch / 2);
  const holes = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.0062, 0.0062, 0.0012, 16),
    standard('hole'),
    (2 * columns + 1) * (2 * rows + 1),
  );
  const matrix = new THREE.Matrix4();
  let k = 0;
  for (let i = -columns; i <= columns; i++) {
    for (let j = -rows; j <= rows; j++) holes.setMatrixAt(k++, matrix.makeTranslation(i * pitch, 0.0004, j * pitch));
  }
  holes.receiveShadow = true;
  lidar.add(holes);

  /** A post from the board to `top`: a holder and a steel rod. */
  const post = (x, z, top) => {
    add(new THREE.CylinderGeometry(0.017, 0.017, 0.045, 24), anodized, [x, 0.0225, z]);
    add(new THREE.CylinderGeometry(0.009, 0.009, top, 16), steel, [x, top / 2, z]);
  };

  // The scanning mirrors: a housing with a round window toward the scene, and a port toward the beamsplitter.
  const [mx, , mz] = LIDAR.parts.mirrors;
  const housing = { width: 0.15, height: 0.15, depth: 0.11, front: mz - 0.036 };
  const housingCenter = [mx, h, housing.front + housing.depth / 2];
  add(new RoundedBoxGeometry(0.12, h - housing.height / 2, 0.09, 2, 0.004), anodized, [mx, (h - housing.height / 2) / 2, housingCenter[2]]);
  add(new RoundedBoxGeometry(housing.width, housing.height, housing.depth, 4, 0.008), body, housingCenter);
  add(new THREE.CircleGeometry(0.047, 48), standard('window'), [mx, h, housing.front - 0.0012], [0, Math.PI, 0]);
  add(new THREE.TorusGeometry(0.05, 0.0065, 16, 64), ring, [mx, h, housing.front - 0.001]);
  add(new THREE.TorusGeometry(0.02, 0.005, 12, 40), steel, [mx - housing.width / 2, h, mz], [0, quarter, 0]);
  // The housing's lid, with a screw at each corner.
  const top = h + housing.height / 2;
  add(new RoundedBoxGeometry(housing.width - 0.024, 0.004, housing.depth - 0.024, 2, 0.002), plate, [mx, top + 0.002, housingCenter[2]]);
  for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    add(new THREE.CylinderGeometry(0.0045, 0.0045, 0.003, 12), anodized, [mx + sx * (housing.width / 2 - 0.022), top + 0.0045, housingCenter[2] + sz * (housing.depth / 2 - 0.022)]);
  }

  // The beamsplitter: a glass cube on a small platform, its coating on the diagonal that turns returning light to the detector.
  const [bx, , bz] = LIDAR.parts.beamsplitter;
  const cube = 0.062;
  post(bx, bz, h - cube / 2 - 0.008);
  add(new RoundedBoxGeometry(0.08, 0.008, 0.08, 2, 0.002), anodized, [bx, h - cube / 2 - 0.004, bz]);
  const glass = add(new THREE.BoxGeometry(cube, cube, cube), standard('glass'), [bx, h, bz]);
  glass.castShadow = false;
  glass.renderOrder = 2;
  const coating = add(new THREE.PlaneGeometry(cube * Math.SQRT2 * 0.98, cube * 0.98), standard('coating'), [bx, h, bz], [0, quarter / 2, 0]);
  coating.material.side = THREE.DoubleSide;
  coating.castShadow = false;
  coating.renderOrder = 1;

  // The laser: a body with its aperture toward the beamsplitter.
  const [lx, , lz] = LIDAR.parts.laser;
  const laser = { length: 0.17, side: 0.072, nozzle: 0.022 };
  const laserCenter = lx - laser.nozzle - laser.length / 2;
  post(laserCenter - 0.04, lz, h - laser.side / 2);
  post(laserCenter + 0.04, lz, h - laser.side / 2);
  add(new RoundedBoxGeometry(laser.length, laser.side, laser.side, 4, 0.007), standard('laser'), [laserCenter, h, lz]);
  add(new THREE.CylinderGeometry(0.019, 0.019, laser.nozzle, 32), anodized, [lx - laser.nozzle / 2, h, lz], [0, 0, quarter]);
  add(new THREE.TorusGeometry(0.017, 0.004, 12, 40), ring, [lx, h, lz], [0, quarter, 0]);

  // The detector behind its objective lens, which looks at the beamsplitter.
  const lens = { front: bz + cube / 2 + 0.018, length: 0.115, radius: 0.034 };
  const lensBack = lens.front + lens.length;
  const detector = { width: 0.12, height: 0.11, depth: 0.18 };
  add(new THREE.CylinderGeometry(lens.radius, lens.radius, lens.length, 40), anodized, [bx, h, lens.front + lens.length / 2], [quarter, 0, 0]);
  add(new THREE.CylinderGeometry(lens.radius + 0.007, lens.radius + 0.007, 0.034, 40), body, [bx, h, lens.front + 0.06], [quarter, 0, 0]);
  add(new THREE.CylinderGeometry(lens.radius + 0.002, lens.radius + 0.002, 0.007, 40), steel, [bx, h, lens.front + 0.028], [quarter, 0, 0]);
  add(new THREE.CylinderGeometry(lens.radius + 0.002, lens.radius + 0.002, 0.007, 40), steel, [bx, h, lens.front + 0.094], [quarter, 0, 0]);
  add(new THREE.TorusGeometry(lens.radius - 0.002, 0.004, 12, 48), steel, [bx, h, lens.front]);
  add(new THREE.CircleGeometry(lens.radius - 0.004, 40), standard('window'), [bx, h, lens.front - 0.0005], [0, Math.PI, 0]);
  add(new RoundedBoxGeometry(detector.width, detector.height, detector.depth, 4, 0.008), body, [bx, h, lensBack + detector.depth / 2]);
  // Cooling fins along the detector's top, and its back plate with two connectors.
  for (const fin of [-0.036, -0.012, 0.012, 0.036]) {
    add(new RoundedBoxGeometry(0.009, 0.008, detector.depth - 0.03, 1, 0.002), anodized, [bx + fin, h + detector.height / 2 + 0.004, lensBack + detector.depth / 2]);
  }
  add(new RoundedBoxGeometry(detector.width - 0.02, detector.height - 0.02, 0.004, 2, 0.002), plate, [bx, h, lensBack + detector.depth + 0.002]);
  for (const side of [-0.025, 0.025]) {
    add(new THREE.CylinderGeometry(0.007, 0.007, 0.016, 16), steel, [bx + side, h - 0.01, lensBack + detector.depth + 0.01], [quarter, 0, 0]);
  }
  post(bx, lensBack + 0.05, h - detector.height / 2);
  post(bx, lensBack + detector.depth - 0.05, h - detector.height / 2);

  scene.add(lidar);
}

function buildLights(scene, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  scene.environment = environment;
  scene.environmentIntensity = 0.3;

  scene.add(new THREE.HemisphereLight('#ffffff', '#3a3a3a', 0.2));
  // A soft light from above: a pool of light that falls off toward the scene's edges.
  const key = new THREE.SpotLight('#fff8f0', 1.35, 0, 0.42, 1, 0);
  key.position.set(2.3, 4.4, 3.0);
  key.target.position.set(0.95, 0, 1.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 7;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.01;
  key.shadow.camera.near = 1.5;
  key.shadow.camera.far = 8;
  // A low light beside the scanning mirrors, as in the website's render: what the lidar cannot reach lies in the teapot's shadow.
  const low = new THREE.SpotLight('#fff1dc', 1.0, 0, 1.25, 0.35, 0);
  const forward = [-Math.sin(LIDAR.yaw), 0, -Math.cos(LIDAR.yaw)];
  low.position.set(BEAM.mirrors[0] + 0.1 * forward[0], BEAM.mirrors[1] + 0.02, BEAM.mirrors[2] + 0.1 * forward[2]);
  low.target.position.set(BEAM.mirrors[0] + forward[0], BEAM.mirrors[1] + 0.25, BEAM.mirrors[2] + forward[2]);
  low.castShadow = true;
  low.shadow.mapSize.set(2048, 2048);
  low.shadow.radius = 5;
  low.shadow.bias = -0.0004;
  low.shadow.normalBias = 0.012;
  low.shadow.camera.near = 0.08;
  low.shadow.camera.far = 4;
  scene.add(key, key.target, low, low.target);
  return environment;
}

/* ---------------------------------------------------------------------------
 * The render.
 * ------------------------------------------------------------------------ */

/**
 * Draw the scene into `canvas` (created for this render; it owns the WebGL
 * context). `colors` are CSS color strings: `direct` and `indirect` light
 * and the `scan` dots. Returns:
 *
 * - `setHiddenObject(geometry)`: add the bunny (cornerScene.js's
 *   `bunnyGeometry`), once; the indirect light is drawn from then on;
 * - `indirect()`: the indirect transient of the measurement at x_p
 *   (`measureIndirect`), or null before the bunny is set;
 * - `setSize(width, height, ratio)` in stage pixels;
 * - `draw(frame)` for a frame of timeline.js;
 * - `project(point)` from world (m) to canvas pixels;
 * - `dispose()`, which frees every GPU resource and the context.
 */
export function createLidarRender(canvas, colors) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Nothing that casts a shadow moves: the shadows are drawn once, and again when the hidden object is added.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.setClearColor('#000000', 1);

  const direct = new THREE.Color(colors.direct);
  const indirect = new THREE.Color(colors.indirect);
  const scanColor = new THREE.Color(colors.scan);
  const white = new THREE.Color('#ffffff');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA.fov, 16 / 9, 0.5, 30);
  const azimuth = THREE.MathUtils.degToRad(CAMERA.azimuth);
  const elevation = THREE.MathUtils.degToRad(CAMERA.elevation);
  camera.position
    .set(Math.cos(elevation) * Math.cos(azimuth), Math.sin(elevation), Math.cos(elevation) * Math.sin(azimuth))
    .multiplyScalar(CAMERA.distance)
    .add(toVector(CAMERA.target));
  camera.lookAt(...CAMERA.target);

  const waves = {
    uWaveColor: { value: indirect },
    uWaveCenter0: { value: toVector(RELAY_POINT) },
    uWaveRadius0: { value: 0 },
    uWaveStrength0: { value: 0 },
    uWaveCenter1: { value: new THREE.Vector3() },
    uWaveRadius1: { value: 0 },
    uWaveStrength1: { value: 0 },
    uWaveWidth: { value: 0.028 },
    uHiddenGlow: { value: 0 },
    uContacts: {
      value: [
        new THREE.Vector4(TEAPOT.position[0], TEAPOT.position[2], 0.21, 0.45),
        new THREE.Vector4(BUNNY.position[0], BUNNY.position[2], 0.2, 0.4),
      ],
    },
  };
  buildRoom(scene, waves);
  buildLidar(scene);
  const environment = buildLights(scene, renderer);

  const teapot = teapotGeometry();
  const teapotMaterial = addLightWaves(standard('teapot'), waves, { seams: [0, 0.5, 0] });
  // Both sides: the lid's rim and the spout's mouth show the inside of the surface.
  teapotMaterial.side = THREE.DoubleSide;
  scene.add(shadowed(new THREE.Mesh(teapot, teapotMaterial)));
  const caster = createCaster({ teapot });
  let hidden = null;

  // Light along the beam's path: laser → beamsplitter → mirrors → a point of the scene, and mirrors → beamsplitter → detector.
  const beamColors = { direct, indirect };
  const laserBeam = createBeam(beamColors);
  const sharedBeam = createBeam(beamColors);
  const mainBeam = createBeam(beamColors);
  const detectorBeam = createBeam(beamColors);
  const pathBeam = createBeam(beamColors);
  laserBeam.place(BEAM.laser, BEAM.beamsplitter);
  sharedBeam.place(BEAM.beamsplitter, BEAM.mirrors);
  mainBeam.place(BEAM.mirrors, RELAY_POINT);
  detectorBeam.place(BEAM.beamsplitter, BEAM.detector);
  scene.add(laserBeam.group, sharedBeam.group, mainBeam.group, detectorBeam.group, pathBeam.group);
  const laserSpan = laserBeam.length;
  const sharedSpan = sharedBeam.length;
  const relaySpan = mainBeam.length;

  const glowTexture = createGlowTexture();
  const packet = createGlow(glowTexture, direct);
  const indirectPacket = createGlow(glowTexture, indirect);
  const spotGlow = createGlow(glowTexture, direct);
  const hiddenGlow = createGlow(glowTexture, indirect);
  scene.add(packet, indirectPacket, spotGlow, hiddenGlow);

  const spotMaterial = new THREE.MeshBasicMaterial({ color: direct.clone(), transparent: true, toneMapped: false, depthWrite: false });
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.014, 40), spotMaterial);
  spot.position.set(...RELAY_POINT).addScaledVector(toVector(RELAY_NORMAL), 0.003);
  spot.lookAt(toVector(RELAY_POINT).add(toVector(RELAY_NORMAL)));
  spot.renderOrder = 2;
  scene.add(spot);

  const outgoingShell = createShell(indirect);
  const returningShell = createShell(indirect);
  scene.add(outgoingShell.mesh, returningShell.mesh);

  // The scan's points: flat dots on the surfaces, each drawn from the moment the beam passes it.
  const points = scanPoints(caster);
  const scanCells = SCAN_ROWS * SCAN_COLUMNS;
  const dots = new THREE.InstancedMesh(
    new THREE.CircleGeometry(DOT_RADIUS, 28),
    new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
    points.length,
  );
  const dotPlacements = points.map((p) => ({
    position: toVector(p.point).addScaledVector(toVector(p.normal), 0.0025),
    quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), toVector(p.normal)),
  }));
  dots.count = 0;
  dots.renderOrder = 1;
  scene.add(dots);
  const dotMatrix = new THREE.Matrix4();
  const dotScale = new THREE.Vector3();
  const dotColor = new THREE.Color();

  let width = 1;
  let height = 1;

  function along(start, end, u) {
    const span = distance(start, end);
    return start.map((s, k) => s + ((end[k] - s) * u) / span);
  }

  /** The measurement at x_p: the pulse out, its direct return, and the indirect light back, along the beam. */
  function drawMeasurement(frame) {
    const T = frame.time;
    const transient = hidden?.indirect ?? null;
    const sinceHit = T - TIMES.hit;
    /** Light at a distance s (m) from the laser on the way out: the pulse, and the trace it leaves. */
    const out = (s) => {
      if (!frame.outgoing) return TRACE_LEVEL * frame.trace;
      return PULSE_LEVEL * pulse(T - s / LIGHT_SPEED) + (s < LIGHT_SPEED * T ? TRACE_LEVEL : 0);
    };
    /** Light at a distance s (m) from x_p on the way back: [direct, indirect]. */
    const back = (s) => [
      frame.directReturn ? PULSE_LEVEL * pulse(sinceHit - s / LIGHT_SPEED) : 0,
      frame.indirect && transient ? 0.85 * transient.at(sinceHit - s / LIGHT_SPEED) : 0,
    ];
    /** The trace of the return path, from the moment the direct return has passed. */
    const returned = (s) => {
      if (frame.outgoing) return 0;
      if (frame.directReturn) return s < LIGHT_SPEED * sinceHit ? TRACE_LEVEL : 0;
      return TRACE_LEVEL * frame.trace;
    };

    mainBeam.place(BEAM.mirrors, RELAY_POINT);
    laserBeam.fill((u) => [out(u), 0]);
    sharedBeam.fill((u) => {
      const [white, amber] = back(relaySpan + sharedSpan - u);
      return [out(laserSpan + u) + white, amber];
    });
    mainBeam.fill((u) => {
      const [white, amber] = back(relaySpan - u);
      return [out(laserSpan + sharedSpan + u) + white, amber];
    });
    detectorBeam.fill((u) => {
      const s = relaySpan + sharedSpan + u;
      const [white, amber] = back(s);
      return [white + returned(s), amber];
    });

    // A glow where the pulse is, while it is between the mirrors and x_p.
    let packetAt = null;
    if (frame.outgoing) packetAt = LIGHT_SPEED * T - laserSpan - sharedSpan;
    if (frame.directReturn) packetAt = relaySpan - LIGHT_SPEED * sinceHit;
    const onBeam = packetAt !== null && packetAt > 0 && packetAt < relaySpan;
    placeGlow(packet, onBeam ? along(BEAM.mirrors, RELAY_POINT, packetAt) : RELAY_POINT, 0.11, onBeam ? 0.9 : 0);
    const indirectAt = transient ? relaySpan - LIGHT_SPEED * (sinceHit - transient.peakDelay) : 0;
    const indirectOnBeam = frame.indirect && transient && indirectAt > 0 && indirectAt < relaySpan;
    placeGlow(indirectPacket, indirectOnBeam ? along(BEAM.mirrors, RELAY_POINT, indirectAt) : RELAY_POINT, 0.16, indirectOnBeam ? 0.5 : 0);

    // x_p: a flash when the pulse arrives, then a lit spot; amber while the indirect light returns through it.
    const flash = frame.outgoing || frame.directReturn ? pulse(sinceHit / 2.5) : 0;
    const amber = frame.indirect && transient ? transient.at(sinceHit) : 0;
    spotMaterial.color.copy(direct).lerp(indirect, 0.85 * amber);
    spotMaterial.opacity = frame.spot;
    spot.visible = frame.spot > 0.003;
    placeGlow(spotGlow, RELAY_POINT, 0.1 + 0.1 * flash + 0.06 * amber, 0.5 * frame.spot + flash);
    spotGlow.material.color.copy(spotMaterial.color);
  }

  /** The wavefront from x_p, the hidden object's light, and the wavefront back. */
  function drawWaves(frame) {
    const transient = hidden?.indirect ?? null;
    const running = frame.indirect && transient !== null;
    const reach = transient ? transient.nearest.distance : 0;
    const r0 = running ? LIGHT_SPEED * (frame.time - TIMES.hit) : 0;
    const r1 = r0 - reach;
    const strength0 = running && r0 > 0 ? Math.min(1, r0 / 0.06) * (1 - smoothstep(reach + 0.35, reach + 0.75, r0)) : 0;
    const strength1 = running && r1 > 0 ? Math.min(1, r1 / 0.05) * (1 - smoothstep(reach - 0.05, reach + 0.25, r1)) : 0;
    outgoingShell.set(RELAY_POINT, r0, strength0);
    returningShell.set(transient ? transient.nearest.point : RELAY_POINT, r1, 0.8 * strength1);

    waves.uWaveRadius0.value = running ? r0 : 100;
    waves.uWaveStrength0.value = strength0;
    waves.uWaveRadius1.value = r1;
    waves.uWaveStrength1.value = 0.7 * strength1;
    // The hidden object: brightest as the wavefront crosses it, then a faint light that stays.
    const crossing = running && r1 > 0 ? Math.exp(-r1 / 0.2) : 0;
    const lit = running ? (r1 > 0 ? 0.34 + 0.56 * crossing : 0.9) : 0.34;
    waves.uHiddenGlow.value = transient ? lit * frame.hiddenGlow : 0;
    placeGlow(hiddenGlow, transient ? transient.nearest.point : RELAY_POINT, 0.2, 0.55 * crossing);

    // The path of the indirect light, once it has returned to x_p.
    const returnedAt = TIMES.hit + (2 * reach) / LIGHT_SPEED;
    const shown = transient ? frame.path * (frame.indirect ? smoothstep(returnedAt - 0.3, returnedAt + 0.5, frame.time) : 1) : 0;
    pathBeam.fill(() => [0, 0.3 * shown]);
  }

  /** The raster scan: the beam at its current direction, and a dot at every grid point it has passed. */
  function drawScan(frame) {
    const progress = frame.scan ?? 0;
    const passed = progress * scanCells;
    let lit = 0;
    while (lit < points.length && points[lit].order + 0.5 <= passed) lit++;
    if (frame.scan !== null && progress >= 1) lit = points.length;
    dots.count = lit;
    for (let i = 0; i < lit; i++) {
      // A dot flashes as the beam passes it, then settles.
      const flash = progress < 1 ? Math.exp(-(passed - points[i].order - 0.5) / 2.5) : 0;
      dotMatrix.compose(dotPlacements[i].position, dotPlacements[i].quaternion, dotScale.setScalar(1 + 0.7 * flash));
      dots.setMatrixAt(i, dotMatrix);
      dots.setColorAt(i, dotColor.copy(scanColor).lerp(white, 0.75 * flash));
    }
    dots.instanceMatrix.needsUpdate = true;
    if (dots.instanceColor) dots.instanceColor.needsUpdate = true;

    if (frame.scan === null || progress <= 0 || progress >= 1) return;
    const direction = scanBeamDirection(progress);
    const hit = caster.cast(BEAM.mirrors, direction);
    const target = hit ? hit.point : BEAM.mirrors.map((value, axis) => value + 3 * direction[axis]);
    mainBeam.place(BEAM.mirrors, target);
    mainBeam.fill((u) => [hit ? SCAN_LEVEL : SCAN_LEVEL * (1 - smoothstep(1.2, 2.6, u)), 0]);
    laserBeam.fill(() => [SCAN_LEVEL, 0]);
    sharedBeam.fill(() => [SCAN_LEVEL, 0]);
    detectorBeam.fill(() => [SCAN_LEVEL / 2, 0]);
    placeGlow(packet, target, 0.09, hit ? 1 : 0);
  }

  return {
    setHiddenObject(geometry) {
      if (hidden) throw new Error('lidarCapture: the hidden object is already in the scene');
      const material = addLightWaves(standard('bunny'), waves, { seams: [0, 0.5, 0], hidden: true });
      const mesh = shadowed(new THREE.Mesh(geometry, material));
      scene.add(mesh);
      hidden = { mesh, indirect: measureIndirect(geometry, caster) };
      waves.uWaveCenter1.value.set(...hidden.indirect.nearest.point);
      pathBeam.place(RELAY_POINT, hidden.indirect.nearest.point);
      renderer.shadowMap.needsUpdate = true;
    },
    indirect() {
      return hidden ? hidden.indirect : null;
    },
    setSize(nextWidth, nextHeight, ratio) {
      if (nextWidth === width && nextHeight === height && renderer.getPixelRatio() === ratio) return;
      width = nextWidth;
      height = nextHeight;
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.setViewOffset(width, height, -CAMERA.shift[0] * width, -CAMERA.shift[1] * height, width, height);
      camera.updateProjectionMatrix();
    },
    draw(frame) {
      drawMeasurement(frame);
      drawWaves(frame);
      drawScan(frame);
      renderer.render(scene, camera);
    },
    project(point) {
      const v = toVector(point).project(camera);
      return [((v.x + 1) / 2) * width, ((1 - v.y) / 2) * height];
    },
    dispose() {
      scene.traverse((object) => {
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (!material) continue;
          for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
          for (const uniform of Object.values(material.uniforms ?? {})) if (uniform.value?.isTexture) uniform.value.dispose();
          material.dispose();
        }
      });
      caster.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
