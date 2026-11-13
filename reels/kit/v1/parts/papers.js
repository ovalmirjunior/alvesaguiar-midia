// Paper props: the price-history sheet (MESA lines 266 to 299, 408 to 415) and the small print cards (MESA lines 329 to 337, 432 to 435).
// Call every method you use on every frame: the methods are stateless (a pure function of t and the cue times) but share one pose per component.
import { clamp, sm, eo, lerp, back, hill } from '../core/timing.js';
import { TINTA, MUTEDL, MARINHO, CLARO, mixc, ramp as getRamp } from '../core/palette.js';
import { txt, dyn, canvasTex, paper, papMat, rr } from '../core/text.js';
import { card } from '../core/stage.js';
import { createPhone } from './phone.js';

export const ZONES = { cx: [281, 829], cy: [678, 717] };   // price sheet, open (482 x 446 px): centre window at the base shot; the sheet ends above y 940
const CW = 1.62, CH = 1.5, LW = 482, LH = 446, CK = 3.75, DOTX = [82, 194, 306, 418], LINEY = 318, DASHY = 156;

export function createPriceHistory(stage, { home = { px: 798, py: 700 }, ry = -.038, ramp = 'tijolo', title = 'Histórico de preço', coverTitle = ['Histórico', 'de preço'], months = ['AGO', 'SET', 'OUT', 'NOV'], oldLabel = 'DE 4.000', realLabel = '2.000' } = {}) {
  const T = stage.THREE, R = getRamp(ramp), hm = stage.at(home);
  if (months.length !== 4) throw new Error('the price sheet has four months');
  const group = new T.Group(); group.visible = false; stage.scene.add(group);
  // chart: one question, one line, four points at most; the old price is a dashed line with a "?" and no point
  // the texts of the lower half show only when the flap is within about 6 degrees of flat (kt), so no text is ever read at a foreshortened size
  const chart = dyn(Math.round(LW * CK), Math.round(LH * CK), (g, w, h, kl, kt) => {
    paper(g, w, h, '#f4f2ec', 1.4); g.scale(CK, CK);
    g.fillStyle = MARINHO; [[30, 44, 9, 18], [43, 34, 9, 28], [56, 26, 9, 36]].forEach(([x, y, a, b]) => { rr(g, x, y, a, b, 2); g.fill() });
    txt(g, title, 78, 47, '700 36px P', MARINHO);
    g.strokeStyle = 'rgba(15,23,34,.10)'; g.lineWidth = 2; [DASHY, 237, LINEY].forEach(y => { g.beginPath(); g.moveTo(34, y); g.lineTo(452, y); g.stroke() });
    g.strokeStyle = TINTA; g.lineWidth = 3; g.beginPath(); g.moveTo(34, 368); g.lineTo(452, 368); g.stroke();
    txt(g, oldLabel, 36, 100, '700 36px P', R[3]);
    g.strokeStyle = R[3]; g.lineWidth = 6; g.setLineDash([17, 12]); g.beginPath(); g.moveTo(36, DASHY); g.lineTo(392, DASHY); g.stroke(); g.setLineDash([]);
    g.fillStyle = R[3]; g.beginPath(); g.arc(424, DASHY, 25, 0, 7); g.fill(); txt(g, '?', 424, DASHY + 3, '700 36px P', CLARO, 'center');
    g.save(); g.globalAlpha = kt; if (kt > 0) months.forEach((m, i) => txt(g, m, DOTX[i], 403, '700 36px P', MUTEDL, 'center')); g.restore();
    // the line of the real price is drawn from the first to the last month
    if (kl > 0) {
      const x1 = DOTX[0] + (DOTX[3] - DOTX[0]) * kl; g.strokeStyle = MARINHO; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(DOTX[0], LINEY); g.lineTo(x1, LINEY); g.stroke();
      DOTX.forEach(x => { if (x <= x1 + 1) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, LINEY, 13, 0, 7); g.fill(); g.strokeStyle = MARINHO; g.lineWidth = 8; g.stroke() } });
      if (kt > 0) { g.save(); g.globalAlpha = kt; txt(g, realLabel, 36, 264, '700 44px P', TINTA); g.restore() }
    }
    const sh = g.createLinearGradient(0, LH / 2 - 10, 0, LH / 2 + 10); sh.addColorStop(0, 'rgba(15,23,34,0)'); sh.addColorStop(.5, 'rgba(15,23,34,.13)'); sh.addColorStop(1, 'rgba(15,23,34,0)'); g.fillStyle = sh; g.fillRect(0, LH / 2 - 10, LW, 20);
  });
  chart.upd('0|0', 0, 0);
  // the cover texts fade out in the first 12 percent of the opening, while the flap is still nearly flat
  const cover = dyn(Math.round(LW * CK), Math.round(LH / 2 * CK), (g, w, h, ct) => {
    paper(g, w, h, '#f1efe8', 1.4); g.scale(CK, CK);
    g.fillStyle = MARINHO; [[34, 74, 13, 26], [53, 60, 13, 40], [72, 48, 13, 52]].forEach(([x, y, a, b]) => { rr(g, x, y, a, b, 3); g.fill() });
    g.save(); g.globalAlpha = ct; if (ct > 0) { txt(g, coverTitle[0], 36, 136, '700 46px P', MARINHO); txt(g, coverTitle[1], 36, 184, '700 46px P', MARINHO) } g.restore();
    g.fillStyle = R[4]; g.beginPath(); g.arc(386, 112, 58, 0, 7); g.fill(); g.save(); g.globalAlpha = ct; if (ct > 0) txt(g, '?', 386, 118, '700 84px P', R[1], 'center'); g.restore();
  });
  cover.upd('10', 1);
  const chTop = stage.sheet(chart.t, CW, CH / 2, { region: [0, 0, 1, .5], parent: group, cast: true }); chTop.position.set(0, .003, -CH / 4);
  const flap = new T.Group(); flap.position.y = .004; group.add(flap);
  const curl = k => (sx, tz) => k * .055 * Math.pow(Math.max(0, sx + tz - 1.42) / .58, 2);   // the free right corner lifts a little
  const chBot = stage.sheet(chart.t, CW, CH / 2, { region: [0, .5, 1, 1], seg: [20, 10], parent: flap, cast: true }); chBot.position.set(0, 0, CH / 4);
  const flapUnder = new T.Group(); flapUnder.rotation.x = Math.PI; flap.add(flapUnder);
  const chCov = stage.sheet(cover.t, CW, CH / 2, { seg: [20, 10], parent: flapUnder, cast: false }); chCov.position.set(0, .0012, -CH / 4);
  const flapMid = new T.Object3D(); flapMid.position.set(0, 0, CH / 4); flap.add(flapMid); flapMid.userData.rest = .004;
  chTop.userData.rest = .003; stage.contact(chTop, CW, CH / 2, .012, { th: .004, blur: [.07, .014], alpha: [.4, .55], yawOf: group });
  stage.contact(flapMid, CW, CH / 2, .012, { th: .02, blur: [.08, .016], alpha: [.42, .55], yawOf: group });
  const S = { shown: false, hidden: false, pk: 0, ko: 0, wob: 0, kl: 0 };
  function vis() { group.visible = S.shown && !S.hidden }
  function redraw() {
    const kt = Math.round(clamp((S.ko - .965) / .03) * 10) / 10, ct = Math.round(clamp(1 - S.ko / .12) * 10) / 10, k = Math.round(S.kl * 60);
    chart.upd(k + '|' + kt, k / 60, kt); cover.upd(String(Math.round(ct * 10)), ct);
  }
  function applyFlap() {
    redraw();
    flap.rotation.x = lerp(-Math.PI + .012 + S.pk, -.036, S.ko) + S.wob; flap.position.y = lerp(.0065, .004, S.ko);
    const ck = Math.round(lerp(-1, 1, S.ko) * 20) / 20; if (flap.userData.ck !== ck) { flap.userData.ck = ck; chBot.userData.bend(curl(ck)); chCov.userData.bend((sx, tz) => -curl(ck)(sx, 1 - tz)) }
  }
  group.position.copy(hm); group.rotation.y = ry; applyFlap();
  const price = {
    name: 'price', group, home, world: hm,
    // slides in from the right edge, from under no object: at rest at t0 + d, folded
    // under = the phone: starts at the phone's centre, turned a quarter (yaw 1.571), not drawn before t0, and slides out to its home turning to its yaw.
    // Without `under` it slides in from the right edge. At rest at t0 + d, folded.
    slideIn(t, t0, { under = null, d = .6 } = {}) {
      if (under) { const e = eo((t - t0) / d), P = under.world; S.shown = t >= t0; vis(); group.position.set(lerp(P.x + .375, hm.x, e), 0, lerp(P.z, hm.z, e)); group.rotation.y = lerp(1.571, ry, e); return }
      const kL = eo((t - t0) / d); S.shown = t >= t0; vis(); group.position.set(hm.x + (1 - kL) * 1.7, .14 * Math.pow(1 - kL, 1.5), hm.z - (1 - kL) * .5); group.rotation.y = ry + (1 - kL) * .62 },
    // the closed flap lifts once by 0.3 rad
    peek(t, t0, d = .55) { S.pk = hill((t - t0) / d) * .3; applyFlap() },
    // flap, curl and wobble
    open(t, t0, d = .85) { S.ko = sm((t - t0 + .12) / d); const te = t0 - .12 + d; S.wob = t > te ? .05 * Math.sin((t - te) * 11) * Math.exp(-(t - te) * 5) : 0; applyFlap() },
    drawLine(t, t0, d = 1.05) { S.kl = clamp((t - t0 + .05) / d); redraw() },
    hide(t, t0) { S.hidden = t >= t0; vis() },
    onCh: (lx, ly) => [(lx / LW - .5) * CW, (ly / LH - .5) * CH],
  };
  return stage.register(price);
}

// a small card without words (a printed picture): MESA lines 330 to 337. It pops out of a source, flies to its place, then slides into an envelope.
let printN = 0;
export function createPrint(stage, { draw, home = { px: 728, py: 1056 }, ry = -.11 }) {
  const T = stage.THREE, PRW = .5, PRD = .58, hm = stage.at(home);
  const t = canvasTex(450, 522, (g, w, h) => { paper(g, w, h, '#fbfbf9', .8); g.save(); rr(g, 30, 30, w - 60, h - 60, 8); g.clip(); draw(g, w, h); g.restore() });
  const group = card(stage.rrShape(PRW, PRD, .012), PRW, PRD, .006, t, { side: '#eceef2', rough: .55, parent: stage.scene }); group.userData.rest = .0045; group.visible = false;
  stage.contact(group, PRW, PRD, .012, { th: .006, blur: [.05, .012], alpha: [.4, .55] });
  const S = { pop: null, tuck: null };
  function apply() {
    const p = S.pop; if (!p) return; const { t, t0, src, y0, i } = p, k = clamp((t - t0 - .04) / .6), e = sm(k);
    const tk = S.tuck, kt = tk ? sm((tk.t - tk.t0 - i * .09 + .05) / .55) : 0, eh = tk ? tk.env.world : { x: 0, z: 0 }, yb = .0045 + i * .0062;
    group.visible = t >= t0 + .04;
    group.position.set(lerp(lerp(src.x, hm.x, e), eh.x + (i ? .05 : -.06), kt), lerp(y0, yb, e) + .55 * hill(k), lerp(lerp(src.z, hm.z, e), eh.z + .015, kt));
    group.userData.shOp = 1 - kt; group.rotation.y = lerp(ry + (1 - e) * .7, i ? .02 : -.03, kt); group.scale.setScalar(.35 + .65 * back(k / .8));
  }
  const print = {
    name: 'print' + (printN++), group, home,
    pop(t, t0, from, y0, i) { S.pop = { t, t0, src: from, y0, i }; apply() },
    tuck(t, t0, envelope, i) { S.tuck = { t, t0, env: envelope }; apply() },
  };
  return stage.register(print);
}

export function selfTest(stage) {
  stage.camKey(0, 'base', { cut: true });
  const ph = createPhone(stage), p = createPriceHistory(stage);
  const pr = createPrint(stage, { draw: (g, w, h) => { g.fillStyle = '#e3e6ec'; g.fillRect(0, 0, w, h); g.fillStyle = MARINHO; g.fillRect(0, 0, w, 104); g.fillStyle = mixc(MARINHO, CLARO, .5); g.fillRect(100, 160, 250, 150) } });
  const frame = t => { p.slideIn(t, .3, { under: ph }); p.peek(t, 1.0); p.open(t, 1.7); p.drawLine(t, 2.1); pr.pop(t, 3.0, p.world, .06, 0); pr.tuck(t, 99, p, 0) };
  return { dur: 4, frame, times: [.2, .6, 1.2, 1.9, 2.4, 3.3, 3.8] };
}
