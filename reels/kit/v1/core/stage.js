// The stage of a kit Reel: renderer with the post pass, light, wood desk, leather mat, camera, frame loop and TEXTRECTS.
// MESA = reelPR2 labrig/mesa.html (every "MESA line N" below is a line of that file). The frame at time t depends only on t.
import * as THREE from 'three';
import { installSeededRandom } from './rng.js';
import { clamp, sm, eo, lerp, makeCues } from './timing.js';
import { env, TEXT_OFF, rr, papMat, plain } from './text.js';
import { createShadows } from './shadow.js';

const KIT_VER = 'v1', TEX = '/kit/assets/textures/t1/';
const FONT_LOADS = ['700 100px P', '500 100px NR', 'italic 400 60px NR', '400 30px HG', '600 30px HG', '700 30px HG'];
const D0 = 18.3;
// named stations (kit-plan 1.2 and addendum v1.1 section C): target on the desk plane, distance as a factor of D0, tilt from the vertical in degrees
const BASE_SHOT = { tx: 0, tz: 0, dist: 1, tilt: 8 };
export const SHOTS = {
  base: BASE_SHOT, phone: BASE_SHOT,
  desk: { tx: 0, tz: 0, dist: 1.45, tilt: 8 },
  laptop: { tx: 5.60, tz: -7.996, dist: 2, tilt: 24 },
  note: { tx: 5.60, tz: .30, dist: 1, tilt: 8 },
};

export function rrShape(w, h, rad) {
  const p = new THREE.Shape(), x = -w / 2, y = -h / 2;
  p.moveTo(x + rad, y); p.lineTo(x + w - rad, y); p.absarc(x + w - rad, y + rad, rad, -Math.PI / 2, 0, false); p.lineTo(x + w, y + h - rad); p.absarc(x + w - rad, y + h - rad, rad, 0, Math.PI / 2, false);
  p.lineTo(x + rad, y + h); p.absarc(x + rad, y + h - rad, rad, Math.PI / 2, Math.PI, false); p.lineTo(x, y + rad); p.absarc(x + rad, y + rad, rad, Math.PI, Math.PI * 1.5, false); return p;
}
// sheet: a printed rectangle lying in XZ, +y up, canvas top at -z. region = part of the canvas it shows [u0,v0,u1,v1] (v from the canvas top).
// userData.tm lets TEXTRECTS project the text boxes of the canvas through the real surface.
export function sheet(tex, w, d, { region = [0, 0, 1, 1], seg = [1, 1], disp = null, parent = null, mat = null, cast = false } = {}) {
  const g = new THREE.PlaneGeometry(w, d, seg[0], seg[1]); g.rotateX(-Math.PI / 2); const P = g.attributes.position, UV = g.attributes.uv, S = [], [u0, v0, u1, v1] = region;
  for (let i = 0; i < P.count; i++) { const sx = P.getX(i) / w + .5, tz = P.getZ(i) / d + .5; S.push([sx, tz]); UV.setXY(i, u0 + (u1 - u0) * sx, 1 - (v0 + (v1 - v0) * tz)) }
  const m = new THREE.Mesh(g, mat || papMat(tex, w, d, {}, u1 - u0, v1 - v0)); m.receiveShadow = true; m.castShadow = cast;
  m.userData.tm = { c: tex.image, region, fn: disp || (() => 0), surf(sx, tz) { return [(sx - .5) * w, this.fn(sx, tz), (tz - .5) * d] } };
  m.userData.bend = fn => { m.userData.tm.fn = fn; for (let i = 0; i < P.count; i++) P.setY(i, fn(S[i][0], S[i][1])); P.needsUpdate = true; g.computeVertexNormals() };
  if (disp) m.userData.bend(disp); if (parent) parent.add(m); return m;
}
// a flat printed face cut to a shape (bounding box w x d), lying in XZ
export function face(shape, w, d, tex, mat) {
  const g = new THREE.ShapeGeometry(shape, 32), P = g.attributes.position, UV = g.attributes.uv; for (let i = 0; i < P.count; i++) UV.setXY(i, P.getX(i) / w + .5, P.getY(i) / d + .5); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat || papMat(tex, w, d)); m.receiveShadow = true; m.userData.tm = { c: tex.image, region: [0, 0, 1, 1], surf: (sx, tz) => [(sx - .5) * w, 0, (tz - .5) * d] }; return m;
}
// a thin card: an extruded shape (its thickness shows a lit edge) with a printed face on top; origin at the centre of its base
export function card(shape, w, d, th, tex, { side = '#d9dce2', under = null, parent = null, rough = .9, nrm = .55 } = {}) {
  const G = new THREE.Group();
  const g = new THREE.ExtrudeGeometry(shape, { depth: th, bevelEnabled: false, curveSegments: 32 }); g.rotateX(-Math.PI / 2);
  const b = new THREE.Mesh(g, [plain(under || side, { roughness: rough }), plain(side, { roughness: rough })]); b.castShadow = true; b.receiveShadow = true; G.add(b);
  const f = face(shape, w, d, tex, papMat(tex, w, d, { roughness: rough, normalScale: new THREE.Vector2(nrm, nrm) })); f.position.y = th + .0006; G.add(f); G.userData.face = f; if (parent) parent.add(G); return G;
}

export async function createStage({ canvas = '#c', cues = null, cuesUrl = 'cues_mesa.json', mat = { x0: -4, x1: 12, z0: -18, z1: 6 } } = {}) {
  installSeededRandom();
  const Q = new URLSearchParams(location.search), W = 1080, H = 1920;
  await Promise.all(FONT_LOADS.map(f => document.fonts.load(f)));
  const CUES = makeCues(cues || await (await fetch(Q.get('cues') || cuesUrl)).json());
  const SS = Math.max(1, Math.min(3, Math.round(+(Q.get('ss') || 2)))), MS = Math.max(0, Math.min(8, Math.round(+(Q.get('ms') ?? 4))));

  // ---------- renderer: the scene is drawn linear into a supersampled float target, then one pass filters it down, tone maps and writes sRGB (MESA lines 80 to 105)
  const r = new THREE.WebGLRenderer({ canvas: typeof canvas === 'string' ? document.querySelector(canvas) : canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  r.setPixelRatio(1); r.setSize(W, H, false); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap; r.toneMapping = THREE.NoToneMapping;
  const ANISO = r.capabilities.getMaxAnisotropy(); env.aniso = ANISO;
  const RT = new THREE.WebGLRenderTarget(W * SS, H * SS, { samples: MS, type: THREE.HalfFloatType, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: true, depthBuffer: true });
  const post = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { tD: { value: RT.texture }, px: { value: new THREE.Vector2(1 / (W * SS), 1 / (H * SS)) }, expo: { value: 1 }, vig: { value: .36 }, grain: { value: .006 }, glow: { value: +(Q.get('glow') || .03) }, seed: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: `precision highp float;
#define SS ${SS}
uniform sampler2D tD;uniform vec2 px;uniform float expo,vig,grain,glow,seed;varying vec2 vUv;
// soft shoulder above 0.76, linear below, no toe: dark mat detail and brand colours pass unchanged
vec3 curve(vec3 c){float p=max(c.r,max(c.g,c.b));const float s=.76;if(p<s)return c;float d=1.-s;float np=1.-d*d/(p+d-s);c*=np/p;float g=1.-1./(.15*(p-np)+1.);return mix(c,vec3(np),g);}
float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){vec3 c=vec3(0.);
 for(int j=0;j<SS;j++)for(int i=0;i<SS;i++)c+=textureLod(tD,vUv+(vec2(float(i),float(j))-.5*float(SS-1))*px,0.).rgb;
 c/=float(SS*SS);
 // veiling glare: a wide, faint glow around the bright objects, from the low mip levels of the frame
 c+=glow*(.3*textureLod(tD,vUv,4.5).rgb+.35*textureLod(tD,vUv,5.5).rgb+.35*textureLod(tD,vUv,6.7).rgb);
 vec2 q=(vUv-.5)*vec2(.5625,1.)*2.;float rr=length(q);c*=1.-vig*smoothstep(.45,1.25,rr);
 c=curve(max(c,0.)*expo);
 c=mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));
 float n=hash(gl_FragCoord.xy+seed*17.)+hash(gl_FragCoord.yx+seed*29.+7.)-1.;
 gl_FragColor=vec4(c+n*grain,1.);}` });
  const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  { const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post); q.frustumCulled = false; postScene.add(q) }

  // ---------- the ten maps of assets/textures/t1
  const TL = new THREE.TextureLoader();
  const [tMatA, tMatN, tMatR, tPapA, tPapN, tWear, tWoodA, tWoodN, tWoodR, tAluN] = await Promise.all(['mat_albedo.jpg', 'mat_normal.png', 'mat_rough.png', 'paper_albedo.jpg', 'paper_normal.png', 'mat_wear.png', 'wood_albedo.jpg', 'wood_normal.png', 'wood_rough.png', 'alu_normal.png'].map(f => TL.loadAsync(TEX + f)));
  for (const t of [tMatA, tMatN, tMatR, tPapN, tWoodA, tWoodN, tWoodR, tAluN]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = ANISO }
  tMatA.colorSpace = THREE.SRGBColorSpace; tWear.colorSpace = THREE.SRGBColorSpace; tWoodA.colorSpace = THREE.SRGBColorSpace; tWear.anisotropy = ANISO;
  env.papA = tPapA; env.papN = tPapN;

  // ---------- scene and image-based light (MESA lines 113 to 123, unchanged): a small studio, dark room, one large soft box on the key side, a cool fill, a dim strip overhead
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x050608);
  {
    const e = new THREE.Scene();
    e.add(new THREE.Mesh(new THREE.BoxGeometry(60, 30, 60), new THREE.MeshBasicMaterial({ color: new THREE.Color(.035, .038, .045), side: THREE.BackSide })));
    const panel = (w, h, p, col, tex) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, map: tex || null, side: THREE.DoubleSide })); m.position.set(...p); m.lookAt(0, 0, 0); e.add(m) };
    const grad = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 128; const g = c.getContext('2d'), l = g.createLinearGradient(0, 0, 0, 128); l.addColorStop(0, '#000'); l.addColorStop(.4, '#fff'); l.addColorStop(1, '#fff'); g.fillStyle = l; g.fillRect(0, 0, 8, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t })();
    panel(20, 13, [-13, 13, -10], new THREE.Color(5.2, 4.9, 4.5));
    panel(12, 16, [20, 7, 4], new THREE.Color(.5, .6, .85));
    { const g = new THREE.Group(); g.position.set(-.6, 14.5, -2.1); g.rotation.y = .42; const m = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.56, 1.7).multiplyScalar(+(Q.get('glare') || 1.8)), map: grad, side: THREE.DoubleSide }));
      m.rotation.x = Math.PI / 2; m.position.z = -4; g.add(m); e.add(g) }
    const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(e, 0.02).texture; scene.environmentIntensity = 1;
  }

  // ---------- camera (kit-plan 1.2) and the base-camera ray helper G
  const cam = new THREE.PerspectiveCamera(20, W / H, 4, 90);
  const gcam = new THREE.PerspectiveCamera(20, W / H, 4, 90);
  function placeCam(c, tx, tz, dist, tilt) { const T = tilt * Math.PI / 180; c.position.set(tx, Math.cos(T) * D0 * dist, tz + Math.sin(T) * D0 * dist); c.lookAt(tx, 0, tz); c.updateMatrixWorld(true) }
  placeCam(cam, 0, 0, 1, 8);
  // G(px,py,h,station): the point of the plane y = h under frame pixel (px,py) seen from that station (no drift); the layout is written in frame pixels. Build time only.
  function G(px, py, h = 0, station = 'base') { const st = SHOTS[station]; if (!st) throw new Error('unknown station ' + station); placeCam(gcam, st.tx, st.tz, st.dist, st.tilt); const v = new THREE.Vector3(px / W * 2 - 1, 1 - py / H * 2, .5).unproject(gcam).sub(gcam.position).normalize(), k = (h - gcam.position.y) / v.y; return new THREE.Vector3(gcam.position.x + v.x * k, h, gcam.position.z + v.z * k) }

  // ---------- light: hemisphere and key spot (MESA lines 130 to 134); the key rig follows and scales with the shot
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x0c0d10, .22));
  const key = new THREE.SpotLight(0xfff5e8, 3.6, 0, .27, 1, 0); scene.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(4096, 4096); key.shadow.radius = 2.5; key.shadow.bias = -.00012;
  const KEYOFF = [-6.05, 13, -7.15];
  function rig(tx, tz, k) {
    key.target.position.set(tx - .15 * k, 0, tz - .45 * k); key.position.set(key.target.position.x + KEYOFF[0] * k, KEYOFF[1] * k, key.target.position.z + KEYOFF[2] * k);
    key.shadow.camera.near = 9 * k; key.shadow.camera.far = 24 * k; key.shadow.normalBias = .003 * k; key.shadow.camera.updateProjectionMatrix(); key.target.updateMatrixWorld(); key.updateMatrixWorld();
  }
  rig(0, 0, 1);
  // horizontal shadow travel per unit of height (used by the contact shadows), computed once with k = 1
  const LDIR = (() => { const d = key.target.position.clone().sub(key.position); return [-d.x / d.y, -d.z / d.y] })();
  const shadows = createShadows(scene, LDIR);

  const MX = (mat.x0 + mat.x1) / 2, MZ = (mat.z0 + mat.z1) / 2;   // centre of the mat
  // ---------- desk: walnut wood under the mat (kit-plan 1.4). Its planks run left to right (grain along world x).
  const woodMat = new THREE.MeshStandardMaterial({ color: Q.get('woodc') || '#ffffff', map: tWoodA, normalMap: tWoodN, normalScale: new THREE.Vector2(.6, .6), roughnessMap: tWoodR, roughness: 1, metalness: 0, envMapIntensity: +(Q.get('woode') || .6) });
  for (const t of [tWoodA, tWoodN, tWoodR]) t.repeat.set(5, 5);
  tAluN.repeat.set(2, 2);
  const wood = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), woodMat); wood.rotation.x = -Math.PI / 2; wood.position.set(MX, -.02, MZ); wood.receiveShadow = true; scene.add(wood);

  // ---------- mat: one landscape leather mat for every object, 0.02 thick, with a stitched seam and a faint wear layer (MESA lines 189 to 203; addendum v1.1 section A)
  const MW = mat.x1 - mat.x0, MD = mat.z1 - mat.z0, MTILE = 2.3, matAnchor = new THREE.Group(); matAnchor.position.set(MX, 0, MZ); scene.add(matAnchor);
  {
    for (const t of [tMatA, tMatN, tMatR]) t.repeat.set(MW / MTILE, MD / MTILE);
    const g = new THREE.ShapeGeometry(rrShape(MW, MD, .22), 24), P = g.attributes.position, UV = g.attributes.uv; for (let i = 0; i < P.count; i++) UV.setXY(i, P.getX(i) / MW + .5, P.getY(i) / MD + .5); g.rotateX(-Math.PI / 2);
    const matMesh = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: Q.get('matc') || '#06070a', map: tMatA, normalMap: tMatN, normalScale: new THREE.Vector2(1, 1), roughnessMap: tMatR, roughness: 1, specularIntensity: +(Q.get('mats') || .13), specularColor: new THREE.Color(.82, .88, 1), envMapIntensity: +(Q.get('mate') || .5) }));
    matMesh.position.set(MX, 0, MZ); matMesh.receiveShadow = true; scene.add(matMesh);
    // the edge: the same rounded shape from y -0.02 to just under the leather
    const eg = new THREE.ExtrudeGeometry(rrShape(MW, MD, .22), { depth: .0196, bevelEnabled: false, curveSegments: 24 }); eg.rotateX(-Math.PI / 2); eg.translate(0, -.02, 0);
    const edge = new THREE.Mesh(eg, plain('#050608', { roughness: .8 })); edge.position.set(MX, 0, MZ); edge.receiveShadow = true; edge.castShadow = true; scene.add(edge);
    shadows.contact(matAnchor, MW, MD, .22, { y: -.0195, th: .02, blur: [.12, .03], alpha: [.5, .7], K: 50 });
    // wear: one plane over the whole mat, mirrored so the tiles do not show a seam
    tWear.wrapS = tWear.wrapT = THREE.MirroredRepeatWrapping; tWear.repeat.set(MW / 3.84, MD / 6.74);
    const wg = new THREE.PlaneGeometry(MW, MD); wg.rotateX(-Math.PI / 2); const wear = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ map: tWear, transparent: true, depthWrite: false, roughness: .85, opacity: +(Q.get('wear') || .16) })); wear.position.set(MX, .0008, MZ); wear.receiveShadow = true; scene.add(wear);
    // seam: a pressed line and one capsule per stitch
    const IN = .17, sw = MW - 2 * IN, sd = MD - 2 * IN, line = rrShape(sw + .03, sd + .03, .15); line.holes.push(rrShape(sw - .03, sd - .03, .13));
    const lg = new THREE.ShapeGeometry(line, 24); lg.rotateX(-Math.PI / 2); const seam = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .5, depthWrite: false, toneMapped: false })); seam.position.set(MX, .0012, MZ); scene.add(seam);
    const pts = rrShape(sw, sd, .14).getSpacedPoints(Math.round(2 * (sw + sd) / .105)), cg = new THREE.CapsuleGeometry(.0125, .058, 3, 8); cg.rotateZ(Math.PI / 2);
    const st = new THREE.InstancedMesh(cg, plain(Q.get('stc') || '#3a3f4a', { roughness: .6 }), pts.length - 1), d = new THREE.Object3D();
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; d.position.set(MX + (a.x + b.x) / 2, .006, MZ - (a.y + b.y) / 2); d.rotation.set(0, Math.atan2(b.y - a.y, b.x - a.x), 0); d.updateMatrix(); st.setMatrixAt(i, d.matrix) }
    st.castShadow = true; st.receiveShadow = true; scene.add(st);
  }

  // ---------- camera keys: a key has two channels, pan (tx) and crane (tz, dist, tilt together), each smoothstep (or the easing named) over [start, start + d].
  // camKey(t, shot, {tr}): both channels end at t after tr seconds; a cut has tr = 0. camTravel: the two channels with their own windows (addendum v1.1 section C).
  const KEYS = [], PUSHES = [], MAX_MOVE = .8; let NOW = 0, FRAME_NO = 0;
  const target = (shot, dx = 0, dz = 0) => ({ tx: shot.tx + dx, tz: shot.tz + dz, dist: shot.dist, tilt: shot.tilt });
  function camKey(t, shot, { tr = .8, cut = false, dx = 0, dz = 0, ease = 'sm' } = {}) {
    const s = typeof shot === 'string' ? SHOTS[shot] : shot, name = typeof shot === 'string' ? shot : (shot.name || 'custom');
    if (!s) throw new Error('unknown shot ' + shot);
    const prev = KEYS[KEYS.length - 1], d = cut ? 0 : tr;
    if (d > MAX_MOVE + 1e-9) throw new Error('a camera move lasts at most ' + MAX_MOVE + ' s (t=' + t + ', tr=' + tr + ')');
    if (prev && t < prev.t) throw new Error('camera keys must be added in time order (t=' + t + ')');
    KEYS.push({ t, name, ease, s: target(s, dx, dz), a: null, pan: [t - d, d], crane: [t - d, d], travel: false, start: t - d });
  }
  // from = a station name (the travel starts exactly there) or 'current' (it starts where the previous key ends)
  function camTravel({ from = 'current', to, t0, d, craneT0 = t0, craneD = d, panEase = 'sm' }) {
    if (Math.max(t0 + d, craneT0 + craneD) - Math.min(t0, craneT0) > MAX_MOVE + 1e-9) throw new Error('a camera move lasts at most ' + MAX_MOVE + ' s (t0=' + t0 + ')');
    const e = typeof to === 'string' ? SHOTS[to] : to; if (!e) throw new Error('unknown station ' + to);
    const a = from === 'current' ? null : target(typeof from === 'string' ? SHOTS[from] : from);
    const prev = KEYS[KEYS.length - 1]; if (prev && t0 < prev.t - 1e-9 && craneT0 < prev.t - 1e-9) throw new Error('camera keys must be added in time order (t0=' + t0 + ')');
    KEYS.push({ t: Math.max(t0 + d, craneT0 + craneD), name: typeof to === 'string' ? to : (to.name || 'custom'), ease: 'sm', s: target(e), a, pan: [t0, d], crane: [craneT0, craneD], panEase, travel: true, start: Math.min(t0, craneT0) });
  }
  const chan = (c, t, ease) => { const x = c[1] > 0 ? clamp((t - c[0]) / c[1]) : (t >= c[0] ? 1 : 0); return ease === 'eo' ? eo(x) : sm(x) };
  function stateAt(t) {
    if (!KEYS.length) return { ...BASE_SHOT, crane: false };
    let i = -1; while (i < KEYS.length - 1 && t >= KEYS[i + 1].start) i++;
    if (i < 0) return { ...KEYS[0].s, crane: false };
    const b = KEYS[i], a = b.a || (i ? KEYS[i - 1].s : b.s), kp = chan(b.pan, t, b.panEase || b.ease), kc = chan(b.crane, t, b.ease);
    return { tx: lerp(a.tx, b.s.tx, kp), tz: lerp(a.tz, b.s.tz, kc), dist: lerp(a.dist, b.s.dist, kc), tilt: lerp(a.tilt, b.s.tilt, kc), crane: b.travel && t > b.crane[0] && t < b.crane[0] + b.crane[1] };
  }
  // opening push (MESA lines 377 to 383): zoom onto the frame pixel `to` ending at t0, hold, pull back from `out`
  function camPush({ t0, d = .55, to, zoom = 2, out = null, outD = .65 }) { PUSHES.push({ t0, d, T: G(to.px, to.py, 0, to.station || 'base'), zoom, out, outD }) }
  function closeOn(t, { px, py, scale, tr = .8, station = 'base' }) { const w = G(px, py, 0, station); camKey(t, { name: 'close', tx: w.x, tz: w.z, dist: 1 / scale, tilt: 8 }, { tr }) }
  const pushK = t => PUSHES.reduce((m, p) => Math.max(m, eo((t - (p.t0 - p.d)) / p.d) * (p.out === null ? 1 : 1 - sm((t - p.out) / p.outD))), 0);
  function camAt(t) {
    const s = stateAt(t);
    for (const p of PUSHES) { const kp = eo((t - (p.t0 - p.d)) / p.d) * (p.out === null ? 1 : 1 - sm((t - p.out) / p.outD)); s.dist /= Math.exp(Math.log(p.zoom) * kp); s.tx = lerp(s.tx, p.T.x, kp); s.tz = lerp(s.tz, p.T.z, kp) }
    // idle drift (MESA line 383), never off
    const tx = s.tx + Math.sin(t * .33) * .012 * s.dist, tz = s.tz + Math.cos(t * .27) * .008 * s.dist;
    placeCam(cam, tx, tz, s.dist, s.tilt); rig(tx, tz, s.dist);
  }

  // ---------- components, projection, TEXTRECTS
  const components = {};
  function register(comp) { if (components[comp.name]) throw new Error('component name used twice: ' + comp.name); components[comp.name] = comp; comp.group.userData.comp = comp.name; return comp }
  const _p = new THREE.Vector3();
  const project = v => { _p.copy(v).project(cam); return [(_p.x + 1) / 2 * W, (1 - _p.y) / 2 * H] };
  // projected bounding box of a component (all its visible meshes), frame pixels
  function bboxOf(name) {
    const c = components[name]; if (!c) throw new Error('no component ' + name); scene.updateMatrixWorld(true);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const bb = new THREE.Box3(), v = new THREE.Vector3();
    c.group.traverse(m => { if (!m.isMesh) return; for (let e = m; e; e = e.parent) if (!e.visible) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); bb.copy(m.geometry.boundingBox);
      for (let i = 0; i < 8; i++) { v.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).applyMatrix4(m.matrixWorld); const [x, y] = project(v); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) } });
    return x0 > x1 ? null : { x0, y0, x1, y1 };
  }
  // every text box of the current frame in page pixels: DOM lines (from the overlays) and text printed on 3D surfaces that face the camera
  function textRects() {
    const dom = stage.overlay ? stage.overlay.rects() : { list: [], endOn: false }, out = dom.list.slice();
    if (!dom.endOn) {
      const v = new THREE.Vector3(), nrm = new THREE.Vector3(), ctr = new THREE.Vector3();
      scene.traverse(m => {
        const tm = m.userData.tm; if (!m.isMesh || !tm || !tm.c.__boxes || !tm.c.__boxes.length) return;
        for (let e = m; e; e = e.parent) if (!e.visible) return;
        if (tm.active && !tm.active()) return;
        nrm.set(0, 1, 0).transformDirection(m.matrixWorld); m.getWorldPosition(ctr); if (nrm.dot(v.copy(cam.position).sub(ctr)) <= 0) return;
        let comp = 'scene'; for (let e = m; e; e = e.parent) if (e.userData.comp) { comp = e.userData.comp; break }
        const c = tm.c, [u0, v0, u1, v1] = tm.region;
        const P = (ux, uy) => { const p = tm.surf(clamp((ux / c.width - u0) / (u1 - u0)), clamp((uy / c.height - v0) / (v1 - v0))); v.set(p[0], p[1], p[2]); m.localToWorld(v); v.project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H] };
        for (const b of c.__boxes) {
          const mu = (b[0] + b[2]) / 2 / c.width, mv = (b[1] + b[3]) / 2 / c.height; if (mu < u0 || mu > u1 || mv < v0 || mv > v1) continue;
          let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
          for (const [px, py] of [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]], [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]]) { const [sx, sy] = P(px, py); x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy) }
          if (x1 < 0 || x0 > W || y1 < 0 || y0 > H) continue;
          const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, a = P(cx, cy), d = P(cx, cy + (cy + 10 <= c.height ? 10 : -10)), px = b[5] * Math.hypot(a[0] - d[0], a[1] - d[1]) / 10;
          out.push({ src: '3d', comp, text: String(b[4]).slice(0, 40), x0: Math.max(0, x0), y0: Math.max(0, y0), x1: Math.min(W, x1), y1: Math.min(H, y1), px });
        }
      });
    }
    return TEXT_OFF ? out.map(o => ({ ...o, off: true })) : out;
  }

  // ---------- the frame: the page poses the components with fn(t); then camera, light rig, shadows, render, overlays
  function frame(t, fn) {
    NOW = t; FRAME_NO++;
    if (fn) fn(t);
    camAt(t); shadows.update();
    if (!window.NO_RENDER) { post.uniforms.seed.value = Math.round(t * 24) % 977; r.setRenderTarget(RT); r.render(scene, cam); r.setRenderTarget(null); r.render(postScene, postCam) } else scene.updateMatrixWorld(true);
    if (stage.overlay) stage.overlay.update(t);
    return true;
  }

  const stage = {
    W, H, scene, cam, cues: CUES, THREE, G, SHOTS, D0, renderer: r, aniso: ANISO, components, register, project, bboxOf,
    camKey, camTravel, camPush, closeOn, pushK, frame, textRects, matAnchor, overlay: null, version: KIT_VER, query: Q,
    sheet: (tex, w, d, o = {}) => sheet(tex, w, d, { parent: scene, ...o }),
    face, card: (shape, w, d, th, tex, o = {}) => card(shape, w, d, th, tex, { parent: scene, ...o }), rrShape,
    contact: shadows.contact, camState: (t = NOW) => { const { crane, ...st } = stateAt(t); return { ...st, crane } }, get frameNo() { return FRAME_NO },
    // world position of a component home: {x, z} or {px, py, station}, at height h
    at: (home, h = 0) => home.x !== undefined ? new THREE.Vector3(home.x, h, home.z) : G(home.px, home.py, h, home.station || 'base'),
    info() { const gl = r.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return { ss: SS, ms: MS, aniso: ANISO, kit: KIT_VER, renderer: e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) } },
    // aluminium (kit-plan 1.4): color #BFC3C9 times `mult`; the normal map tile is 0.5 units (extruded geometry has world-size UVs)
    alu(mult = 1, { rough = null } = {}) { return new THREE.MeshStandardMaterial({ color: new THREE.Color(Q.get('alum') || '#BFC3C9').multiplyScalar(mult), metalness: .6, roughness: rough ?? +(Q.get('alur') || .48), normalMap: tAluN, normalScale: new THREE.Vector2(.15, .15), envMapIntensity: .9 }) },
  };
  return stage;
}
