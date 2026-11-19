"""
Media of the method slides (processing, conditioning, generation), from the
captured vase scene of the Dropbox figures folder (read-only). Run from the
presentation directory:

    python media/method-scene.py [scene] [mip] [light] [streams] [generated]

With no argument it runs every part. Everything is written to
public/slides/processing/ (the three slides share the folder).

scene    The data of the 3D view, as PNG files, so the page loads them as
         images and the capture and record views wait for them like any
         other media:
           input-image.png   the RGB image, 256 x 256, as displayed
           input-depth.png   depth z from the direct light, in millimeters
                             as 16 bits: R the high byte, G the low byte
                             (B 0, A 255); 0 where there is no depth
           nlos-volume.png   the NLOS volume, cropped to the region with
                             signal and resampled to 7 mm voxels, as an
                             atlas of z slices: slice k at tile
                             (k % columns, k // columns); gray value
                             255 * sqrt(rho / max rho)
         and prints the "scene" object of the slides' content.json.
mip      Renders the maximum-intensity projection (MIP) and MIP depth of
         the NLOS volume along the 29 target cameras as the paper defines
         them (the maximum of the volume along each pixel's ray over camera
         depth, and the depth of that maximum) into work/mip_raw.npz.
light, streams, generated
         One video file per slide (a slide holds one video element, so
         clips that play together cannot drift), each with its first frame
         as <name>.poster.jpg:
           propagating-light.mp4      (light) the captured light video
           conditioning-streams.mp4   (streams) warped RGB, MIP, MIP depth
                                      in a column, with black gaps for the
                                      labels. It holds the input view for
                                      2 s (while the conditioning slide
                                      draws the trajectory), plays forward,
                                      holds the last view for 2 s, and
                                      plays back (114 frames at 15 fps).
           conditioning-streams.final.png
                                      (streams) the frame of that file in
                                      the middle of its hold on the last
                                      view, decoded by ffmpeg: the still
                                      the generation slide shows where the
                                      video was
           generated.mp4              (generated) our generated video. It
                                      plays forward, holds the last view,
                                      plays back, and holds the input view
                                      (79 frames at 15 fps).

Coordinates of the 3D view ("slide coordinates"): three.js's, y up, the
input camera at the origin looking down -z, x to the right of the image as
displayed, meters. The capture's native pixels are mirrored left-right and
every video of this scene shows them flipped back, so a native OpenCV point
(x, y, z) is (-x, -y, -z) in slide coordinates.

The warped RGB and the generated video are the paper's files. MIP and MIP
depth are rendered here from the volume and colored with inferno and turbo
(near is red, far is green, the hues of the paper's overview figure). Ray
maxima below the 90th percentile of the positive maxima of the trajectory
are empty and the MIP is normalized to the 99.5th; the paper's setting for
captures is the 80th, raised here so that the MIP depth covers the region
where the MIP is visibly above black. Videos are H.264 yuv420p (BT.709),
1.5 times the size they are shown at, without audio or metadata.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates

from figures import figures_dir  # noqa: E402

FIGURES = figures_dir()
SCENE = FIGURES / "1_teaser/teaser_scene/scenes/teaser"
# Intermediate renders (kept between runs; in the bucket with the other sources).
WORK = Path("assets/sources/processing/work")
PUBLIC = Path("public/slides/processing")

# The volume's crop in slide coordinates (m): the region where the
# reconstruction is above the MIP's empty threshold, with a margin.
BOX_MIN = np.array([-0.40, -0.28, -1.56])
VOXEL = 0.007
VOXELS = np.array([121, 69, 75])  # x, y, z
ATLAS_COLUMNS = 10

# MIP rendering and display.
TAU = np.arange(0.25, 2.75, 0.004, dtype=np.float32)  # camera depth samples, m
ROWS_PER_CHUNK = 16
EMPTY_PERCENTILE = 90
NORMALIZE_PERCENTILE = 99.5
DEPTH_PERCENTILES = (1, 99)  # of the valid MIP depths: the colormap's range
TURBO_RANGE = (0.42, 0.95)  # far (green) to near (red)

# The slides' geometry in stage pixels (MethodScene.jsx), and the videos' scale.
SCALE = 1.5
PANEL = 140  # a stream panel, an input
PANEL_PITCH = 190  # from one stream panel's top to the next
COLUMN_HEIGHT = 2 * PANEL_PITCH + PANEL
OUTPUT = 288  # the generated video
FPS = 15
FRAMES = 29
# The generated video: forward, hold on the last view, back without the end frames, hold on the first.
LOOP = list(range(FRAMES)) + [FRAMES - 1] * 15 + list(range(FRAMES - 2, 0, -1)) + [0] * 8
# The conditioning streams: the first view for LEAD more frames, forward, the
# last view for HOLD_LAST more frames, back without the end frames. The
# slide's "streams" names both numbers (`lead`, `holdLast`).
LEAD = 29
HOLD_LAST = 29
STREAMS_LOOP = [0] * LEAD + list(range(FRAMES)) + [FRAMES - 1] * HOLD_LAST + list(range(FRAMES - 2, 0, -1))
# The frame of the streams file the final still is: the middle of the hold on the last view.
FINAL_FRAME = LEAD + FRAMES - 1 + HOLD_LAST // 2

INFERNO = np.array([
    [0.0002189403691192265, 0.001651004631001012, -0.01948089843709184],
    [0.1065134194856116, 0.5639564367884091, 3.932712388889277],
    [11.60249308247187, -3.972853965665698, -15.9423941062914],
    [-41.70399613139459, 17.43639888205313, 44.35414519872813],
    [77.162935699427, -33.40235894210092, -81.80730925738993],
    [-71.31942824499214, 32.62606426397723, 73.20951985803202],
    [25.13112622477341, -12.24266895238567, -23.07032500287172],
])
TURBO = np.array([
    [0.13572138, 4.61539260, -42.66032258, 132.13108234, -152.94239396, 59.28637943],
    [0.09140261, 2.19418839, 4.84296658, -14.18503333, 4.27729857, 2.82956604],
    [0.10667330, 12.64194608, -60.58204836, 110.36276771, -89.90310912, 27.34824973],
])


def inferno(t):
    """Matplotlib's inferno as a polynomial fit (the 3D view's shader uses the same)."""
    t = np.clip(np.asarray(t, np.float64), 0, 1)[..., None]
    rgb = np.zeros(t.shape[:-1] + (3,))
    for coefficients in INFERNO[::-1]:
        rgb = rgb * t + coefficients
    return np.clip(rgb, 0, 1)


def turbo(t):
    """Google's turbo as a polynomial fit."""
    t = np.clip(np.asarray(t, np.float64), 0, 1)
    powers = np.stack([t ** k for k in range(6)], -1)
    return np.clip(powers @ TURBO.T, 0, 1)


def to_bytes(rgb):
    return np.round(np.clip(rgb, 0, 1) * 255).astype(np.uint8)


def scaled(stage_pixels):
    pixels = round(stage_pixels * SCALE)
    assert pixels % 2 == 0, f"{stage_pixels} stage pixels is an odd number of video pixels"
    return pixels


def save_png(array, path):
    Image.fromarray(array).save(path, optimize=True)


# --- scene ---------------------------------------------------------------

def image_and_depth():
    """The RGB image and the depth map, as displayed; returns the display intrinsics."""
    rgbd = np.load(SCENE / "transient/registered/rgbd_aligned.npz")
    depth = np.where(rgbd["valid"], rgbd["depth_z"], 0.0)
    millimeters = np.round(depth * 1000).astype(np.uint16)
    encoded = np.zeros(depth.shape + (4,), np.uint8)
    encoded[..., 0] = millimeters >> 8
    encoded[..., 1] = millimeters & 255
    encoded[..., 3] = 255
    save_png(np.ascontiguousarray(rgbd["rgb_u8"]), PUBLIC / "input-image.png")
    save_png(encoded, PUBLIC / "input-depth.png")
    # This file's K maps display pixels to native x with a negative fx;
    # in slide coordinates (x = -native x) the focal length is positive.
    K = rgbd["K"]
    assert K[0, 0] < 0, "rgbd_aligned.npz: expected the display K (negative fx)"
    height, width = depth.shape
    return {
        "width": width, "height": height,
        "fx": round(float(-K[0, 0]), 4), "fy": round(float(K[1, 1]), 4),
        "cx": round(float(K[0, 2]), 4), "cy": round(float(K[1, 2]), 4),
        "depth": "/slides/processing/input-depth.png",
        "depthRange": [round(float(depth[depth > 0].min()), 3), round(float(depth.max()), 3)],
    }


def load_volume():
    meta = json.loads((SCENE / "volume/metadata.json").read_text())
    assert meta["axis_order"] == "XYZ"
    rho = np.load(SCENE / "volume/nlos.npy").astype(np.float32)
    lo = np.array(meta["volume_min_xyz_m"], np.float32)
    spacing = np.array(meta["voxel_spacing_xyz_m"], np.float32)
    return rho, lo, spacing


def volume_atlas():
    rho, lo, spacing = load_volume()
    # Low-pass to the new voxel size before resampling.
    rho = gaussian_filter(rho, sigma=0.5 * VOXEL / spacing)
    axes = [BOX_MIN[a] + VOXEL * np.arange(VOXELS[a]) for a in range(3)]
    z, y, x = np.meshgrid(axes[2], axes[1], axes[0], indexing="ij")  # (nz, ny, nx)
    native = -np.stack([x, y, z], -1)  # slide -> native OpenCV
    index = (native - lo) / spacing
    grid = map_coordinates(rho, index.reshape(-1, 3).T, order=1, mode="constant", cval=0.0).reshape(z.shape)
    encoded = np.round(255 * np.sqrt(grid / grid.max())).astype(np.uint8)
    nz, ny, nx = encoded.shape
    rows = -(-nz // ATLAS_COLUMNS)
    atlas = np.zeros((rows * ny, ATLAS_COLUMNS * nx), np.uint8)
    for k in range(nz):
        r, c = divmod(k, ATLAS_COLUMNS)
        atlas[r * ny:(r + 1) * ny, c * nx:(c + 1) * nx] = encoded[k]
    save_png(atlas, PUBLIC / "nlos-volume.png")
    box_max = BOX_MIN + VOXEL * (VOXELS - 1)
    print(f"volume: the crop's maximum is {grid.max():.3e} (encoded as 255)", file=sys.stderr)
    return {
        "src": "/slides/processing/nlos-volume.png",
        "size": [int(nx), int(ny), int(nz)],
        "columns": ATLAS_COLUMNS,
        "box": [[round(float(v), 4) for v in BOX_MIN], [round(float(v), 4) for v in box_max]],
    }


def load_cameras():
    cameras = json.loads((SCENE / "geometry/cameras.json").read_text())
    return cameras, np.array(cameras["K"], np.float32), np.array(cameras["camera_to_world_opencv"], np.float32)


def trajectory():
    """The 29 target poses as the orbit they are, checked against the file."""
    cameras, _, c2w = load_cameras()
    radius = cameras["orbit_radius_m"]
    arc = abs(cameras["arc_degrees"])
    assert len(c2w) == FRAMES
    center = np.array([0.0, 0.0, -radius])
    for f in range(FRAMES):
        a = np.radians(arc * f / (FRAMES - 1))
        position = center + radius * np.array([np.sin(a), 0.0, np.cos(a)])
        assert np.allclose(-c2w[f, :3, 3], position, atol=1e-4), f"pose {f}: position"
        forward = -c2w[f, :3, 2]  # the camera's +z axis, in slide coordinates
        toward = (center - position) / radius
        assert np.allclose(forward, toward, atol=1e-3), f"pose {f}: direction"
    return {"center": [0, 0, -radius], "radius": radius, "arcDegrees": arc, "frames": FRAMES}


def scene():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    camera = image_and_depth()
    description = {
        "image": "/slides/processing/input-image.png",
        "camera": camera,
        "volume": volume_atlas(),
        "trajectory": trajectory(),
    }
    print(json.dumps(description, indent=2))


# --- mip -----------------------------------------------------------------

def mip():
    rho, lo, spacing = load_volume()
    _, K, c2w = load_cameras()
    size = 256
    u, v = np.meshgrid(np.arange(size, dtype=np.float32), np.arange(size, dtype=np.float32))
    rays = np.stack([(u - K[0, 2]) / K[0, 0], (v - K[1, 2]) / K[1, 1], np.ones_like(u)], -1)
    m = np.zeros((FRAMES, size, size), np.float32)
    d = np.zeros((FRAMES, size, size), np.float32)
    for f in range(FRAMES):
        R, C = c2w[f, :3, :3], c2w[f, :3, 3]
        for r0 in range(0, size, ROWS_PER_CHUNK):
            directions = rays[r0:r0 + ROWS_PER_CHUNK] @ R.T  # world, per unit camera depth
            points = C + directions[..., None, :] * TAU[:, None]
            index = (points - lo) / spacing
            samples = map_coordinates(rho, index.reshape(-1, 3).T, order=1, mode="constant", cval=0.0)
            samples = samples.reshape(index.shape[:-1])
            m[f, r0:r0 + ROWS_PER_CHUNK] = samples.max(-1)
            d[f, r0:r0 + ROWS_PER_CHUNK] = TAU[samples.argmax(-1)]
        print(f"mip: frame {f + 1}/{FRAMES}", flush=True)
    WORK.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(WORK / "mip_raw.npz", m=m, d=d)


# --- videos --------------------------------------------------------------

def encode(frames, name, fps):
    """Encode RGB uint8 frames (n, h, w, 3) as H.264, and the first frame as the poster."""
    n, h, w, _ = frames.shape
    assert h % 2 == 0 and w % 2 == 0
    path = PUBLIC / f"{name}.mp4"
    command = [
        "ffmpeg", "-v", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
        "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
        "-c:v", "libx264", "-preset", "slow", "-crf", "16",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-an", "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:v", "+bitexact",
        "-movflags", "+faststart", str(path),
    ]
    subprocess.run(command, input=np.ascontiguousarray(frames).tobytes(), check=True)
    Image.fromarray(frames[0]).save(PUBLIC / f"{name}.poster.jpg", quality=92)
    print(f"{path.name}: {n} frames, {w}x{h}, {path.stat().st_size / 1e3:.0f} kB")


def read_video(path, size=256):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, size, size, 3)


def resize(frame, size):
    return np.asarray(Image.fromarray(frame).resize((size, size), Image.LANCZOS))


def mip_frames():
    """MIP (inferno) and MIP depth (turbo, near is warm) frames, as displayed."""
    raw = np.load(WORK / "mip_raw.npz")
    m = raw["m"][:, :, ::-1]
    d = raw["d"][:, :, ::-1]
    positive = m[m > 0]
    empty = np.percentile(positive, EMPTY_PERCENTILE)
    top = np.percentile(positive, NORMALIZE_PERCENTILE)
    valid = m >= empty
    level = np.clip((m - empty) / (top - empty), 0, 1)
    near, far = np.percentile(d[valid], DEPTH_PERCENTILES)
    closeness = 1 - np.clip((d - near) / (far - near), 0, 1)
    low, high = TURBO_RANGE
    print(f"mip: empty below {empty:.3e}, 1 at {top:.3e}; depth {near:.3f} to {far:.3f} m")
    return to_bytes(inferno(level) * valid[..., None]), to_bytes(turbo(low + (high - low) * closeness) * valid[..., None])


def light():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    frames = read_video(FIGURES / "website/assets/teaser-light-clean.mp4")
    encode(np.stack([resize(frame, scaled(PANEL)) for frame in frames]), "propagating-light", 48)


def streams():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    warped = read_video(SCENE / "presentation/warped_rgb.mp4")
    mip_color, depth_color = mip_frames()
    assert len(warped) == len(mip_color) == len(depth_color) == FRAMES
    panel = scaled(PANEL)
    column = np.zeros((FRAMES, scaled(COLUMN_HEIGHT), panel, 3), np.uint8)
    for f in range(FRAMES):
        for i, stream in enumerate((warped, mip_color, depth_color)):
            top = round(i * PANEL_PITCH * SCALE)
            column[f, top:top + panel] = resize(stream[f], panel)
    encode(column[STREAMS_LOOP], "conditioning-streams", FPS)
    # The still is the encoded file's own frame, decoded by ffmpeg, so it matches what the video
    # shows. It is written here and not by ffmpeg, whose PNG carries the video's transfer function
    # as a gamma chunk: a browser then converts the image, and shows it darker than the video.
    # The chroma is interpolated (full_chroma_int), as a browser does; of ffmpeg's filters, bicubic
    # came closest to Chromium's decode of the frame (mean difference 0.1 of 255).
    raw = subprocess.run([
        "ffmpeg", "-v", "error", "-i", str(PUBLIC / "conditioning-streams.mp4"),
        "-vf", f"select=eq(n\\,{FINAL_FRAME}),scale=in_color_matrix=bt709:in_range=tv:out_range=pc"
               ":flags=bicubic+accurate_rnd+full_chroma_int",
        "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
    ], capture_output=True, check=True).stdout
    still = PUBLIC / "conditioning-streams.final.png"
    save_png(np.frombuffer(raw, np.uint8).reshape(scaled(COLUMN_HEIGHT), panel, 3), still)
    print(f"{still.name}: frame {FINAL_FRAME}, {still.stat().st_size / 1e3:.0f} kB")


def generated():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    frames = read_video(SCENE / "prediction/video.mp4")
    assert len(frames) == FRAMES
    output = scaled(OUTPUT)
    encode(np.stack([resize(frame, output) for frame in frames])[LOOP], "generated", FPS)


PARTS = {"scene": scene, "mip": mip, "light": light, "streams": streams, "generated": generated}

if __name__ == "__main__":
    for name in sys.argv[1:] or PARTS:
        PARTS[name]()
