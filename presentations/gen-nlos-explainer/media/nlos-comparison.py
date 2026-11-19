"""Rotating views of NLOS reconstructions, and of the scenes they reconstruct, for the slide nlos-comparison.

One file holds the grid (columns: the scene, ours, CC-SOCR, 3D-GTR; rows: the
simulated living room, the captured letters behind the non-planar wall of the
Stanford f-k dataset), so the eight renders stay in step. The volumes are the
ones the paper's figure fig/nlos_comparison4.pdf shows; each was identified by
comparing the results page's view of every candidate row with the figure's
embedded panel (VOLUMES gives the match of each).

The camera is orthographic and rocks about the vertical axis through the
box's center: yaw = ROCK_DEGREES * sin(2 pi n / FRAMES), so the loop is
seamless and starts at the front view. The room is seen from
ROOM_PITCH_DEGREES above the horizontal. Each frame of a reconstruction is the
results page's projection, taken along the camera's rays: the largest sum of
two samples one depth voxel apart. Each render is shown from 0 to its own
99.5th percentile at yaw 0, held for the loop, as the page and the paper's
figure show each panel; at yaw 0 the letters' renders are the figure's panels.
The colormap is matplotlib's `hot`, as in the figure, starting from black.

The scene column draws what was captured, turning with the reconstructions:

  room      The room's meshes with their baked base colors (muted), lit from
            fixed directions, through the reconstructions' camera (same box,
            scale, pitch, and yaw), so the cell lines up with the three beside
            it. The ceiling and the walls that face away from the camera are
            left out, and so is what reaches outside the box (a cabinet and
            the open door pass through the walls). The lidar is a small box
            at the capture camera's origin with its square 85 degree field of
            view as a pyramid 1 m deep; a dot marks every fourth scan point
            where its ray first meets a surface (the relay), on the surfaces
            the frame draws. Pose and field of view: the sensor of the scene's
            XML (also `capture.camera` in scene.json).
  stanford  No ground truth of the letters exists (the results page: "no
            ground truth"), so the cell shows the capture only: the relay
            wall (the import's scan points, 128 x 128 over 1 m, as a surface
            with a dot at every eighth point), the scanner with the pyramid
            of its scan, and the box the three reconstructions fill. The
            scanner's position is not in the dataset: it is the least-squares
            fit of the dataset's direct time of flight to each scan point
            (tof.mat; 3.7 mm RMS), 3.0 m from the wall's center, and its field
            of view is the scan's extent from there. The box is the lattice
            region of the page's index.json (lateral cells of 1/128 m, depth
            bins of 4.8 mm from the relay's mean height; file axis 1 runs
            against x). A backprojection of the capture puts the letters at
            the same place within 1.5 cm. The setup is 3 m across and the
            relay covers the box from the front, so this cell has its own
            framing: seen from SETUP_PITCH_DEGREES above, scaled to hold the
            scanner, with the reconstructions' yaw.

The volumes come from the bucket (read-only) and keep its paths under SOURCES:
  rclone copy tcig:tcig-projects/nlos_results_pages_20261114/nonplanar_nlos_results/outputs/evalcmp/<directory> \\
      assets/sources/nlos-comparison/<directory>
  rclone copy tcig:tcig-projects/nlos_results_pages_20261114/nonplanar_nlos_results/docs/pages/evalcmp_condensed/views/living_room \\
      assets/sources/nlos-comparison/page/views/living_room
The scenes come from the evaluation's data, E = tcig:tcig-projects/fk-torch/evaluation_and_comparisons_20261108/data:
  rclone copy E/data/benchmark/B1_scale/living_room_infinigen_le162_midroom_full assets/sources/nlos-comparison/room-scene
  rclone copy E/outputs/evalcmp/real/stanford_fk/nonplanar/import/relay --include direct_pos.npy \\
      assets/sources/nlos-comparison/real/stanford_fk/nonplanar/import/relay
  rclone copy E/data/downloads/stanford_fk_extracted/nonplanar --include tof.mat \\
      assets/sources/nlos-comparison/stanford_fk_extracted/nonplanar

Run from the presentation directory:  python media/nlos-comparison.py
Cells are 318 x 243 px (212 x 162 stage pixels at 1.5x), the gaps 54 px (36),
as `grid` in slides/nlos-comparison/content.json. Needs numpy, numba, h5py,
Pillow, and ffmpeg. `--stills <file.png>` writes a sheet of five frames
instead of the video; `--overlay <file.png>` writes the room's scene render
over ours' projection at three yaws, to check that they coincide.
"""
import argparse
import json
import os
import re
import site
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import NamedTuple

site.addsitedir(site.getusersitepackages())  # numpy and numba, also under `python -I`

import numpy as np  # noqa: E402
from numba import njit, prange  # noqa: E402

SOURCES = Path('assets/sources/nlos-comparison')
OUT = Path('public/slides/nlos-comparison')
CELL_WIDTH, CELL_HEIGHT, COLUMN_GAP, ROW_GAP = 318, 243, 54, 54
FRAMES, FPS = 150, 30
ROCK_DEGREES = 30
ROOM_PITCH_DEGREES = 25
SETUP_PITCH_DEGREES = 25
PERCENTILE = 99.5
SUBSTEPS = 4  # samples per depth voxel along a ray
ENCODING = ['-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart', '-map_metadata', '-1']

ROOM = 'c_room/living_room/fk_match/relay_query'
ROOM_BASELINES = 'g2/c_room/living_room'
STANFORD = 'g1/real/stanford_fk/nonplanar/views/rows'

# Rows of the grid, then the reconstructions' columns: ours, CC-SOCR, 3D-GTR. Each entry
# is the volume's path under SOURCES and how its file is laid out (load_volume). In the
# comments: the PSNR of the page's view of that volume against the figure's panel (the
# room's top view, the letters' front view), then that of the best other row of the same
# method.
#
# Identified the same way and not on the slide: the figure's two other captured rows
# (3D-GTR's dataset, the letter E), files <name>.npy in
#   g1/real/gtr/Cwall2_E/views/rows/, volume[down, left, away], box (256, 246, 132):
#     ours_extras_gn10x5__normal___GN_10_x_5__0_65_s_it              46.8 dB (33.9)
#     CC_SOCR_extras__the_near_gate_to_the_last_bin                  48.5 dB (24.8)
#     3D_GTR_extras__the_authors__hyperparameters_for_this_capture   49.9 dB (30.2)
#   g1/real/gtr/Swall1_E/views/rows/, volume[right, down, away], box (254, 256, 103):
#     ours_extras_gn10x5__normal___GN_10_x_5__0_70_s_it              39.5 dB (30.9)
#     CC_SOCR_extras__the_near_gate_to_the_last_bin                  51.7 dB (20.8)
#     3D_GTR_extras__the_authors__hyperparameters_for_this_capture   51.2 dB (33.3)
VOLUMES = [
    ('room', [
        (f'{ROOM}/general_070/ours_070/solve_gn/x.npy', 'room-blocks'),                                # 35.0 dB (28.2)
        (f'{ROOM_BASELINES}/runs/cc_socr_d3_full_weighted/volume/world_volume_display.npy', 'room'),  # 37.3 dB (22.7)
        (f'{ROOM_BASELINES}/tune/3d_gtr/nogate_x4_full/run/volume/world_volume_display.npy', 'room'),  # 41.5 dB (31.4)
    ]),
    ('stanford', [
        (f'{STANFORD}/ours_ppd3_gn10x5__normal___GN_10_x_5__1_08_s_it.npy', 'stanford'),               # 42.7 dB (28.6)
        (f'{STANFORD}/CC_SOCR_extras__the_near_gate_to_the_last_bin.npy', 'stanford'),                 # 46.1 dB (16.4)
        (f'{STANFORD}/3D_GTR_extras__d_3__the_pulse_deconvolved.npy', 'stanford'),                     # 49.6 dB (38.7)
    ]),
]

# The size of each scene's box as (height, width, depth): for the room in meters (the
# page's box), for the capture in the page's units (the pixels of its front and top
# views, which it draws to scale).
SIZES = {
    'room': (2.815, 5.502, 6.002),
    'stanford': (256, 256, 233),
}

# The scene column's inputs.
ROOM_SCENE = 'room-scene'
ROOM_SCENE_XML = f'{ROOM_SCENE}/living_room_infinigen_le162_midroom_full.xml'
ROOM_BOX = 'page/views/living_room/ours-full-nogate-gn-shown-plain.json'
STANFORD_RELAY = 'real/stanford_fk/nonplanar/import/relay/direct_pos.npy'
STANFORD_TIMES = 'stanford_fk_extracted/nonplanar/tof.mat'
STANFORD_INDEX = f'{STANFORD}/index.json'
STANFORD_WALL_WIDTH = 1.0       # meters across the scan: the import's wall_size
STANFORD_DEPTH_BIN = 0.0048     # meters of depth per time bin: half the import's 9.6 mm of optical path

# How a scene is drawn. Colors are sRGB; the accent and the hidden region's red are the deck's.
SCENE_RENDER = 'scene-1'        # names the cached scene renders: change it with anything below
SUPERSAMPLES = 3                # samples per pixel and axis
ACCENT = (255, 204, 102)
HIDDEN = (255, 90, 90)
RELAY_GRAY = (150, 156, 166)
AMBIENT = 0.34
# Lights fixed to the scene, as (direction toward the light in the box's frame, strength):
# one from above, left, and the camera's side; a weaker one from the right.
LIGHTS = [((-0.45, -0.70, -0.55), 0.62), ((0.60, -0.30, -0.30), 0.26)]
ROOM_GAIN = 1.15                # the room's baked colors are dark for a black slide
ROOM_SATURATION = 0.4           # of the room's baked colors, so that the accent reads against wood and plaster
LINE_WIDTH = 1.5                # pixels of the video
DOT_RADIUS = 1.0
FLAT_AGAINST_WALL = 0.1         # meters from a wall within which a whole mesh counts as hung on it
OUTSIDE_ROOM = 0.06             # meters past the room's box that its meshes are drawn (a cabinet and the open door reach through the walls)
OCCLUDED_LINE = 0.3             # opacity of a line behind a surface
LIGHT_SPEED = 2.99792458e-4     # meters per picosecond


def long_path(path):
    """An absolute path that Windows opens even past 260 characters."""
    path = os.path.abspath(path)
    return '\\\\?\\' + path if os.name == 'nt' and not path.startswith('\\\\?\\') else path


# ---------------------------------------------------------------------------
# The camera, shared by the reconstructions and the scenes

def camera_axes(yaw, pitch):
    """
    The orthographic camera's (right, down, forward) unit vectors in a box's frame
    (x right, y down, z away): turned by `yaw` about the vertical axis and raised
    by `pitch` (radians).
    """
    level = np.array([np.sin(yaw), 0, np.cos(yaw)])
    right = np.array([np.cos(yaw), 0, -np.sin(yaw)])
    forward = np.cos(pitch) * level + np.sin(pitch) * np.array([0, 1, 0])
    down = np.cos(pitch) * np.array([0, 1, 0]) - np.sin(pitch) * level
    return right, down, forward


def pixels_per_unit(size, pitch):
    """The scale at which the box fits a cell at every yaw of the rock, seen from `pitch`; a front face fills the cell's height."""
    height, width, depth = size
    yaws = np.radians(np.linspace(0, ROCK_DEGREES, 31))
    across = width * np.cos(yaws) + depth * np.sin(yaws)
    along = width * np.sin(yaws) + depth * np.cos(yaws)
    tall = height * np.cos(pitch) + along * np.sin(pitch)
    return min(CELL_WIDTH / across.max(), CELL_HEIGHT / tall.max())


def rock(frame):
    """The yaw at a frame of the loop, in thousandths of a degree (the key of a render)."""
    return round(1000 * ROCK_DEGREES * np.sin(2 * np.pi * frame / FRAMES))


def pitch_of(scene):
    return np.radians(ROOM_PITCH_DEGREES) if scene == 'room' else 0.0


# ---------------------------------------------------------------------------
# Reconstructions: maximum-intensity projections

def load_volume(path, layout):
    """
    A reconstruction as (volume[down, right, away], (height, width, depth)): the
    axes of the results page's front view and the depth behind it, the camera at
    yaw 0 looking along `away`. Found by matching each file's projections with its
    page view:
      room          volume[x, y, z], z up; the front view looks along +y;
      room-blocks   ours' unknown, an albedo-scaled normal per voxel, one row per
                    voxel in the order (z, x // 8, y // 4, x % 8, y % 4); the page
                    shows its norm;
      stanford      volume[down, left, away].
    """
    data = np.load(long_path(SOURCES / path))
    if layout == 'room-blocks':
        blocks = np.linalg.norm(data, axis=1).reshape(128, 16, 32, 8, 4)
        data = blocks.transpose(1, 3, 2, 4, 0).reshape(128, 128, 128)
    if layout.startswith('room'):
        return np.ascontiguousarray(data.transpose(2, 0, 1)[::-1], dtype=np.float32), SIZES['room']
    return np.ascontiguousarray(data[:, ::-1], dtype=np.float32), SIZES[layout]


@njit(cache=True)
def sample(volume, row, column, layer):
    """The volume at a fractional index, linear between voxel centers and toward zero outside the box."""
    rows, columns, layers = volume.shape
    if row <= -1 or column <= -1 or layer <= -1 or row >= rows or column >= columns or layer >= layers:
        return 0.0
    r, c, l = int(np.floor(row)), int(np.floor(column)), int(np.floor(layer))
    total = 0.0
    for dr in range(2):
        weight_r = row - r if dr else 1 - (row - r)
        if r + dr < 0 or r + dr >= rows:
            continue
        for dc in range(2):
            weight_c = column - c if dc else 1 - (column - c)
            if c + dc < 0 or c + dc >= columns:
                continue
            for dl in range(2):
                weight_l = layer - l if dl else 1 - (layer - l)
                if l + dl < 0 or l + dl >= layers:
                    continue
                total += weight_r * weight_c * weight_l * volume[r + dr, c + dc, l + dl]
    return total


@njit(parallel=True, cache=True)
def march(volume, origin, across, down, forward, count, substeps, image):
    """
    Fills `image` with, for each pixel's ray, the largest sum of two samples
    `substeps` apart among `count` samples. `origin` is the index of the first
    sample of pixel (0, 0); `across`, `down`, and `forward` are the index
    steps per pixel to the right, per pixel down, and per sample.
    """
    for i in prange(image.shape[0]):
        recent = np.zeros(substeps)
        for j in range(image.shape[1]):
            recent[:] = 0.0
            best = 0.0
            for k in range(count):
                value = sample(
                    volume,
                    origin[0] + i * down[0] + j * across[0] + k * forward[0],
                    origin[1] + i * down[1] + j * across[1] + k * forward[1],
                    origin[2] + i * down[2] + j * across[2] + k * forward[2])
                if k >= substeps:
                    best = max(best, value + recent[k % substeps])
                recent[k % substeps] = value
            image[i, j] = best


def project(volume, size, yaw, pitch):
    """
    The projection (CELL_HEIGHT, CELL_WIDTH) of `volume` from the camera at `yaw`
    and `pitch` (radians) about the box's center: along each ray, the largest sum
    of two samples one depth voxel apart; zero outside the box; not normalized.
    The samples are SUBSTEPS per depth voxel and include the voxel centers at yaw
    0 and pitch 0, where the result is the page's front view.
    """
    height, width, depth = size
    scale = pixels_per_unit(size, pitch)
    voxel = depth / volume.shape[2]
    right, down, forward = camera_axes(yaw, pitch)
    reach = 0.5 * np.sqrt(height ** 2 + width ** 2 + depth ** 2)
    voxels = volume.shape[2] + 2 * int(np.ceil((reach - depth / 2) / voxel))
    count = (voxels - 1) * SUBSTEPS + 1
    step = voxel / SUBSTEPS
    first = (0.5 - CELL_WIDTH / 2) / scale * right + (0.5 - CELL_HEIGHT / 2) / scale * down - (count - 1) / 2 * step * forward

    # From the box's units (x, y, z about its center) to the volume's indices (row, column, layer).
    per_unit = np.array([volume.shape[1] / width, volume.shape[0] / height, volume.shape[2] / depth])
    to_index = lambda vector: (vector * per_unit)[[1, 0, 2]]
    origin = to_index(first) + (np.array(volume.shape) - 1) / 2
    image = np.empty((CELL_HEIGHT, CELL_WIDTH), dtype=np.float32)
    march(volume, origin, to_index(right / scale), to_index(down / scale), to_index(forward * step), count, SUBSTEPS, image)
    return image


def render(row, column, yaws, cache):
    """Renders one reconstruction at each yaw into the cache, skipping those there; returns {yaw: file}."""
    scene, methods = VOLUMES[row]
    files = {yaw: cache / f'{row}-{column}-{yaw:+06d}.npy' for yaw in yaws}
    missing = [yaw for yaw, file in files.items() if not file.exists()]
    if missing:
        volume, size = load_volume(*methods[column])
        for yaw in missing:
            partial = files[yaw].with_suffix('.partial.npy')
            np.save(partial, project(volume, size, np.radians(yaw / 1000), pitch_of(scene)))
            os.replace(partial, files[yaw])
    return files


def exposure(row, column, first_frame):
    """
    The value shown as white: the 99.5th percentile of the projection at yaw 0. For
    a front view it is taken on the volume's own grid, which gives the page's
    number; for the raised view of the room, on the first frame, over the pixels
    whose rays cross the box.
    """
    scene, methods = VOLUMES[row]
    volume, size = load_volume(*methods[column])
    if pitch_of(scene) == 0:
        return float(np.percentile((volume[..., :-1] + volume[..., 1:]).max(axis=-1), PERCENTILE))
    inside = project(np.ones_like(volume), size, 0.0, pitch_of(scene)) > 1.0
    return float(np.percentile(first_frame[inside], PERCENTILE))


def hot(value):
    """matplotlib's `hot` colormap on values in [0, 1], as uint8 RGB, with 0 drawn black (matplotlib starts at 4% red)."""
    value = np.clip(value, 0, 1)
    red = np.clip(value / 0.365079, 0, 1)
    green = np.clip((value - 0.365079) / (0.746032 - 0.365079), 0, 1)
    blue = np.clip((value - 0.746032) / (1 - 0.746032), 0, 1)
    return np.round(255 * np.stack([red, green, blue], axis=-1)).astype(np.uint8)


# ---------------------------------------------------------------------------
# Scenes: lit geometry with the capture drawn over it

class Scene(NamedTuple):
    """
    What a scene cell draws, in a box's frame (x right, y down, z away; meters).
    A face on a side of the room is drawn only while that side faces the camera;
    side 0 holds everything else. A dot is drawn while its side is and nothing
    covers it; a segment is drawn fainter where a surface covers it.
    """
    vertices: np.ndarray        # (V, 3) float32
    texcoords: np.ndarray       # (V, 2) float32: u across a texture's columns, v down its rows (the room's meshes)
    faces: np.ndarray           # (F, 3) int32
    face_texture: np.ndarray    # (F,) index into `textures`
    face_side: np.ndarray       # (F,) index into `side_normals`
    textures: np.ndarray        # (T, N, N, 3) uint8 sRGB
    side_normals: np.ndarray    # (S, 3) the normal of each side toward the room's inside; side 0 is zero
    bounds: np.ndarray          # (2, 3) float32: faces are drawn inside this box (its low and high corners)
    segments: list              # [(start, end, sRGB color)]
    dots: np.ndarray            # (D, 3)
    dot_side: np.ndarray        # (D,) index into `side_normals`
    gain: float                 # multiplies the lit colors
    depth_bias: float           # meters by which a line or dot may lie behind a surface and still show on it
    pitch: float                # radians
    scale: float                # pixels per meter
    center: np.ndarray          # (2,) where the frame's origin sits in the cell, in pixels from the cell's center


def srgb_to_linear(color):
    color = np.asarray(color, dtype=np.float32) / 255
    return np.where(color <= 0.04045, color / 12.92, ((color + 0.055) / 1.055) ** 2.4).astype(np.float32)


def linear_to_srgb(color):
    color = np.clip(color, 0, 1)
    return np.round(255 * np.where(color <= 0.0031308, 12.92 * color, 1.055 * color ** (1 / 2.4) - 0.055)).astype(np.uint8)


SRGB_TO_LINEAR = srgb_to_linear(np.arange(256))


def solid_texture(color, size):
    return np.broadcast_to(np.array(color, dtype=np.uint8), (size, size, 3))


def box_mesh(center, forward, right, up, length, width):
    """A box's (vertices (8, 3), faces (12, 3)): `length` along `forward`, `width` along `right` and `up`."""
    corners = np.array([[x, y, z] for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)])
    vertices = center + 0.5 * (length * corners[:, :1] * forward + width * corners[:, 1:2] * right + width * corners[:, 2:] * up)
    quads = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    return vertices, np.array([triangle for a, b, c, d in quads for triangle in ((a, b, c), (a, c, d))])


def outline(points):
    """The segments of a closed line through `points`."""
    return [(points[i], points[(i + 1) % len(points)]) for i in range(len(points))]


def read_ply(path):
    """A mesh of the room as (vertices (V, 5): x, y, z, u, v; faces (F, 3)). Its files are binary, triangles only."""
    with open(long_path(path), 'rb') as file:
        counts = {}
        while True:
            words = file.readline().decode('ascii').split()
            if words[0] == 'element':
                counts[words[1]] = int(words[2])
            if words[0] == 'end_header':
                break
        vertices = np.frombuffer(file.read(20 * counts['vertex']), dtype='<f4').reshape(-1, 5)
        faces = np.frombuffer(file.read(13 * counts['face']), dtype=np.dtype([('count', 'u1'), ('corners', '<i4', 3)]))
    if len(vertices) != counts['vertex'] or len(faces) != counts['face'] or (faces['count'] != 3).any():
        sys.exit(f'{path}: not a binary PLY of x, y, z, u, v and triangles')
    return vertices, faces['corners']


@njit(cache=True)
def first_hits(vertices, faces, origin, forward, right, up, tangent, count, distance, hit):
    """
    Casts a `count` x `count` grid of rays from `origin` over a square field of
    view (`tangent` of its half angle) and fills, for each ray, the `distance`
    along the ray's direction (forward + a right + b up, not normalized) to the
    nearest face and that face's index in `hit` (-1 for none). Each face is
    tested against the rays its projection can hold.
    """
    distance[:] = np.inf
    hit[:] = -1
    corners = np.empty((3, 3))
    for f in range(faces.shape[0]):
        behind = 0
        low_a, high_a, low_b, high_b = np.inf, -np.inf, np.inf, -np.inf
        for k in range(3):
            for axis in range(3):
                corners[k, axis] = vertices[faces[f, k], axis] - origin[axis]
            along = corners[k, 0] * forward[0] + corners[k, 1] * forward[1] + corners[k, 2] * forward[2]
            if along < 1e-4:
                behind += 1
                continue
            a = (corners[k, 0] * right[0] + corners[k, 1] * right[1] + corners[k, 2] * right[2]) / (along * tangent)
            b = (corners[k, 0] * up[0] + corners[k, 1] * up[1] + corners[k, 2] * up[2]) / (along * tangent)
            low_a, high_a, low_b, high_b = min(low_a, a), max(high_a, a), min(low_b, b), max(high_b, b)
        if behind == 3:
            continue
        if behind:  # the face crosses the origin's plane: its projection has no bounds
            first_a, last_a, first_b, last_b = 0, count - 1, 0, count - 1
        else:
            first_a = max(int(np.ceil((low_a + 1) / 2 * count - 0.5)), 0)
            last_a = min(int(np.floor((high_a + 1) / 2 * count - 0.5)), count - 1)
            first_b = max(int(np.ceil((low_b + 1) / 2 * count - 0.5)), 0)
            last_b = min(int(np.floor((high_b + 1) / 2 * count - 0.5)), count - 1)
        if first_a > last_a or first_b > last_b:
            continue
        edge_1 = corners[1] - corners[0]
        edge_2 = corners[2] - corners[0]
        for i in range(first_b, last_b + 1):
            for j in range(first_a, last_a + 1):
                a = ((j + 0.5) / count * 2 - 1) * tangent
                b = ((i + 0.5) / count * 2 - 1) * tangent
                direction = forward + a * right + b * up
                # Moller-Trumbore, the ray starting at the frame's origin.
                p = np.cross(direction, edge_2)
                determinant = edge_1 @ p
                if abs(determinant) < 1e-14:
                    continue
                s = -corners[0]
                u = (s @ p) / determinant
                if u < 0 or u > 1:
                    continue
                q = np.cross(s, edge_1)
                v = (direction @ q) / determinant
                if v < 0 or u + v > 1:
                    continue
                t = (edge_2 @ q) / determinant
                if 1e-6 < t < distance[i, j]:
                    distance[i, j] = t
                    hit[i, j] = f


@njit(cache=True)
def rasterize(points, faces, drawn, vertices, bounds, depth, hit, weights):
    """
    Draws the faces marked `drawn` into a depth buffer, each only where it lies
    inside `bounds` (low and high corners, in the frame of `vertices`). `points`
    holds each vertex's (column, row, depth) with sample centers at whole
    numbers. For each sample: `depth` of the nearest face, its index in `hit`
    (-1 for none), and in `weights` the barycentric weights of that face's second
    and third corners.
    """
    rows, columns = depth.shape
    for f in range(faces.shape[0]):
        if not drawn[f]:
            continue
        a, b, c = faces[f, 0], faces[f, 1], faces[f, 2]
        x0, y0, z0 = points[a]
        x1, y1, z1 = points[b]
        x2, y2, z2 = points[c]
        left, right = max(int(np.ceil(min(x0, x1, x2))), 0), min(int(np.floor(max(x0, x1, x2))), columns - 1)
        top, bottom = max(int(np.ceil(min(y0, y1, y2))), 0), min(int(np.floor(max(y0, y1, y2))), rows - 1)
        if left > right or top > bottom:
            continue
        area = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0)
        if area == 0:
            continue
        crosses = False  # whether part of the face is outside the bounds
        for axis in range(3):
            low, high = bounds[0, axis], bounds[1, axis]
            if (vertices[a, axis] < low or vertices[b, axis] < low or vertices[c, axis] < low
                    or vertices[a, axis] > high or vertices[b, axis] > high or vertices[c, axis] > high):
                crosses = True
        for i in range(top, bottom + 1):
            for j in range(left, right + 1):
                w1 = ((j - x0) * (y2 - y0) - (i - y0) * (x2 - x0)) / area
                w2 = ((x1 - x0) * (i - y0) - (y1 - y0) * (j - x0)) / area
                if w1 < 0 or w2 < 0 or w1 + w2 > 1:
                    continue
                if crosses:
                    outside = False
                    for axis in range(3):
                        value = vertices[a, axis] + w1 * (vertices[b, axis] - vertices[a, axis]) + w2 * (vertices[c, axis] - vertices[a, axis])
                        if value < bounds[0, axis] or value > bounds[1, axis]:
                            outside = True
                    if outside:
                        continue
                z = z0 + w1 * (z1 - z0) + w2 * (z2 - z0)
                if z < depth[i, j]:
                    depth[i, j] = z
                    hit[i, j] = f
                    weights[i, j, 0] = w1
                    weights[i, j, 1] = w2


@njit(cache=True)
def stamp(opacity, depth, column, row, z, radius, bias, occluded):
    """Raises `opacity` to 1 over a disc where its point is in front of `depth` (within `bias`), and to `occluded` where it is behind."""
    rows, columns = depth.shape
    for i in range(max(int(np.ceil(row - radius)), 0), min(int(np.floor(row + radius)), rows - 1) + 1):
        for j in range(max(int(np.ceil(column - radius)), 0), min(int(np.floor(column + radius)), columns - 1) + 1):
            if (i - row) ** 2 + (j - column) ** 2 <= radius ** 2:
                value = 1.0 if z <= depth[i, j] + bias else occluded
                if value > opacity[i, j]:
                    opacity[i, j] = value


@njit(cache=True)
def stamp_segment(opacity, depth, start, end, radius, bias, occluded):
    """Stamps discs along a segment given by its ends' (column, row, depth), one per sample."""
    steps = int(np.ceil(max(abs(end[0] - start[0]), abs(end[1] - start[1])))) + 1
    for k in range(steps + 1):
        t = k / steps
        stamp(opacity, depth, start[0] + t * (end[0] - start[0]), start[1] + t * (end[1] - start[1]),
              start[2] + t * (end[2] - start[2]), radius, bias, occluded)


def draw_scene(scene, yaw):
    """One frame (CELL_HEIGHT, CELL_WIDTH, 3) uint8 of a scene from the camera at `yaw` (radians) and the scene's pitch."""
    right, down, forward = camera_axes(yaw, scene.pitch)
    samples = SUPERSAMPLES

    def to_samples(points):
        """(column, row, depth) of points, in samples: pixel j's samples are j * samples to (j + 1) * samples - 1."""
        column = (CELL_WIDTH / 2 + scene.center[0] + scene.scale * (points @ right)) * samples - 0.5
        row = (CELL_HEIGHT / 2 + scene.center[1] + scene.scale * (points @ down)) * samples - 0.5
        return np.stack([column, row, points @ forward], axis=-1)

    side_drawn = scene.side_normals @ forward < -1e-9
    side_drawn[0] = True
    depth = np.full((CELL_HEIGHT * samples, CELL_WIDTH * samples), np.inf, dtype=np.float32)
    hit = np.full(depth.shape, -1, dtype=np.int32)
    weights = np.zeros((*depth.shape, 2), dtype=np.float32)
    rasterize(to_samples(scene.vertices).astype(np.float32), scene.faces, side_drawn[scene.face_side], scene.vertices, scene.bounds, depth, hit, weights)

    covered = hit >= 0
    face = hit[covered]
    corners = scene.faces[face]
    w1, w2 = weights[covered][:, :1], weights[covered][:, 1:]
    p0, p1, p2 = (scene.vertices[corners[:, k]] for k in range(3))
    normal = np.cross(p1 - p0, p2 - p0)
    normal /= np.linalg.norm(normal, axis=1, keepdims=True) + 1e-20
    normal[normal @ forward > 0] *= -1  # both sides of a surface are lit as the side that faces the camera
    light = AMBIENT + sum(strength * np.clip(normal @ (np.array(direction) / np.linalg.norm(direction)), 0, None) for direction, strength in LIGHTS)
    t0, t1, t2 = (scene.texcoords[corners[:, k]] for k in range(3))
    texcoord = t0 + w1 * (t1 - t0) + w2 * (t2 - t0)
    size = scene.textures.shape[1]
    texel_column = np.floor((texcoord[:, 0] % 1) * size).astype(np.int64) % size
    texel_row = np.floor((texcoord[:, 1] % 1) * size).astype(np.int64) % size
    image = np.zeros((*depth.shape, 3), dtype=np.float32)
    image[covered] = SRGB_TO_LINEAR[scene.textures[scene.face_texture[face], texel_row, texel_column]] * (scene.gain * light)[:, None]

    def composite(opacity, color):
        image[:] = image * (1 - opacity[..., None]) + srgb_to_linear(color) * opacity[..., None]

    for color in dict.fromkeys(color for _, _, color in scene.segments):
        opacity = np.zeros(depth.shape, dtype=np.float32)
        for start, end, segment_color in scene.segments:
            if segment_color == color:
                ends = to_samples(np.stack([start, end]))
                stamp_segment(opacity, depth, ends[0], ends[1], LINE_WIDTH * samples / 2, scene.depth_bias, OCCLUDED_LINE)
        composite(opacity, color)
    opacity = np.zeros(depth.shape, dtype=np.float32)
    for point in to_samples(scene.dots[side_drawn[scene.dot_side]]):
        stamp(opacity, depth, point[0], point[1], point[2], DOT_RADIUS * samples, scene.depth_bias, 0.0)
    composite(opacity, ACCENT)

    return linear_to_srgb(image.reshape(CELL_HEIGHT, samples, CELL_WIDTH, samples, 3).mean(axis=(1, 3)))


def room_scene():
    """
    The living room with its capture, in the reconstructions' frame: the box's
    center at the origin, x as the room's x, y down (the room's z is up), z as
    the room's y, so that the reconstructions' camera sees both alike.
    """
    box = json.loads((SOURCES / ROOM_BOX).read_text())['box']
    low, high = np.array(box['min']), np.array(box['max'])
    if not np.allclose((high - low)[[2, 0, 1]], SIZES['room'], atol=1e-3):
        sys.exit(f'{ROOM_BOX}: the box is not the one the reconstructions are drawn in')
    middle = (low + high) / 2
    to_frame = lambda points: (np.asarray(points) - middle)[..., [0, 2, 1]] * np.array([1, -1, 1])

    xml = (SOURCES / ROOM_SCENE_XML).read_text()
    look = re.search(r'<sensor.*?<float name="fov" value="([^"]+)"/>.*?<lookat origin="([^"]+)" target="([^"]+)" up="([^"]+)"/>', xml, flags=re.S)
    if not look or '<string name="fov_axis" value="x"/>' not in xml:
        sys.exit(f'{ROOM_SCENE_XML}: no perspective sensor with a horizontal field of view and a lookat')
    field_of_view = np.radians(float(look.group(1)))
    origin, target, vertical = (np.array([float(value) for value in look.group(k).split(',')]) for k in (2, 3, 4))
    origin, target = to_frame(origin), to_frame(target)
    vertical = to_frame(middle + vertical)
    forward = (target - origin) / np.linalg.norm(target - origin)
    right = np.cross(forward, vertical)
    right /= np.linalg.norm(right)
    up = np.cross(right, forward)
    tangent = np.tan(field_of_view / 2)

    # The sides of the room, by the normal toward its inside, in the frame: a wall, floor, or
    # ceiling face is on the side its own normal names; a skirting face on the wall it runs
    # along; a mesh that lies flat against a wall (a mirror, a picture) on that wall's side.
    side_normals = np.array([[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], dtype=float)
    walls = {1: (0, low[0]), 2: (0, high[0]), 5: (1, low[1]), 6: (1, high[1])}  # side: (the room's axis, the wall's position)

    shapes = re.findall(r'<shape type="ply" id="([^"]+)".*?<string name="filename" value="([^"]+)"/>(.*?)</shape>', xml, flags=re.S)
    texture_files, vertices, texcoords, faces, face_texture, face_side = {}, [], [], [], [], []
    first_vertex = 0
    for shape, mesh, body in shapes:
        if shape.startswith('room_exterior'):
            continue  # the outside of the walls
        named = re.search(r'textures/(.*)_diffuse_(?:luminance|base)\.png', body)
        if not named:
            sys.exit(f'{ROOM_SCENE_XML}: shape {shape} names no diffuse texture')
        texture = texture_files.setdefault(f'{named.group(1)}_diffuse_base.png', len(texture_files))
        mesh_vertices, mesh_faces = read_ply(SOURCES / ROOM_SCENE / mesh)
        positions = to_frame(mesh_vertices[:, :3].astype(float))
        side = np.zeros(len(mesh_faces), dtype=np.uint8)
        if shape.startswith(('room_wall', 'room_floor', 'room_ceiling')):
            a, b, c = (positions[mesh_faces[:, k]] for k in range(3))
            normal = np.cross(b - a, c - a)
            normal /= np.linalg.norm(normal, axis=1, keepdims=True)
            alignment = normal @ side_normals[1:].T
            if (alignment.max(axis=1) < 0.999).any():
                sys.exit(f'{mesh}: a face of the room is not along an axis')
            side = (1 + alignment.argmax(axis=1)).astype(np.uint8)
        elif shape.startswith('room_skirting'):
            centers = mesh_vertices[:, :3][mesh_faces].mean(axis=1)
            sides = list(walls)
            side = np.array(sides, dtype=np.uint8)[np.argmin([np.abs(centers[:, axis] - position) for axis, position in walls.values()], axis=0)]
        elif not shape.startswith('room_'):
            for wall, (axis, position) in walls.items():
                if np.abs(mesh_vertices[:, axis] - position).max() < FLAT_AGAINST_WALL:
                    side[:] = wall
        vertices.append(positions.astype(np.float32))
        texcoords.append(mesh_vertices[:, 3:])
        faces.append(mesh_faces + first_vertex)
        face_texture.append(np.full(len(mesh_faces), texture, dtype=np.int16))
        face_side.append(side)
        first_vertex += len(mesh_vertices)

    from PIL import Image
    textures = [np.asarray(Image.open(long_path(SOURCES / ROOM_SCENE / 'textures' / name)).convert('RGB')) for name in texture_files]
    size = textures[0].shape[0]
    if any(texture.shape != (size, size, 3) for texture in textures):
        sys.exit(f'{ROOM_SCENE}/textures: the base colors are not all {size} x {size}')
    linear = SRGB_TO_LINEAR[np.stack(textures)]
    luminance = (linear @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32))[..., None]
    textures = list(linear_to_srgb(luminance + ROOM_SATURATION * (linear - luminance)))

    vertices, faces, face_side = np.concatenate(vertices), np.concatenate(faces).astype(np.int32), np.concatenate(face_side)

    # The relay: where every fourth scan point's ray first meets the room (the film is 128 x 128).
    count = 32
    distance = np.empty((count, count))
    hit = np.empty((count, count), dtype=np.int64)
    first_hits(vertices, faces, origin, forward, right, up, tangent, count, distance, hit)
    a, b = np.meshgrid(((np.arange(count) + 0.5) / count * 2 - 1) * tangent, ((np.arange(count) + 0.5) / count * 2 - 1) * tangent)
    bounds = np.array([-1, 1])[:, None] * (np.array(SIZES['room'])[[1, 0, 2]] / 2 + OUTSIDE_ROOM)
    met = hit >= 0
    dots = origin + distance[met][:, None] * (forward + a[met][:, None] * right + b[met][:, None] * up)
    shown = ((dots >= bounds[0]) & (dots <= bounds[1])).all(axis=1)
    print(f'room: lidar at {np.round(origin, 3)} in the frame, {np.degrees(field_of_view):.0f} degrees; {met.sum()} of {count * count} sampled rays meet a surface, '
          f'{np.median(distance[met] * np.linalg.norm(forward + a[met][:, None] * right + b[met][:, None] * up, axis=1)):.2f} m away at the median')

    # The lidar's body and the pyramid of its field of view, 1 m deep.
    body_vertices, body_faces = box_mesh(origin, forward, right, up, 0.36, 0.24)
    reach = 1.0
    far = [origin + reach * (forward + sa * tangent * right + sb * tangent * up) for sa, sb in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    segments = [(origin, corner, ACCENT) for corner in far] + [(start, end, ACCENT) for start, end in outline(far)]

    accent = len(textures)
    textures.append(solid_texture(ACCENT, size))
    pitch = np.radians(ROOM_PITCH_DEGREES)
    return Scene(
        vertices=np.concatenate([vertices, body_vertices.astype(np.float32)]),
        texcoords=np.concatenate([*texcoords, np.zeros((len(body_vertices), 2), dtype=np.float32)]),
        faces=np.concatenate([faces, (body_faces + len(vertices)).astype(np.int32)]),
        face_texture=np.concatenate([*face_texture, np.full(len(body_faces), accent, dtype=np.int16)]),
        face_side=np.concatenate([face_side, np.zeros(len(body_faces), dtype=np.uint8)]),
        textures=np.stack(textures), side_normals=side_normals,
        bounds=bounds.astype(np.float32), segments=segments,
        dots=dots[shown], dot_side=face_side[hit[met]][shown], gain=ROOM_GAIN, depth_bias=0.04,
        pitch=pitch, scale=pixels_per_unit(SIZES['room'], pitch), center=np.zeros(2))


def locate_scanner(points, round_trip):
    """
    The scanner's position (meters, the points' frame) from the direct time of
    flight to each scan point (picoseconds, there and back, with an unknown
    delay): the least-squares fit of |point - scanner| = c/2 (time - delay), on
    the side of the wall its points face (+z). Returns (position, RMS in meters).
    """
    points, half_path = points.reshape(-1, 3), 0.5 * LIGHT_SPEED * round_trip.ravel()
    unknowns = np.array([0.0, 0.0, 2.5, 0.0])  # the position, then the delay as a distance
    damping = 1e-3
    misfit = lambda v: np.linalg.norm(points - v[:3], axis=1) - (half_path - v[3])
    residual = misfit(unknowns)
    for _ in range(200):
        toward = (points - unknowns[:3]) / np.linalg.norm(points - unknowns[:3], axis=1, keepdims=True)
        jacobian = np.concatenate([-toward, np.ones((len(points), 1))], axis=1)
        normal = jacobian.T @ jacobian
        step = np.linalg.solve(normal + damping * np.diag(np.diag(normal)), -jacobian.T @ residual)
        trial = misfit(unknowns + step)
        if trial @ trial < residual @ residual:
            unknowns, residual, damping = unknowns + step, trial, damping / 3
        else:
            damping *= 3
    return unknowns[:3], float(np.sqrt(np.mean(residual ** 2)))


def stanford_scene():
    """
    The Stanford capture's setup in the import's frame (meters: x right and y
    down across the wall as the front view shows them, z from the wall toward
    the hidden letters), about the middle of the setup. See the module docstring
    for where each part comes from.
    """
    import h5py
    relay = np.load(long_path(SOURCES / STANFORD_RELAY)).astype(float)  # [row, column]: y then x
    with h5py.File(long_path(SOURCES / STANFORD_TIMES)) as file:
        round_trip = np.asarray(file['tofgrid'], dtype=float).T  # MATLAB's order; transposed, it is the relay's
    if relay.shape[:2] != round_trip.shape:
        sys.exit(f'{STANFORD_TIMES}: one time per scan point of {STANFORD_RELAY} expected')
    scanner, misfit = locate_scanner(relay, round_trip)
    if misfit > 0.005:
        sys.exit(f'the scanner fit leaves {1000 * misfit:.1f} mm RMS; the times do not match the relay')

    # The reconstructions' box: the lattice region of the page's index, the same for every row.
    regions = {json.dumps(row['region_indices']) for row in json.loads((SOURCES / STANFORD_INDEX).read_text()).values()}
    if len(regions) != 1:
        sys.exit(f'{STANFORD_INDEX}: the rows do not share one region')
    (first_i, last_i), (first_j, last_j), (first_k, last_k) = json.loads(regions.pop())
    cell = STANFORD_WALL_WIDTH / relay.shape[0]
    plane = relay[..., 2].mean()
    low = np.array([STANFORD_WALL_WIDTH / 2 - (last_j + 1) * cell, first_i * cell - STANFORD_WALL_WIDTH / 2, plane + first_k * STANFORD_DEPTH_BIN])
    high = np.array([STANFORD_WALL_WIDTH / 2 - first_j * cell, (last_i + 1) * cell - STANFORD_WALL_WIDTH / 2, plane + (last_k + 1) * STANFORD_DEPTH_BIN])
    box = [np.array([x, y, z]) for z in (low[2], high[2]) for x, y in ((low[0], low[1]), (high[0], low[1]), (high[0], high[1]), (low[0], high[1]))]
    box_edges = outline(box[:4]) + outline(box[4:]) + [(box[k], box[k + 4]) for k in range(4)]

    # The relay as a surface through the scan points, and its border.
    rows, columns = relay.shape[:2]
    index = np.arange(rows * columns).reshape(rows, columns)
    quads = np.stack([index[:-1, :-1], index[:-1, 1:], index[1:, 1:], index[1:, :-1]], axis=-1).reshape(-1, 4)
    relay_faces = np.concatenate([quads[:, [0, 1, 2]], quads[:, [0, 2, 3]]])
    border = np.concatenate([relay[0, :-1], relay[:-1, -1], relay[-1, :0:-1], relay[:0:-1, 0]])[::4]
    corners = [relay[0, 0], relay[0, -1], relay[-1, -1], relay[-1, 0]]

    aim = relay.reshape(-1, 3).mean(axis=0) - scanner
    forward = aim / np.linalg.norm(aim)
    right = np.cross(forward, [0, -1, 0])
    right /= np.linalg.norm(right)
    up = np.cross(right, forward)
    body_vertices, body_faces = box_mesh(scanner, forward, right, up, 0.26, 0.17)
    toward = (relay.reshape(-1, 3) - scanner) / np.linalg.norm(relay.reshape(-1, 3) - scanner, axis=1, keepdims=True)
    across = np.degrees(np.ptp(np.arctan2(toward @ right, toward @ forward)))
    tall = np.degrees(np.ptp(np.arctan2(toward @ up, toward @ forward)))
    print(f'stanford: scanner at {np.round(scanner, 3)} m, {np.linalg.norm(aim):.2f} m from the relay ({1000 * misfit:.1f} mm RMS); '
          f'the scan spans {across:.1f} x {tall:.1f} degrees; box {np.round(low, 3)} to {np.round(high, 3)} m')

    segments = ([(scanner, corner, ACCENT) for corner in corners] + [(start, end, ACCENT) for start, end in outline(list(border))]
                + [(start, end, HIDDEN) for start, end in box_edges])
    dots = relay[4::8, 4::8].reshape(-1, 3)

    # The frame's origin and scale: the setup's middle, and the largest scale at which it stays in the cell through the rock.
    pitch = np.radians(SETUP_PITCH_DEGREES)
    extent = np.concatenate([relay.reshape(-1, 3)[::16], np.array(box), body_vertices])
    middle = (extent.min(axis=0) + extent.max(axis=0)) / 2
    spans = []
    for yaw in np.radians(np.linspace(-ROCK_DEGREES, ROCK_DEGREES, 61)):
        right_axis, down_axis, _ = camera_axes(yaw, pitch)
        spans.append(np.stack([(extent - middle) @ right_axis, (extent - middle) @ down_axis], axis=1))
    spans = np.concatenate(spans)
    margin = 8
    scale = min((np.array([CELL_WIDTH, CELL_HEIGHT]) - 2 * margin) / np.ptp(spans, axis=0))
    center = -scale * (spans.min(axis=0) + spans.max(axis=0)) / 2

    size = 4
    return Scene(
        vertices=(np.concatenate([relay.reshape(-1, 3), body_vertices]) - middle).astype(np.float32),
        texcoords=np.zeros((rows * columns + len(body_vertices), 2), dtype=np.float32),
        faces=np.concatenate([relay_faces, body_faces + rows * columns]).astype(np.int32),
        face_texture=np.concatenate([np.zeros(len(relay_faces), dtype=np.int16), np.ones(len(body_faces), dtype=np.int16)]),
        face_side=np.zeros(len(relay_faces) + len(body_faces), dtype=np.uint8),
        textures=np.stack([solid_texture(RELAY_GRAY, size), solid_texture(ACCENT, size)]), side_normals=np.zeros((1, 3)),
        bounds=np.array([[-np.inf] * 3, [np.inf] * 3], dtype=np.float32),
        segments=[(start - middle, end - middle, color) for start, end, color in segments],
        dots=dots - middle, dot_side=np.zeros(len(dots), dtype=np.uint8), gain=1.0, depth_bias=0.012,
        pitch=pitch, scale=scale, center=center)


SCENES = {'room': room_scene, 'stanford': stanford_scene}


def render_scene(row, yaws, cache):
    """Renders one row's scene at each yaw into the cache, skipping those there; returns {yaw: file}."""
    files = {yaw: cache / f'{row}-{SCENE_RENDER}-{yaw:+06d}.npy' for yaw in yaws}
    missing = [yaw for yaw, file in files.items() if not file.exists()]
    if missing:
        scene = SCENES[VOLUMES[row][0]]()
        for yaw in missing:
            partial = files[yaw].with_suffix('.partial.npy')
            np.save(partial, draw_scene(scene, np.radians(yaw / 1000)))
            os.replace(partial, files[yaw])
    return files


# ---------------------------------------------------------------------------
# The grid

def compose(frame, scenes, files, exposures):
    """The whole grid at one frame of the loop, as uint8 RGB: each row's scene, then its reconstructions."""
    rows, columns = len(VOLUMES), 1 + len(VOLUMES[0][1])
    canvas = np.zeros((rows * CELL_HEIGHT + (rows - 1) * ROW_GAP, columns * CELL_WIDTH + (columns - 1) * COLUMN_GAP, 3), dtype=np.uint8)
    cell = lambda row, column: (slice(row * (CELL_HEIGHT + ROW_GAP), row * (CELL_HEIGHT + ROW_GAP) + CELL_HEIGHT),
                                slice(column * (CELL_WIDTH + COLUMN_GAP), column * (CELL_WIDTH + COLUMN_GAP) + CELL_WIDTH))
    for row, scene_files in scenes.items():
        canvas[cell(row, 0)] = np.load(scene_files[rock(frame)])
    for (row, column), cell_files in files.items():
        canvas[cell(row, 1 + column)] = hot(np.load(cell_files[rock(frame)]) / exposures[row, column])
    return canvas


def overlay(scenes, files, exposures, yaws):
    """For each yaw, a row of three cells: the room's scene, ours' projection, and the scene's edges over the projection."""
    sheet = []
    for yaw in yaws:
        scene = np.load(scenes[0][yaw]).astype(np.float32)
        projection = hot(np.load(files[0, 0][yaw]) / exposures[0, 0]).astype(np.float32)
        gray = scene.mean(axis=-1)
        edges = np.zeros_like(gray)
        edges[1:-1, 1:-1] = np.abs(gray[1:-1, 2:] - gray[1:-1, :-2]) + np.abs(gray[2:, 1:-1] - gray[:-2, 1:-1])
        strength = np.clip(edges / 60, 0, 1)[..., None]
        over = projection * (1 - strength) + np.array([90, 220, 255]) * strength
        sheet.append(np.concatenate([scene, projection, over], axis=1))
    return np.concatenate(sheet).astype(np.uint8)


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--cache', default=str(Path(tempfile.gettempdir()) / 'nlos-comparison-renders'),
                        help='directory that keeps the rendered frames between runs')
    parser.add_argument('--stills', help='write a sheet of five frames to this PNG instead of the video')
    parser.add_argument('--overlay', help="write the room's scene over ours' projection at three yaws to this PNG instead of the video")
    arguments = parser.parse_args()
    cache = Path(arguments.cache) / f'{CELL_WIDTH}x{CELL_HEIGHT}-rock{ROCK_DEGREES}-pitch{ROOM_PITCH_DEGREES}-substeps{SUBSTEPS}'
    cache.mkdir(parents=True, exist_ok=True)

    still_frames = [0, FRAMES // 8, FRAMES // 4, 5 * FRAMES // 8, 3 * FRAMES // 4]
    frames = [0, FRAMES // 4, 3 * FRAMES // 4] if arguments.overlay else still_frames if arguments.stills else range(FRAMES)
    yaws = sorted({rock(frame) for frame in frames})
    cells = [(row, column) for row in range(len(VOLUMES)) for column in range(len(VOLUMES[row][1]))]
    scenes = {row: render_scene(row, yaws, cache) for row in range(len(VOLUMES))}
    files = {(row, column): render(row, column, yaws, cache) for row, column in cells}
    exposures = {(row, column): exposure(row, column, np.load(files[row, column][0])) for row, column in cells}
    for (row, column), value in exposures.items():
        print(f'{VOLUMES[row][0]:8s} column {column}: white at {value:.6g}  ({VOLUMES[row][1][column][0]})')

    if arguments.overlay or arguments.stills:
        from PIL import Image
        if arguments.overlay:
            sheet = overlay(scenes, files, exposures, [rock(frame) for frame in frames])
        else:
            sheet = np.concatenate([np.pad(compose(frame, scenes, files, exposures), ((0, 24), (0, 0), (0, 0)), constant_values=60) for frame in frames])
        Image.fromarray(sheet).save(arguments.overlay or arguments.stills)
        return

    OUT.mkdir(parents=True, exist_ok=True)
    video = OUT / 'scene-ours-ccsocr-3dgtr.mp4'
    first = compose(0, scenes, files, exposures)
    height, width = first.shape[:2]
    raw = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{width}x{height}', '-r', str(FPS), '-i', '-']
    # The video is BT.709 and says so, so that a browser shows the frames' colors.
    encoder = subprocess.Popen(
        [*raw, '-vf', 'scale=out_color_matrix=bt709:out_range=tv', '-colorspace', 'bt709', '-color_primaries', 'bt709',
         '-color_trc', 'bt709', *ENCODING, str(video)],
        stdin=subprocess.PIPE)
    for frame in range(FRAMES):
        encoder.stdin.write(compose(frame, scenes, files, exposures).tobytes())
    encoder.stdin.close()
    if encoder.wait() != 0:
        sys.exit('ffmpeg failed')
    # The poster is the first frame, shown until the video has one. It is encoded from the
    # frame itself: a JPEG taken from the video would go through a second color conversion.
    subprocess.run([*raw, '-frames:v', '1', '-q:v', '2', '-map_metadata', '-1', str(video.with_suffix('.poster.jpg'))],
                   input=first.tobytes(), check=True)
    print(f'{video}: {width}x{height}, {FRAMES} frames at {FPS} fps')


if __name__ == '__main__':
    main()
