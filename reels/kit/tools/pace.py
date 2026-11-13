# Per-clip pace for reelPR v2 (OP 2026-11-12: every clip at least 2.9 words per second, p0 included; intent: atempo at most 1.15).
# For each clip: decode to 48 kHz mono; trim the ends as src/mesa_cues.py load() does (onset - 240 samples, offset + 2400 samples);
# find the smallest atempo f (step 0.0025, at most 1.15) with words / output duration >= TARGET;
# if f = 1.15 is not enough, shorten the longest internal pause (quiet run, same envelope and threshold as mesa_cues.py),
# in 0.01 s steps down to a floor of FLOOR s, cutting the middle of the quiet run with a 10 ms crossfade, until the target holds.
# A clip that meets the target with no change is left as the mp3 (mesa_cues.py then reads the mp3).
# Writes <tts_dir>/<id>-<voice>-<model>.wav for each changed clip and prints one JSON line per clip.
# usage: python3 -I pace.py <beats.json> <tts_dir> <voice> <model> <work_dir>
import json, os, subprocess, sys
import numpy as np, soundfile as sf
beats, d, voice, model, work = sys.argv[1:6]
SR = 48000; TARGET = float(os.environ.get('PACE_TARGET', '2.92')); FMAX = 1.15; FLOOR = float(os.environ.get('PACE_FLOOR', '0.08')); FF = '/opt/homebrew/bin/ffmpeg'
os.makedirs(work, exist_ok=True); SRC_EXT = os.environ.get('PACE_SRC_EXT', 'mp3'); OUT_DIR = os.environ.get('PACE_OUT', d)  # round 2: source ext and output folder

def dec(f):
    return np.frombuffer(subprocess.run([FF, '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                                        capture_output=True, check=True).stdout, np.float32).astype(np.float64)

def env(y):
    return np.convolve(np.abs(y), np.ones(480) / 480, 'same')

def trim(y):
    on = np.where(env(y) > 0.008)[0]
    return y[max(0, on[0] - 240): on[-1] + 2400]

def runs(y):
    e = env(y); q = e < 0.008; on = np.where(~q)[0]; out = []; i = on[0]
    while i < on[-1]:
        if q[i]:
            j = i
            while j < on[-1] and q[j]: j += 1
            if (j - i) / SR >= 0.06: out.append((i, j))
            i = j
        else: i += 1
    return out

def shorten(y, a, b, keep):
    n = b - a; k = int(keep * SR)
    if n <= k: return y
    cut0 = a + k // 2; cut1 = b - (k - k // 2); x = 480
    fade = np.linspace(1, 0, x)
    mid = y[cut0 - x:cut0] * fade + y[cut1:cut1 + x] * (1 - fade)
    return np.concatenate([y[:cut0 - x], mid, y[cut1 + x:]])

def tempo(y, f, tag):
    src = os.path.join(work, f'{tag}-src.wav'); dst = os.path.join(work, f'{tag}-f{f:.4f}.wav')
    sf.write(src, y, SR, subtype='PCM_16')
    subprocess.run([FF, '-v', 'error', '-y', '-i', src, '-af', f'atempo={f:.4f}', '-ar', str(SR), '-ac', '1', dst], check=True)
    return dst, len(dec(dst)) / SR

ONLY = os.environ.get('ONLY', '').split(',') if os.environ.get('ONLY') else None
for s in json.load(open(beats))['segments']:
    if ONLY and s['id'] not in ONLY: continue
    sid = s['id']; n = len(s['text'].split()); f0 = os.path.join(d, f'{sid}-{voice}-{model}.{SRC_EXT}')
    raw = dec(f0); y = trim(raw); wps_raw = n / (len(raw) / SR)
    if wps_raw >= TARGET:
        print(json.dumps(dict(id=sid, words=n, file_s=round(len(raw) / SR, 3), wps_file=round(wps_raw, 3), action='none')), flush=True); continue
    pause_log = []; f = 1.0; found = None
    while True:
        f = 1.0
        while f <= FMAX + 1e-9:
            if n / (len(y) / SR / f) >= TARGET: break
            f = round(f + 0.0025, 4)
        f = min(f, FMAX)
        while f <= FMAX + 1e-9:  # atempo pads its output a little, so test the real file at each step up to FMAX
            dst, dur = tempo(y, f, sid)
            if n / dur >= TARGET: found = (f, dst, dur); break
            f = round(f + 0.0025, 4)
        if found: break
        rr = sorted(runs(y), key=lambda r: r[0] - r[1])
        if not rr or (rr[0][1] - rr[0][0]) / SR <= FLOOR + 1e-9:
            break
        a, b = rr[0]; keep = max(FLOOR, (b - a) / SR - 0.01)
        pause_log.append([round(a / SR, 3), round((b - a) / SR, 3), round(keep, 3)]); y = shorten(y, a, b, keep)
    if found is None:
        print(json.dumps(dict(id=sid, words=n, action='FAIL', note='target not reachable at atempo 1.15 and pause floor')), flush=True); continue
    f, dst, dur = found; out = os.path.join(OUT_DIR, f'{sid}-{voice}-{model}.wav')
    subprocess.run(['/bin/cp', dst, out], check=True)
    first_last = {}
    if pause_log: first_last = dict(pause_before_s=pause_log[0][1], pause_after_s=pause_log[-1][2], pause_at_s=pause_log[0][0])
    print(json.dumps(dict(id=sid, words=n, file_s=round(len(raw) / SR, 3), wps_file=round(wps_raw, 3), trimmed_s=round(len(y) / SR, 3),
                          atempo=f, out=out, out_s=round(dur, 3), wps_out=round(n / dur, 3), **first_last)), flush=True)
