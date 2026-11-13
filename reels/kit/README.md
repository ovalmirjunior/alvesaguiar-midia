# Desk kit for 3D desk Reels (reels/kit)

A kit of modules and tools for Reels of the Alves Aguiar Advocacia account told with sober office objects on a desk, seen from above: a phone, a price-history sheet,
a laptop with law text, a notepad with a pen, an envelope, the caption layer and the end card. It is the reelPR2 scene (`mesa.html`) cut into modules plus four new things
(wood desk, laptop, notepad with pen, cover overlay). One landscape leather mat (11.12 x 10.68 units) holds every object from 0 s to the end card: the phone and the price sheet at its left,
the laptop at its far right, the notepad, pen and envelope in front of the laptop. Three camera stations (`phone`, `laptop`, `note`) frame them and the camera travels between them: there is no cut. Brand source: `/Users/valmirjunior/dev/vision/areas/work/content/brand-guide.md` ("Standard palette", "Goal and covers").
Safe zones: `/Users/valmirjunior/dev/vision/areas/work/content/style-bank.md` pattern 6. The frame at time t depends only on t.

## Tree

```
reels/kit/
  README.md  VERSION                  VERSION: one line, the newest version folder (v1)
  vendor/three-0.169.0/build/three.module.js      the whole of three.js for v1 (no addon)
  assets/fonts/f1/                    six font files        assets/textures/t1/   ten maps and SOURCES.txt
  v1/
    kit.js kit.css                    entry (re-exports everything) and overlay styles
    core/    palette rng timing text stage shadow overlays cover
    parts/   phone screens papers envelope laptop notepad
    demo/    mesa.html cues_mesa.json KIT.pin       the 21 s demo Reel (a test page, never published)
    test/    component.html KIT.pin                 ?c=none (stations and travels)|phone|laptop|notepad|price|envelope
    MANIFEST.sha256                   sha256 of every file the version loads
    FROZEN                            absent while v1 is being built; one line with the date once a Reel pinned to v1 is published
  tools/    seven byte copies (COPIES.sha256) and the kit_* tools
```

## How a Reel starts

1. Copy `v1/demo/mesa.html` to the Reel's `labrig/` folder and keep the head (the import map and the stylesheet name `/kit/v1/`).
2. Write `labrig/KIT.pin`, one line: `v1 <sha256 of reels/kit/v1/MANIFEST.sha256>`.
3. Write `labrig/cues_mesa.json` (segments with `id`, `ramp`, `cards`, `cite`, `cite_at`, `cite_t1`, `fx`, `t0`, `t1`, `words`; `bar`; `end_t`; `dur`), in the format of `v1/demo/cues_mesa.json`.
4. Edit the beats in the page: components are created once, posed every frame by `pose(t)`; every move is a pure function of `t` and of cue times.
5. Rules for a Reel: a ramp is `ambar | tijolo | verde | aco`, at most two ramps in the cues; every text measures at least 34 px on screen; text only at y 260 to 1700, and x below 886 for y 940 to 1846;
   in every 2.0 s at least one object starts a move on a word; a camera event (push, cut or a nudge of 0.03 units or more) at least every 5.0 s; objects arrive by sliding, never by fading in;
   stations are `phone` (alias `base`), `desk` (opening only), `laptop` and `note`; the camera moves between them with `stage.camTravel({from, to, t0, d, craneT0, craneD})`
   (a pan of tx, then a crane of tz, dist and tilt); no 3D text may be on screen while the crane runs (kit_zones `crane_text`), and a display powers on only after the crane ends.
   Objects that come out from under another are not drawn before their slide starts (the price sheet under the phone, the envelope under the notepad).

## Components

| component | file | what it is |
|---|---|---|
| stage | core/stage.js | renderer with post pass, light rig that follows the shot, wood desk, leather mat, camera keys (`camKey`, `camPush`, `closeOn`), `frame(t, fn)`, `textRects()` |
| overlays | core/overlays.js | bar, story card, word caption, citation pill, badge, end card (`endCard({label, headline, em})`), DOM text boxes |
| phone | parts/phone.js, screens.js | store page on an emissive display: `power`, `flash`, `slideOut` (exit to the left, then not drawn; the demo does not use it), `screen.upd(key, {u1, u2, banner})` |
| price sheet | parts/papers.js | folded history sheet: `slideIn(t, t0, {under, d})` (out from under the phone, or in from the right without `under`), `peek`, `open`, `drawLine`, `hide`; `createPrint` for small picture cards |
| envelope | parts/envelope.js | `slide` (not drawn before t0), `flap`; the label is checked to fit at 112 canvas px or more |
| laptop | parts/laptop.js | law text on a display: `show`, `lid(t, t0, {from, to, d})` (several calls per frame: the last whose t0 has passed wins), `power`, `scroll`, `mark`; always on the mat, closed it may be in any frame; `DEMO_DOC` is the demo text |
| notepad and pen | parts/notepad.js | `write`, `pen(t, {lift: [t0, d], rest: [t0, d]})` (the pen lies beside the pad, lifts to line 0 and goes back), `appear`; one to three short lines |
| cover | core/cover.js | `window.KIT.cover({headline, hi, ramp, pos})` |

Call every method you use on every frame (the methods are stateless but each component keeps one pose).

## Preview and render

```
export NODE_PATH=/Users/valmirjunior/dev/vjmecha/node_modules
node tools/kit_render.js <labrig> <outdir> [--query q] [--step n] [--page mesa.html]       frames 00000.jpg ... at 24 fps
python3 -I tools/framesheet.py <outdir> <sheet.jpg> <label>                                one frame per second with safe-zone lines (needs --step 1 frames)
```
Lab render: `python3 -I tools/kit_pack.py <labrig> <bundle>` writes a self-contained bundle (the labrig files plus `kit/` with only the files of the pinned manifest and one MANIFEST.sha256);
a plain file server at the bundle root serves the page, and the byte copies `render_mac.js` and `cover.js` also work on a bundle. Lab steps: `runbooks/lab-render.md` in the vault.
Quality switches in the URL: `ss`, `ms`, `glow`, `glare`; material overrides `matc mats mate wear stc woodc woode alum alur lapE`.

## Checks and pass rules (each prints one JSON line and runs the pin check first)

- `node tools/kit_zones.js <labrig> <out.json> [--query q] [--step n] [--page p]`: every frame, every text box (DOM and 3D). Break: `y0 < 260`, `y1 > 1700`, `x1 > 886` while the box overlaps y 940 to 1846, `px < 34`, or `crane_text` (any 3D text box with a part inside the frame while `window.CAMSTATE().crane` is true). Pass: 0 breaks.
- `node tools/kit_iconscan.js <labrig> <out.json> [--step 2]`: every second frame twice, text on and text off, crop x 886 to 1080 and y 940 to 1846; pixels that differ by more than 8. Pass: 0 pixels.
- `node tools/kit_order.js <labrig> <out.json> [--times a,b,c]`: PNG screenshots forward, reversed, in a seeded shuffle and in the same shuffle on a fresh page. Pass: the four sha256 of each time are equal.
- Component pages: `--page component.html --query c=phone` (labrig `v1/test`).
- `python3 -I tools/kit_check.py [--version v1]`: every manifest line matches the file on disk, every file of the version is listed, every `KIT.pin` matches, `tools/COPIES.sha256` matches. Exit 0 only when all match.
- Pin rule: before any render, cover or check the tools stop with exit 3 unless the `/kit/<version>/` of the page equals the version of `KIT.pin`, every line of that version's manifest matches the file on disk, and the sha256 of `MANIFEST.sha256` equals the pin.

## Cover

```
node tools/kit_cover.js <labrig> <out.jpg> <t> [--headline "<3 to 5 words>"] [--hi "<words>"] [--ramp ambar] [--pos top|bottom] [--focus <component name>] [--quality 95] [--query q]
node tools/kit_cover.js /Users/valmirjunior/dev/alvesaguiar-midia/reels/kit/v1/demo <Reel folder>/out/cover.jpg 13.2 --headline "A lei proíbe isso" --hi "proíbe"
```
It writes the cover, `<out>-3x4.jpg` (crop y 240 to 1680) and `<out>-4x5.jpg` (crop y 285 to 1635). Exit 2: headline outside 3 to 5 words; 3: pin; 4: plate or focus component outside x 35 to 1045, y 285 to 1635; 5: `#cap` still shown.
Never the 0 s frame; the strongest beat; one focal object; no sale wording. With no `--headline` the story card of that time stays as the text.

## Versions

A version folder with `FROZEN` is never edited. A change after that is a new folder (`v2`, a copy of `v1` plus the change). `vendor/` and `assets/` are append-only: a file there is never changed or removed;
a new texture set is `assets/textures/t2/`. Run `kit_check.py` before each kit commit. A Reel pinned to `v1` keeps loading `/kit/v1/`, so a later version cannot change its pixels.
`kit_check.py --write-manifest v1` (re)writes the manifest and the `KIT.pin` files of the version, only before it is FROZEN.

## Size budget

`reels/kit/` at v1: 20 MB at most. Each later code version: at most 0.6 MB. A new texture set: at most 6 MB. At 40 MB stop and ask the OP before adding more.
