# Synthesized SFX track for reelPR v2 ("Metade do dobro? Nessa Black Friday não!", one desk shot), timed from ../labrig/cues_mesa.json.
# Writes ../out/sfx.wav (48 kHz mono). Uses only numpy, soundfile and scipy.
# Every time below mirrors labrig/mesa.html: the same "fx" key words of src/beats.json and the same offsets (T_DISC, T_IN, T_LAND, T_TMR, T_STRIP, T_FLY, T_NOTE_OUT, PUSH_D, OUT_D).
# Paths can be overridden for tests: CUES_IN (cues json), SFX_OUT (wav).
import json, os, re
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
C = json.load(open(os.environ.get('CUES_IN', os.path.join(HERE, '..', 'labrig', 'cues_mesa.json'))))
seg = {s['id']: s for s in C['segments']}
N = int((C['dur'] + .5) * SR); out = np.zeros(N); rng = np.random.default_rng(7)
norm = lambda w: re.sub(r'[^\wÀ-ú]', '', w).lower()
def fx(sid, key):
    g = seg[sid]; n = norm((g.get('fx') or {}).get(key, ''))
    w = next((w for w in g['words'] if n and norm(w[2]).startswith(n)), g['words'][len(g['words']) // 2]); return w[0]
def add(t, y, g=1.0):
    i = max(0, int(t * SR)); j = min(N, i + len(y))
    if j > i: out[i:j] += g * y[:j - i]
def env(n, a=.002, d=.12):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def band(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def thud(d=.25, f=70):
    n = int(d * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t * (1 - .4 * t / d)) * env(n, .002, .07) + .25 * rng.normal(0, 1, n) * env(n, .001, .015)
def knock(f=420):
    n = int(.12 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + .6 * np.sin(2 * np.pi * f * 1.64 * t)) * env(n, .001, .025)
def plim(f=1320):
    n = int(.5 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t) * env(n, .003, .12) + .7 * np.sin(2 * np.pi * f * 1.5 * t) * env(n, .003, .09) * (t > .08)
def pop(f0=500):
    n = int(.09 * SR); t = np.arange(n) / SR; f = f0 + 900 * t / .09; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .03)
def whoosh(d=.45, lo=500, hi=3500):
    n = int(d * SR); return band(rng.normal(0, 1, n), lo, hi) * np.hanning(n) * .6
def flick():
    n = int(.08 * SR); return rng.normal(0, 1, n) * env(n, .001, .015) * .5
def tick(f, d=.07):
    n = int(d * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t) * env(n, .001, .02)
def shutter():
    a = np.zeros(int(.2 * SR)); f = flick(); a[:len(f)] += f; k = knock(900) * .5; i = int(.07 * SR); a[i:i + len(k)] += k; f2 = flick() * .7; i = int(.11 * SR); a[i:i + len(f2)] += f2; return a
def paper(d=.6, rise=True):
    # paper being moved: band noise with small crackles
    n = int(d * SR); t = np.arange(n) / SR; x = band(rng.normal(0, 1, n), 1500, 7000)
    crack = band((rng.random(n) < .004) * rng.normal(0, 6, n), 2500, 9000)
    return (x * .5 + crack) * np.sin(np.pi * t / d) ** .6 * ((.4 + .6 * t / d) if rise else 1)
def slide(d=.5):
    n = int(d * SR); t = np.arange(n) / SR; return band(rng.normal(0, 1, n), 900, 5000) * np.sin(np.pi * t / d) ** .8 * .45

END = C['end_t']
tPush = fx('p0', 'push'); tOut = fx('p0', 'out') - .12; tNope = fx('p0', 'nope')
tBanner = fx('p0', 'banner'); tNote = fx('p1', 'note'); tU1 = fx('p1', 'under1'); tU2 = fx('p1', 'under2')
tOpen = fx('p2', 'open'); tLine = fx('p2', 'line'); tFlip = fx('p2', 'flip'); tTimer = fx('p2', 'timer')
tStrip = fx('p3', 'strip'); tStop = fx('p3', 'stop')
tLens = fx('p4', 'lens'); tScan = fx('p4', 'scan'); tShot1 = fx('p4', 'shot1'); tShot2 = fx('p4', 'shot2'); tEnv = fx('p4', 'env'); tTuck = fx('p4', 'tuck')
tPlane = fx('p5', 'plane')
PUSH_D = .55; OUT_D = .65; T_DISC = .3; T_IN = tOut + .6; T_LAND = T_IN + .6; T_TMR = tTimer + .3; T_STRIP = tStrip + .14; T_FLY = tPlane - .05; T_NOTE_OUT = seg['p2']['t0'] + .05
# hook: the disc drops onto the glass; the camera pushes in on the prices and lands on "dobro"; it pulls back on "Black"; the banner comes down; the disc shakes "no" on "não"
add(0.0, whoosh(.3), .2); add(T_DISC, knock(480), .5); add(T_DISC + .02, thud(.14, 120), .3)
add(tNope - .05, flick(), .4); add(tNope + .1, knock(520), .3); add(tNope + .24, knock(560), .26); add(tNope + .4, knock(520), .2)
add(tPush - PUSH_D, whoosh(PUSH_D + .1, 300, 2600), .5); add(tPush - .03, thud(.3, 62), .9); add(tPush + .02, plim(660), .14)
# still in the hook: the folded paper slides in and lifts its flap once. Context (p1): the wish note slides out, the two underlines
add(tOut, whoosh(OUT_D, 300, 2200), .3)
add(T_IN, slide(.65), .5); add(T_LAND - .04, flick(), .5); add(T_LAND, thud(.16, 95), .3); add(T_LAND + .1, paper(.5), .3)
tB = max(tBanner - .06, tOut + OUT_D * .85); add(tB, whoosh(.35), .22); add(tB + .36, plim(990), .18)
add(tNote - .12, slide(.55), .5); add(tNote + .45, flick(), .3)
add(tU1 - .05, whoosh(.3, 1500, 6000), .2); add(tU2 - .05, whoosh(.3, 1500, 6000), .22); add(tU2 + .28, tick(1100), .2)
add(T_NOTE_OUT, slide(.55), .35)   # the wish note goes back under the phone when p2 starts
# conflict: the paper opens; the line of the real price is drawn, one soft tick per month
add(tOpen - .12, paper(.85), .6); add(tOpen + .7, thud(.14, 110), .25)
for i in range(4): add(tLine - .05 + 1.05 * i / 3, tick(700 + 60 * i), .3)
# escalation: the disc turns over on "zero"; the timer card drops and ticks once per second until "proíbe"
add(tFlip - .06, whoosh(.4), .25); add(tFlip + .42, knock(480), .55); add(tFlip + .46, thud(.14, 120), .3)
add(T_TMR - .3, whoosh(.3), .2); add(T_TMR, knock(380), .55)
stop = tStop + .05; k = 1
while T_TMR + k < stop: add(T_TMR + k, tick(1500, .05), .22); k += 1
# turn: the strip "ENGANOSA" is laid over the dashed line; the timer stops, turns face down and slides away
add(T_STRIP - .3, whoosh(.3), .25); add(T_STRIP, thud(.2, 105), .85); add(T_STRIP + .01, flick(), .5)
add(stop, knock(300), .4); add(stop + .12, whoosh(.4), .22); add(stop + .5, knock(420), .3); add(stop + .5, slide(.6), .5)
# payoff: the magnifier card arrives and scans the line; two shutters; the prints land; the envelope slides out; the prints go in; the flap closes
add(tLens - .2, slide(.5), .35); add(tLens + .38, knock(520), .4)
add(tScan - .1, slide(1.4), .22)
for t0 in (tShot1, tShot2): add(t0, shutter(), .8); add(t0 + .1, whoosh(.5), .16); add(t0 + .62, flick(), .4)
add(tEnv - .12, slide(.6), .5); add(tEnv + .46, flick(), .3)
add(tTuck - .05, slide(.5), .45); add(tTuck + .04, slide(.5), .35); add(tTuck + .5, whoosh(.4, 1200, 5000), .2); add(tTuck + .93, flick(), .5); add(tTuck + .95, plim(1320), .22)
# send-ask: the paper plane leaves the phone and crosses the frame; then the end card
add(T_FLY, pop(640), .4); add(T_FLY + .05, whoosh(1.3, 700, 4200), .32)
add(END - .05, whoosh(.5), .22); add(END + .15, plim(990), .2)
out = out / (np.abs(out).max() + 1e-9) * .6
dst = os.environ.get('SFX_OUT', os.path.join(HERE, '..', 'out', 'sfx.wav')); sf.write(dst, out, SR); print('sfx', round(N / SR, 2), 's', os.path.normpath(dst))
