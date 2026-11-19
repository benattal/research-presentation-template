"""Direct-only and indirect-only videos of propagating light for the lamp and globe captures.

The processing is the supplemental website's (figures/website/render_source/
render_results_light.py: baselines, gating, scaling, the white and amber
colors over the dimmed input view), with the direct and indirect light
drawn separately. One file holds the four clips (columns: direct, indirect;
rows: lamp, globe), so they stay in step, at 48 frames per second, one
16 ps bin per frame. Both columns start together and play the bins in
which their light is on screen (the ranges are printed); the indirect
column pauses on FREEZE_FRAME for PAUSE_FRAMES, then plays on to its end.
The shorter column holds its last frame until the longer ends; then the
video loops. The slide's red boxes around the arcs show during the pause
(the times are printed).

Run from the presentation directory:  python media/light-split.py
Cells are 336 px (224 stage pixels at 1.5x), the gaps 54 and 60 px (36 and 40).
"""
import subprocess
from pathlib import Path

import h5py
import numpy as np

from figures import figures_dir

FIGURES = figures_dir()
OUT = Path('public/slides/line-of-sight')
SCENES = {'lamp': 5, 'globe': 6}
FIRST_BIN, LAST_BIN = 320, 896
CELL, COLUMN_GAP, ROW_GAP = 336, 54, 60
# The frame the indirect column freezes on, as an offset from FIRST_BIN: 9.82 ns, chosen by the user
# (2026-11-19) for how the lamp and globe differ there.
FREEZE_FRAME = 294
# How long the indirect column pauses on FREEZE_FRAME, in frames at 48 fps.
PAUSE_FRAMES = 120
AMBER = np.array([230, 159, 0]) / 255


def render(scene):
    """Frames (bins, 256, 256, 3) of the direct and of the indirect light for one capture."""
    source = FIGURES / f'6_QualExperimental/scenes/paperscene{scene}/transient'
    with h5py.File(source / 'registered/aligned_transients.h5') as h:
        rgb = h['rgb_u8'][()].astype(np.float32) / 255
        wall_y = np.arange(256)[:, None]
        wall_x = np.arange(256)[None, :]
        boundary = np.where(wall_x >= 185, 210 + (wall_x - 185) * .48, 216)
        valid_alpha = np.broadcast_to(np.clip((boundary - wall_y) / 7, 0, 1), (256, 256)).copy().astype(np.float32)
        valid_alpha[(wall_x >= 42) & (wall_x < 186) & (wall_y >= 77)] = 0
        valid = valid_alpha > 0
        gray = np.einsum('ijk,k->ij', rgb, [.2126, .7152, .0722])
        bg = (.5 * rgb + .5 * gray[..., None]) * .2
        los, nlos, nlos_support = h['los_rate'], h['nlos_rate'], h['nlos_support']
        nbase = np.median(np.stack([nlos[i] for i in (1000, 1050, 1100, 1150, 1200)]), axis=0)
        base = np.median(np.stack([los[i] for i in (820, 850, 880, 910, 940)]), axis=0)
        peak_value = np.full((256, 256), -np.inf, dtype=np.float32)
        peak = np.zeros((256, 256), dtype=np.int32)
        for idx in range(320, 800):
            v = los[idx] - base
            select = v > peak_value
            peak_value[select] = v[select]
            peak[select] = idx
        book = np.zeros((256, 256), dtype=bool)
        book[75:222, 40:190] = True
        direct_frames, indirect_frames = [], []
        for idx in range(FIRST_BIN, LAST_BIN):
            direct_raw = np.maximum(los[idx] - base, 0)
            direct_raw = np.where((np.abs(idx - peak) <= 5) & (peak_value > 2500), direct_raw, 0)
            direct_raw = np.where(book & ((idx < 372) | (idx > 400) | (np.abs(idx - peak) > 5) | (peak_value < 6000)), 0, direct_raw)
            if idx < 400:
                pad = np.pad(direct_raw, 1, mode='edge')
                smoothed = sum(pad[dy:dy + 256, dx:dx + 256] for dy in range(3) for dx in range(3)) / 9
                direct_raw = np.where(valid, direct_raw, smoothed)
            direct_scale = max(float(np.percentile(direct_raw, 99.5)), 2500.)
            direct = np.clip((direct_raw / direct_scale - .12) / .88, 0, 1) ** .5
            raw = np.maximum(nlos[idx] - nbase, 0)
            raw = np.where(nlos_support[idx] > 0, raw, 0)
            pad = np.pad(raw, 1, mode='edge')
            raw = sum(pad[dy:dy + 256, dx:dx + 256] for dy in range(3) for dx in range(3)) / 9
            raw = np.where(valid, raw, 0)
            indirect_scale = max(float(np.percentile(raw[valid], 99.5)), 350.)
            indirect = np.clip((raw / indirect_scale - .15) / .85, 0, 1) ** .5 * valid_alpha
            for wave, frames in ((direct[..., None] * .8 * np.ones(3), direct_frames), (indirect[..., None] * AMBER, indirect_frames)):
                frames.append(np.rint((1 - (1 - bg) * (1 - np.minimum(wave, 1))) * 255).astype(np.uint8))
    return np.stack(direct_frames), np.stack(indirect_frames), np.rint(bg * 255).astype(np.uint8)


def lit_counts(stacks, background):
    """Per frame, the largest number of lit pixels over the captures."""
    counts = np.zeros(len(stacks[0]))
    for frames, bg in zip(stacks, background):
        lit = np.abs(frames.astype(np.int16) - bg.astype(np.int16)).max(axis=-1) > 40
        counts = np.maximum(counts, lit.sum(axis=(1, 2)))
    return counts


def lit_range(stacks, background):
    """First and last frame in which light is on screen (5% of its peak extent), with a sixth of a second around them."""
    counts = lit_counts(stacks, background)
    on = np.flatnonzero(counts > 0.05 * counts.max())
    return max(int(on[0]) - 8, 0), min(int(on[-1]) + 8, len(counts) - 1)


def write(name, tiles):
    """One video of four clips, `tiles[row][column]`, each scaled to a cell, with the gaps between them."""
    width, height = 2 * CELL + COLUMN_GAP, 2 * CELL + ROW_GAP
    crops = ''.join(
        f'[t{r}{c}]crop=256:256:{256 * c}:{256 * r},scale={CELL}:{CELL}:flags=lanczos[s{r}{c}];'
        for r in range(2) for c in range(2))
    layout = '|'.join(f'{c * (CELL + COLUMN_GAP)}_{r * (CELL + ROW_GAP)}' for r in range(2) for c in range(2))
    process = subprocess.Popen(
        ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '512x512', '-r', '48', '-i', '-',
         '-filter_complex',
         f'[0:v]split=4[t00][t01][t10][t11];{crops}'
         f'[s00][s01][s10][s11]xstack=inputs=4:layout={layout}:fill=black,pad={width}:{height}',
         '-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
         '-map_metadata', '-1', str(OUT / f'{name}.mp4')], stdin=subprocess.PIPE)
    for frames in zip(tiles[0][0], tiles[0][1], tiles[1][0], tiles[1][1]):
        top = np.concatenate([frames[0], frames[1]], axis=1)
        bottom = np.concatenate([frames[2], frames[3]], axis=1)
        process.stdin.write(np.concatenate([top, bottom]).tobytes())
    process.stdin.close()
    if process.wait():
        raise RuntimeError(f'ffmpeg failed for {name}')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(OUT / f'{name}.mp4'), '-frames:v', '1', '-q:v', '2',
                    '-map_metadata', '-1', str(OUT / f'{name}.poster.jpg')], check=True)


rendered = {name: render(scene) for name, scene in SCENES.items()}
backgrounds = [rendered[name][2] for name in SCENES]
ns = lambda frame: (FIRST_BIN + frame) * 0.016
ranges = []
for kind, index in (('direct light', 0), ('indirect light', 1)):
    first, last = lit_range([rendered[name][index] for name in SCENES], backgrounds)
    ranges.append((first, last))
    print(f'{kind}: frames {first}-{last}, {ns(first):.2f}-{ns(last):.2f} ns')

direct = list(range(ranges[0][0], ranges[0][1] + 1))
first, last = ranges[1]
indirect = list(range(first, FREEZE_FRAME)) + [FREEZE_FRAME] * PAUSE_FRAMES + list(range(FREEZE_FRAME, last + 1))
length = max(len(direct), len(indirect))
order = [frames + [frames[-1]] * (length - len(frames)) for frames in (direct, indirect)]
pause = (FREEZE_FRAME - first) / 48
print(f'indirect: paused on {ns(FREEZE_FRAME):.2f} ns from {pause:.3f} s to {pause + PAUSE_FRAMES / 48:.3f} s; '
      f'loop {length / 48:.3f} s')
write('direct-and-indirect-light', [[rendered[name][index][order[index]] for index in (0, 1)] for name in SCENES])
