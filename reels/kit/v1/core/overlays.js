// DOM overlays of a Reel (MESA lines 50 to 63, 385 to 457, 461 to 465): progress bar, story card, word caption, citation pill, badge, end card, cover plate.
// They are moved by layout properties, never by CSS transforms (a transformed text layer is drawn from a cached raster that depends on earlier frames).
// Ids: bar, hd (ttl, rule), cap (pill), cite (citet), badge, end, thumb.
import { clamp, eo, back } from './timing.js';
import { ramp, mixc } from './palette.js';
import { measure } from './text.js';

const MARK = (w, s) => `<svg width="${w}" height="${w}" viewBox="0 0 112 112" fill="none"><path d="M12 96 L56 14 L100 96" stroke="${s[0]}" stroke-width="${s[1]}" stroke-linejoin="miter"/><path d="M34 96 L56 54 L78 96" stroke="${s[0]}" stroke-width="${s[1]}" stroke-linejoin="miter"/><path d="M42 80 L70 80" stroke="${s[0]}" stroke-width="${s[1]}"/></svg>`;
const SIGN = '<svg width="104" height="104" viewBox="0 0 112 112" fill="none"><path d="M12 16 L56 98 L100 16" stroke="#9DB4D6" stroke-width="5" stroke-linejoin="miter"/><path d="M40 52 L56 20 L72 52" stroke="#9DB4D6" stroke-width="5" stroke-linejoin="miter"/><path d="M45 42 L67 42" stroke="#9DB4D6" stroke-width="5"/></svg>';

export function createOverlays(stage, { pairs = [], end = {} } = {}) {
  const C = stage.cues, SEG = C.segments, END = C.END, fx = C.fx, seg = C.seg;
  if (C.DUR - END < 2.4) throw new Error('the end card must hold at least 2.4 s: dur - end_t = ' + (C.DUR - END));
  const body = document.body;
  body.insertAdjacentHTML('beforeend', `<div class="bar" id="bar"></div>
<div class="hd" id="hd"><div class="ttl" id="ttl"></div><div class="rule" id="rule"></div></div>
<div class="cap" id="cap"><span class="pill" id="pill"></span></div>
<div class="cite" id="cite"><span id="citet"></span></div>
<div class="badge" id="badge">${MARK(58, ['#F2F4F7', 7])}</div>
<div class="end" id="end">
 <div class="ehead f" data-d="0">${MARK(88, ['#9DB4D6', 6])}<span>Alves Aguiar Advocacia</span></div>
 <div class="erule f" data-d="0"></div>
 <div class="elabel f" data-d=".12"></div>
 <h1 class="f" data-d=".2"></h1>
 <div class="edisc f" data-d=".34">Conteúdo informativo. Não substitui a análise de um caso concreto.</div>
 <div class="esign f" data-d=".46">${SIGN}<div><div class="nm">Valmir Aguiar</div><div class="oab">OAB/CE 33.267</div></div><div class="url">alvesaguiar.adv.br</div></div>
</div>
<div id="thumb"></div>`);
  const $ = id => document.getElementById(id);
  { // end card background: the CSS radial-gradient of MESA line 33 drawn once into an image
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const g = c.getContext('2d');
    const rx = 1.2 * 1080, ry = .7 * 1920, gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, '#24497f'); gr.addColorStop(.55, '#1F3F6E'); gr.addColorStop(1, '#183358');
    g.setTransform(1, 0, 0, ry / rx, 540, .38 * 1920); g.fillStyle = gr; g.fillRect(-540 - 1, -(.38 * 1920) * rx / ry - 1, 1082, 1920 * rx / ry + 2);
    $('end').style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')'; $('end').style.backgroundSize = '1080px 1920px';
  }
  function endCard({ label = 'Direito do consumidor', headline = ['Mande para', 'quem vai', 'comprar.'], em = 'comprar.' } = {}) {
    document.querySelector('#end .elabel').textContent = label;
    const h = document.querySelector('#end h1'); h.textContent = '';
    headline.forEach((l, i) => { if (i) h.appendChild(document.createElement('br')); if (l === em) { const e = document.createElement('em'); e.textContent = l; h.appendChild(e) } else h.appendChild(document.createTextNode(l)) });
  }
  endCard(end);
  const SR = SEG.map(g => ramp(g.ramp || 'ambar'));
  const mw = (t, px) => measure('700 ' + px + 'px P', t);
  // caption phrases: up to three spoken words, the word being said is lit
  const PHR = []; SEG.forEach((g, si) => {
    let cur = []; const flush = () => { if (cur.length) { PHR.push({ w: cur, si }); cur = [] } };
    g.words.forEach((w, j) => { const pair = pairs.some(([a, b]) => a.test(w[2]) && g.words[j + 1] && b.test(g.words[j + 1][2])); if (cur.length && (cur.length >= 3 || (pair && cur.length >= 2) || mw(cur.map(x => x[2]).join(' ') + ' ' + w[2], 86) > 760)) flush(); cur.push(w); if (/[.,?!;:]$/.test(w[2])) flush() }); flush();
  });
  PHR.forEach((p, i) => { const e = p.w[p.w.length - 1][1], n = PHR[i + 1]; p.t0 = p.w[0][0] - .04; p.t1 = n && n.w[0][0] - .04 - e < .45 ? n.w[0][0] - .04 : e + .3; p.fs = Math.min(86, Math.floor(86 * 770 / mw(p.w.map(x => x[2]).join(' '), 86))) });
  // story cards: one line, the "hi" words in tone 4 of the beat's ramp
  const CARDS = []; SEG.forEach((g, si) => (g.cards || []).forEach(c => {
    const t = c.t !== undefined ? c.t : c.at ? fx(g.id, c.at) - .06 : (si ? g.t0 + .25 : -1), i = c.hi ? c.text.lastIndexOf(c.hi) : -1, col = SR[si][4];
    CARDS.push({ t, col, fs: Math.min(92, Math.floor(92 * 950 / mw(c.text, 92))), html: i < 0 ? c.text : c.text.slice(0, i) + '<b style="color:' + col + '">' + c.hi + '</b>' + c.text.slice(i + c.hi.length) });
  }));
  // progress bar: one cell per story beat, each fills while its beat plays
  const BAR = (C.bar || SEG.map(g => [g.id, null])).map(([id, k]) => ({ t: k ? fx(id, k) - .06 : seg(id).t0, R: ramp(seg(id).ramp || 'ambar') })); BAR[0].t = 0;
  $('bar').innerHTML = BAR.map(() => '<i><b></b></i>').join(''); const fills = [...document.querySelectorAll('#bar b')];
  const ENDF = [...document.querySelectorAll('#end .f')];
  // citation pills: appear at fx(cite_at) - 0.10 (or 0.25 s into the segment), leave at cite_t1 (or 0.35 s into the next segment)
  const CITE = SEG.filter(g => g.cite).map((g, k) => { const gi = SEG.indexOf(g), nx = SEG[gi + 1];
    return { text: g.cite, t0: g.cite_at ? fx(g.id, g.cite_at) - .10 : g.t0 + .25, t1: g.cite_t1 ?? (nx ? Math.min(END, nx.t0 + .35) : END) } });

  // an opacity under 0.002 is written as 0: a value like 1e-15 is painted differently depending on the layer the element had before
  const op = v => v < .002 ? 0 : v;
  function update(t) {
    const ke = clamp((t - END) / .2), live = ke < 1;
    { let i = 0; while (i < CARDS.length - 1 && t >= CARDS[i + 1].t) i++; const c = CARDS[i], n = CARDS[i + 1], hd = $('hd'), tt = $('ttl');
      if (c) {
        if (hd.dataset.k !== String(i)) { hd.dataset.k = String(i); tt.innerHTML = c.html; tt.style.fontSize = c.fs + 'px'; $('rule').style.background = c.col }
        const k = eo((t - c.t) / .3) * clamp(((n ? n.t : END) - t) / .14) * (1 - clamp(stage.pushK(t) / .06));
        hd.style.opacity = live ? op(k) : 0; tt.style.top = ((1 - eo((t - c.t) / .3)) * 24) + 'px'; $('rule').style.width = (200 * eo((t - c.t - .1) / .4)) + 'px';
      } else hd.style.opacity = 0 }
    BAR.forEach((b, i) => { const n = BAR[i + 1] ? BAR[i + 1].t : END, k = clamp((t - b.t) / (n - b.t)); fills[i].style.width = (100 * k) + '%'; fills[i].style.background = mixc(b.R[4], b.R[3], clamp((t - n) / .4)) });
    $('bar').style.opacity = live ? op(clamp((t + .3) / .25)) : 0;
    { const c = live && CITE.find(c => t >= c.t0 && t < c.t1), ct = $('cite');
      if (c) { const sp = $('citet'), sc = .84 + .16 * back((t - c.t0) / .3); sp.textContent = c.text; sp.style.fontSize = (42 * sc) + 'px'; sp.style.top = ((1 - sc) * 35) + 'px'; ct.style.opacity = op(clamp((c.t1 - t) / .15)) } else ct.style.opacity = 0 }
    { const pi = live ? PHR.findIndex(p => t >= p.t0 && t < p.t1) : -1, cap = $('cap'), pill = $('pill');
      if (pi >= 0) { const p = PHR[pi]; if (pill.dataset.k !== String(pi)) { pill.innerHTML = p.w.map(w => '<span>' + w[2] + '</span>').join(' '); pill.dataset.k = String(pi); pill.style.setProperty('--on', SR[p.si][4]) }
        let act = 0; p.w.forEach((w, j) => { if (t >= w[0] - .03) act = j }); [...pill.children].forEach((sp, j) => { sp.className = j === act ? 'on' : (j < act ? 'past' : 'next') });
        const sc = .9 + .1 * back((t - p.t0) / .18); pill.style.fontSize = (p.fs * sc) + 'px'; pill.style.top = ((1 - sc) * p.fs * .73) + 'px'; cap.style.opacity = 1 } else cap.style.opacity = 0 }
    $('badge').style.opacity = live ? .6 : 0;
    const en = $('end'); en.style.display = ke > 0 ? 'block' : 'none'; en.style.opacity = op(ke);
    ENDF.forEach(e => { const k = eo((t - END - .1 - (+e.dataset.d)) / .5); e.style.opacity = op(k); e.style.marginTop = ((1 - k) * 18) + 'px' });
  }

  // DOM text lines in page pixels, `px` = computed font size of the text's parent
  function rects() {
    const out = [], endOn = +$('end').style.opacity >= .99;
    const shown = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || +cs.opacity < .05) return false } return true };
    for (const id of ['hd', 'cap', 'cite', 'end', 'thumb']) {
      const el = $(id); if (id !== 'end' && endOn) continue;
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
      while ((n = tw.nextNode())) {
        if (!n.textContent.trim() || !shown(n.parentElement)) continue;
        const rg = document.createRange(); rg.selectNodeContents(n); const px = parseFloat(getComputedStyle(n.parentElement).fontSize);
        for (const q of rg.getClientRects()) if (q.width > 1) out.push({ src: id, comp: id, text: n.textContent.trim().slice(0, 40), x0: q.left, y0: q.top, x1: q.right, y1: q.bottom, px });
      }
    }
    return { list: out, endOn };
  }
  const o = { endCard, update, rects, ramps: SR, phrases: PHR, cards: CARDS, cites: CITE }; stage.overlay = o; return o;
}
