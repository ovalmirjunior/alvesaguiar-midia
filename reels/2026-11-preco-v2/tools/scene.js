// Mac helper for the reelPR v2 desk scene (labrig/mesa.html). It serves ../labrig and three 0.169.0 in-process.
// usage (NODE_PATH must point to a node_modules folder with playwright):
//   node scene.js frames <outdir> <t1,t2,...|all:fps> [query]     writes <outdir>/t<sec>.jpg, prints one JSON line
//   node scene.js zones <out.json> [query] [step]                  safe-zone check of every text box (DOM and 3D) on every frame
// query is the page query string, for example "cues=cues-est115.json&ss=1&ms=0".
// CUES_FILE=<absolute path> serves that file as /__cues.json, for cues kept outside labrig: use query "cues=/__cues.json".
// Safe zones (style-bank.md pattern 6): a text box breaks them when y0 < 260, or y1 > 1700, or (x1 > 886 and it overlaps y 940..1846).
// The zones mode sets window.NO_RENDER, so the page moves the scene and the camera for each frame without drawing it.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const LABRIG = path.join(__dirname, '..', 'labrig');
const THREE_ROOT = process.env.THREE_ROOT || '/Users/valmirjunior/dev/vision/scratch/fable-reel-objetos/preview';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png' };
const [mode, out, a3, a4, a5] = process.argv.slice(2);
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/__cues.json' && process.env.CUES_FILE) { r.writeHead(200, { 'Content-Type': 'application/json' }); return fs.createReadStream(process.env.CUES_FILE).pipe(r); }
  const base = u.startsWith('/node_modules/') ? THREE_ROOT : LABRIG;
  const f = path.join(base, path.normalize(u));
  if (!f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port; const errs = [];
  const b = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=metal'] });
  try {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    p.on('requestfailed', q => errs.push('requestfailed: ' + q.url()));
    const query = mode === 'frames' ? a4 : a3;
    if (mode === 'zones') await p.addInitScript(() => { window.NO_RENDER = true; });
    await p.goto(`http://127.0.0.1:${port}/mesa.html${query ? '?' + query : ''}`);
    await p.waitForFunction('window.READY === true', null, { timeout: 180000 });
    const dur = await p.evaluate('window.DUR'); const info = await p.evaluate('window.INFO');
    if (mode === 'frames') {
      fs.mkdirSync(out, { recursive: true });
      let ts;
      if (a3.startsWith('all:')) { const fps = Number(a3.slice(4)); ts = []; for (let k = 0; k < Math.ceil(dur * fps); k++) ts.push(k / fps); }
      else ts = a3.split(',').map(Number);
      const t0 = Date.now();
      for (const t of ts) {
        await p.evaluate(x => window.setT(x), t);
        await p.screenshot({ path: path.join(out, `t${t.toFixed(3).padStart(8, '0')}.jpg`), type: 'jpeg', quality: 90 });
      }
      console.log(JSON.stringify({ dur, frames: ts.length, sec_per_frame: +((Date.now() - t0) / 1000 / ts.length).toFixed(3), info, errors: errs }));
    } else {
      const STEP = Number(a4 || 1); const n = Math.ceil(dur * 24); const bad = []; let rects = 0, r3d = 0;
      const ext = { minY: 1e9, maxY: -1e9, maxX1InBand: -1e9 }; const seen = {};
      for (let f = 0; f < n; f += STEP) {
        const rs = await p.evaluate(t => { window.setT(t); return window.TEXTRECTS(); }, f / 24);
        for (const q of rs) {
          rects++; if (q.src === '3d') r3d++;
          const k = q.src + ':' + q.text; const band = q.y1 > 940 && q.y0 < 1846;
          const s = seen[k] || (seen[k] = { minY: 1e9, maxY: -1e9, maxX1InBand: -1e9, frames: 0 });
          s.frames++; s.minY = Math.min(s.minY, Math.round(q.y0)); s.maxY = Math.max(s.maxY, Math.round(q.y1)); if (band) s.maxX1InBand = Math.max(s.maxX1InBand, Math.round(q.x1));
          ext.minY = Math.min(ext.minY, q.y0); ext.maxY = Math.max(ext.maxY, q.y1); if (band) ext.maxX1InBand = Math.max(ext.maxX1InBand, q.x1);
          if (q.y0 < 260 || q.y1 > 1700 || (band && q.x1 > 886)) bad.push({ frame: f, t: +(f / 24).toFixed(3), ...q });
        }
      }
      const res = { query: query || '', dur, frames: n, step: STEP, rects, rects_3d: r3d, extent: ext, breaks: bad.length, first_breaks: bad.slice(0, 60), texts: seen, errors: errs };
      fs.writeFileSync(out, JSON.stringify(res, null, 1));
      console.log(JSON.stringify({ query: query || '', dur, frames: n, rects, rects_3d: r3d, extent: ext, breaks: bad.length, errors: errs.length }));
    }
  } finally { await b.close(); srv.close(); }
});
