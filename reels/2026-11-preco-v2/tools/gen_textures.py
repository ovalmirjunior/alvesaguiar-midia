# Texture generator for reelPR v2 (desk scene). Every map is computed here; nothing is downloaded.
# usage: python3 -I gen_textures.py            (writes ../labrig/textures/)
# Maps (all tileable except mat_wear.png):
#   mat_albedo.jpg   2048x2048  leather grain detail, near white; the page multiplies it by the mat colour (Noite family)
#   mat_normal.png   2048x2048  tangent-space normal map (OpenGL convention, green up) of the pebble grain
#   mat_rough.png    2048x2048  roughness (grey; three.js reads the green channel): plateaus smoother, creases rougher
#   paper_albedo.jpg 1024x1024  paper fibre detail, near white; the page multiplies it into each printed canvas
#   paper_normal.png 1024x1024  paper fibre and cockle normal map
#   mat_wear.png     1440x2560  RGBA overlay laid once over the whole mat: dust specks, a few fibres, faint scuffs
# Deterministic: fixed seeds. Needs numpy, scipy, PIL.
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'labrig', 'textures')
os.makedirs(OUT, exist_ok=True)


def band_noise(n, fc, width=0.5, seed=0):
    """Periodic noise with energy around fc cycles per tile (log-normal band), zero mean, unit std."""
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


def voronoi(n, cells, jitter, warp, seed):
    """Periodic Voronoi over an n x n tile: returns F1 and F2 - F1 in cell units."""
    r = np.random.default_rng(seed)
    gy, gx = np.mgrid[0:cells, 0:cells]
    pts = np.stack([(gx + 0.5 + r.uniform(-jitter, jitter, gx.shape)) / cells,
                    (gy + 0.5 + r.uniform(-jitter, jitter, gy.shape)) / cells], -1).reshape(-1, 2) % 1.0
    tree = cKDTree(pts, boxsize=1.0)
    y, x = np.mgrid[0:n, 0:n]
    u = (x + 0.5) / n
    v = (y + 0.5) / n
    if warp:
        u = u + warp / cells * band_noise(n, 7, 0.45, seed + 11)
        v = v + warp / cells * band_noise(n, 7, 0.45, seed + 12)
    q = np.stack([u % 1.0, v % 1.0], -1).reshape(-1, 2)
    d, _ = tree.query(q, k=2, workers=-1)
    d = d.reshape(n, n, 2) * cells
    return d[..., 0], d[..., 1] - d[..., 0]


def normal_map(h, strength):
    """Height (rows down) to an OpenGL tangent-space normal map image (uint8 RGB)."""
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


def leather(n=2048):
    f1, e = voronoi(n, 150, 0.42, 0.30, 101)         # pebble cells, about 0.8 mm on the mat
    plate = smooth(e, 0.02, 0.5)                      # 0 in the creases, 1 on the cell plateaus
    dome = np.clip(1 - (f1 / 0.8) ** 2, 0, 1)
    _, e2 = voronoi(n, 13, 0.5, 0.9, 202)             # broad, shallow wrinkles
    wr = smooth(e2, 0.0, 0.10)
    h = plate * (0.72 + 0.28 * dome) * (0.86 + 0.14 * wr)
    h = h + 0.05 * band_noise(n, 420, 0.35, 7) + 0.10 * band_noise(n, 4, 0.5, 8)
    h = gaussian_filter(h, 1.0, mode='wrap')
    save('mat_normal.png', normal_map(h, 2.2), optimize=True)
    rough = 0.50 + 0.30 * (1 - plate) + 0.10 * (1 - wr) + 0.035 * band_noise(n, 60, 0.6, 9)
    rough = gaussian_filter(rough, 0.7, mode='wrap')
    save('mat_rough.png', (np.clip(rough, 0, 1) * 255 + 0.5).astype(np.uint8), optimize=True)
    a = 0.58 + 0.36 * plate ** 0.8 * (0.9 + 0.1 * wr) + 0.03 * band_noise(n, 30, 0.7, 10) + 0.02 * band_noise(n, 3, 0.5, 13)
    a = np.clip(gaussian_filter(a, 0.6, mode='wrap'), 0, 1)
    rgb = np.stack([a * 0.985, a * 0.995, a], -1)       # a touch cool, as the Noite colour
    save('mat_albedo.jpg', (rgb * 255 + 0.5).astype(np.uint8), quality=94, subsampling=0)


def fibres(n, count, seed, lo=6, hi=38, width=1):
    """Random short curved fibres on a periodic tile, as a float image 0..1."""
    r = np.random.default_rng(seed)
    S = 2
    im = Image.new('L', (n * S, n * S), 0)
    d = ImageDraw.Draw(im)
    for _ in range(count):
        x, y = r.uniform(0, n * S, 2)
        a = r.uniform(0, 2 * np.pi)
        L = r.uniform(lo, hi) * S
        k = r.normal(0, 0.02)
        pts = []
        for s in np.linspace(0, L, 8):
            pts.append((x + np.cos(a + k * s) * s, y + np.sin(a + k * s) * s))
        c = int(r.uniform(90, 255))
        for ox in (-n * S, 0, n * S):
            for oy in (-n * S, 0, n * S):
                d.line([(px + ox, py + oy) for px, py in pts], fill=c, width=width * S)
    im = im.resize((n, n), Image.LANCZOS)
    return np.asarray(im, np.float64) / 255


def paper(n=1024):
    fb = fibres(n, 9000, 301)
    fb = gaussian_filter(fb, 0.8, mode='wrap')
    h = 0.55 * fb + 0.35 * band_noise(n, 180, 0.5, 21) * 0.5 + 0.9 * band_noise(n, 9, 0.5, 22) * 0.5
    h = gaussian_filter(h, 0.6, mode='wrap')
    save('paper_normal.png', normal_map(h, 1.6), optimize=True)
    dark = fibres(n, 1400, 302, 4, 22)                 # a few darker fibres and specks
    dark = gaussian_filter(dark, 0.6, mode='wrap')
    a = 0.972 - 0.05 * dark + 0.012 * band_noise(n, 90, 0.6, 23) + 0.010 * band_noise(n, 5, 0.5, 24) + 0.018 * (fb - fb.mean())
    a = np.clip(a, 0, 1)
    rgb = np.stack([a, a * 0.997, a * 0.99], -1)
    save('paper_albedo.jpg', (rgb * 255 + 0.5).astype(np.uint8), quality=94, subsampling=0)


def wear(w=1440, h=2560):
    r = np.random.default_rng(404)
    S = 3
    im = Image.new('L', (w * S, h * S), 0)
    d = ImageDraw.Draw(im)
    for _ in range(950):                                # dust specks
        x, y = r.uniform(0, w * S), r.uniform(0, h * S)
        rad = r.uniform(0.5, 1.9) * S * (2.2 if r.random() < 0.05 else 1)
        d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=int(r.uniform(60, 190)))
    for _ in range(46):                                 # lint fibres
        x, y = r.uniform(0, w * S), r.uniform(0, h * S)
        a = r.uniform(0, 2 * np.pi)
        k = r.normal(0, 0.012)
        L = r.uniform(18, 70) * S
        pts = []
        for s in np.linspace(0, L, 14):
            pts.append((x + np.cos(a + k * s) * s, y + np.sin(a + k * s) * s))
            a += r.normal(0, 0.05)
        d.line(pts, fill=int(r.uniform(50, 130)), width=S)
    spec = np.asarray(im.resize((w, h), Image.LANCZOS), np.float64) / 255
    sc = Image.new('L', (w, h), 0)                      # faint scuffs: long, soft, almost parallel strokes
    d = ImageDraw.Draw(sc)
    for _ in range(26):
        x, y = r.uniform(0, w), r.uniform(0, h)
        a = r.normal(0.5, 0.35)
        L = r.uniform(120, 420)
        d.line([(x, y), (x + np.cos(a) * L, y + np.sin(a) * L)], fill=int(r.uniform(40, 110)), width=int(r.uniform(2, 7)))
    scuff = np.asarray(sc.filter(ImageFilter.GaussianBlur(5)), np.float64) / 255
    alpha = np.clip(spec * 0.62 + scuff * 0.10, 0, 1)
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., 0] = 196
    rgba[..., 1] = 200
    rgba[..., 2] = 210
    rgba[..., 3] = (alpha * 255 + 0.5).astype(np.uint8)
    save('mat_wear.png', rgba, optimize=True)


if __name__ == '__main__':
    leather()
    paper()
    wear()
