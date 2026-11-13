// Easings (MESA lines 357 to 358, 371) and the cue reader. No other curve is allowed in a Reel.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const sm = x => { x = clamp(x); return x * x * (3 - 2 * x) };
export const eo = x => 1 - Math.pow(1 - clamp(x), 3);
export const ei = x => Math.pow(clamp(x), 3);
export const lerp = (a, b, k) => a + (b - a) * k;
export const back = x => { x = clamp(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2) };
export const hill = x => Math.sin(clamp(x) * Math.PI);
// fall from height h0 during d seconds ending at t1, with one small settle of 0.16 s
export const fall = (t, t1, d, h0) => { if (t < t1) { const k = clamp((t - (t1 - d)) / d); return h0 * (1 - k * k) } return .03 * h0 * hill((t - t1) / .16) };

export const norm = w => w.toLowerCase().replace(/[^\p{L}\p{N}_]/gu, '');
// segments: [{id, ramp, cards, cite, cite_at, fx, t0, t1, words: [[t0, t1, word], ...]}], bar, end_t, dur
export function makeCues(CUES) {
  const segments = CUES.segments, seg = id => { const g = segments.find(g => g.id === id); if (!g) throw new Error('no segment ' + id); return g };
  // time of the first word of segment id that starts with the word stored under key k in its "fx" map
  const fx = (id, k) => { const g = seg(id), n = norm((g.fx || {})[k] || ''), w = n && g.words.find(w => norm(w[2]).startsWith(n)); return (w || g.words[g.words.length >> 1])[0] };
  return { segments, seg, fx, bar: CUES.bar || null, END: CUES.end_t, DUR: CUES.dur, raw: CUES };
}
