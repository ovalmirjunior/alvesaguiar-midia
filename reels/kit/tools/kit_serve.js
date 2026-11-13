// Shared module of the kit tools (require it; it is not a command).
// serve(labrig): in-process static server as render_mac.js lines 9 to 15, with one change: a URL that starts with /kit/ is read from the kit root
//   (the folder above tools/), anything else from labrig (the folder of the page).
// checkPin(labrig, page): the pin rule of kit-plan section 2. Returns {ok, version, reason}.
// launchArgs: the Chromium flags of render_mac.js.
// pageUrl(port, page, query): http URL of the page.
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const KIT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.txt': 'text/plain', '.pin': 'text/plain' };
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

function serve(labrig) {
  return http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const isKit = u.startsWith('/kit/');
    const base = isKit ? KIT : labrig;
    const f = path.join(base, path.normalize(isKit ? u.slice(4) : u));
    if (!f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  });
}

function checkPin(labrig, page = 'mesa.html') {
  const fail = reason => ({ ok: false, reason });
  const pf = path.join(labrig, 'KIT.pin'), pg = path.join(labrig, page);
  if (!fs.existsSync(pf)) return fail('no KIT.pin in ' + labrig);
  if (!fs.existsSync(pg)) return fail('no page ' + pg);
  const pin = fs.readFileSync(pf, 'utf8').trim().split(/\s+/);
  if (pin.length !== 2) return fail('KIT.pin must be one line: <version> <sha256>');
  const m = /\/kit\/(v\d+)\//.exec(fs.readFileSync(pg, 'utf8'));
  if (!m) return fail('no /kit/<version>/ in the import map of ' + page);
  if (m[1] !== pin[0]) return fail('import map version ' + m[1] + ' differs from KIT.pin version ' + pin[0]);
  const mf = path.join(KIT, pin[0], 'MANIFEST.sha256');
  if (!fs.existsSync(mf)) return fail('no ' + mf);
  if (sha(mf) !== pin[1]) return fail('sha256 of MANIFEST.sha256 differs from KIT.pin');
  for (const line of fs.readFileSync(mf, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const mm = /^([0-9a-f]{64}) [ *](.+)$/.exec(line);
    if (!mm) return fail('bad manifest line: ' + line);
    const f = path.join(KIT, mm[2]);
    if (!fs.existsSync(f)) return fail('missing ' + mm[2]);
    if (sha(f) !== mm[1]) return fail('sha256 mismatch ' + mm[2]);
  }
  return { ok: true, version: pin[0] };
}

// each tool calls this first: prints one JSON line and exits 3 when the pin rule fails
function requirePin(labrig, page) {
  const p = checkPin(labrig, page);
  if (!p.ok) { console.log(JSON.stringify({ error: 'pin', reason: p.reason })); process.exit(3); }
  return p;
}

const launchArgs = ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'];
const pageUrl = (port, page, query) => `http://127.0.0.1:${port}/${page}${query ? '?' + query : ''}`;

// tiny argument parser: positional list plus --key value pairs
function args(argv) {
  const pos = [], opt = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { opt[argv[i].slice(2)] = argv[i + 1]; i++; } else pos.push(argv[i]);
  }
  return { pos, opt };
}

module.exports = { KIT, serve, checkPin, requirePin, launchArgs, pageUrl, args, sha };
