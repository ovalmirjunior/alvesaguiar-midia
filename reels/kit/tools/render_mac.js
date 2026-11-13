// Common Mac render for the builder test: serves <labrig> plus three 0.169.0 (from the reelPR v1 preview folder) in-process,
// renders every frame of the scene at 24 fps in time order to <outdir>/%05d.jpg (JPEG quality 90, as the lab render) and prints one JSON line.
// usage: NODE_PATH=/Users/valmirjunior/dev/vjmecha/node_modules node render_mac.js <labrig> <outdir>
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [labrig, out] = process.argv.slice(2);
const THREE_ROOT = '/Users/valmirjunior/dev/vision/scratch/fable-reel-objetos/preview';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.hdr': 'application/octet-stream' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  const base = u.startsWith('/node_modules/') ? THREE_ROOT : labrig;
  const f = path.join(base, path.normalize(u));
  if (!f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port; const errs = [];
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
  try {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    p.on('requestfailed', q => errs.push('requestfailed: ' + q.url()));
    await p.goto(`http://127.0.0.1:${port}/mesa.html`);
    await p.waitForFunction('window.READY === true', null, { timeout: 180000 });
    const renderer = await p.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
      if (!c) return 'no webgl'; const e = c.getExtension('WEBGL_debug_renderer_info'); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : c.getParameter(c.RENDERER); });
    const dur = await p.evaluate('window.DUR'); const n = Math.ceil(dur * 24); const t0 = Date.now();
    for (let f = 0; f < n; f++) {
      await p.evaluate(t => window.setT(t), f / 24);
      await p.screenshot({ path: path.join(out, String(f).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 90 });
    }
    const s = (Date.now() - t0) / 1000;
    console.log(JSON.stringify({ renderer, dur, frames: n, seconds: +s.toFixed(1), sec_per_frame: +(s / n).toFixed(3), errors: errs }));
  } finally { await b.close(); srv.close(); }
});
