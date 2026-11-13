// Printed text and canvases (MESA lines 137 to 155). Printed text goes only through txt() on a canvas made by canvasTex() or dyn():
// that is what puts its boxes into TEXTRECTS. Box = [x0, y0, x1, y1, text, px] in canvas pixels, px = the font size times the transform scale.
import * as THREE from 'three';

// text-off switch: read once at load (?notext=1 or window.KIT_TEXT_OFF === true before the module loads)
export const TEXT_OFF = (() => { try { return new URLSearchParams(location.search).get('notext') === '1' || window.KIT_TEXT_OFF === true } catch (e) { return false } })();

if (TEXT_OFF) document.documentElement.classList.add('kit-notext');   // kit.css turns the DOM text transparent

// shared by the stage after it loads the maps
export const env = { aniso: 1, papA: null, papN: null };

export const rr = (g, x, y, w, h, rad) => { g.beginPath(); g.roundRect(x, y, w, h, rad) };

export function txt(g, t, x, y, font, color, align = 'left', ls = '0px') {
  g.font = font; g.letterSpacing = ls; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle';
  if (!TEXT_OFF) g.fillText(t, x, y);
  const m = g.measureText(t), x0 = x - m.actualBoundingBoxLeft, x1 = x + m.actualBoundingBoxRight, y0 = y - m.actualBoundingBoxAscent, y1 = y + m.actualBoundingBoxDescent, Tm = g.getTransform();
  const P = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([a, b]) => [Tm.a * a + Tm.c * b + Tm.e, Tm.b * a + Tm.d * b + Tm.f]);
  const fs = +(/(\d+(?:\.\d+)?)px/.exec(font) || [0, 0])[1] * Math.hypot(Tm.c, Tm.d);
  g.canvas.__boxes.push([Math.min(...P.map(p => p[0])), Math.min(...P.map(p => p[1])), Math.max(...P.map(p => p[0])), Math.max(...P.map(p => p[1])), t, fs]);
  g.letterSpacing = '0px'; return m.width;
}
export const texOf = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = env.aniso; return t };
// printed canvases are drawn on the CPU (willReadFrequently): a GPU canvas draws glyph edges that differ by a level or two with the frames drawn before
export const C2D = { willReadFrequently: true };
export function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; c.__boxes = []; draw(c.getContext('2d', C2D), w, h); return texOf(c) }
// a canvas redrawn only when its key changes; save and restore keep each redraw free of the state of the one before
export function dyn(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.__boxes = []; const g = c.getContext('2d', C2D), t = texOf(c); let key = null;
  return { t, c, upd(k, ...a) { if (k === key) return; key = k; c.__boxes = []; g.save(); g.clearRect(0, 0, w, h); draw(g, w, h, ...a); g.restore(); t.needsUpdate = true } };
}
// text measuring outside a drawn canvas
const mctx = document.createElement('canvas').getContext('2d');
export const measure = (font, t, ls = '0px') => { mctx.font = font; mctx.letterSpacing = ls; const w = mctx.measureText(t).width; mctx.letterSpacing = '0px'; return w };

// paper ground: a colour multiplied by the fibre map
const papPat = (g, k) => { const p = g.createPattern(env.papA.image, 'repeat'); p.setTransform(new DOMMatrix().scale(k)); return p };
export function paper(g, w, h, color, k = 1) { g.fillStyle = color; g.fillRect(0, 0, w, h); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = papPat(g, k); g.fillRect(0, 0, w, h); g.restore() }
export const PAPT = .85; // world size of one paper map tile
export const papN = (w, d, ru = 1, rv = 1) => { const n = env.papN.clone(); n.repeat.set(w / PAPT / ru, d / PAPT / rv); n.needsUpdate = true; return n };
export const papMat = (tex, w, d, o = {}, ru = 1, rv = 1) => new THREE.MeshStandardMaterial({ map: tex, roughness: .9, normalMap: papN(w, d, ru, rv), normalScale: new THREE.Vector2(.55, .55), shadowSide: THREE.DoubleSide, ...o });
export const plain = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .88, ...o });
