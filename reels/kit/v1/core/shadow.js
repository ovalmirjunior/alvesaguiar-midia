// Contact shadows (MESA lines 175 to 187): a soft dark sprite on the surface under an object. It follows the anchor: as the anchor rises,
// the sprite slides away from the light, widens and fades. LDIR is computed once with the shot factor k = 1 and never changes.
import * as THREE from 'three';
import { rr } from './text.js';

export function createShadows(scene, LDIR) {
  const SHD = [], _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _sc = new THREE.Vector3();
  function contact(anchor, w, d, rad, { y = .0016, th = .01, blur = [.11, .022], alpha = [.42, .7], grow = 0, yawOf = null, K = 220 } = {}) {
    const pad = blur[0] * 2.6 + .06, cw = Math.ceil((w + 2 * pad) * K), chh = Math.ceil((d + 2 * pad) * K);
    const c = document.createElement('canvas'); c.width = cw; c.height = chh; const g = c.getContext('2d');
    [0, 1].forEach(i => { g.filter = 'blur(' + (blur[i] * K).toFixed(1) + 'px)'; g.fillStyle = 'rgba(0,0,0,' + alpha[i] + ')'; const e = i ? -.004 : grow; rr(g, pad * K - e * K, pad * K - e * K, (w + 2 * e) * K, (d + 2 * e) * K, Math.max(.001, rad + e) * K); g.fill() });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const geo = new THREE.PlaneGeometry(w + 2 * pad, d + 2 * pad); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false })); m.renderOrder = 1; scene.add(m);
    const cast = []; anchor.traverse(o => { if (o.isMesh && o.castShadow) cast.push(o) });
    SHD.push({ m, anchor, y, th, rest: null, yawOf: yawOf || anchor, cast }); return m;
  }
  function update() {
    for (const o of SHD) {
      const a = o.anchor; let vis = true; for (let e = a; e; e = e.parent) if (!e.visible) { vis = false; break }
      a.getWorldPosition(_v); if (o.rest === null) o.rest = a.userData.rest ?? _v.y; const h = Math.max(0, _v.y - o.rest); a.getWorldScale(_sc);
      for (const c of o.cast) c.castShadow = h < .1; o.yawOf.getWorldQuaternion(_q); _e.setFromQuaternion(_q, 'YXZ');
      o.m.visible = vis && _sc.x > .02; o.m.position.set(_v.x + LDIR[0] * (h + o.th * .5), o.y, _v.z + LDIR[1] * (h + o.th * .5)); o.m.rotation.y = _e.y; o.m.scale.setScalar(_sc.x * (1 + h * .3));
      o.m.material.opacity = (a.userData.shOp ?? 1) / Math.pow(1 + h * 2.4, 2);
    }
  }
  return { contact, update };
}
