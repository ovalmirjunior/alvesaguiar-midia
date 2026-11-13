// The phone (MESA lines 205 to 253): metal frame, black glass, emissive display under the glass (black diffuse, the UI as emission, a glossy reflection of the room on top).
// Call every method you use on every frame (the methods are stateless: the pose is a pure function of t and the cue times).
import { clamp, sm, eo, lerp } from '../core/timing.js';
import { dyn } from '../core/text.js';
import { storePage } from './screens.js';
import { ramp as getRamp } from '../core/palette.js';

export const ZONES = { cx: [263, 684], cy: [912, 963] };   // safe placement window of its centre at the base shot, frame px, for a yaw within 0.06 rad
const PW = 1.5, PH = 3.075, PT = .15, PR = .215, BEV = .017, BT = .03, BEZ = .03, DW = PW - 2 * (BEV + BEZ), DH = PH - 2 * (BEV + BEZ), DR = PR - BEV - BEZ;
const SCW = 1160, SCH = Math.round(1160 * DH / DW);

export function createPhone(stage, { home = { px: 292, py: 918 }, ry = .052, draw = storePage, ramp = 'ambar' } = {}) {
  const T = stage.THREE; getRamp(ramp);
  const group = new T.Group(); group.position.copy(stage.at(home)); group.rotation.y = ry; stage.scene.add(group);
  {
    const g = new T.ExtrudeGeometry(stage.rrShape(PW - 2 * BEV, PH - 2 * BEV, PR - BEV), { depth: PT - 2 * BT, bevelEnabled: true, bevelThickness: BT, bevelSize: BEV, bevelSegments: 6, curveSegments: 28 }); g.rotateX(-Math.PI / 2); g.translate(0, BT, 0);
    const glass = new T.MeshStandardMaterial({ color: 0x030405, roughness: .07, metalness: 0 }), metal = new T.MeshStandardMaterial({ color: 0x8f9299, roughness: .34, metalness: 1 });
    const b = new T.Mesh(g, [glass, metal]); b.castShadow = true; b.receiveShadow = true; group.add(b);
    const btn = (x, z, l) => { const m = new T.Mesh(new T.CapsuleGeometry(.014, l, 4, 10), metal); m.rotation.x = Math.PI / 2; m.position.set(x, PT * .5, z); m.castShadow = true; group.add(m) };
    btn(PW / 2 + .004, -.52, .3); btn(-PW / 2 - .004, -.72, .16); btn(-PW / 2 - .004, -.42, .16);
  }
  const x0 = group.position.x; group.userData.rest = 0; stage.contact(group, PW, PH, PR, { th: PT, blur: [.2, .035], alpha: [.62, .9], grow: .03 });
  const screen = dyn(SCW, SCH, (g, w, h, o) => draw(g, w, h, { ramp, ...o }));
  screen.upd('init', {});
  const disp = stage.face(stage.rrShape(DW, DH, DR), DW, DH, screen.t, new T.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: screen.t, emissiveIntensity: 0, roughness: .08, metalness: 0 }));
  disp.position.y = PT + .0006; group.add(disp);
  let level = 0; disp.userData.tm.active = () => level >= .05;   // a dark glass reports no text boxes
  const fg = new T.ShapeGeometry(stage.rrShape(DW, DH, DR), 24); fg.rotateX(-Math.PI / 2);
  const flashP = new T.Mesh(fg, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); flashP.position.y = PT + .02; flashP.visible = false; group.add(flashP);
  const phone = {
    name: 'phone', group, screen, home, world: group.position.clone(), DW, DH, SCW, SCH,
    // events: [{on: t0, d: 0.22} | {off: t0, d: 0.25}, ...] in time order; level 0..1 scales emissiveIntensity (0.93 at 1)
    power(t, events) {
      let prev = 0, lvl = 0;
      for (const e of events) { const on = e.on !== undefined, s = on ? e.on : e.off, to = on ? 1 : 0; if (t < s) break; lvl = lerp(prev, to, sm((t - s) / e.d)); prev = to }
      level = lvl; disp.material.emissiveIntensity = .93 * lvl; return lvl;
    },
    // exit move: slides left along x by dx units (eo) during d seconds, then is not drawn; call after power() has switched the glass off (no text on it while it moves)
    slideOut(t, t0, { dx = -2.4, d = .55 } = {}) { group.position.x = x0 + eo((t - t0) / d) * dx; group.visible = !(t >= t0 + d) },
    flash(t, t0) { const f = t >= t0 ? clamp(1 - (t - t0) / .34) : 0; flashP.visible = f > 0; flashP.material.opacity = f * .92 },
    // point of the glass under canvas pixel (cx, cy), in phone coordinates
    onScr: (cx, cy) => [(cx / SCW - .5) * DW, (cy / SCH - .5) * DH],
    get level() { return level },
  };
  return stage.register(phone);
}

// 4 s timeline of the component alone on the base shot
export function selfTest(stage) {
  stage.camKey(0, 'base', { cut: true });
  const p = createPhone(stage), ev = [{ on: .5, d: .22 }, { off: 3.2, d: .25 }];
  const frame = t => {
    p.power(t, ev); p.flash(t, 2.6);
    const k1 = Math.round(sm((t - 1.2) / .35) * 30) / 30, k2 = Math.round(sm((t - 2.0) / .35) * 30) / 30;
    p.screen.upd(k1 + '|' + k2, { u1: k1, u2: k2 });
  };
  return { dur: 4, frame, times: [.3, .8, 1.5, 2.3, 2.8, 3.6] };
}
