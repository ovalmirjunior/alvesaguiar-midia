# One-frame-per-second sheet from a frames folder (%05d.jpg at 24 fps), with safe-zone lines, at most 2400 px wide.
# usage: python3 -I framesheet.py <frames dir> <out.jpg> <label> [cols]
import os, sys
from PIL import Image, ImageDraw, ImageFont
d, out, label = sys.argv[1:4]; cols = int(sys.argv[4]) if len(sys.argv) > 4 else 9
fs = sorted(f for f in os.listdir(d) if f.endswith('.jpg')); idx = list(range(0, len(fs), 24))
W = 2400 // cols; H = int(W * 1920 / 1080); rows = (len(idx) + cols - 1) // cols
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 22)
sheet = Image.new('RGB', (W * cols, (H + 28) * rows), 'white'); dr = ImageDraw.Draw(sheet)
for k, i in enumerate(idx):
    im = Image.open(os.path.join(d, fs[i])).convert('RGB').resize((W, H), Image.LANCZOS); g = ImageDraw.Draw(im); s = W / 1080; c = (230, 30, 30)
    g.line([0, 260 * s, W, 260 * s], fill=c, width=2); g.line([0, 1700 * s, W, 1700 * s], fill=c, width=2); g.line([886 * s, 940 * s, 886 * s, 1700 * s], fill=c, width=2)
    x = (k % cols) * W; y = (k // cols) * (H + 28); sheet.paste(im, (x, y)); dr.text((x + 4, y + H + 2), f'{label} {i // 24} s', fill='black', font=font)
sheet.save(out, quality=85); print(sheet.size, len(idx))
