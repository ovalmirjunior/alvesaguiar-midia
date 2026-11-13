// Icon column scan (kit-plan section 4): renders every <step>th frame twice, text on and text off, as PNG, crops x 886 to 1080 and y 940 to 1846,
// and counts the pixels where any channel differs by more than 8. Pass: 0 pixels in every sampled frame.
// The text-off page is the same page with ?notext=1 added to the query.
// usage: NODE_PATH=/Users/valmirjunior/dev/vjmecha/node_modules node kit_iconscan.js <labrig> <out.json> [--step 2] [--page mesa.html] [--query q]
// Prints one JSON line {page, step, frames_sampled, max_pixels, frames_with_pixels, errors}.
const fs = require('fs');
const { chromium } = require('playwright');
const K = require('./kit_serve.js');
const { pos: [labrig, out], opt } = K.args(process.argv.slice(2));
const page = opt.page || 'mesa.html', STEP = Math.max(1, Number(opt.step || 2)), query = opt.query || '';
K.requirePin(labrig, page);
const CLIP = { x: 886, y: 940, width: 194, height: 906 };
const srv = K.serve(labrig);
srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port; const errs = [];
  const b = await chromium.launch({ args: K.launchArgs });
  const open = async q => {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    p.on('requestfailed', r => errs.push('requestfailed: ' + r.url())); p.on('response', r => { if (r.status() >= 400) errs.push('http ' + r.status() + ': ' + r.url()); });
    await p.goto(K.pageUrl(port, page, q)); await p.waitForFunction('window.READY === true', null, { timeout: 180000 }); return p;
  };
  try {
    const pOn = await open(query), pOff = await open((query ? query + '&' : '') + 'notext=1');
    const dur = await pOn.evaluate('window.DUR'), n = Math.ceil(dur * 24), res = []; let sampled = 0, maxPx = 0;
    for (let f = 0; f < n; f += STEP) {
      const t = f / 24; await pOn.evaluate(x => window.setT(x), t); await pOff.evaluate(x => window.setT(x), t);
      const a = (await pOn.screenshot({ type: 'png', clip: CLIP })).toString('base64'), c = (await pOff.screenshot({ type: 'png', clip: CLIP })).toString('base64');
      const cnt = await pOn.evaluate(async ([x, y]) => {
        const load = s => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = 'data:image/png;base64,' + s });
        const [A, B] = await Promise.all([load(x), load(y)]); const d = im => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, c.width, c.height).data };
        const da = d(A), db = d(B); let k = 0; for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) > 8 || Math.abs(da[i + 1] - db[i + 1]) > 8 || Math.abs(da[i + 2] - db[i + 2]) > 8) k++; return k;
      }, [a, c]);
      sampled++; maxPx = Math.max(maxPx, cnt); if (cnt) res.push({ frame: f, t: +t.toFixed(3), pixels: cnt });
    }
    fs.writeFileSync(out, JSON.stringify({ page, query, step: STEP, frames_sampled: sampled, max_pixels: maxPx, frames_with_pixels: res, errors: errs }, null, 1));
    console.log(JSON.stringify({ page, step: STEP, frames_sampled: sampled, max_pixels: maxPx, frames_with_pixels: res.length, errors: errs.length }));
  } finally { await b.close(); srv.close(); }
});
