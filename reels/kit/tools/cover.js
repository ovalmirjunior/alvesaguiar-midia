// Cover frame for reelPR2: serves <labrig> plus three 0.169.0 in-process, sets t, hides the word-caption pill (#cap), saves a 1080x1920 JPEG.
// usage: NODE_PATH=/Users/valmirjunior/dev/vjmecha/node_modules node cover.js <labrig> <out.jpg> <t seconds> <quality>
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [labrig, out, tArg, qArg] = process.argv.slice(2);
const THREE_ROOT = '/Users/valmirjunior/dev/vision/scratch/fable-reel-objetos/preview';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  const base = u.startsWith('/node_modules/') ? THREE_ROOT : labrig;
  const f = path.join(base, path.normalize(u));
  if (!f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port; const errs = [];
  const b = await chromium.launch({ args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
  try {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('requestfailed', q => errs.push('requestfailed: ' + q.url()));
    await p.goto(`http://127.0.0.1:${port}/mesa.html`);
    await p.waitForFunction('window.READY === true', null, { timeout: 180000 });
    await p.addStyleTag({ content: '#cap{display:none !important}' });
    await p.evaluate(t => window.setT(t), Number(tArg));
    const capShown = await p.evaluate(() => getComputedStyle(document.getElementById('cap')).display);
    await p.screenshot({ path: out, type: 'jpeg', quality: Number(qArg || 95) });
    const renderer = await p.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); const e = c && c.getExtension('WEBGL_debug_renderer_info'); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
    console.log(JSON.stringify({ t: Number(tArg), out, cap_display: capShown, renderer, errors: errs }));
  } finally { await b.close(); srv.close(); }
});
