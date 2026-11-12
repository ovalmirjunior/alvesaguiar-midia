# Cues for the "preço" desk Reel (reelPR). Orchestrator tool; the beat plan comes from src/beats.json (Fable child).
# Estimate mode (no audio):  python3 mesa_cues.py
# Audio mode:                python3 mesa_cues.py <tts_dir> <voice> <model>
#   reads <tts_dir>/<id>-<voice>-<model>.wav (else .mp3) for each segment, trims silence, lays the clips out with the gaps,
#   maps the script words onto each clip by its silent pauses (no Whisper model on the Mac), and writes
#   ../labrig/cues_mesa.json and ../out/narration.wav (48 kHz mono).
# Output keys per segment: every beats.json segment key except "text" and "keys", plus t0, t1, land, name_t, words.
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
B = json.load(open(os.environ.get('BEATS', os.path.join(HERE, 'beats.json'))))
SEGS = B['segments']; LEAD = B.get('lead', 0.25); DEF_GAP = B.get('gap', 0.45); GAP = B.get('gaps', {})
TAIL = B.get('end_pad', 0.9); HOLD = B.get('end_hold', 2.6)
SR = 48000
norm = lambda w: re.sub(r'[^\wÀ-ú]', '', w).lower()

EST_SPEED = float(os.environ.get('EST_SPEED', '1'))   # estimate mode only: >1 simulates a faster read

def est_words(text, t):
    out = []
    for tok in text.split():
        d = max(0.18, len(tok) / 14.5) / EST_SPEED; out.append([t, t + d, tok]); t += d + (0.12 if re.search(r'[.,?!;:]$', tok) else 0.02) / EST_SPEED
    return out, t

def spread(toks, a, b):
    L = [max(1, len(re.findall(r'[aeiouáéíóúâêôãõày]+', norm(t)))) + 0.6 for t in toks]; tot = sum(L); out = []; c = a
    for t, l in zip(toks, L):
        d = (b - a) * l / tot; out.append([c, c + d, t]); c += d
    return out

def phrases(text):
    toks = text.split(); ph = [[]]
    for t in toks:
        ph[-1].append(t)
        if re.search(r'[.,?!;:]$', t): ph.append([])
    return [p for p in ph if p]

def load(f):
    import numpy as np
    y = subprocess.run(['/opt/homebrew/bin/ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                       capture_output=True, check=True).stdout
    y = np.frombuffer(y, np.float32).astype(np.float64)
    env = np.convolve(np.abs(y), np.ones(480) / 480, 'same'); on = np.where(env > 0.008)[0]
    return y[max(0, on[0] - 240): on[-1] + 2400]

def pauses(y, min_s=0.06):
    import numpy as np
    env = np.convolve(np.abs(y), np.ones(480) / 480, 'same'); quiet = env < 0.008
    runs = []; i = 0; n = len(quiet)
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            if i > 0 and j < n and (j - i) / SR >= min_s: runs.append(((i + j) / 2 / SR, (j - i) / SR, i / SR, j / SR))
            i = j
        else: i += 1
    return runs

def clip_words(text, y):
    ph = phrases(text); dur = len(y) / SR
    head = 240 / SR; tail = dur - 2400 / SR
    pz = pauses(y)
    if len(ph) > 1 and len(pz) >= len(ph) - 1:
        cut = sorted(sorted(pz, key=lambda r: -r[1])[:len(ph) - 1], key=lambda r: r[0])
        bounds = [(head, cut[0][2])] + [(cut[k][3], cut[k + 1][2]) for k in range(len(cut) - 1)] + [(cut[-1][3], tail)]
        how = 'pauses'
    else:
        bounds = None; how = 'spread'
    if bounds is None:
        return spread(text.split(), head, tail), how, len(pz)
    out = []
    for p, (a, b) in zip(ph, bounds): out += spread(p, a, b)
    return out, how, len(pz)

audio = len(sys.argv) > 3
t = LEAD; out = []; track = []; report = []
for s in SEGS:
    if audio:
        d, voice, model = sys.argv[1:4]
        f = os.path.join(d, f"{s['id']}-{voice}-{model}.wav")
        if not os.path.exists(f): f = f[:-4] + '.mp3'
        y = load(f)
        ww, how, npz = clip_words(s['text'], y)
        words = [[round(t + a, 3), round(t + b, 3), w] for a, b, w in ww]
        track.append((t, y)); report.append((s['id'], how, npz, round(len(y) / SR, 3))); t = t + len(y) / SR
    else:
        words, t = est_words(s['text'], t)
        words = [[round(a, 3), round(b, 3), w] for a, b, w in words]
    def find(key, after=-1):
        return next((w for w in words if w[0] > after and norm(w[2]).startswith(norm(key)[:6])), words[len(words) // 2])
    land = name_t = None; k = s.get('keys') or {}
    if k.get('land'):
        land = round(find(k['land'])[0] - 0.3, 3)
    if k.get('name'):
        name_t = round(find(k['name'], land if land is not None else -1)[0] - 0.05, 3)
    seg = {kk: v for kk, v in s.items() if kk not in ('text', 'keys')}
    seg.update(t0=round(words[0][0] - 0.3, 3), t1=round(words[-1][1], 3), land=land, name_t=name_t, words=words)
    out.append(seg)
    t += GAP.get(s['id'], DEF_GAP)
end_t = round(out[-1]['t1'] + TAIL, 3)
cues = {kk: v for kk, v in B.items() if kk not in ('segments',)}
cues.update(segments=out, end_t=end_t, dur=round(end_t + HOLD, 3))
dst = os.environ.get('CUES_OUT', os.path.join(HERE, '..', 'labrig', 'cues_mesa.json'))
json.dump(cues, open(dst, 'w'), ensure_ascii=False, indent=1)
if audio:
    import numpy as np, soundfile as sf
    N = int((cues['dur'] + 0.2) * SR); mix = np.zeros(N)
    for t0, y in track:
        i = int(t0 * SR); mix[i:i + len(y)] += y[:N - i]
    sf.write(os.environ.get('NARR_OUT', os.path.join(HERE, '..', 'out', 'narration.wav')), mix, SR)
    print('align', report)
print('dur', cues['dur'], 'end_t', end_t, [(s['id'], s['t0'], s['land'], s['name_t']) for s in out])
