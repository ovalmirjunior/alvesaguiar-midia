// Render every frame (or every <step>th) of a kit page at 24 fps to <outdir>/%05d.jpg (JPEG quality 90, as the lab render), in time order.
// File names carry the true frame number, so with --step 24 the files are 00000, 00024, 00048, ...
// usage: NODE_PATH=/Users/valmirjunior/dev/vjmecha/node_modules node kit_render.js <labrig> <outdir> [--query q] [--step n] [--page mesa.html]
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const K = require('./kit_serve.js');
const { pos: [labrig, out], opt } = K.args(process.argv.slice(2));
const page = opt.page || 'mesa.html', step = Math.max(1, Number(opt.step || 1));
K.requirePin(labrig, page);
const srv = K.serve(labrig);
srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port; const errs = [];
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: K.launchArgs });
  try {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    p.on('requestfailed', q => errs.push('requestfailed: ' + q.url()));
    p.on('response', r => { if (r.status() >= 400) errs.push('http ' + r.status() + ': ' + r.url()); });
    await p.goto(K.pageUrl(port, page, opt.query));
    await p.waitForFunction('window.READY === true', null, { timeout: 180000 });
    const renderer = await p.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
      if (!c) return 'no webgl'; const e = c.getExtension('WEBGL_debug_renderer_info'); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : c.getParameter(c.RENDERER); });
    const dur = await p.evaluate('window.DUR'); const n = Math.ceil(dur * 24); const t0 = Date.now(); let written = 0;
    for (let f = 0; f < n; f += step) {
      await p.evaluate(t => window.setT(t), f / 24);
      await p.screenshot({ path: path.join(out, String(f).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 90 }); written++;
    }
    const s = (Date.now() - t0) / 1000;
    console.log(JSON.stringify({ renderer, dur, frames: written, step, seconds: +s.toFixed(1), sec_per_frame: +(s / written).toFixed(3), errors: errs }));
  } finally { await b.close(); srv.close(); }
});
