# Pace after processing: for each segment use <id>-<voice>-<model>.wav if it exists, else the .mp3 (the same choice as src/mesa_cues.py).
# Two measures per clip: words / speech span (first to last 10 ms mean level above 0.008, as rate.py) and words / file duration (the OP's measure).
# usage: python3 -I rate2.py <beats.json> <tts_dir> <voice> <model>
import json, os, subprocess, sys
import numpy as np
beats, d, voice, model = sys.argv[1:5]; SR = 48000; W = Ts = Tf = 0.0
for s in json.load(open(beats))['segments']:
    f = os.path.join(d, f"{s['id']}-{voice}-{model}.wav")
    if not os.path.exists(f): f = f[:-4] + '.mp3'
    y = np.frombuffer(subprocess.run(['/opt/homebrew/bin/ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                                     capture_output=True, check=True).stdout, np.float32).astype(np.float64)
    env = np.convolve(np.abs(y), np.ones(480) / 480, 'same'); on = np.where(env > 0.008)[0]
    sp = (on[-1] - on[0]) / SR; fd = len(y) / SR; n = len(s['text'].split()); W += n; Ts += sp; Tf += fd
    print(json.dumps(dict(id=s['id'], file=os.path.basename(f), words=n, speech_s=round(sp, 3), file_s=round(fd, 3), wps_speech=round(n / sp, 3), wps_file=round(n / fd, 3))))
print(json.dumps(dict(total_words=int(W), speech_s=round(Ts, 3), file_s=round(Tf, 3), wps_speech=round(W / Ts, 3), wps_file=round(W / Tf, 3))))
