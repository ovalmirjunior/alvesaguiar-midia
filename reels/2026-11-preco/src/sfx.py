# Synthesized SFX track for reelPR ("As 4 peças do preço", desk scene, look v2), timed from ../labrig/cues_mesa.json.
# Adapted from Reel B src/sfx.py. Writes ../out/sfx.wav (48 kHz mono). Uses only numpy, soundfile and scipy.
# Every time below mirrors labrig/mesa.html: the same land / name_t cues and the same "fx" key words of beats.json.
import json, os, re
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000; C = json.load(open(os.path.join(HERE, '..', 'labrig', 'cues_mesa.json')))
seg = {s['id']: s for s in C['segments']}; L = {s['piece']: max(s['land'], s['t0'] + .55) for s in C['segments'] if s['land'] is not None}
N = int((C['dur'] + .5) * SR); out = np.zeros(N); rng = np.random.default_rng(5)
norm = lambda w: re.sub(r'[^\wÀ-ú]', '', w).lower()
def fx(sid, key):
    g = seg[sid]; n = norm((g.get('fx') or {}).get(key, ''))
    w = next((w for w in g['words'] if n and norm(w[2]).startswith(n)), g['words'][len(g['words']) // 2]); return w[0]
def add(t, y, g=1.0):
    i = max(0, int(t * SR)); j = min(N, i + len(y))
    if j > i: out[i:j] += g * y[:j - i]
def env(n, a=.002, d=.12):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def thud(d=.25, f=70):
    n = int(d * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t * (1 - .4 * t / d)) * env(n, .002, .07) + .25 * rng.normal(0, 1, n) * env(n, .001, .015)
def knock(f=420):
    n = int(.12 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + .6 * np.sin(2 * np.pi * f * 1.64 * t)) * env(n, .001, .025)
def plim(f=1320):
    n = int(.5 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) * env(n, .003, .12) + .7 * np.sin(2 * np.pi * f * 1.5 * t) * env(n, .003, .09) * (t > .08))
def pop(f0=500):
    n = int(.09 * SR); t = np.arange(n) / SR; f = f0 + 900 * t / .09; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .03)
def whoosh(d=.45):
    n = int(d * SR); x = rng.normal(0, 1, n); k = np.hanning(n)
    return sosfilt(butter(2, [500, 3500], 'band', fs=SR, output='sos'), x) * k * .6
def flick():
    n = int(.08 * SR); return rng.normal(0, 1, n) * env(n, .001, .015) * .5
def tick(f):
    n = int(.07 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t) * env(n, .001, .02)
def shutter():
    a = np.zeros(int(.2 * SR)); f = flick(); a[:len(f)] += f; k = knock(900) * .5; i = int(.07 * SR); a[i:i + len(k)] += k; f2 = flick() * .7; i = int(.11 * SR); a[i:i + len(f2)] += f2; return a
def stamp():
    a = thud(.2, 110) * .9; k = knock(); a[200:200 + len(k)] += .6 * k[:len(a) - 200]; return a
def beep(f=880, d=.11):
    n = int(d * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t) * np.minimum(1, t / .004) * np.minimum(1, (d - t) / .02)
def peel(d=.95):
    n = int(d * SR); t = np.arange(n) / SR; x = sosfilt(butter(2, [1500, 7000], 'band', fs=SR, output='sos'), rng.normal(0, 1, n))
    crack = (rng.random(n) < .004) * rng.normal(0, 6, n); crack = sosfilt(butter(2, [2500, 9000], 'band', fs=SR, output='sos'), crack)
    return (x * .5 + crack) * np.sin(np.pi * t / d) ** .6 * (.4 + .6 * t / d)
T = {i: seg['p%d' % i]['t0'] for i in range(1, 6)}; T_FINAL = T[5]; END = C['end_t']; T_BOARD = T_FINAL + .45
tFlip = fx('p0', 'flip'); tPush = fx('p0', 'push'); tBar = fx('p0', 'bar'); tShot = fx('p1', 'shot'); tOk = fx('p1', 'ok'); tHi = fx('p2', 'hi'); tStamp = fx('p2', 'stamp')
tCaixa = fx('p3', 'caixa'); tRing = fx('p3', 'ring'); tTile = [fx('p4', k) for k in 'abc']; PEEL0 = .22; PEELD = .95
# hook: the tag swings and settles, the sticker peels off and flies away, the disc flips on "metade",
# the camera pushes in on "Antes", the bar ticks on "quatro"
add(0.0, whoosh(.3), .22); add(.12, thud(.18, 85), .5)
add(PEEL0, peel(PEELD), .55); add(PEEL0 + PEELD, whoosh(.4), .25); add(PEEL0 + PEELD + .02, flick(), .5)
add(tFlip - .05, whoosh(.4), .22); add(tFlip + .42, knock(520), .55); add(tFlip + .46, plim(990), .2)
add(tPush - .2, whoosh(1.0), .14)
for i in range(4): add(tBar - .15 + i * .13 + .1, tick(900 + 140 * i), .3)
# camera travel to each piece (t0 to t0 + .5); the final board is built in place: the tray shrinks into its cell
for i in range(1, 5): add(T[i], whoosh(.5), .3)
add(T_FINAL + .05, whoosh(.55), .28)
# each piece wakes with a small hop when the camera has arrived; its bar cell fills; each title pops
for p in ('print', 'chart', 'menor', 'escolha'):
    add(L[p], pop(440), .5); add(L[p] + .36, thud(.2, 82), .55); add(L[p] + .18, plim(), .26)
for s in C['segments']:
    if s['name_t'] is not None: add(s['name_t'], pop(), .4)
# piece 1: screenshot shutter on "print", check coin on "cumprir"
add(tShot, shutter(), .8); add(tOk - .15, pop(560), .4); add(tOk + .05, plim(1560), .32)
# piece 2: the invented price appears on "inventado", stamp on "enganosa"
add(tHi - .1, pop(700), .35); add(tStamp + .05 - .5, whoosh(.4), .3); add(tStamp + .05, stamp(), .95)
# piece 3: terminal slides in and beeps on "caixa", frame and check on "menor", the higher price is struck
add(tCaixa - .3, whoosh(.4), .26); add(tCaixa - .3 + .42, knock(360), .6); add(tCaixa + .2, beep(), .16)
add(tRing - .2, pop(560), .5); add(tRing + .18, plim(1560), .34); add(tRing + .3, flick(), .4)
# piece 4: one tile flips over per choice
for i, t in enumerate(tTile): add(t - .35, flick(), .5); add(t - .3, whoosh(.3), .18); add(t + .12, knock(380 + 70 * i), .7)
# final board: the four pieces pop back, then the end card
add(T_BOARD - .1, pop(), .35)
for i in range(4): add(T_BOARD + i * .14 + .12, pop(520 + 110 * i), .45)
add(T_BOARD + .75, plim(1320), .3)
add(END - .05, whoosh(.5), .22); add(END + .15, plim(990), .2)
out = out / (np.abs(out).max() + 1e-9) * .6
dst = os.path.join(HERE, '..', 'out', 'sfx.wav'); sf.write(dst, out, SR); print('sfx', round(N / SR, 2), 's', os.path.normpath(dst))
