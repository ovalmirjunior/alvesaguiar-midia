// Safe-zone check of every text box (DOM and 3D) on every frame (kit-plan sections 4 and 7). Runs with window.NO_RENDER: the page moves the scene and the camera
// for each frame without drawing it. A break: y0 < 260, or y1 > 1700, or x1 > 886 while the box overlaps y 940 to 1846, or px < 34,
// or crane_text: any 3D text box with a part inside the frame while window.CAMSTATE().crane is true (a camera travel is changing tz, dist or tilt).
// usage: NODE_PATH=/Users/valmirjunior/dev/vjmecha/node_modules node kit_zones.js <labrig> <out.json> [--query q] [--step n] [--page mesa.html]
// Prints one JSON line: {query, page, dur, frames, rects, rects_3d, extent, breaks, min_px, min_px_by_comp, errors}. The out.json holds the first 60 breaks and a per-text summary.
const fs = require('fs');
const { chromium } = require('playwright');
const K = require('./kit_serve.js');
const { pos: [labrig, out], opt } = K.args(process.argv.slice(2));
const page = opt.page || 'mesa.html', STEP = Math.max(1, Number(opt.step || 1)), query = opt.query || '';
K.requirePin(labrig, page);
const srv = K.serve(labrig);
srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port; const errs = [];
  const b = await chromium.launch({ args: K.launchArgs });
  try {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    p.on('requestfailed', q => errs.push('requestfailed: ' + q.url()));
    p.on('response', r => { if (r.status() >= 400) errs.push('http ' + r.status() + ': ' + r.url()); });
    await p.addInitScript(() => { window.NO_RENDER = true; });
    await p.goto(K.pageUrl(port, page, query));
    await p.waitForFunction('window.READY === true', null, { timeout: 180000 });
    const dur = await p.evaluate('window.DUR'); const n = Math.ceil(dur * 24);
    const bad = []; let rects = 0, r3d = 0, minPx = 1e9; const minComp = {}, seen = {};
    const ext = { minY: 1e9, maxY: -1e9, maxX1InBand: -1e9 };
    for (let f = 0; f < n; f += STEP) {
      const { rs, cs } = await p.evaluate(t => { window.setT(t); return { rs: window.TEXTRECTS(), cs: window.CAMSTATE ? window.CAMSTATE() : null }; }, f / 24);
      const crane = !!(cs && cs.crane);
      for (const q of rs) {
        rects++; if (q.src === '3d') r3d++;
        const band = q.y1 > 940 && q.y0 < 1846, px = q.px == null ? 1e9 : q.px;
        minPx = Math.min(minPx, px); minComp[q.comp] = Math.min(minComp[q.comp] ?? 1e9, px);
        const k = q.src + ':' + q.comp + ':' + q.text, s = seen[k] || (seen[k] = { minY: 1e9, maxY: -1e9, maxX1InBand: -1e9, minPx: 1e9, frames: 0 });
        s.frames++; s.minY = Math.min(s.minY, Math.round(q.y0)); s.maxY = Math.max(s.maxY, Math.round(q.y1)); s.minPx = Math.min(s.minPx, +px.toFixed(1)); if (band) s.maxX1InBand = Math.max(s.maxX1InBand, Math.round(q.x1));
        ext.minY = Math.min(ext.minY, q.y0); ext.maxY = Math.max(ext.maxY, q.y1); if (band) ext.maxX1InBand = Math.max(ext.maxX1InBand, q.x1);
        const why = []; if (q.y0 < 260) why.push('y0<260'); if (q.y1 > 1700) why.push('y1>1700'); if (band && q.x1 > 886) why.push('x1>886'); if (px < 34) why.push('px<34');
        if (crane && q.src === '3d') why.push('crane_text');
        if (why.length) bad.push({ frame: f, t: +(f / 24).toFixed(3), why: why.join(','), ...q });
      }
    }
    const rd = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v >= 1e9 ? null : +v.toFixed(1)]));
    fs.writeFileSync(out, JSON.stringify({ query, page, dur, frames: n, step: STEP, rects, rects_3d: r3d, extent: ext, breaks: bad.length, first_breaks: bad.slice(0, 60), min_px: minPx, min_px_by_comp: rd(minComp), texts: seen, errors: errs }, null, 1));
    console.log(JSON.stringify({ query, page, dur, frames: n, step: STEP, rects, rects_3d: r3d, extent: ext, breaks: bad.length, min_px: minPx >= 1e9 ? null : +minPx.toFixed(1), min_px_by_comp: rd(minComp), errors: errs.length }));
  } finally { await b.close(); srv.close(); }
});
