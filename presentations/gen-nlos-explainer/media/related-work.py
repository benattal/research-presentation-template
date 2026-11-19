"""Media of the slide related-work: one video of five method tiles, and its poster.

Each tile is the output of the method the slide names under it:

  f-k migration    the maximum-intensity projection of the f-k migration volume of
                   the bicycle capture of Lindell et al. (180 min), from a camera
                   that pans: FK_BIKE, an "f-k MIP conditioning video" per the
                   README and PROVENANCE.md of its folder (`fkdata_fk`, the
                   Stanford f-k dataset reconstructed with f-k migration).
                   Frames 18 to 46 of its 65, cropped to the square the
                   bicycle stays in.
  phasor fields    fast RSD (Liu et al. 2020) on the simulated living room of the
                   slide nlos-comparison: FAST_RSD, the results page's row
                   "fast RSD" of that scene, rendered here as nlos-comparison.py
                   renders the room, the camera turning from -22.5 to 22.5 degrees.
  HOLI-1-to-3*     the paper's reimplementation on the captured scene with a
                   hidden lamp (HOLI_LAMP; the folder's README names the run).
  GEN3C*           the paper's reimplementation on the same scene (GEN3C_LAMP).
  Lyra 2           the released model on a simulated room (LYRA2_ROOM; the
                   folder's README: "the videos used for the paper's Lyra2 rows").

The volume comes from the bucket (read-only) and keeps its path under SOURCES:
  rclone copy tcig:tcig-projects/nlos_results_pages_20261114/nonplanar_nlos_results/outputs/evalcmp/g2/c_room/living_room/runs/fast_rsd_plain \\
      assets/sources/related-work/nlos-volumes/g2/c_room/living_room/runs/fast_rsd_plain
The clips are read from the Dropbox figures folder (read-only).

Every clip is 29 frames at 15 fps and plays as the results slides' clips do
(results.sh): forward, 2 s on the last view, back, 0.5 s on the first view, a
6.27 s loop. One file holds the five tiles, so they stay in step: 300 px squares
(200 stage pixels at 1.5x) at the offsets of TILE_LEFT, the gaps black, as the
layout RelatedWork places its windows.

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
HOLI_LAMP = FIGURES / 'holi_1_to_3_trajectories/captured_lamp_holi123.mp4'
GEN3C_LAMP = FIGURES / '6_QualExperimental/scenes/paperscene5/rgb_only/video.mp4'
LYRA2_ROOM = FIGURES / '5_QualSimulation/assets/test100_paper_8020_cfg3/lyra2/videos/test_zone_full_zone_full_3000023_obs_000_traj_ccw.mp4'
SOURCES = Path('assets/sources/related-work/nlos-volumes')
FAST_RSD = 'g2/c_room/living_room/runs/fast_rsd_plain/volume/world_volume_display.npy'
OUT = Path('public/slides/related-work')

TILE = 300
# Left edges of the tiles in the file: three of non-line-of-sight imaging, two of
# generative view synthesis; 30 px between tiles of a group (20 stage pixels), 102
# between the groups (two paddings of 20 and a gap of 28).
TILE_LEFT = [0, 330, 660, 1062, 1392]
FRAMES, FPS = 29, 15
TURN_DEGREES = 22.5
ROOM_PITCH_DEGREES = 25
PERCENTILE = 99.5
# The first of the 29 consecutive frames of the bicycle clip, and the square around the bicycle.
BIKE_FIRST_FRAME, BIKE_CROP = 18, '216:216:21:18'
ENCODING = ['-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart', '-map_metadata', '-1']
# results.sh's loop: forward, the last frame for 2 s, back, the first frame for 0.5 s.
LOOP = ('split=4[a][b][c][d];'
        '[b]trim=start_frame=28:end_frame=29,loop=loop=29:size=1:start=0,setpts=N/15/TB[hold];'
        '[c]reverse,trim=start_frame=1:end_frame=28,setpts=N/15/TB[rev];'
        '[d]trim=start_frame=0:end_frame=1,loop=loop=7:size=1:start=0,setpts=N/15/TB[first];'
        '[a][hold][rev][first]concat=n=4:v=1')


def room_renderer():
    """nlos-comparison.py as a module, set to render one square tile; it owns the projection and the colormap."""
    spec = importlib.util.spec_from_file_location('nlos_comparison', Path(__file__).with_name('nlos-comparison.py'))
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module  # numba's cache finds the functions' module by name
    spec.loader.exec_module(module)
    module.SOURCES = SOURCES
    module.CELL_WIDTH = module.CELL_HEIGHT = TILE
    module.ROCK_DEGREES = TURN_DEGREES  # the yaws the box must fit the tile at
    return module


def render_fast_rsd():
    """
    The fast RSD volume from FRAMES yaws, -TURN_DEGREES to TURN_DEGREES, as uint8
    RGB (FRAMES, TILE, TILE, 3): shown from 0 to the 99.5th percentile of the
    front view (over the pixels whose rays cross the box), held for the clip.
    """
    renderer = room_renderer()
    volume, size = renderer.load_volume(FAST_RSD, 'room')
    pitch = np.radians(ROOM_PITCH_DEGREES)
    inside = renderer.project(np.ones_like(volume), size, 0.0, pitch) > 1.0
    white = np.percentile(renderer.project(volume, size, 0.0, pitch)[inside], PERCENTILE)
    yaws = np.radians(np.linspace(-TURN_DEGREES, TURN_DEGREES, FRAMES))
    return np.stack([renderer.hot(renderer.project(volume, size, yaw, pitch) / white) for yaw in yaws])


def main():
    for source in (FK_BIKE, HOLI_LAMP, GEN3C_LAMP, LYRA2_ROOM, SOURCES / FAST_RSD):
        if not source.exists():
            sys.exit(f'missing source: {source}')
    OUT.mkdir(parents=True, exist_ok=True)
    video = OUT / 'methods.mp4'
    with tempfile.TemporaryDirectory() as scratch:
        fast_rsd = Path(scratch) / 'fast-rsd.rgb'
        fast_rsd.write_bytes(render_fast_rsd().tobytes())
        square = f'fps={FPS},scale={TILE}:{TILE}:flags=lanczos,setsar=1'
        tiles = [
            f'[0:v]trim=start_frame={BIKE_FIRST_FRAME}:end_frame={BIKE_FIRST_FRAME + FRAMES},setpts=N/{FPS}/TB,crop={BIKE_CROP},{square}[t0]',
            f'[1:v]setsar=1[t1]',
            f'[2:v]{square}[t2]',
            f'[3:v]{square}[t3]',
            f'[4:v]{square}[t4]',
        ]
        layout = '|'.join(f'{left}_0' for left in TILE_LEFT)
        graph = ';'.join(tiles) + f';[t0][t1][t2][t3][t4]xstack=inputs=5:layout={layout}:fill=black,pad=ceil(iw/2)*2:ceil(ih/2)*2,{LOOP}'
        # The file carries no color tags, as the clips it is made of: a browser reads both as BT.601.
        subprocess.run(
            ['ffmpeg', '-v', 'error', '-y', '-i', str(FK_BIKE),
             '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{TILE}x{TILE}', '-r', str(FPS), '-i', str(fast_rsd),
             '-i', str(HOLI_LAMP), '-i', str(GEN3C_LAMP), '-i', str(LYRA2_ROOM),
             '-filter_complex', graph, '-r', str(FPS), *ENCODING, str(video)],
            check=True)
    # The poster is the video's first frame, shown until the video has one.
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(video), '-frames:v', '1', '-q:v', '2', '-map_metadata', '-1',
                    str(video.with_suffix('.poster.jpg'))], check=True)
    probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height,nb_frames,duration',
                            '-of', 'csv=p=0', str(video)], capture_output=True, text=True, check=True)
    print(f'{video}: {probe.stdout.strip()}')


if __name__ == '__main__':
    main()
