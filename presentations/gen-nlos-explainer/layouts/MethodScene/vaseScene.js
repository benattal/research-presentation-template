/**
 * The captured scene of the method slides in 3D, in three.js: the RGB image
 * unprojected into a colored point cloud with the depth from direct light,
 * the reconstructed NLOS volume glowing behind it, the input camera, and
 * the target trajectory with a camera moving along it.
 *
 * World coordinates are three.js's: y up, the input camera at the origin
 * looking down -z, x to the right of the image as displayed, meters.
 *
 * The view keeps no clock: `draw(picture)` draws one frame, a pure function
 * of `picture`, and skips the work when nothing changed since the last
 * frame. A slide takes a view with `acquireVaseScene` and gives it back
 * with `releaseVaseScene`; a view given back is kept for a moment, so the
 * next slide of the same scene shows it at once instead of building it.
 *
 * A frame is drawn in three passes: the points and lines into a
 * multisampled target with a depth texture; the volume, ray marched at
 * half resolution and dimmed behind the points with that depth; and their
 * sum on the canvas, with a halo around the volume from that pass's
 * mipmaps.
 */
import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';

/** Colors of the drawing, in the theme's roles (`--direct`, `--accent`). */
const COLORS = { inputCamera: 0xffffff, target: 0xffcc66 };

/** Depth of the image plane each camera is drawn with, m. */
const INPUT_PLANE_DEPTH = 0.42;
const TARGET_PLANE_DEPTH = 0.11;

/** Target frames drawn as fixed cameras along the trajectory. */
const KEY_FRAMES = [7, 14, 21, 28];
const ARC_SEGMENTS = 120;
/** Target frames of the growing arc over which a camera on it grows to its size; fewer at the arc's end. */
const APPEAR_FRAMES = 6;
const END_FRAMES = 1;
/** The moving camera's size, relative to the fixed cameras. */
const MOVING_CAMERA_SCALE = 1.5;

/**
 * The volume's look. It is drawn as the conditioning videos draw it, by the
 * largest density along each pixel's ray in inferno, so the 3D view and the
 * MIP video show the same shapes. Densities are relative to the volume's
 * maximum (the MIP videos are empty below 0.32 and saturate at 0.98).
 */
const VOLUME_LOOK = {
  low: 0.16, // where the colormap starts
  high: 0.95, // where it saturates
  behind: 0.5, // share of the level left behind a visible surface
  resolution: 0.5, // of the canvas, per axis
};

/** How long a view given back is kept for the next slide, in ms. */
const PARK_MS = 2000;

/** Inferno, as a polynomial fit (the conditioning videos use the same one). */
const INFERNO_GLSL = /* glsl */ `
vec3 inferno(float t) {
  const vec3 c0 = vec3(0.0002189403691192265, 0.001651004631001012, -0.01948089843709184);
  const vec3 c1 = vec3(0.1065134194856116, 0.5639564367884091, 3.932712388889277);
  const vec3 c2 = vec3(11.60249308247187, -3.972853965665698, -15.9423941062914);
  const vec3 c3 = vec3(-41.70399613139459, 17.43639888205313, 44.35414519872813);
  const vec3 c4 = vec3(77.162935699427, -33.40235894210092, -81.80730925738993);
  const vec3 c5 = vec3(-71.31942824499214, 32.62606426397723, 73.20951985803202);
  const vec3 c6 = vec3(25.13112622477341, -12.24266895238567, -23.07032500287172);
  t = clamp(t, 0.0, 1.0);
  return clamp(c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6))))), 0.0, 1.0);
}
`;

/**
 * A point per image pixel: `position` holds the pixel's ray (x, y at unit
 * depth) and its depth (0: none). Colors are written linear, like the
 * lines three.js draws into the same target.
 */
const POINT_VERTEX = /* glsl */ `
uniform float uUnproject;     // 0: every pixel on the input camera's image plane; 1: at its depth
uniform float uDepthTint;     // 0: the image's colors; 1: the depth map (near is bright)
uniform float uPlaneDepth;    // depth of that image plane, m
uniform vec2 uDepthRange;     // nearest and farthest depth, m
uniform float uFocal;         // the input camera's focal length, pixels
uniform float uPixelsPerUnit; // drawing-buffer pixels per meter at distance 1
attribute vec3 color;
varying vec3 vColor;

vec3 toLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}

void main() {
  bool hasDepth = position.z > 0.0;
  float depth = hasDepth ? position.z : uPlaneDepth;
  float farness = clamp((depth - uDepthRange.x) / (uDepthRange.y - uDepthRange.x), 0.0, 1.0);
  // Near pixels leave the plane first.
  float t = clamp((uUnproject - 0.3 * farness) / 0.7, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  float along = mix(uPlaneDepth, depth, t);
  vec4 view = modelViewMatrix * vec4(position.xy * along, -along, 1.0);
  gl_Position = projectionMatrix * view;
  // One image pixel's footprint at this depth, enlarged so that neighbors touch.
  float size = max(2.0, 2.0 * along / uFocal * uPixelsPerUnit / -view.z);
  // A pixel without depth has nowhere to go: it shrinks away as the others leave.
  if (!hasDepth) size *= 1.0 - smoothstep(0.0, 0.25, uUnproject);
  gl_PointSize = size;
  if (size < 0.05) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  vec3 depthColor = hasDepth ? vec3(mix(0.96, 0.16, farness)) : vec3(0.0);
  vColor = toLinear(mix(color, depthColor, uDepthTint));
}
`;

const POINT_FRAGMENT = /* glsl */ `
varying vec3 vColor;
void main() {
  float radius = 2.0 * length(gl_PointCoord - 0.5);
  // Half a pixel of soft edge: a small point stays bright.
  float alpha = clamp((1.0 - radius) / fwidth(radius) + 0.5, 0.0, 1.0);
  if (alpha <= 0.0) discard;
  gl_FragColor = vec4(vColor, alpha);
}
`;

const SCREEN_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** The volume along each pixel's ray, in display colors with their coverage in alpha. */
const VOLUME_FRAGMENT = /* glsl */ `
precision highp float;
precision highp sampler3D;
uniform sampler3D uVolume;
uniform sampler2D uDepth;          // depth of the points, from the scene pass
uniform mat4 uInverseProjection;
uniform mat4 uCameraWorld;
uniform vec3 uBoxMin;
uniform vec3 uBoxMax;
uniform vec3 uSize;                // voxels per axis
uniform float uLow;
uniform float uHigh;
uniform float uBehind;
uniform float uReveal;             // 0: nothing; 1: all of it; the densest parts appear first
varying vec2 vUv;
${INFERNO_GLSL}
const int MAX_STEPS = 256;
const float STEP = 0.005;

void main() {
  vec2 ndc = vUv * 2.0 - 1.0;
  vec4 far = uInverseProjection * vec4(ndc, 1.0, 1.0);
  vec3 direction = normalize((uCameraWorld * vec4(normalize(far.xyz / far.w), 0.0)).xyz);
  vec3 origin = uCameraWorld[3].xyz;

  float depth = texture2D(uDepth, vUv).r;
  vec4 surface = uInverseProjection * vec4(ndc, depth * 2.0 - 1.0, 1.0);
  float surfaceDistance = depth < 1.0 ? length(surface.xyz / surface.w) : 1.0e6;

  vec3 t0 = (uBoxMin - origin) / direction;
  vec3 t1 = (uBoxMax - origin) / direction;
  vec3 tNear = min(t0, t1);
  vec3 tFar = max(t0, t1);
  float enter = max(max(max(tNear.x, tNear.y), tNear.z), 0.0);
  float leave = min(min(tFar.x, tFar.y), tFar.z);
  float brightest = 0.0;
  if (enter < leave && uReveal > 0.0) {
    // A fixed per-pixel offset of the first sample hides the slicing pattern.
    float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    for (int i = 0; i < MAX_STEPS; i++) {
      float s = enter + (float(i) + jitter) * STEP;
      if (s > leave) break;
      vec3 p = origin + direction * s;
      vec3 uvw = (0.5 + (p - uBoxMin) / (uBoxMax - uBoxMin) * (uSize - 1.0)) / uSize;
      // An explicit level: a sample that takes screen-space derivatives cannot sit in a loop that ends early.
      float encoded = textureLod(uVolume, uvw, 0.0).r;
      float density = encoded * encoded;
      float level = (density - uLow) / (uHigh - uLow) * smoothstep(1.0 - uReveal, 1.15 - uReveal, density + 0.15 * uReveal);
      brightest = max(brightest, level * (s > surfaceDistance ? uBehind : 1.0));
    }
  }
  brightest = clamp(brightest, 0.0, 1.0);
  float coverage = smoothstep(0.02, 0.4, brightest);
  gl_FragColor = vec4(inferno(brightest) * coverage, coverage);
}
`;

/** The scene pass (linear) in display colors, plus the volume's emission. */
const COMPOSITE_FRAGMENT = /* glsl */ `
uniform sampler2D uScene;
uniform sampler2D uGlow;
varying vec2 vUv;

vec3 toDisplay(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  vec3 scene = toDisplay(texture2D(uScene, vUv).rgb);
  vec4 glow = texture2D(uGlow, vUv);
  vec3 halo = 0.45 * textureLod(uGlow, vUv, 2.5).rgb + 0.4 * textureLod(uGlow, vUv, 4.5).rgb;
  // The volume covers most of what is behind it, then adds its light and a halo.
  vec3 color = scene * (1.0 - 0.75 * glow.a) + glow.rgb + halo;
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * The point cloud's attributes from decoded image pixels: `rgba` (the RGB
 * image) and `depthRgba` (depth in mm as 16 bits, R the high byte, G the
 * low byte; 0: none), both `camera.width` × `camera.height`. `rays` holds
 * each pixel's ray at unit depth (x, y) and its depth in meters.
 */
export function pointCloudFromPixels({ rgba, depthRgba, camera }) {
  const count = camera.width * camera.height;
  const rays = new Float32Array(3 * count);
  const colors = new Float32Array(3 * count);
  for (let v = 0; v < camera.height; v += 1) {
    for (let u = 0; u < camera.width; u += 1) {
      const pixel = v * camera.width + u;
      rays[3 * pixel] = (u - camera.cx) / camera.fx;
      rays[3 * pixel + 1] = -(v - camera.cy) / camera.fy;
      rays[3 * pixel + 2] = (depthRgba[4 * pixel] * 256 + depthRgba[4 * pixel + 1]) / 1000;
      for (let channel = 0; channel < 3; channel += 1) colors[3 * pixel + channel] = rgba[4 * pixel + channel] / 255;
    }
  }
  return { rays, colors };
}

/**
 * The volume's voxels (x fastest, then y, then z) from its atlas image
 * (`rgba`, `atlasWidth` wide): slice k is tile (k % columns,
 * floor(k / columns)), tile row j is voxel row j, tile column i is voxel i.
 */
export function volumeFromAtlas({ rgba, atlasWidth, size, columns }) {
  const [nx, ny, nz] = size;
  const voxels = new Uint8Array(nx * ny * nz);
  for (let k = 0; k < nz; k += 1) {
    const tileX = (k % columns) * nx;
    const tileY = Math.floor(k / columns) * ny;
    for (let j = 0; j < ny; j += 1) {
      const row = (tileY + j) * atlasWidth;
      for (let i = 0; i < nx; i += 1) voxels[i + nx * (j + ny * k)] = rgba[4 * (row + tileX + i)];
    }
  }
  return voxels;
}

/** A pinhole camera's frustum from its center to its image plane at `depth`, as segment endpoints. */
function frustumSegments(camera, depth) {
  const corners = [[0, 0], [camera.width, 0], [camera.width, camera.height], [0, camera.height]].map(([u, v]) => (
    new THREE.Vector3(((u - camera.cx) / camera.fx) * depth, (-(v - camera.cy) / camera.fy) * depth, -depth)
  ));
  const center = new THREE.Vector3();
  return corners.flatMap((corner, i) => [center, corner, corner, corners[(i + 1) % 4]]);
}

/** Position of target camera `index` (fractional between frames) on the orbit about `trajectory.center`. */
function orbitPosition(trajectory, index) {
  const angle = THREE.MathUtils.degToRad(trajectory.arcDegrees * (index / (trajectory.frames - 1)));
  const [x, y, z] = trajectory.center;
  return new THREE.Vector3(x + trajectory.radius * Math.sin(angle), y, z + trajectory.radius * Math.cos(angle));
}

/**
 * Create the 3D view, on a canvas of its own. `scene` is the slides' scene
 * description
 * (`camera`: intrinsics and `depthRange`; `volume`: `size`, `box`;
 * `trajectory`: `center`, `radius`, `arcDegrees`, `frames`), `cloud` comes
 * from `pointCloudFromPixels` and `voxels` from `volumeFromAtlas`.
 * `background` is the CSS color behind the scene: the canvas is opaque, so
 * it is given the shade of the panel it sits in.
 *
 * Returns `{ canvas, resize(width, height, ratio), draw(picture),
 * invalidate(), project(point), dispose() }`: `resize` takes CSS pixels and
 * the device pixel ratio to draw at, does nothing when they are the view's
 * already, and otherwise makes the next `draw` draw, as `invalidate` does;
 * `project` maps a world point to CSS pixels in the canvas, for the view
 * last drawn; `dispose` frees every GPU resource and the context, after
 * which the canvas cannot draw again.
 */
export function createVaseScene({ scene, cloud, voxels, background }) {
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  // The scene pass is cleared to it in linear values, and the composite pass shows it in display colors.
  renderer.setClearColor(new THREE.Color(background), 1);
  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 20);
  const disposables = [];
  const track = (item) => {
    disposables.push(item);
    return item;
  };

  // Pass targets. Lines do not write depth, so the depth is the points'.
  const sceneTarget = track(new THREE.WebGLRenderTarget(1, 1, {
    samples: 4,
    type: THREE.HalfFloatType,
    depthTexture: track(new THREE.DepthTexture(1, 1)),
  }));
  const glowTarget = track(new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter,
  }));

  // Point cloud.
  const pointGeometry = track(new THREE.BufferGeometry());
  pointGeometry.setAttribute('position', new THREE.BufferAttribute(cloud.rays, 3));
  pointGeometry.setAttribute('color', new THREE.BufferAttribute(cloud.colors, 3));
  const pointMaterial = track(new THREE.ShaderMaterial({
    vertexShader: POINT_VERTEX,
    fragmentShader: POINT_FRAGMENT,
    uniforms: {
      uUnproject: { value: 1 },
      uDepthTint: { value: 0 },
      uPlaneDepth: { value: INPUT_PLANE_DEPTH },
      uDepthRange: { value: new THREE.Vector2(...scene.camera.depthRange) },
      uFocal: { value: scene.camera.fx },
      uPixelsPerUnit: { value: 1 },
    },
    alphaToCoverage: true,
  }));
  const points = new THREE.Points(pointGeometry, pointMaterial);
  points.frustumCulled = false;
  world.add(points);

  // Cameras and the trajectory, as lines.
  const lines = [];
  function addLines(segments, color, linewidth) {
    const geometry = track(new LineSegmentsGeometry());
    geometry.setPositions(segments.flatMap((point) => [point.x, point.y, point.z]));
    const material = track(new LineMaterial({ color, linewidth, transparent: true, depthWrite: false, alphaToCoverage: true }));
    const object = new LineSegments2(geometry, material);
    object.frustumCulled = false;
    lines.push(object);
    world.add(object);
    return object;
  }

  addLines(frustumSegments(scene.camera, INPUT_PLANE_DEPTH), COLORS.inputCamera, 1.5);

  const { trajectory } = scene;
  const orbitCenter = new THREE.Vector3(...trajectory.center);
  const up = new THREE.Vector3(0, 1, 0);
  const poseMatrix = new THREE.Matrix4();
  /** Put a camera drawn at the origin (looking down -z) at target frame `index`. */
  function placeOnOrbit(object, index) {
    object.position.copy(orbitPosition(trajectory, index));
    object.quaternion.setFromRotationMatrix(poseMatrix.lookAt(object.position, orbitCenter, up));
  }

  const arcPoints = Array.from({ length: ARC_SEGMENTS + 1 }, (_, s) => (
    orbitPosition(trajectory, (s / ARC_SEGMENTS) * (trajectory.frames - 1))
  ));
  const arc = addLines(arcPoints.slice(1).flatMap((point, s) => [arcPoints[s], point]), COLORS.target, 1.6);

  const targetSegments = frustumSegments(scene.camera, TARGET_PLANE_DEPTH);
  const keyCameras = KEY_FRAMES.map((frame) => {
    const object = addLines(targetSegments, COLORS.target, 1.1);
    object.material.opacity = 0.5;
    placeOnOrbit(object, frame);
    return object;
  });

  const movingCamera = new THREE.Group();
  movingCamera.add(addLines(targetSegments, COLORS.target, 2.4));
  const planeCorners = [1, 3, 5, 7].map((i) => targetSegments[i]);
  const planeGeometry = track(new THREE.BufferGeometry().setFromPoints([0, 1, 2, 0, 2, 3].map((i) => planeCorners[i])));
  const planeMaterial = track(new THREE.MeshBasicMaterial({
    color: COLORS.target, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide,
  }));
  movingCamera.add(new THREE.Mesh(planeGeometry, planeMaterial));
  world.add(movingCamera);

  // NLOS volume: ray marched on a screen-filling pair of triangles.
  const [nx, ny, nz] = scene.volume.size;
  const volumeTexture = track(new THREE.Data3DTexture(voxels, nx, ny, nz));
  volumeTexture.format = THREE.RedFormat;
  volumeTexture.type = THREE.UnsignedByteType;
  volumeTexture.minFilter = THREE.LinearFilter;
  volumeTexture.magFilter = THREE.LinearFilter;
  volumeTexture.unpackAlignment = 1;
  volumeTexture.needsUpdate = true;

  const screenGeometry = track(new THREE.PlaneGeometry(2, 2));
  const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  function screenPass(fragmentShader, uniforms) {
    const material = track(new THREE.ShaderMaterial({
      vertexShader: SCREEN_VERTEX, fragmentShader, uniforms, depthTest: false, depthWrite: false,
    }));
    const mesh = new THREE.Mesh(screenGeometry, material);
    mesh.frustumCulled = false;
    return { material, scene: new THREE.Scene().add(mesh) };
  }
  const glowPass = screenPass(VOLUME_FRAGMENT, {
    uVolume: { value: volumeTexture },
    uDepth: { value: sceneTarget.depthTexture },
    uInverseProjection: { value: camera.projectionMatrixInverse },
    uCameraWorld: { value: camera.matrixWorld },
    uBoxMin: { value: new THREE.Vector3(...scene.volume.box[0]) },
    uBoxMax: { value: new THREE.Vector3(...scene.volume.box[1]) },
    uSize: { value: new THREE.Vector3(nx, ny, nz) },
    uLow: { value: VOLUME_LOOK.low },
    uHigh: { value: VOLUME_LOOK.high },
    uBehind: { value: VOLUME_LOOK.behind },
    uReveal: { value: 0 },
  });
  const compositePass = screenPass(COMPOSITE_FRAGMENT, {
    uScene: { value: sceneTarget.texture },
    uGlow: { value: glowTarget.texture },
  });

  let cssWidth = 1;
  let cssHeight = 1;
  /** What the last frame drew, to skip a frame or its volume pass when unchanged. */
  let drawn = { frame: '', glow: '' };

  function resize(width, height, ratio) {
    if (width === cssWidth && height === cssHeight && ratio === renderer.getPixelRatio()) return;
    cssWidth = width;
    cssHeight = height;
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height);
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    sceneTarget.setSize(size.x, size.y);
    glowTarget.setSize(Math.ceil(size.x * VOLUME_LOOK.resolution), Math.ceil(size.y * VOLUME_LOOK.resolution));
    camera.aspect = width / height;
    for (const object of lines) object.material.resolution.set(width, height);
    drawn = { frame: '', glow: '' };
  }

  /**
   * Draw one frame. `picture`:
   *   eye, target    the viewing camera's position and look-at point, m
   *   fov            its vertical field of view, degrees
   *   shift          CSS pixels the whole picture is moved right (a lens
   *                  shift: the perspective stays that of `eye` and `target`)
   *   unproject     0..1: the image's pixels from the image plane to their depths
   *   depthTint      0..1: the pixels colored by depth instead of by the image
   *   volume         0..1: how much of the NLOS volume shows, the densest parts first
   *   trajectory     0..1: how much of the target trajectory is drawn; it is
   *                  drawn at least as far as the moving camera
   *   targetIndex    fractional target frame of the moving camera
   *
   * The arc grows from the input camera. The moving camera grows to its
   * size as the arc leaves, and each fixed camera as the arc passes it.
   */
  function draw(picture) {
    const glowKey = JSON.stringify([picture.eye, picture.target, picture.fov, picture.shift, picture.unproject, picture.volume]);
    const frameKey = JSON.stringify(picture);
    if (frameKey === drawn.frame) return;

    camera.position.set(...picture.eye);
    camera.fov = picture.fov;
    // The canvas shows the part of the camera's picture that begins `shift` pixels left of it; this updates the projection.
    camera.setViewOffset(cssWidth, cssHeight, -picture.shift, 0, cssWidth, cssHeight);
    camera.lookAt(...picture.target);
    camera.updateMatrixWorld();

    const drawingHeight = renderer.getDrawingBufferSize(new THREE.Vector2()).y;
    pointMaterial.uniforms.uPixelsPerUnit.value = drawingHeight / (2 * Math.tan(THREE.MathUtils.degToRad(picture.fov) / 2));
    pointMaterial.uniforms.uUnproject.value = picture.unproject;
    pointMaterial.uniforms.uDepthTint.value = picture.depthTint;

    const lastFrame = trajectory.frames - 1;
    const reached = picture.trajectory > 0 ? Math.max(picture.trajectory * lastFrame, picture.targetIndex) : 0;
    /**
     * Size, 0 to 1, of the camera at `frame`: it grows over the APPEAR_FRAMES
     * after the arc reaches it, and the one at the arc's end over the arc's
     * last END_FRAMES.
     */
    const grown = (frame) => {
      const from = Math.min(frame, lastFrame - END_FRAMES);
      const t = THREE.MathUtils.clamp((reached - from) / (Math.min(frame + APPEAR_FRAMES, lastFrame) - from), 0, 1);
      return 1 - (1 - t) ** 3;
    };
    const show = (object, size) => {
      object.visible = size > 0;
      if (size > 0) object.scale.setScalar(size);
    };
    arc.visible = reached > 0;
    arc.geometry.instanceCount = Math.round((ARC_SEGMENTS * reached) / lastFrame);
    keyCameras.forEach((object, i) => show(object, grown(KEY_FRAMES[i])));
    show(movingCamera, MOVING_CAMERA_SCALE * grown(0));
    placeOnOrbit(movingCamera, picture.targetIndex);

    renderer.setRenderTarget(sceneTarget);
    renderer.render(world, camera);
    if (glowKey !== drawn.glow) {
      glowPass.material.uniforms.uReveal.value = picture.volume;
      renderer.setRenderTarget(glowTarget);
      renderer.render(glowPass.scene, screenCamera);
    }
    renderer.setRenderTarget(null);
    renderer.render(compositePass.scene, screenCamera);
    drawn = { frame: frameKey, glow: glowKey };
  }

  function invalidate() {
    drawn = { ...drawn, frame: '' };
  }

  function project(point) {
    const ndc = new THREE.Vector3(...point).project(camera);
    return { x: (ndc.x + 1) * 0.5 * cssWidth, y: (1 - ndc.y) * 0.5 * cssHeight };
  }

  function dispose() {
    for (const item of disposables) item.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  return { canvas, resize, draw, invalidate, project, dispose };
}

/** Views given back and not yet taken again or disposed, each `{ key, view, timer }`. */
const parked = [];

export function hasParkedVaseScene(key) {
  return parked.some((entry) => entry.key === key);
}

/**
 * A view of the scene named `key` with its canvas in `holder`: the one a
 * slide just gave back, at the size it had, or a new one from `create()`
 * (which calls `createVaseScene`). Its next `draw` draws, whatever the
 * picture: a canvas that moved in the page is drawn again.
 */
export function acquireVaseScene(key, holder, create) {
  const index = parked.findIndex((entry) => entry.key === key);
  let view;
  if (index === -1) {
    view = create();
  } else {
    clearTimeout(parked[index].timer);
    [{ view }] = parked.splice(index, 1);
  }
  holder.append(view.canvas);
  view.invalidate();
  return view;
}

/** Give a view back: its canvas leaves the page, and it is disposed unless a slide takes it within PARK_MS. */
export function releaseVaseScene(key, view) {
  view.canvas.remove();
  const entry = {
    key,
    view,
    timer: setTimeout(() => {
      parked.splice(parked.indexOf(entry), 1);
      view.dispose();
    }, PARK_MS),
  };
  parked.push(entry);
}
