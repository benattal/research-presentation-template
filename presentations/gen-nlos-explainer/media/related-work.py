"""Media of the slide related-work: one video of five method tiles, and its poster.

Each tile is the output of the method the slide names under it:

  f-k migration    the maximum-intensity projection of the f-k migration volume of
                   the bicycle capture of Lindell et al. (180 min), from a camera
                   that pans: FK_BIKE, an "f-k MIP conditioning video" per the
                   README and PROVENANCE.md of its folder (`fkdata_fk`, the
                   Stanford f-k dataset reconstructed with f-k migration).
                   Frames 18 to 46 of its 65, cropped to the square the
                   bicycle stays in.
  phasor fields    fast RSD (Liu et al. 2020) on the paper's own office scene (the
                   390-minute capture of its Fig. 7): FAST_RSD, written by
                   fast-rsd-office.py from the authors' released code and data,
                   cropped to OFFICE_CROP (the shelf, the chair, and the box) and
                   rendered as nlos-comparison.py renders volumes, the camera
                   turning from -22.5 to 22.5 degrees.
  HOLI-1-to-3      the authors' own result: the Pikachu cell of the HOLI-1-to-3
                   column in the comparison of the paper's supplementary video
                   (HOLI_VIDEO, IEEE Xplore, DOI 10.1109/TPAMI.2024.3463875/mm1),
                   one full turn (HOLI_TURN), slowed to last the whole loop so it
                   turns on without a seam.
  GEN3C            the authors' own result: the wall of televisions of the project
                   page's single-view gallery (GEN3C_GRID, research.nvidia.com/
                   labs/toronto-ai/GEN3C, its Cosmos grid_4.mp4, the bottom-right
                   cell), the camera passing the wall and drawing back (GEN3C_SPAN).
  Lyra 2           the authors' own result: the medieval town of the project page's
                   gallery (LYRA2_TOWN, nv-tlabs.github.io/Project-Lyra,
                   assets/videos/input_0558.mp4), the camera turning from a house
                   to the square with its fountain and tower (LYRA2_SPAN).

The paper sources live in assets/sources/related-work/papers/ (the bucket keeps
them with the presentation's assets); the f-k clip is read from the Dropbox
figures folder (read-only).

Every clip is 29 frames at 15 fps and plays as the results slides' clips do
(results.sh): forward, 2 s on the last view, back, 0.5 s on the first view, a
6.27 s loop; HOLI-1-to-3's turn spans the same loop. One file holds the five
tiles, so they stay in step: 300 px squares (the layout shows them at 180 stage
pixels) at the offsets of TILE_LEFT, the gaps black; the layout RelatedWork
draws each square onto its tile's canvas.

Run from the presentation directory:  python media/related-work.py
Needs numpy, numba, and ffmpeg.
"""
import importlib.util
import site
import subprocess
import sys
import tempfile
from pathlib import Path

site.addsitedir(site.getusersitepackages())  # numpy and numba, also under `python -I`

import numpy as np  # noqa: E402

from figures import figures_dir  # noqa: E402

FIGURES = figures_dir()
FK_BIKE = FIGURES / '7_conventionalnlos/conventional_nlos/qualitative/fkdata_fk/inputs/bike_meas_180min_mip.mp4'
PAPERS = Path('assets/sources/related-work/papers')
FAST_RSD = PAPERS / 'liu2020-fast-rsd/volumes/officescene.npy'
HOLI_VIDEO = PAPERS / 'shen2025-holi/supp1-3463875.mp4'
GEN3C_GRID = PAPERS / 'ren2025-gen3c/grid_4.mp4'
LYRA2_TOWN = PAPERS / 'shen2026-lyra2/input_0558.mp4'
OUT = Path('public/slides/related-work')

TILE = 300
# Left edges of the tiles in the file: three of non-line-of-sight imaging, two of
# generative view synthesis; 30 px between tiles of a group (20 stage pixels), 102
# between the groups (two paddings of 20 and a gap of 28).
TILE_LEFT = [0, 330, 660, 1062, 1392]
FRAMES, FPS = 29, 15
TURN_DEGREES = 22.5
# The office volume's square around the shelf, the chair, and the box: [rows, columns] of its 150 x 150, 2 cm voxels.
OFFICE_CROP = (slice(36, 116), slice(38, 118))
VOXEL = 0.02  # meters
# One turn of the Pikachu: from 66 s, 151 frames at 30 fps; the square of its cell in the 1920 x 1080 video.
HOLI_TURN, HOLI_CROP = (66.0, 151 / 30), '270:270:1370:258'
# The spans, (start, duration) in seconds, played as FRAMES frames, and the squares of the frames they keep.
GEN3C_SPAN, GEN3C_CROP = (2.4, 2.4), '352:352:784:352'   # the cell at 640:352 of the 1280 x 704 grid, its middle square
LYRA2_SPAN, LYRA2_CROP = (6.5, 3.0), '480:480:176:0'     # the middle square of the 832 x 480 frame
LOOP_FRAMES = 94  # the loop's frames: 29 forward, 30 held, 27 back, 8 held
PERCENTILE = 99.5
# The first of the 29 consecutive frames of the bicycle clip, and the square around the bicycle.
BIKE_FIRST_FRAME, BIKE_CROP = 18, '216:216:21:18'
ENCODING = ['-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart', '-map_metadata', '-1']
# results.sh's loop: forward, the last frame for 2 s, back, the first frame for 0.5 s; `name` keeps each tile's labels apart.
def loop(name):
    return (f'split=4[{name}a][{name}b][{name}c][{name}d];'
            f'[{name}b]trim=start_frame=28:end_frame=29,loop=loop=29:size=1:start=0,setpts=N/15/TB[{name}hold];'
            f'[{name}c]reverse,trim=start_frame=1:end_frame=28,setpts=N/15/TB[{name}rev];'
            f'[{name}d]trim=start_frame=0:end_frame=1,loop=loop=7:size=1:start=0,setpts=N/15/TB[{name}first];'
            f'[{name}a][{name}hold][{name}rev][{name}first]concat=n=4:v=1')


def span(times, crop):
    """A filter keeping `times` (start, duration in seconds) of a clip, stretched to FRAMES frames at FPS, cropped to `crop`."""
    start, duration = times
    return (f'trim=start={start}:duration={duration},setpts=(PTS-STARTPTS)*{FRAMES / FPS / duration},'
            f'fps={FPS},trim=end_frame={FRAMES},crop={crop}')


def room_renderer():
    """nlos-comparison.py as a module, set to render one square tile; it owns the projection and the colormap."""
    spec = importlib.util.spec_from_file_location('nlos_comparison', Path(__file__).with_name('nlos-comparison.py'))
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module  # numba's cache finds the functions' module by name
    spec.loader.exec_module(module)
    module.CELL_WIDTH = module.CELL_HEIGHT = TILE
    module.ROCK_DEGREES = TURN_DEGREES  # the yaws the box must fit the tile at
    return module


def render_fast_rsd():
    """
    The fast RSD volume from FRAMES yaws, -TURN_DEGREES to TURN_DEGREES, as uint8
    RGB (FRAMES, TILE, TILE, 3): shown from 0 to the 99.5th percentile of the
    front view (over the pixels whose rays cross the box), held for the clip.
    The volume is [down, right, away] already, as the paper shows its MIP.
    """
    renderer = room_renderer()
    volume = np.ascontiguousarray(np.load(FAST_RSD)[OFFICE_CROP], dtype=np.float32)
    size = tuple(VOXEL * n for n in volume.shape)
    pitch = 0.0
    inside = renderer.project(np.ones_like(volume), size, 0.0, pitch) > 1.0
    white = np.percentile(renderer.project(volume, size, 0.0, pitch)[inside], PERCENTILE)
    yaws = np.radians(np.linspace(-TURN_DEGREES, TURN_DEGREES, FRAMES))
    return np.stack([renderer.hot(renderer.project(volume, size, yaw, pitch) / white) for yaw in yaws])


def main():
    for source in (FK_BIKE, HOLI_VIDEO, GEN3C_GRID, LYRA2_TOWN, FAST_RSD):
        if not source.exists():
            sys.exit(f'missing source: {source}')
    OUT.mkdir(parents=True, exist_ok=True)
    video = OUT / 'methods.mp4'
    with tempfile.TemporaryDirectory() as scratch:
        fast_rsd = Path(scratch) / 'fast-rsd.rgb'
        fast_rsd.write_bytes(render_fast_rsd().tobytes())
        square = f'fps={FPS},scale={TILE}:{TILE}:flags=lanczos,setsar=1'
        start, turn = HOLI_TURN
        # Each clip loops on its own, except HOLI-1-to-3's turn, slowed to the loop's length.
        tiles = [
            f'[0:v]trim=start_frame={BIKE_FIRST_FRAME}:end_frame={BIKE_FIRST_FRAME + FRAMES},setpts=N/{FPS}/TB,crop={BIKE_CROP},{square},{loop('t0')}[t0]',
            f'[1:v]setsar=1,{loop('t1')}[t1]',
            f'[2:v]trim=start={start}:duration={turn},setpts=(PTS-STARTPTS)*{LOOP_FRAMES / FPS / turn},crop={HOLI_CROP},'
            f'{square},trim=end_frame={LOOP_FRAMES}[t2]',
            f'[3:v]{span(GEN3C_SPAN, GEN3C_CROP)},{square},{loop('t3')}[t3]',
            f'[4:v]{span(LYRA2_SPAN, LYRA2_CROP)},{square},{loop('t4')}[t4]',
        ]
        layout = '|'.join(f'{left}_0' for left in TILE_LEFT)
        # Every tile on one clock, frame by frame, so xstack pairs their frames.
        graph = ';'.join(tiles) + ''.join(f';[t{i}]setpts=N/{FPS}/TB[s{i}]' for i in range(5))
        graph += f';[s0][s1][s2][s3][s4]xstack=inputs=5:layout={layout}:fill=black,pad=ceil(iw/2)*2:ceil(ih/2)*2'
        # The file carries no color tags, as the clips it is made of: a browser reads both as BT.601.
        subprocess.run(
            ['ffmpeg', '-v', 'error', '-y', '-i', str(FK_BIKE),
             '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{TILE}x{TILE}', '-r', str(FPS), '-i', str(fast_rsd),
             '-i', str(HOLI_VIDEO), '-i', str(GEN3C_GRID), '-i', str(LYRA2_TOWN),
             '-filter_complex', graph, '-r', str(FPS), '-frames:v', str(LOOP_FRAMES), *ENCODING, str(video)],
            check=True)
    # The poster is the video's first frame, shown until the video has one.
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(video), '-frames:v', '1', '-q:v', '2', '-map_metadata', '-1',
                    str(video.with_suffix('.poster.jpg'))], check=True)
    probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height,nb_frames,duration',
                            '-of', 'csv=p=0', str(video)], capture_output=True, text=True, check=True)
    print(f'{video}: {probe.stdout.strip()}')


if __name__ == '__main__':
    main()
