// Cover tool (kit-plan section 5): sets t, calls window.KIT.cover(...), screenshots 1080x1920 as JPEG and also <out>-3x4.jpg (crop y 240 to 1680) and <out>-4x5.jpg (crop y 285 to 1635).
// usage: NODE_PATH=/Users/valmirjunior/dev/vjmecha/node_modules node kit_cover.js <labrig> <out.jpg> <t> [--headline "<3 to 5 words>"] [--hi "<words>"] [--ramp ambar] [--pos top|bottom] [--focus <component name>] [--quality 95] [--query "<page query>"] [--page mesa.html]
// Exit codes: 2 headline outside 3 to 5 words; 3 pin check; 4 plate (or the focus component) outside x 35 to 1045, y 285 to 1635; 5 #cap still displayed. Nothing is written on a nonzero exit.
// Output: one JSON line {t, out, sha256, headline, plate, focus, cap_display, renderer, errors}.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const K = require('./kit_serve.js');
const { pos: [labrig, out, tArg], opt } = K.args(process.argv.slice(2));
const page = opt.page || 'mesa.html', t = Number(tArg), q = Number(opt.quality || 95);
const fail = (code, msg) => { console.log(JSON.stringify({ error: msg, exit: code })); process.exit(code); };
if (!labrig || !out || !(t >= 0)) fail(2, 'usage: kit_cover.js <labrig> <out.jpg> <t> [options]');
if (opt.headline !== undefined) { const n = opt.headline.trim().split(/\s+/).filter(Boolean).length; if (n < 3 || n > 5) fail(2, 'the headline has ' + n + ' words (3 to 5 allowed)'); }
K.requirePin(labrig, page);
const WIN = { x0: 35, x1: 1045, y0: 285, y1: 1635 };
const inWin = r => r.x0 >= WIN.x0 && r.x1 <= WIN.x1 && r.y0 >= WIN.y0 && r.y1 <= WIN.y1;
const srv = K.serve(labrig);
srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port; const errs = [];
  const b = await chromium.launch({ args: K.launchArgs });
  try {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    p.on('requestfailed', r => errs.push('requestfailed: ' + r.url())); p.on('response', r => { if (r.status() >= 400) errs.push('http ' + r.status() + ': ' + r.url()); });
    await p.goto(K.pageUrl(port, page, opt.query)); await p.waitForFunction('window.READY === true', null, { timeout: 180000 });
    await p.evaluate(x => window.setT(x), t);
    let plate = null;
    try { plate = await p.evaluate(o => window.KIT.cover(o), { headline: opt.headline, hi: opt.hi, ramp: opt.ramp || 'ambar', pos: opt.pos || 'top' }); }
    catch (e) { await b.close(); srv.close(); fail(4, 'cover: ' + e.message.split('\n')[0]); }
    await p.evaluate(x => window.setT(x), t);
    const capDisplay = await p.evaluate(() => getComputedStyle(document.getElementById('cap')).display);
    plate = await p.evaluate(() => { const e = document.getElementById('thumb'); if (getComputedStyle(e).display === 'none') return null; const r = e.getBoundingClientRect(); return { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom } });
    let focus = null;
    if (opt.focus) { focus = await p.evaluate(n => window.KIT.bbox(n), opt.focus); if (!focus) { await b.close(); srv.close(); fail(4, 'focus component has no visible mesh: ' + opt.focus) } }
    if (capDisplay !== 'none') { await b.close(); srv.close(); fail(5, '#cap is still displayed') }
    if (plate && !inWin(plate)) { await b.close(); srv.close(); fail(4, 'the plate leaves x 35 to 1045 or y 285 to 1635') }
    if (focus && !inWin(focus)) { await b.close(); srv.close(); fail(4, 'the focus component leaves x 35 to 1045 or y 285 to 1635') }
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    await p.screenshot({ path: out, type: 'jpeg', quality: q });
    const base = out.replace(/\.jpe?g$/i, '');
    await p.screenshot({ path: base + '-3x4.jpg', type: 'jpeg', quality: q, clip: { x: 0, y: 240, width: 1080, height: 1440 } });
    await p.screenshot({ path: base + '-4x5.jpg', type: 'jpeg', quality: q, clip: { x: 0, y: 285, width: 1080, height: 1350 } });
    const renderer = await p.evaluate(() => (window.INFO || {}).renderer || 'unknown');
    console.log(JSON.stringify({ t, out, sha256: K.sha(out), headline: opt.headline || null, plate, focus, cap_display: capDisplay, renderer, errors: errs }));
  } finally { await b.close().catch(() => {}); srv.close(); }
});
