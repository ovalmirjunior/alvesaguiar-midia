// Safe-zone measure of the DOM text of a setT(t) scene at every frame (24 fps), on the Mac.
// For each frame, every visible element with its own text node gets its client rects (one per text line);
// a rect breaks the zones when y < 260, or y > 1700, or (x2 > 886 and the rect overlaps y 940 to 1846).
// Text drawn inside the WebGL canvas is not DOM; it is checked on the frames by eye.
// usage: NODE_PATH=/Users/valmirjunior/dev/vjmecha/node_modules node measure.js <labrig> <out.json> [step frames, default 4]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [labrig, outFile] = process.argv.slice(2); const STEP = Number(process.argv[4] || 4);
const THREE_ROOT = '/Users/valmirjunior/dev/vision/scratch/fable-reel-objetos/preview';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  const base = u.startsWith('/node_modules/') ? THREE_ROOT : labrig;
  const f = path.join(base, path.normalize(u));
  if (!f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port; const errs = [];
  const b = await chromium.launch({ args: ['--ignore-gpu-blocklist'] });
  try {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    await p.goto(`http://127.0.0.1:${port}/mesa.html`);
    await p.waitForFunction('window.READY === true', null, { timeout: 120000 });
    const dur = await p.evaluate('window.DUR'); const n = Math.ceil(dur * 24);
    const bad = []; let rects = 0; const ext = { minY: 1e9, maxY: -1e9, maxX2InBand: -1e9 };
    for (let f = 0; f < n; f += STEP) {
      await p.evaluate(t => window.setT(t), f / 24);
      const rs = await p.evaluate(() => {
        const out = []; const W = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let nd; while ((nd = W.nextNode())) {
          if (!nd.textContent.trim()) continue; const el = nd.parentElement; let e = el, vis = true, op = 1;
          while (e) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') { vis = false; break; } op *= Number(cs.opacity); e = e.parentElement; }
          if (!vis || op < 0.05) continue;
          const rg = document.createRange(); rg.selectNodeContents(nd);
          for (const r of rg.getClientRects()) if (r.width > 0 && r.height > 0 && r.right > 0 && r.left < 1080 && r.bottom > 0 && r.top < 1920)
            out.push({ t: nd.textContent.trim().slice(0, 40), x1: Math.round(r.left), y1: Math.round(r.top), x2: Math.round(r.right), y2: Math.round(r.bottom), op: +op.toFixed(2) });
        }
        return out;
      });
      for (const r of rs) {
        rects++; ext.minY = Math.min(ext.minY, r.y1); ext.maxY = Math.max(ext.maxY, r.y2);
        const band = r.y2 > 940 && r.y1 < 1846; if (band) ext.maxX2InBand = Math.max(ext.maxX2InBand, r.x2);
        if (r.y1 < 260 || r.y2 > 1700 || (band && r.x2 > 886)) bad.push({ frame: f, ...r });
      }
    }
    const res = { dur, frames: n, step: STEP, rects, extent: ext, breaks: bad.length, first_breaks: bad.slice(0, 40), errors: errs };
    fs.writeFileSync(outFile, JSON.stringify(res, null, 1));
    console.log(JSON.stringify({ dur, frames: n, rects, extent: ext, breaks: bad.length, errors: errs.length }));
  } finally { await b.close(); srv.close(); }
});
