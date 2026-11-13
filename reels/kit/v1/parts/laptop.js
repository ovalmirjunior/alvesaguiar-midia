// The laptop (kit-plan 3.6), new. It shows law text in the `laptop` station and nothing else; closed it may be in any frame. One article per beat.
// Call every method you use on every frame (stateless: the pose is a pure function of t and the cue times).
import { clamp, sm, back, lerp } from '../core/timing.js';
import { TINTA, MARINHO, CLARO, ramp as getRamp } from '../core/palette.js';
import { txt, dyn, rr, measure } from '../core/text.js';

export const ZONES = { text: { x: [105, 865], y: [500, 1030] } };   // fixed by the shot: text column on screen
const LW = 6.40, LD = 4.40, BASE_T = .23, LID_T = .11, DW = 6.10, DH = 3.8125, CHIN = .4375;
const CAN_W = 2000, CAN_H = 1250, CLIP_Y0 = 120, PAGE_H = 1130, COL_X = 100, COL_W = 1600;

// the demo text, verbatim from reelPR2 script.md section 5 item 1 (Lei 8.078/1990, Código de Defesa do Consumidor, art. 37 caput and § 1º)
export const DEMO_DOC = {
  law: 'Lei 8.078/1990 · CDC',
  blocks: [
    { label: 'Art. 37.', text: 'É proibida toda publicidade enganosa ou abusiva.', size: 120 },
    { label: '§ 1º', text: 'É enganosa qualquer modalidade de informação ou comunicação de caráter publicitário, inteira ou parcialmente falsa, ou, por qualquer outro modo, mesmo por omissão, capaz de induzir em erro o consumidor a respeito da natureza, características, qualidade, quantidade, propriedades, origem, preço e quaisquer outros dados sobre produtos e serviços.', size: 80 },
  ],
  marks: [{ id: 'h1', block: 0, phrase: 'É proibida' }, { id: 'h2', block: 0, phrase: 'publicidade enganosa' }, { id: 'h3', block: 1, phrase: 'inteira ou parcialmente falsa' }, { id: 'h4', block: 1, phrase: 'preço' }],
};

// greedy wrap of one block; returns its lines and the geometry of its marks (canvas px relative to the block origin)
function layoutBlock(b, i, marks) {
  const fL = '700 ' + b.size + 'px P', fT = '500 ' + b.size + 'px NR', lw = measure(fL, b.label), sp = measure(fT, ' ');
  if (b.size < 80) throw new Error('block size under 80 canvas px (34 px on screen): ' + b.size);
  const lines = []; let cur = { x0: COL_X + lw + sp, text: '', cs: 0 }, pos = 0;
  for (const w of b.text.split(' ')) {
    const cand = cur.text ? cur.text + ' ' + w : w;
    if (cur.text && cur.x0 + measure(fT, cand) > COL_X + COL_W) { lines.push(cur); cur = { x0: COL_X, text: w, cs: pos } } else cur.text = cand;
    pos += w.length + 1;
  }
  lines.push(cur);
  const yStart = i === 0 ? 330 : 180, lh = 1.28 * b.size, end = yStart + lines.length * lh;
  if (end > 1210) throw new Error('block ' + i + ' ends at y ' + end.toFixed(0) + ' (limit 1210): pick a shorter passage');
  const mk = marks.filter(m => m.block === i).map(m => {
    const a = b.text.indexOf(m.phrase);
    if (a < 0 || b.text.indexOf(m.phrase, a + 1) >= 0) throw new Error('mark ' + m.id + ': the phrase must occur exactly once in its block');
    const segs = []; lines.forEach((ln, n) => { const ce = ln.cs + ln.text.length, s0 = Math.max(a, ln.cs), s1 = Math.min(a + m.phrase.length, ce); if (s1 > s0) segs.push({ n, x0: ln.x0 + measure(fT, ln.text.slice(0, s0 - ln.cs)) - 6, x1: ln.x0 + measure(fT, ln.text.slice(0, s1 - ln.cs)) + 6 }) });
    return { id: m.id, segs };
  });
  return { b, lines, yStart, lh, fL, fT, lw, marks: mk };
}

export function createLaptop(stage, { front = -2.51, x = 5.60, ry = -.012, ramp = 'ambar', doc = DEMO_DOC } = {}) {
  const T = stage.THREE, R = getRamp(ramp), Q = stage.query;
  const blocks = doc.blocks.map((b, i) => layoutBlock(b, i, doc.marks || []));
  const alu = stage.alu(), aluHinge = stage.alu(.75), aluPad = stage.alu(.93, { rough: .3 });
  const group = new T.Group(); group.position.set(x, 0, front - LD); group.rotation.y = ry; stage.scene.add(group);
  // base: extruded like the phone body, bevel 0.02
  const BV = .02; { const g = new T.ExtrudeGeometry(stage.rrShape(LW - 2 * BV, LD - 2 * BV, .2 - BV), { depth: BASE_T - 2 * BV, bevelEnabled: true, bevelThickness: BV, bevelSize: BV, bevelSegments: 4, curveSegments: 16 }); g.rotateX(-Math.PI / 2); g.translate(0, BV, LD / 2);
    const base = new T.Mesh(g, alu); base.castShadow = true; base.receiveShadow = true; group.add(base) }
  const topY = BASE_T;
  // keyboard well and trackpad (margins: hinge side 0.30, front 0.18, so the deck sums to 4.40)
  const flat = (shape, mat, y, z) => { const g = new T.ShapeGeometry(shape, 12); g.rotateX(-Math.PI / 2); const m = new T.Mesh(g, mat); m.position.set(0, y, z); m.receiveShadow = true; group.add(m); return m };
  const wellMat = new T.MeshStandardMaterial({ color: '#14161a', roughness: .7 }), keyMat = new T.MeshStandardMaterial({ color: '#1c1f25', roughness: .62 });
  flat(stage.rrShape(5.67, 2.36, .06), wellMat, topY + .002, .30 + 1.18);
  { const g = new T.ExtrudeGeometry(stage.rrShape(2.30, 1.40, .08), { depth: .004, bevelEnabled: false, curveSegments: 12 }); g.rotateX(-Math.PI / 2); const m = new T.Mesh(g, aluPad); m.position.set(0, topY, .30 + 2.36 + .16 + .70); m.receiveShadow = true; group.add(m) }
  // keys: pitch 0.40, gap 0.05, cap 0.028 high, corner 0.045; function row 0.19 deep; one mesh per key, geometry cached by width; no legends
  const ROWS = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5], [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25], [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75], [1, 1, 1, 1.25, 5.5, 1.25, 1, 1, 1]];
  const geoCache = {}, keyGeo = (w, d) => geoCache[w + 'x' + d] || (geoCache[w + 'x' + d] = (() => { const g = new T.ExtrudeGeometry(stage.rrShape(w, d, .045), { depth: .028 - .01, bevelEnabled: true, bevelThickness: .005, bevelSize: .005, bevelSegments: 2, curveSegments: 6 }); g.rotateX(-Math.PI / 2); g.translate(0, .005, 0); return g })());
  let nKeys = 0;
  ROWS.forEach((row, j) => {
    const depth = j === 0 ? .19 : .35, z0 = j === 0 ? .385 : .385 + .19 + .05 + (j - 1) * .40; let cum = 0;
    for (const w of row) { const cw = .40 * w - .05, m = new T.Mesh(keyGeo(+(cw - .01).toFixed(3), depth - .01), keyMat); m.position.set(-2.775 + cum * .40 + cw / 2, topY + .003, z0 + depth / 2); m.castShadow = false; m.receiveShadow = true; group.add(m); cum += w; nKeys++ }
  });
  { const m = new T.Mesh(new T.CylinderGeometry(.09, .09, 5.2, 24), aluHinge); m.rotation.z = Math.PI / 2; m.position.set(0, topY - .01, .03); m.castShadow = true; group.add(m) }
  // lid: a group at the hinge, rotation.x = (180 - A) deg. In its own frame at A = 180 it lies flat behind the hinge with the display up.
  const lid = new T.Group(); lid.position.set(0, topY, 0); group.add(lid);
  { const g = new T.ExtrudeGeometry(stage.rrShape(LW, LD, .2), { depth: LID_T, bevelEnabled: false, curveSegments: 16 }); g.rotateX(-Math.PI / 2); g.translate(0, -LID_T, -LD / 2);
    const plate = new T.Mesh(g, alu); plate.castShadow = true; plate.receiveShadow = true; lid.add(plate);
    const bg = new T.ShapeGeometry(stage.rrShape(LW - .03, LD - .03, .185), 16); bg.rotateX(-Math.PI / 2); const bez = new T.Mesh(bg, new T.MeshStandardMaterial({ color: 0x030405, roughness: .1 })); bez.position.set(0, .0004, -LD / 2); bez.receiveShadow = true; lid.add(bez) }
  // display: 6.10 x 3.8125 (16:10), side and top bezel 0.15, chin 0.4375 at the hinge; canvas 2000 x 1250 redrawn through dyn
  const screen = dyn(CAN_W, CAN_H, (g, w, h, scroll, marks) => {
    g.fillStyle = CLARO; g.fillRect(0, 0, w, h);
    g.save(); g.beginPath(); g.rect(0, CLIP_Y0, w, h - CLIP_Y0); g.clip();
    blocks.forEach((B, i) => {
      const off = (i - scroll) * PAGE_H; if (off > h || off < -h) return;
      if (i === 0) { const y = 215 + off; if (y >= CLIP_Y0 && y <= h) txt(g, doc.law, COL_X, y, '700 80px HG', MARINHO) }
      // highlighter marks first, behind the words; a phrase broken over two lines gets one rectangle per line and the sweep runs through them in reading order
      for (const m of B.marks) {
        const k = marks[m.id] || 0; if (k <= 0) continue; let rem = k * m.segs.reduce((a, s) => a + s.x1 - s.x0, 0);
        for (const s of m.segs) { const wd = Math.min(s.x1 - s.x0, rem); rem -= wd; if (wd <= 0) continue; const mid = B.yStart + (s.n + .5) * B.lh + off, hh = .82 * B.b.size; g.fillStyle = R[4]; rr(g, s.x0, mid - hh / 2 + .04 * B.b.size, wd, hh, 8); g.fill() }
      }
      B.lines.forEach((ln, n) => {
        const mid = B.yStart + (n + .5) * B.lh + off; if (mid < CLIP_Y0 || mid > h) return;   // a line whose middle is outside the clip stores no text box
        if (n === 0) txt(g, B.b.label, COL_X, mid, B.fL, TINTA);
        txt(g, ln.text, ln.x0, mid, B.fT, TINTA);
      });
    });
    g.restore();
    // right rail: three page thumbnails (white rectangles with grey bars) and a scroll thumb that moves with the scroll
    g.fillStyle = '#E3E6EC'; g.fillRect(1740, CLIP_Y0, w - 1740, h - CLIP_Y0);
    [0, 1, 2].forEach(i => { const y = 160 + i * 190; g.fillStyle = '#FFFFFF'; rr(g, 1770, y, 170, 160, 10); g.fill(); g.fillStyle = '#C9CED8'; [0, 1, 2, 3].forEach(r => { rr(g, 1790, y + 24 + r * 30, r === 3 ? 70 : 130, 12, 6); g.fill() }) });
    const span = Math.max(1, blocks.length - 1); g.fillStyle = '#B7BEC9'; rr(g, 1962, 150, 14, 1060, 7); g.fill(); g.fillStyle = MARINHO; rr(g, 1962, 150 + (1060 - 260) * clamp(scroll / span), 14, 260, 7); g.fill();
    // toolbar, drawn last: Marinho, three plain rounded buttons and one empty field (no words)
    g.fillStyle = MARINHO; g.fillRect(0, 0, w, CLIP_Y0);
    g.fillStyle = 'rgba(242,244,247,.22)'; [0, 1, 2].forEach(i => { rr(g, 40 + i * 90, 30, 60, 60, 16); g.fill() }); g.fillStyle = 'rgba(242,244,247,.16)'; rr(g, 340, 26, 1360, 68, 34); g.fill();
  });
  const S = { scroll: 0, marks: Object.fromEntries((doc.marks || []).map(m => [m.id, 0])) };
  function redraw() { const sc = Math.round(S.scroll * 30) / 30, ks = Object.fromEntries(Object.entries(S.marks).map(([k, v]) => [k, Math.round(v * 20) / 20])); screen.upd(Math.round(sc * 30) + '|' + Object.values(ks).map(v => Math.round(v * 20)).join(','), sc, ks) }
  redraw();
  const disp = stage.face(stage.rrShape(DW, DH, .05), DW, DH, screen.t, new T.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: screen.t, emissiveIntensity: 0, roughness: .08, metalness: 0 }));
  disp.position.set(0, .0009, -(CHIN + DH / 2)); lid.add(disp);
  let A = 0, level = 0, lidFrame = -1, lidApplied = false; lid.rotation.x = (180 - A) * Math.PI / 180;
  disp.userData.tm.active = () => level >= .05 && A >= 100;   // text boxes only while the display is lit and the lid is open
  // the contact shadow follows the centre of the base (the group origin is on the hinge line); blur 0.13 keeps the sprite inside the mat (0.40 from the far edge)
  const shAnchor = new T.Object3D(); shAnchor.position.set(0, 0, LD / 2); group.add(shAnchor);
  stage.contact(shAnchor, LW, LD, .2, { th: .23, blur: [.13, .05], alpha: [.6, .9], grow: .04, yawOf: group });
  const lapE = +(Q.get('lapE') || .86);
  const lap = {
    name: 'laptop', group, lidGroup: lid, screen, nKeys, LW, LD,
    // shown from t0 until t1 (unused by the demo: the laptop is always drawn; closed it may be in any frame)
    show(t, t0, t1 = Infinity) { group.visible = t >= t0 && t < t1 },
    // opening angle in degrees: back() easing when opening, smoothstep when closing. Several calls in one frame: the last one whose t0 has passed wins (a call before its t0 only counts when no call has set the angle in this frame).
    lid(t, t0, { from = 0, to = 135, d = .7 } = {}) {
      if (lidFrame !== stage.frameNo) { lidFrame = stage.frameNo; lidApplied = false }
      if (t < t0 && lidApplied) return; lidApplied = true;
      const x = (t - t0) / d; A = lerp(from, to, to > from ? back(x) : sm(x)); lid.rotation.x = (180 - A) * Math.PI / 180;
    },
    power(t, events) {
      let prev = 0, lvl = 0;
      for (const e of events) { const on = e.on !== undefined, s = on ? e.on : e.off, to = on ? 1 : 0; if (t < s) break; lvl = lerp(prev, to, sm((t - s) / e.d)); prev = to }
      level = lvl; disp.material.emissiveIntensity = lapE * lvl; return lvl;
    },
    scroll(t, t0, { from = 0, to = 1, d = .55 } = {}) { S.scroll = lerp(from, to, sm((t - t0) / d)); redraw() },
    mark(t, t0, id, d = .35) { if (!(id in S.marks)) throw new Error('unknown mark ' + id); S.marks[id] = clamp((t - t0) / d); redraw() },
    get angle() { return A }, get level() { return level }, display: disp, lidCorners() { return { DW, DH, CHIN } },
  };
  return stage.register(lap);
}

export function selfTest(stage) {
  stage.camKey(0, 'laptop', { cut: true });
  const l = createLaptop(stage);
  const ev = [{ on: .8, d: .2 }];
  const frame = t => { l.lid(t, .3, { from: 0, to: 135, d: .7 }); l.power(t, ev); l.mark(t, 1.2, 'h1'); l.mark(t, 1.6, 'h2', .5); l.scroll(t, 2.2); l.mark(t, 2.8, 'h3', .5); l.mark(t, 3.3, 'h4') };
  return { dur: 4, frame, times: [.4, .6, .9, 1.4, 1.9, 2.5, 3.1, 3.8] };
}
