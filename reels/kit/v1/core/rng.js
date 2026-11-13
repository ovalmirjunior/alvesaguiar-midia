// Seeded random: the page never uses a time-based or unseeded source. createStage calls installSeededRandom() first thing.
export function installSeededRandom(seed = 0x9E3779B9) {
  let a = seed;
  Math['random'] = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
}
// deterministic 0..1 from an integer, for per-frame jitter
export function hash01(i) {
  let t = Math.imul((i | 0) ^ 0x9E3779B9, 0x85EBCA6B); t ^= t >>> 13; t = Math.imul(t, 0xC2B2AE35); t ^= t >>> 16;
  return (t >>> 0) / 4294967296;
}
