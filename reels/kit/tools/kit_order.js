// Frame-order test (kit-plan section 4): PNG screenshots at a list of times in forward order, then reversed, then in a seeded shuffle on the same page,
// then the same shuffle on a fresh page. Pass when the four sha256 of each time are equal.
// usage: NODE_PATH=/Users/valmirjunior/dev/vjmecha/node_modules node kit_order.js <labrig> <out.json> [--times a,b,c] [--page mesa.html] [--query q]
// Without --times: window.TIMES of the page when it has one (component pages: the times of selfTest), else the times of the demo.
// Prints one JSON line {page, query, times, equal, mismatches, errors}.
const fs = require('fs'), crypto = require('crypto');
const { chromium } = require('playwright');
const K = require('./kit_serve.js');
const { pos: [labrig, out], opt } = K.args(process.argv.slice(2));
const page = opt.page || 'mesa.html', query = opt.query || '';
K.requirePin(labrig, page);
const DEMO = [0, 0.5, 1.5, 4.5, 7.5, 8.9, 9.1, 9.3, 9.5, 9.7, 9.9, 10.5, 12.0, 13.2, 14.2, 14.5, 15.2, 16.0, 17.2, 18.6, 20.9];
const sha = buf => crypto.createHash('sha256').update(buf).digest('hex');
// seeded shuffle (mulberry32)
function shuffle(a, seed) { a = a.slice(); let s = seed >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
const srv = K.serve(labrig);
srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port; const errs = [];
  const b = await chromium.launch({ args: K.launchArgs });
  const open = async () => {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    p.on('requestfailed', q => errs.push('requestfailed: ' + q.url())); p.on('response', r => { if (r.status() >= 400) errs.push('http ' + r.status() + ': ' + r.url()); });
    await p.goto(K.pageUrl(port, page, query)); await p.waitForFunction('window.READY === true', null, { timeout: 180000 }); return p;
  };
  const shoot = async (p, ts) => { const m = {}; for (const t of ts) { await p.evaluate(x => window.setT(x), t); m[t] = sha(await p.screenshot({ type: 'png' })); } return m };
  try {
    const p1 = await open();
    const times = opt.times ? opt.times.split(',').map(Number) : (await p1.evaluate('window.TIMES') || DEMO);
    const sh = shuffle(times, 20261112);
    const fwd = await shoot(p1, times), rev = await shoot(p1, times.slice().reverse()), shf = await shoot(p1, sh);
    const p2 = await open(); const fresh = await shoot(p2, sh);
    const mism = times.filter(t => !(fwd[t] === rev[t] && rev[t] === shf[t] && shf[t] === fresh[t]));
    const res = { page, query, times, equal: mism.length === 0, mismatches: mism, errors: errs.length, sha256_forward: fwd, shuffle_order: sh };
    fs.writeFileSync(out, JSON.stringify(res, null, 1));
    console.log(JSON.stringify({ page, query, times: times.length, equal: res.equal, mismatches: mism, errors: errs.length }));
  } finally { await b.close(); srv.close(); }
});
