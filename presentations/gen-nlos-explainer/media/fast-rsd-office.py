"""The office scene of Liu et al. 2020, reconstructed with their fast RSD method, for the slide related-work.

A line-by-line port of the authors' released MATLAB script
main_focusing_disjoint_largeFOV.m (dataset id 6, "officescene", the
Fourier-domain histogram of the 390-minute capture): the same virtual
aperture padding, 2x spatial downsampling, depth range, two-piece spatial
sectioning, and RSD convolution kernel. MATLAB's column-major, 1-based
indexing is kept in the comments where it matters.

The code and data are the paper's "Source Data - Code and Sample Dataset"
(Nature Communications 11, 1645, 2020; supplementary file MOESM3, GPL code),
unzipped under SOURCE:
  curl -L -o download/fast-rsd-code-data.zip \\
    'https://static-content.springer.com/esm/art%3A10.1038%2Fs41467-020-15157-4/MediaObjects/41467_2020_15157_MOESM3_ESM.zip'
  unzip download/fast-rsd-code-data.zip

Writes VOLUME: the magnitude volume [x, y, z] (150 x 150 x 101: x and y across
the 3 m virtual aperture, z the depth from 0.5 to 2.5 m in 2 cm steps), and
a front MIP preview beside it.

Run from the presentation directory:  python media/fast-rsd-office.py
Needs numpy, h5py, and imageio.
"""
from pathlib import Path

import h5py
import numpy as np

SOURCE = Path('assets/sources/related-work/papers/liu2020-fast-rsd')
INPUT = SOURCE / 'nlos_rsd_fast/input/officescene_3.mat'
VOLUME = SOURCE / 'volumes/officescene.npy'

C_LIGHT = 299792458.0
# The script's parameters for id 6.
V_APT_SZ = 3.0      # virtual aperture size, meters
DEPTH_MIN, DEPTH_MAX = 0.5, 2.5
D_LEVEL = 2         # pieces of the spatial sectioning
D_WCYCLE = 7        # cycles of the illumination pulse
D_OFFSET = 0.1      # electrical delay, meters


def load():
    """The .mat (v7.3) variables in MATLAB's axis order (h5py reads them reversed)."""
    with h5py.File(INPUT) as f:
        raw = f['u_total'][()]
        u_total = (raw['real'] + 1j * raw['imag']).transpose(2, 1, 0)  # [x, y, frequency]
        flat = lambda name: np.asarray(f[name][()]).ravel()
        return (u_total, flat('aperturefullsize'), flat('SPAD_index'),
                flat('lambda_loop'), flat('omega_space'), flat('weight'))


def symmetric(u, apt):
    """tool_symmetry: pad the shorter side with zeros, both ends, to a square."""
    m, n = u.shape[:2]
    delta = apt[0] / (m - 1)
    if m < n:
        pad = int(np.ceil(0.5 * (n - m)))
        u = np.pad(u, [(pad, pad), (0, 0)] + [(0, 0)] * (u.ndim - 2))
    elif m > n:
        pad = int(np.ceil(0.5 * (m - n)))
        u = np.pad(u, [(0, 0), (pad, pad)] + [(0, 0)] * (u.ndim - 2))
    return u, delta * np.array(u.shape[:2], float)


def virtual_aperture(u, apt, max_size, spad):
    """Create_VirtualAperture, on the whole cube at once: square it, then zero-pad it to max_size meters."""
    m, n = u.shape[:2]
    delta = apt[0] / (m - 1)
    m_prime = round(max_size / delta)
    u, _ = symmetric(u, apt)
    spad = spad + (np.array(u.shape[:2]) - [m, n]) / 2
    dm = 2 * int(np.ceil((m_prime - u.shape[0]) / 2))
    if dm > 0:
        u = np.pad(u, [(dm // 2, dm // 2), (dm // 2, dm // 2)] + [(0, 0)] * (u.ndim - 2))
        spad = spad + dm / 2
    return u, delta * np.array(u.shape[:2], float), spad


def sectioning(spad, shape, dmin, res, pulse, offset, levels):
    """Create_DisDiffCube: per voxel, which offset level its plane-wave approximation error falls in."""
    nx, ny, nz = shape
    i = np.arange(1, nx + 1)[:, None, None]  # MATLAB's 1-based voxel indices
    j = np.arange(1, ny + 1)[None, :, None]
    k = np.arange(1, nz + 1)[None, None, :]
    d_r = res * np.hypot(i - spad[0], j - spad[1])
    d_v = dmin + res * (k - 1)
    error = np.sqrt(d_r ** 2 + d_v ** 2) - d_v
    offsets = offset + pulse * np.arange(levels)
    masks = [(error > level * pulse) & (error <= (level + 1) * pulse) for level in range(levels)]
    return offsets, masks


def rsd_kernel_fft(m, length, wavelength, z):
    """fft2 of propRSD_conv's kernel h for an m x m field of side `length` meters."""
    dx = length / (m - 1)
    z_hat = z / dx
    mul_square = wavelength * z_hat / (m * dx)
    grid = np.arange(m) - m / 2
    g_m, g_n = np.meshgrid(grid, grid)  # meshgrid(n, m): g_m varies along columns
    r = np.sqrt(1 + (g_m ** 2 + g_n ** 2) / z_hat ** 2)
    h = np.exp(1j * 2 * np.pi * (z_hat ** 2 * r) / (mul_square * m)) / r
    return np.fft.fft2(h)


def reconstruct():
    u_total, apt, spad, lambdas, omegas, weights = load()
    sample_spacing = apt[0] / (u_total.shape[0] - 1)
    if u_total.shape[0] % 2 == 1:
        sys.exit('odd aperture: the script pads it first, not ported')
    u_total, apt, spad = virtual_aperture(u_total, apt, V_APT_SZ, spad)
    size = 2 * round(round(V_APT_SZ / sample_spacing) / 2)
    assert u_total.shape[:2] == (size, size), u_total.shape
    # Spatial downsampling by bounded resolution: the aperture size keeps its value.
    u_total = u_total[0::2, 0::2] + u_total[1::2, 1::2]
    spad = spad / 2
    depths = np.arange(DEPTH_MIN, DEPTH_MAX + 1e-9, 2 * sample_spacing)
    m = u_total.shape[0]
    shape = (m, m, len(depths))
    central_lambda = lambdas[int(np.ceil(len(lambdas) / 2)) - 1]
    offsets, masks = sectioning(spad, shape, DEPTH_MIN, 2 * sample_spacing, D_WCYCLE * central_lambda, D_OFFSET, D_LEVEL)

    spectra = np.fft.fft2(u_total, axes=(0, 1))  # the phase factor is a scalar per frequency, so fft2 once
    volume = np.zeros(shape, complex)
    for offset, mask in zip(offsets, masks):
        mask = mask[:, ::-1]  # fliplr
        for index, depth in enumerate(depths):
            total = np.zeros((m, m), complex)
            for f in range(len(lambdas)):
                phase = np.exp(1j * omegas[f] * (depth + offset) / C_LIGHT)
                total += weights[f] * phase * spectra[:, :, f] * rsd_kernel_fft(m, apt[0], lambdas[f], depth)
            # Camera_Focusing flips each frequency's field; ifftshift and fliplr are linear, so once for the sum.
            volume[:, :, index] += np.fliplr(np.fft.ifftshift(np.fft.ifft2(total))) * mask[:, :, index]
        print(f'level {offset:.3f} m done')
    return np.abs(volume).astype(np.float32)


def main():
    volume = reconstruct()
    VOLUME.parent.mkdir(parents=True, exist_ok=True)
    np.save(VOLUME, volume)
    import imageio.v3 as iio
    mip = volume.max(axis=2)
    mip = np.clip(mip / np.percentile(mip, 99.9), 0, 1)
    iio.imwrite(VOLUME.with_suffix('.mip.png'), (mip * 255).astype(np.uint8))
    print(f'{VOLUME}: {volume.shape}')


if __name__ == '__main__':
    import sys
    main()
