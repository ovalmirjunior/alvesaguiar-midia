# Contact sheets for a Reel: one frame per second (0, 1, 2, ... s) in sheets of 6x2 tiles, plus full-size
# frames at 0 s, 2 s and the last frame. Optional safe-zone overlay (style-bank.md pattern 6) on extra copies.
# usage: python3 -I sheet.py <video.mp4> <outdir> <label> [--zones] [--lines]
# --lines draws the safe-zone limits as red lines on the plain sheets (y 260, y 1700, x 886 for y 940 to 1700).
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
FF = '/opt/homebrew/bin/ffmpeg'; FP = '/opt/homebrew/bin/ffprobe'
vid, out, label = sys.argv[1:4]; zones = '--zones' in sys.argv; lines = '--lines' in sys.argv
os.makedirs(out, exist_ok=True)
pr = json.loads(subprocess.run([FP, '-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries',
                                'stream=nb_read_frames,r_frame_rate:format=duration', '-of', 'json', vid],
                               capture_output=True, check=True).stdout)
nf = int(pr['streams'][0]['nb_read_frames']); num, den = map(int, pr['streams'][0]['r_frame_rate'].split('/')); fps = num / den
dur = float(pr['format']['duration'])
def grab(idx):
    p = os.path.join(out, f'f{idx:05d}.png')
    if not os.path.exists(p):
        subprocess.run([FF, '-v', 'error', '-i', vid, '-vf', f'select=eq(n\\,{idx})', '-frames:v', '1', '-y', p], check=True)
    return p
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 30)
def guide(im):
    d = ImageDraw.Draw(im); W, H = im.size; s = W / 1080; c = (230, 30, 30); w = max(2, round(3 * s * 3))
    d.line([0, 260 * s, W, 260 * s], fill=c, width=w); d.line([0, 1700 * s, W, 1700 * s], fill=c, width=w)
    d.line([886 * s, 940 * s, 886 * s, 1700 * s], fill=c, width=w); d.line([886 * s, 940 * s, W, 940 * s], fill=c, width=w)
    return im
def mask(im):
    im = im.convert('RGBA'); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    W, H = im.size; s = W / 1080
    d.rectangle([0, 0, W, 260 * s], fill=(255, 0, 0, 70)); d.rectangle([0, 1700 * s, W, H], fill=(255, 0, 0, 70))
    d.rectangle([886 * s, 940 * s, W, 1700 * s], fill=(255, 0, 0, 70))
    return Image.alpha_composite(im, ov).convert('RGB')
secs = list(range(0, int(dur) + 1)); secs = [k for k in secs if round(k * fps) < nf]
idx = [round(k * fps) for k in secs]
TW, TH, LH, COLS, ROWS = 340, 604, 44, 6, 2
made = []
for v in ([False, True] if zones else [False]):
    for sh in range(0, len(idx), COLS * ROWS):
        part = list(zip(secs, idx))[sh: sh + COLS * ROWS]
        im = Image.new('RGB', (COLS * TW, ROWS * (TH + LH)), (255, 255, 255)); d = ImageDraw.Draw(im)
        for k, (sec, i) in enumerate(part):
            fr = Image.open(grab(i)).convert('RGB').resize((TW, TH), Image.LANCZOS)
            if v: fr = mask(fr)
            elif lines: fr = guide(fr)
            x, y = (k % COLS) * TW, (k // COLS) * (TH + LH); im.paste(fr, (x, y))
            d.text((x + 8, y + TH + 6), f'{label} {sec:d}.0 s', fill=(0, 0, 0), font=font)
        p = os.path.join(out, f'{label}-sheet{"-zones" if v else ""}-{sh // (COLS * ROWS) + 1}.jpg'); im.save(p, quality=88); made.append(p)
full = [(0, 0), (2, round(2 * fps)), (round((nf - 1) / fps, 3), nf - 1)]
for sec, i in full:
    fr = Image.open(grab(i)).convert('RGB')
    p = os.path.join(out, f'{label}-full-{sec}s.jpg'); fr.save(p, quality=92); made.append(p)
    if zones:
        p = os.path.join(out, f'{label}-full-zones-{sec}s.jpg'); mask(fr).save(p, quality=92); made.append(p)
print(json.dumps({'video': vid, 'frames': nf, 'fps': fps, 'duration': dur, 'seconds_sampled': secs, 'files': made}))
