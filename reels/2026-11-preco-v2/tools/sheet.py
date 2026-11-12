# Preview sheet for reelPR v2 from frames written by tools/scene.js (t<sec>.jpg): one frame per second, the time under each,
# safe-zone guide lines (style-bank.md pattern 6: y 260, y 1700, x 886 for y 940 and lower), at most 2400 px on the long side.
# usage: python3 -I sheet.py <frames_dir> <out.jpg> [label]
import glob, os, sys
from PIL import Image, ImageDraw, ImageFont
d, out = sys.argv[1:3]; label = sys.argv[3] if len(sys.argv) > 3 else ''
fs = sorted(glob.glob(os.path.join(d, 't*.jpg')))
COLS = 10; TW = 240; TH = round(TW * 1920 / 1080); LH = 28; rows = -(-len(fs) // COLS)
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 20)
im = Image.new('RGB', (COLS * TW, rows * (TH + LH)), (255, 255, 255)); dr = ImageDraw.Draw(im)
s = TW / 1080; c = (235, 40, 40)
for k, f in enumerate(fs):
    t = float(os.path.basename(f)[1:-4]); fr = Image.open(f).convert('RGB').resize((TW, TH), Image.LANCZOS); g = ImageDraw.Draw(fr)
    g.line([0, 260 * s, TW, 260 * s], fill=c, width=1); g.line([0, 1700 * s, TW, 1700 * s], fill=c, width=1)
    g.line([886 * s, 940 * s, 886 * s, 1700 * s], fill=c, width=1); g.line([886 * s, 940 * s, TW, 940 * s], fill=c, width=1)
    x, y = (k % COLS) * TW, (k // COLS) * (TH + LH); im.paste(fr, (x, y)); dr.rectangle([x, y, x + TW - 1, y + TH - 1], outline=(255, 255, 255))
    dr.text((x + 6, y + TH + 3), f'{label} {t:g} s'.strip(), fill=(0, 0, 0), font=font)
assert max(im.size) <= 2400, im.size
im.save(out, quality=88); print(out, im.size, len(fs), 'frames')
