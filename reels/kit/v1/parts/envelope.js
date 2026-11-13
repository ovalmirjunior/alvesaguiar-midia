// The envelope (MESA lines 338 to 347, 428 to 430). The form is not in v1: a form is a stage.card with a draw function and must carry no monogram or crest.
import { lerp, sm, eo } from '../core/timing.js';
import { MARINHO } from '../core/palette.js';
import { txt, canvasTex, paper, papN, measure } from '../core/text.js';
import { card } from '../core/stage.js';

export const ZONES = { cxMax: 756, cy: [550, 1325] };
const EW = .98, ED = .64, ETH = .02, EFL = .36;

export function createEnvelope(stage, { home = { px: 880, py: 640, station: 'note' }, ry = .03, label } = {}) {
  if (!label) throw new Error('createEnvelope needs a label');
  const T = stage.THREE, world = stage.at(home);
  // label: Poppins Bold, Marinho, 132 canvas px, letter spacing 10 px, shrunk to fit 780 canvas px, never under 112 canvas px (37 px on screen)
  let fs = 132; while (measure('700 ' + fs + 'px P', label, '10px') > 780 && fs > 100) fs -= 2;
  if (measure('700 ' + fs + 'px P', label, '10px') > 780 || fs < 112) throw new Error('envelope label "' + label + '" does not fit at 112 canvas px or more');
  const group = new T.Group(); group.position.copy(world); group.rotation.y = ry; group.visible = false; stage.scene.add(group);
  const tex = canvasTex(882, 576, (g, w, h) => {
    paper(g, w, h, '#eef0f3', 1); g.strokeStyle = 'rgba(15,23,34,.16)'; g.lineWidth = 5; g.lineJoin = 'round'; g.beginPath(); g.moveTo(4, h - 4); g.lineTo(w / 2, h * .46); g.lineTo(w - 4, h - 4); g.stroke();
    g.strokeStyle = 'rgba(15,23,34,.10)'; g.beginPath(); g.moveTo(4, 4); g.lineTo(w / 2, h * .5); g.lineTo(w - 4, 4); g.stroke();
    txt(g, label, w / 2 + 5, h * .775, '700 ' + fs + 'px P', MARINHO, 'center', '10px');
  });
  card(stage.rrShape(EW, ED, .02), EW, ED, ETH, tex, { side: '#dfe2e7', parent: group, nrm: .2 });
  const tri = new T.Shape(); tri.moveTo(-EW / 2 + .01, 0); tri.lineTo(EW / 2 - .01, 0); tri.lineTo(.07, EFL - .03); tri.quadraticCurveTo(0, EFL, -.07, EFL - .03); tri.closePath();
  const fg = new T.ShapeGeometry(tri, 12); fg.rotateX(-Math.PI / 2);   // at angle 0 the flap lies flat beyond the far edge; it stands half open until the prints are in
  const fm = new T.Mesh(fg, new T.MeshStandardMaterial({ color: '#e6e9ee', roughness: .9, side: T.DoubleSide, shadowSide: T.DoubleSide, normalMap: papN(EW, EFL), normalScale: new T.Vector2(.5, .5) })); fm.castShadow = true; fm.receiveShadow = false;
  const hinge = new T.Group(); hinge.position.set(0, ETH + .001, -ED / 2 + .004); hinge.add(fm); group.add(hinge); hinge.rotation.x = 1.78;
  group.userData.rest = 0; stage.contact(group, EW, ED, .02, { th: ETH, blur: [.07, .015], alpha: [.45, .62] });
  const env = {
    name: 'envelope', group, home, world, label,
    // not drawn before t0; slides out from under the object on its left (the notepad), starting at t0
    slide(t, t0, { dx = -1.057, dz = 0, d = .6 } = {}) { const k = eo((t - t0) / d); group.visible = k > 0; group.position.set(world.x + (1 - k) * dx, 0, world.z + (1 - k) * dz) },
    // half open (1.78 rad) to closed
    flap(t, t0, d = .45) { hinge.rotation.x = lerp(1.78, Math.PI - .06, sm((t - t0) / d)) },
  };
  return stage.register(env);
}

export function selfTest(stage) {
  stage.camKey(0, 'note', { cut: true });
  const e = createEnvelope(stage, { label: 'PROCON' });
  return { dur: 4, frame: t => { e.slide(t, .4); e.flap(t, 2.8) }, times: [.3, .7, 1.2, 2.2, 3.0, 3.6] };
}
