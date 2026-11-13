// Cover plate (kit-plan section 5). The page side of tools/kit_cover.js: window.KIT.cover({headline, hi, ramp, pos}) hides the caption and the bar,
// hides the story card and the citation when a headline is given, and fills #thumb: Poppins Bold, #F2F4F7, the `hi` words in the ramp tone 4,
// at most two lines, the largest size from 168 down to 120 px that fits, line height 1.08, on a plate rgba(10,12,16,0.92), radius 28, padding 28, left 70.
// Badge rule: the plate keeps 24 px from #badge on every side.
// Fit rule: the whole plate (text plus padding) is at most 940 px wide, so it ends at x 1010 and stays inside the cover window x 35 to 1045.
import { ramp as getRamp, } from './palette.js';
import { measure } from './text.js';
import { norm } from './timing.js';

const PAD = 28, LEFT = 70, MAXW = 940;
export function cover({ headline = null, hi = null, ramp = 'ambar', pos = 'top' } = {}) {
  const $ = id => document.getElementById(id);
  for (const id of ['cap', 'bar']) $(id).style.display = 'none';
  if (!headline) return null;
  for (const id of ['hd', 'cite']) $(id).style.display = 'none';
  const words = headline.trim().split(/\s+/), tone4 = getRamp(ramp)[4], hiSet = new Set((hi || '').split(/\s+/).filter(Boolean).map(norm));
  let pick = null;
  for (let fs = 168; fs >= 120 && !pick; fs -= 4) {
    const font = '700 ' + fs + 'px P', lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (cur && measure(font, t) > MAXW - 2 * PAD) { lines.push(cur); cur = w } else cur = t }
    lines.push(cur);
    const wd = Math.max(...lines.map(l => measure(font, l)));
    if (lines.length <= 2 && wd <= MAXW - 2 * PAD) pick = { fs, lines, wd };
  }
  if (!pick) throw new Error('the headline does not fit in two lines of at most 940 px plate width at 120 px');
  const lh = pick.fs * 1.08, w = Math.ceil(pick.wd) + 2 * PAD, h = Math.round(pick.lines.length * lh + 2 * PAD);
  // the plate stays at least 24 px clear of the badge box (#badge) on every side: with pos bottom the plate bottom moves up as needed; if it still cannot clear, it is an error (the tool exits 4)
  const bd = $('badge').getBoundingClientRect(), hasBadge = bd.width > 0 && getComputedStyle($('badge')).display !== 'none', GAP = 24;
  const top = pos === 'bottom' ? Math.min(1600, hasBadge ? bd.top - GAP : 1600) - h : 320, th = $('thumb');
  if (hasBadge && !(LEFT + w <= bd.left - GAP || LEFT >= bd.right + GAP || top + h <= bd.top - GAP || top >= bd.bottom + GAP)) throw new Error('the plate is less than 24 px from the badge');
  th.innerHTML = pick.lines.map(l => '<div>' + l.split(' ').map(x => hiSet.has(norm(x)) ? '<span style="color:' + tone4 + '">' + x + '</span>' : x).join(' ') + '</div>').join('');
  Object.assign(th.style, { display: 'block', left: LEFT + 'px', top: top + 'px', width: w + 'px', height: h + 'px', padding: PAD + 'px', fontSize: pick.fs + 'px', lineHeight: lh + 'px' });
  return { x0: LEFT, y0: top, x1: LEFT + w, y1: top + h, fs: pick.fs, lines: pick.lines };
}

// window.KIT: what the page tools call (kit_cover.js, kit_zones.js)
export function installKit(stage) {
  window.KIT = { version: stage.version, stage, cover, bbox: name => stage.bboxOf(name) };
  window.TEXTRECTS = () => stage.textRects();
  window.CAMSTATE = () => stage.camState();
}
