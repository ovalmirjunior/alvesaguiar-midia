# Kit texture generator (draft by Fable for reels/kit/tools/gen_textures_kit.py). Every map is computed here; nothing is downloaded.
# usage: python3 -I gen_textures_kit.py <out dir>
# Maps (all tileable):
#   wood_albedo.jpg  2048x2048  dark walnut desk top, grain along the image x axis, 4 planks per tile (one tile = 8 x 8 world units)
#   wood_normal.png  1024x1024  tangent-space normal map (OpenGL convention) of the grain and the plank grooves
#   wood_rough.png   1024x1024  roughness (grey): latewood and grooves rougher
#   alu_normal.png    256x256   fine bead-blast grain for the laptop aluminium
# Deterministic: fixed seeds. Needs numpy, scipy, PIL (the same as gen_textures.py).
import os, sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, zoom

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)


def aniso_noise(n, fu, fv, seed, wv=0.45):
    """Periodic noise: low-pass along x (cut-off fu cycles per tile), band-pass along y (around fv cycles per tile). Zero mean, unit std."""
    r = np.random.default_rng(seed)
    F = np.fft.fft2(r.normal(size=(n, n)))
    fy = np.abs(np.fft.fftfreq(n)[:, None] * n)
    fx = np.abs(np.fft.fftfreq(n)[None, :] * n)
    g = np.exp(-0.5 * (fx / fu) ** 2) * np.exp(-0.5 * ((np.log(fy + 1e-9) - np.log(fv)) / wv) ** 2)
    g[0, 0] = 0
    x = np.real(np.fft.ifft2(F * g))
    return x / x.std()


def iso_noise(n, fc, width, seed):
    r = np.random.default_rng(seed)
    F = np.fft.fft2(r.normal(size=(n, n)))
    fy = np.fft.fftfreq(n)[:, None] * n
    fx = np.fft.fftfreq(n)[None, :] * n
    f = np.hypot(fx, fy)
    f[0, 0] = 1e-9
    g = np.exp(-0.5 * ((np.log(f) - np.log(fc)) / width) ** 2)
    g[0, 0] = 0
    x = np.real(np.fft.ifft2(F * g))
    return x / x.std()


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def normal_map(h, strength):
    dc = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5 * strength
    dr = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5 * strength
    nx, ny, nz = -dc, dr, np.ones_like(h)
    l = np.sqrt(nx * nx + ny * ny + nz * nz)
    rgb = np.stack([nx / l, ny / l, nz / l], -1) * 0.5 + 0.5
    return (np.clip(rgb, 0, 1) * 255 + 0.5).astype(np.uint8)


def save(name, arr, **kw):
    p = os.path.join(OUT, name)
    Image.fromarray(arr).save(p, **kw)
    print(name, arr.shape, os.path.getsize(p), 'bytes')


def wood(n=2048, planks=4):
    r = np.random.default_rng(601)
    v = (np.arange(n)[:, None] + 0.5) / n
    figure = aniso_noise(n, 1.1, 3, 611, 0.6)            # broad figure that bends the rings
    fine = aniso_noise(n, 14, 150, 612, 0.4)             # fine grain lines
    pores = aniso_noise(n, 60, 420, 613, 0.3)            # short pore dashes
    ring = 0.5 + 0.5 * np.sin(2 * np.pi * (v * 34 + 0.55 * figure))
    late = smooth(ring, 0.5, 0.95)                        # 1 on the dark latewood bands
    a = 0.60 - 0.30 * late + 0.085 * fine - 0.05 * smooth(pores, 1.2, 2.4)
    ph = n // planks
    groove = np.zeros((n, 1))
    for p in range(planks):                               # each plank: its own shift along the grain and its own tone
        sl = slice(p * ph, (p + 1) * ph)
        a[sl] = np.roll(a[sl], int(r.integers(0, n)), axis=1) * (1 + r.uniform(-0.07, 0.07))
        late[sl] = np.roll(late[sl], 0, axis=1)
        groove[p * ph: p * ph + 3] = 1
        groove[(p + 1) * ph - 3: (p + 1) * ph] = 1
    groove = gaussian_filter(np.repeat(groove, n, 1), (1.4, 0), mode='wrap')
    a = np.clip(a, 0, 1) * (1 - 0.6 * groove)
    dark = np.array([0x1C, 0x11, 0x0A]) / 255.0           # darkest grain
    light = np.array([0x5A, 0x3A, 0x22]) / 255.0          # lightest grain
    rgb = dark[None, None, :] + (light - dark)[None, None, :] * np.clip(a, 0, 1)[..., None]
    save('wood_albedo.jpg', (rgb * 255 + 0.5).astype(np.uint8), quality=90, subsampling=2)
    h = 0.45 * a - 0.9 * groove
    h2 = zoom(gaussian_filter(h, 1.0, mode='wrap'), 0.5, order=1, mode='grid-wrap')
    save('wood_normal.png', normal_map(h2, 3.0), optimize=True)
    rough = 0.50 + 0.16 * (1 - a) + 0.25 * groove
    r2 = zoom(gaussian_filter(rough, 1.0, mode='wrap'), 0.5, order=1, mode='grid-wrap')
    save('wood_rough.png', (np.clip(r2, 0, 1) * 255 + 0.5).astype(np.uint8), optimize=True)


def alu(n=256):
    h = gaussian_filter(iso_noise(n, 75, 0.35, 701), 0.6, mode='wrap')
    save('alu_normal.png', normal_map(h, 0.9), optimize=True)


if __name__ == '__main__':
    wood()
    alu()
