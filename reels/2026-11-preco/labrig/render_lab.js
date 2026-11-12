// Render frames of a page driven by window.setT(t) (Reel B desk scene).
// usage: node render_lab.js <fps> <outdir> <mode sw|gpu> <start> <step> [count] [url]
// mode sw  = software WebGL (SwiftShader), the same path as First's cloud renders
// mode gpu = ask Chromium for the host GPU through ANGLE/EGL (falls back to software if none)
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [fps, out, mode, start, step, count, url] = [Number(process.argv[2]), process.argv[3], process.argv[4] || 'sw',
    Number(process.argv[5] || 0), Number(process.argv[6] || 1), process.argv[7] ? Number(process.argv[7]) : Infinity,
    process.argv[8] || 'http://127.0.0.1:8765/mesa.html'];
  const args = mode === 'gpu'
    ? ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu-rasterization']
    : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto(url);
  await p.waitForFunction('window.READY === true', null, { timeout: 120000 });
  const renderer = await p.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    if (!c) return 'no webgl'; const e = c.getExtension('WEBGL_debug_renderer_info'); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : c.getParameter(c.RENDERER); });
  const n = Math.ceil(await p.evaluate('window.DUR') * fps); let done = 0; const t0 = Date.now();
  for (let f = start; f < n && done < count; f += step) {
    await p.evaluate(t => window.setT(t), f / fps);
    await p.screenshot({ path: `${out}/${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90 });
    done++;
  }
  const s = (Date.now() - t0) / 1000;
  console.log(JSON.stringify({ mode, renderer, frames: done, seconds: +s.toFixed(1), sec_per_frame: +(s / Math.max(1, done)).toFixed(3), total_frames: n }));
  await b.close();
})();
