// Draw functions for the phone glass (MESA lines 216 to 248). The Reel fills them with words; every text is 104 canvas px or more
// (37.5 px on screen at the base shot), the floor of the kit.
import { NOITE, CLARO, TINTA, MUTEDL, MARINHO, mixc, ramp as getRamp } from '../core/palette.js';
import { txt, rr } from '../core/text.js';

// a small picture on the product card: a screen on a stand with a sun in the ramp tone 4
export function drawTV(g, x, y, w, h, R = getRamp('ambar')) {
  g.fillStyle = 'rgba(15,23,34,.13)'; g.beginPath(); g.ellipse(x + w / 2, y + h + 96, w * .44, 18, 0, 0, 7); g.fill();
  g.fillStyle = '#232d3b'; g.fillRect(x + w / 2 - 30, y + h - 6, 60, 74); g.fillStyle = '#161f2b'; rr(g, x + w * .3, y + h + 62, w * .4, 20, 10); g.fill();
  g.fillStyle = TINTA; rr(g, x, y, w, h, 20); g.fill();
  g.save(); rr(g, x + 14, y + 14, w - 28, h - 32, 8); g.clip();
  g.fillStyle = mixc(MARINHO, CLARO, .5); g.fillRect(x, y, w, h);
  g.fillStyle = R[4]; g.beginPath(); g.arc(x + w * .7, y + h * .36, h * .13, 0, 7); g.fill();
  g.fillStyle = mixc(MARINHO, CLARO, .22); g.beginPath(); g.moveTo(x, y + h * .72); g.quadraticCurveTo(x + w * .3, y + h * .38, x + w * .58, y + h * .7); g.quadraticCurveTo(x + w * .8, y + h * .5, x + w, y + h * .64); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.fill();
  g.fillStyle = MARINHO; g.beginPath(); g.moveTo(x, y + h * .86); g.quadraticCurveTo(x + w * .42, y + h * .6, x + w * .74, y + h * .84); g.quadraticCurveTo(x + w * .9, y + h * .74, x + w, y + h * .8); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.fill();
  g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(x + w * .08, y); g.lineTo(x + w * .34, y); g.lineTo(x + w * .12, y + h); g.lineTo(x - w * .14, y + h); g.fill();
  g.restore();
}

// store page. Marinho top bar with no words (no clock, no carrier), one picture, one product name, two prices, one button.
// u1 and u2 (0..1): the two underlines (under the struck price, under the plate); banner: null, or a string that slides in (kb 0..1); no badge on the glass by default.
export function storePage(g, w, h, { store = 'Loja Online', product = 'Smart TV 4K', from = 'de R$ 4.000', to = ['por', 'R$ 2.000'], cta = 'Comprar', ramp = 'ambar', u1 = 0, u2 = 0, picture = drawTV, banner = null, kb = 1 } = {}) {
  const R = getRamp(ramp);
  g.fillStyle = CLARO; g.fillRect(0, 0, w, h);
  g.fillStyle = MARINHO; g.fillRect(0, 0, w, 318);
  g.fillStyle = '#000'; rr(g, w / 2 - 170, 44, 340, 98, 49); g.fill(); g.fillStyle = '#0c1626'; g.beginPath(); g.arc(w / 2 + 104, 93, 24, 0, 7); g.fill(); g.fillStyle = '#1b2c4a'; g.beginPath(); g.arc(w / 2 + 104, 93, 11, 0, 7); g.fill();
  g.fillStyle = CLARO; [0, 1, 2, 3].forEach(i => { rr(g, 96 + i * 24, 112 - i * 12 - 22, 15, 22 + i * 12, 4); g.fill() });
  rr(g, w - 196, 70, 84, 44, 12); g.lineWidth = 5; g.strokeStyle = CLARO; g.stroke(); rr(g, w - 188, 78, 54, 28, 6); g.fill(); rr(g, w - 106, 84, 8, 16, 3); g.fill();
  g.lineCap = 'round'; g.lineWidth = 11; g.strokeStyle = CLARO; [0, 1, 2].forEach(i => { g.beginPath(); g.moveTo(66, 206 + i * 30); g.lineTo(138, 206 + i * 30); g.stroke() });
  g.fillStyle = 'rgba(242,244,247,.16)'; rr(g, 186, 188, w - 186 - 250, 104, 52); g.fill(); g.lineWidth = 9; g.beginPath(); g.arc(248, 236, 19, 0, 7); g.stroke(); g.beginPath(); g.moveTo(263, 251); g.lineTo(280, 268); g.stroke();
  g.lineWidth = 10; g.lineJoin = 'round'; g.beginPath(); g.moveTo(w - 196, 200); g.lineTo(w - 172, 200); g.lineTo(w - 152, 262); g.lineTo(w - 84, 262); g.lineTo(w - 70, 216); g.lineTo(w - 166, 216); g.stroke();
  g.beginPath(); g.arc(w - 146, 288, 9, 0, 7); g.arc(w - 92, 288, 9, 0, 7); g.fill();
  g.fillStyle = '#e3e6ec'; g.fillRect(0, 318, w, 950);
  picture(g, 160, 500, 840, 500, R);
  if (banner && kb > 0) { g.save(); g.beginPath(); g.rect(0, 318, w, 150); g.clip(); g.translate(0, -150 * (1 - kb)); g.fillStyle = NOITE; g.fillRect(0, 318, w, 150); txt(g, banner, 70, 397, '700 104px P', R[4], 'left', '6px'); g.restore() }
  txt(g, store, 70, 1316, '700 104px P', MARINHO); txt(g, product, 70, 1430, '700 104px HG', TINTA);
  const wd = txt(g, from, 70, 1566, '700 104px P', MUTEDL); g.fillStyle = MUTEDL; g.fillRect(60, 1562, wd + 20, 9);
  if (u1 > 0) { g.fillStyle = R[3]; rr(g, 64, 1628, (wd + 12) * u1, 16, 8); g.fill() }
  g.fillStyle = R[4]; rr(g, 54, 1690, 1052, 290, 44); g.fill();
  const w1 = txt(g, to[0], 100, 1846, '700 104px P', R[2]); txt(g, to[1], 100 + w1 + 34, 1838, '700 186px P', R[1]);
  if (u2 > 0) { g.fillStyle = R[1]; rr(g, 100, 1938, (1052 - 92) * u2, 16, 8); g.fill() }
  g.fillStyle = MARINHO; rr(g, 54, 2060, 1052, 230, 56); g.fill(); txt(g, cta, w / 2, 2180, '700 104px P', CLARO, 'center');
  g.fillStyle = 'rgba(15,23,34,.35)'; rr(g, w / 2 - 190, h - 64, 380, 18, 9); g.fill();
}
