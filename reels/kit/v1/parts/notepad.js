// The notepad and the pen (kit-plan 3.7), new. A note is one to three words per line, the action the viewer takes; no hand; the pen leaves when the note is done.
// Call every method you use on every frame (stateless: the pose is a pure function of t and the cue times). Call write() for every line before pen().
import { clamp, sm, lerp, hill } from '../core/timing.js';
import { MARINHO } from '../core/palette.js';
import { txt, dyn, paper, measure } from '../core/text.js';
import { card } from '../core/stage.js';

export const ZONES = { cx: [293, 787], cy: [812, 990], cy3: [812, 900] };   // centre window at the base shot; one or two lines end above y 940, three lines need cy3
const PW = 1.7, PD = 2.4, PH = .085, CW = 850, CH = 1200, X0 = 90, LEAN0 = 70, LEAN1 = 48;

export function createNotepad(stage, { home = { px: 470, py: 850, station: 'note' }, penRest = { px: 140, py: 850, station: 'note', yaw: .06 }, lines = [] } = {}) {
  const T = stage.THREE, ry = .035;
  if (lines.length > 3) throw new Error('a note has at most three lines');
  // line i: middle at y 265 + 150 i, starting at x 90, italic 400 170px NR, shrunk when wider than 680 canvas px, never under 112 px
  const L = lines.map((s, i) => { let fs = 170, w = measure('italic 400 ' + fs + 'px NR', s); if (w > 680) { fs = Math.floor(170 * 680 / w); w = measure('italic 400 ' + fs + 'px NR', s) }
    if (fs < 112 || w > 680.5) throw new Error('note line "' + s + '" is too wide (needs under 112 canvas px)'); return { s, fs, w, y: 265 + 150 * i } });
  const page = dyn(CW, CH, (g, w, h, ks) => {
    paper(g, w, h, '#f4f2ec', .9);
    g.strokeStyle = 'rgba(45,90,154,0.22)'; g.lineWidth = 4; for (let n = 0; n < 8; n++) { const y = 340 + 150 * n; g.beginPath(); g.moveTo(40, y); g.lineTo(w - 40, y); g.stroke() }
    L.forEach((ln, i) => { const k = ks[i]; if (!(k > 0)) return; const edge = X0 - 10 + k * (ln.w + 20);
      g.save(); g.beginPath(); g.rect(X0 - 10, ln.y - 120, k * (ln.w + 20), 240); g.clip(); txt(g, ln.s, X0, ln.y, 'italic 400 ' + ln.fs + 'px NR', MARINHO); g.restore();
      const bx = g.canvas.__boxes[g.canvas.__boxes.length - 1]; bx[2] = Math.min(bx[2], edge) });   // while k < 1 the text box ends at the clip edge
  });
  const Ks = L.map(() => 0); page.upd(Ks.join(','), Ks);
  const group = card(stage.rrShape(PW, PD, .03), PW, PD, PH, page.t, { side: '#e4e1d6', parent: stage.scene }); group.position.copy(stage.at(home)); group.rotation.y = ry; group.userData.rest = 0;
  { const m = new T.Mesh(new T.BoxGeometry(PW, .012, .26), new T.MeshStandardMaterial({ color: MARINHO, roughness: .55 })); m.position.set(0, PH + .006 + .0006, -PD / 2 + .13); m.castShadow = true; m.receiveShadow = true; group.add(m) }
  stage.contact(group, PW, PD, .03, { th: PH, blur: [.09, .02], alpha: [.5, .7] });
  // pen: 2.3 units long, tip at the group origin, axis +y; barrel in Marinho-blue clearcoat, tip, clip and cap in aluminium
  const pen = new T.Group(); stage.scene.add(pen);
  { const alu = stage.alu(), body = new T.MeshPhysicalMaterial({ color: '#1F3F6E', roughness: .28, clearcoat: .6, clearcoatRoughness: .2 });
    const add = (g, m, y) => { const o = new T.Mesh(g, m); o.position.y = y; o.castShadow = true; pen.add(o); return o };
    add(new T.CylinderGeometry(.035, 0, .22, 32), alu, .11);
    add(new T.CylinderGeometry(.062, .062, 1.88, 32), body, 1.16);
    add(new T.LatheGeometry([[.062, 2.1], [.062, 2.2], [.058, 2.262], [.042, 2.293], [0, 2.3]].map(([x, y]) => new T.Vector2(x, y)), 32), alu, 0);
    const clip = add(new T.BoxGeometry(.028, .7, .012), alu, 1.9); clip.position.x = .062 + .006 }
  // rest: lying flat on the mat beside the pad, axis along z, tip toward -z, axis 0.062 above the mat (the barrel radius); penRest is the centre of the pen
  const yawR = penRest.yaw ?? .06, REST_DIR = new T.Vector3(Math.sin(yawR), 0, Math.cos(yawR)), RC = stage.at(penRest, .062), REST_TIP = RC.clone().addScaledVector(REST_DIR, -1.15);
  const shAnchor = new T.Object3D(); shAnchor.position.y = 1.15; shAnchor.userData.rest = .062; pen.add(shAnchor);
  const yawObj = new T.Object3D(); yawObj.rotation.y = yawR; stage.scene.add(yawObj);   // the sprite's yaw: the pen lies at 90 degrees of pitch, where a yaw taken from its quaternion is ambiguous
  stage.contact(shAnchor, .14, 2.3, .06, { th: .12, blur: [.05, .012], alpha: [.45, .6], yawOf: yawObj });   // its opacity goes to 0 while the pen is lifted
  // world points of the stroke: canvas (x, y) of the page to world, through the pad pose
  const pos0 = group.position.clone(), c = Math.cos(ry), sn = Math.sin(ry), TIPY = PH + .0006 + .004;
  const pageToWorld = (cx, cy, y = TIPY) => { const lx = (cx / CW - .5) * PW, lz = (cy / CH - .5) * PD; return new T.Vector3(pos0.x + lx * c + lz * sn, y, pos0.z - lx * sn + lz * c) };
  const startPt = i => pageToWorld(X0, L[i].y + .28 * L[i].fs), endPt = i => pageToWorld(X0 + L[i].w, L[i].y + .28 * L[i].fs);
  const W = L.map(() => null);
  const dirOf = lean => { const a = lean * Math.PI / 180, b = 40 * Math.PI / 180; return new T.Vector3(Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b)) };
  const WRITE_DIR = dirOf(LEAN1), UP = new T.Vector3(0, 1, 0), tmp = new T.Vector3();
  const place = (p, dir, shOp) => { pen.position.copy(p); pen.quaternion.setFromUnitVectors(UP, dir.clone().normalize()); shAnchor.userData.shOp = shOp };
  const mixDir = (a, b, k) => new T.Vector3().lerpVectors(a, b, k);
  const note = {
    name: 'notepad', group, pen, home, lines: L,
    appear(t, t0) { group.visible = t >= t0 },
    // reveals line i from t0 during d seconds (steps of 1/40)
    write(t, i, t0, d) { if (!L[i]) throw new Error('no line ' + i); W[i] = { t0, d }; Ks[i] = Math.round(clamp((t - t0) / d) * 40) / 40; page.upd(Ks.map(k => Math.round(k * 40)).join(','), Ks) },
    // pen: rests beside the pad, lifts to the start of line 0 on an arc 0.5 high, writes, and goes back to rest on the same path backward
    pen(t, { lift, rest }) {
      const LI = { t0: lift[0], d: lift[1] ?? .42 }, RE = { t0: rest[0], d: rest[1] ?? .5 };
      const ws = W.map((w, i) => w && { ...w, i }).filter(Boolean);
      if (!ws.length) throw new Error('call write() for every line before pen()');
      const first = ws[0].i, last = ws[ws.length - 1].i;
      if (t < LI.t0) { place(REST_TIP, REST_DIR, 1); return }
      if (t < LI.t0 + LI.d) { const k = (t - LI.t0) / LI.d, e = sm(k), p = tmp.lerpVectors(REST_TIP, startPt(first), e); p.y += .5 * hill(k); place(p, mixDir(REST_DIR, WRITE_DIR, e), 1 - e); return }
      if (t >= RE.t0 + RE.d) { place(REST_TIP, REST_DIR, 1); return }
      if (t >= RE.t0) { const k = (t - RE.t0) / RE.d, e = sm(k), p = tmp.lerpVectors(endPt(last), REST_TIP, e); p.y += .5 * hill(k); place(p, mixDir(WRITE_DIR, REST_DIR, e), e); return }
      let p = startPt(first);
      for (let n = 0; n < ws.length; n++) {
        const w = ws[n], te = w.t0 + w.d;
        if (t >= w.t0 && t < te) { const k = (t - w.t0) / w.d; p = tmp.lerpVectors(startPt(w.i), endPt(w.i), k); p.z += .012 * Math.sin(k * L[w.i].w / 170 * 3 * Math.PI); break }
        if (t >= te) { p = endPt(w.i); const nx = ws[n + 1]; if (nx && t < nx.t0) { const s0 = Math.max(te, nx.t0 - .25), s = clamp((t - s0) / (nx.t0 - s0)); p = tmp.lerpVectors(endPt(w.i), startPt(nx.i), sm(s)); p.y += .12 * hill(s); break } }
      }
      place(p, WRITE_DIR, 0);
    },
  };
  return stage.register(note);
}

export function selfTest(stage) {
  stage.camKey(0, 'note', { cut: true });
  const n = createNotepad(stage, { lines: ['Print', 'Procon'] });
  const frame = t => { n.write(t, 0, .9, .5); n.write(t, 1, 1.56, .55); n.pen(t, { lift: [.4, .42], rest: [2.6, .5] }) };
  return { dur: 4, frame, times: [.3, .6, .7, 1.15, 1.45, 1.85, 2.4, 2.8, 3.3] };
}
