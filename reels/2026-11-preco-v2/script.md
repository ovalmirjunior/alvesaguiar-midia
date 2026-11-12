# reelPR v2 · "Metade do dobro? Nessa Black Friday não!" · script, beats and legal check
Account @alvesaguiar.adv (Valmir Aguiar, OAB/CE 33.267). Source: candidate F, `script-candidate-F.md` in this folder (sha256 072fca692ca5c21c353328cf9debc86c464ef256fb694f7391776c5a072a7370), picked by the account owner on 2026-11-12 ("H1: I pick candidate F (script-1) as written."). This file was written by the Fable child of run fable-reel-objetos-v2b on 2026-11-12; round 2 (same day) applies the account owner's three changes to the look: a darker mat, an opening camera push, and the wish note leaving after p1; round 3 (same day) sets the account owner's new hook. Tags: FACT (seen in this run), HYPOTHESIS, OPINION.

## 1. Tip
Before paying on Black Friday, check the price history in a price comparator. If the old price of the ad does not show there, the discount may be false; a discount over an invented price is misleading advertising, and you can report it to the Procon with a print of the ad and of the history.

## 2. Narration (PT-BR, as spoken; the six TTS clips of `src/beats.json`)
FACT: p2 to p5 equal the narration of candidate F, section 5, byte for byte (checked by script in this run). p0 is the account owner's hook of 2026-11-12 about 18:20 -03, verbatim: "eu nao gostei muito dessa roteiro, comecou muito fraca. Essa Tv pela metade nunca custou o dobro,black friday! -  troque por: Metade do dobro? Nessa black friday não!"; p1 lost its first sentence "Black Friday.", which the hook now says. 89 words.
- p0: Metade do dobro? Nessa Black Friday não!
- p1: No site, a TV que você quer: de quatro mil por dois mil.
- p2: Mas o histórico de preços mostra: ela custa dois mil desde agosto. Então o desconto é zero, e o cronômetro do site manda decidir agora.
- p3: Mas preço antigo inventado é publicidade enganosa, e a lei proíbe.
- p4: Então, antes de pagar, abra um comparador de preços. O preço antigo não aparece? Tire print do anúncio e do histórico e denuncie no Procon.
- p5: Mande para quem vai comprar na Black Friday.

## 3. Beats
Times of p0 and p1 are estimate cues for the round 3 text (EST_SPEED=1: 37.619 s with the end card; EST_SPEED=1.15: 33.364 s); the rows from p2 on keep the round 1 estimate and now start about 1.0 s earlier. Real times come from the audio. Every action is tied to a spoken word through the `fx` map of `src/beats.json`.
| seg | est. time (s) | role | story card (Poppins Bold, top) | desk object and action (word that triggers it) | citation on screen |
|---|---|---|---|---|---|
| p0 | 0.0 to 2.9 | hook | "Metade do dobro?" (hidden while the camera is close) | Frame 0: the phone is lit with the store page (a TV, "Loja Online", "Smart TV 4K", "de R$ 4.000" struck, "por R$ 2.000", button "Comprar"); a paper disc "−50%" drops onto the glass beside the two prices (at rest at 0.3 s). The camera pushes in fast (2x, 0.55 s) onto the struck "de R$ 4.000", the disc and "por R$ 2.000", and lands on "dobro" (about 0.9 s). It pulls back to the whole desk on "Black" (0.65 s); the banner "BLACK FRIDAY" comes down on the phone ("Friday"); the folded paper "Histórico de preço ?" slides in beside the phone and lifts its flap once; the disc shakes "no" ("não"). | — |
| p1 | 2.9 to 6.9 | context | "De 4.000 por 2.000" (from "de") | A wish note "TV" with a hand-drawn star slides out from under the phone ("TV"); the two price rows are underlined ("quatro", "dois"). | — |
| p2 | 8.0 to 12.6 | conflict | "2.000 desde agosto" (from "dois") | The wish note slides back under the phone as p2 starts. The folded paper opens into the chart ("histórico"): AGO, SET, OUT, NOV, a dashed line "DE 4.000" with no point and a "?". The line of the real price, "2.000", is drawn from AGO to NOV ("dois"). | — |
| p2 | 12.6 to 17.4 | escalation | "Desconto: zero" (from "Então") | The paper disc turns over from "−50%" to "0%" ("zero"); a paper timer card "00:09:59" drops beside the "Comprar" button ("cronômetro") and counts down one second at a time, with no flashing. | — |
| p3 | 17.5 to 22.2 | turn | "Publicidade enganosa" (from "publicidade") | A paper strip "ENGANOSA" is laid over the dashed line, under its label "DE 4.000" ("enganosa"); the timer stops, turns face down and slides off the mat ("proíbe"). | CDC, art. 37, caput e § 1º |
| p4 | 22.3 to 28.1 | payoff | "Confira o histórico" | A magnifier-shaped paper card comes to the NOV point of the chart ("comparador") and scans back along the 2.000 line ("antigo"). | — |
| p4 | 28.1 to 32.0 | action | "Print e Procon" (from "Tire") | Flash on the phone and a small print of the ad flies out ("anúncio"); flash on the chart and a print of the history joins it ("histórico"); a paper envelope "PROCON" slides out from under the phone ("denuncie"); the two prints go in and the flap closes ("Procon"). | Decreto 2.181/1997, art. 4º |
| p5 | 32.1 to 35.1 | send-ask | "Mande para quem", then "vai comprar" (from "vai") | A paper plane leaves the phone and crosses the mat to the edge of the frame ("Mande"); the desk rests; then the fixed navy end card. | — |
Always on screen until the end card: the progress bar (seven cells, one per row above, each fills while its beat plays), the spoken words as one-to-three-word captions (the word being said is lit), the AA badge.
End card: "Alves Aguiar Advocacia", "Direito do consumidor", "Mande para quem vai comprar.", "Conteúdo informativo. Não substitui a análise de um caso concreto.", "Valmir Aguiar", "OAB/CE 33.267", "alvesaguiar.adv.br".

## 4. Changes from candidate F, and why
Narration: none.
1. Citation of p3: "CDC, art. 37, § 1º" became "CDC, art. 37, caput e § 1º". "A lei proíbe" comes from the caput (fix 1 of the blind review, `blind-scores.md`).
2. The wish note and the PROCON envelope slide out from under the phone instead of in from the edge of the frame, and the timer card turns face down before it leaves. Reason: text printed on a 3D object may not cross the icon column (x 886 and up, y 940 to 1846) or the band under y 1700.
3. The folded paper slides in over the mat instead of dropping from above (a slide keeps its shadow under it), and since round 2 it comes in after the opening push, as the camera comes back (in round 3 that is still inside p0, at about 2.3 to 2.9 s), not at frame 0: with the paper on the desk, its words would cross the top band (y under 260) during the opening push.
4. Card times follow the spoken word: "De 4.000 por 2.000" starts on "de", "2.000 desde agosto" on "dois", "Publicidade enganosa" on "publicidade", "Print e Procon" on "Tire". "Metade de quê?" stays through the first half of p1.
5. Added desk actions inside the same beats: the disc drops in at the start and shakes "no" on "não", the folded paper lifts its flap once when it arrives, the 2.000 line is drawn on "dois mil desde agosto", the magnifier scans the line on "O preço antigo não aparece?".
6. On the chart the strip "ENGANOSA" sits just under the label "DE 4.000", so the label stays readable next to it.
7. The two small prints carry no words (a picture of the ad, a picture of the chart): a caption on them would be too small to read on a phone.
8. Phone page wording: "de R$ 4.000" (struck) and "por R$ 2.000" in lower case, product name "Smart TV 4K"; the status bar has no clock (it would be a line too small to read). Since round 2 the store name "Loja Online" sits above the product name and the top bar shows a search field with no words, and the "−50%" disc lies beside the two prices instead of on the corner of the picture: both keep every printed word inside the safe zones during the opening push.
9. End card headline is the send-ask ("Mande para quem vai comprar."), in place of the save line of reelPR v1.
10. Layout bands against reelPR v1: the caption moved from y 1346 to y 1436 and the citation from y 1504 (44 px) to y 1582 (42 px, x 180 to 880), so the phone could grow to 915 px tall; the badge moved to y 1592.
11. Round 2, asked by the account owner (2026-11-12 17:54 -03): the leather mat is near Noite #0A0C10; the opening has one strong camera move (the push that lands on "dobro"), and the story card hides while the camera is close; the wish note leaves when p1 ends; the banner "BLACK FRIDAY" comes down on "Friday", when the camera is back.
12. Round 3, asked by the account owner (2026-11-12 about 18:20 -03): new hook "Metade do dobro? Nessa Black Friday não!"; p1 without "Black Friday."; the story card of the hook reads "Metade do dobro?"; the camera push lands on "dobro", now the third word (about 0.9 s); the pull-back, the banner and the folded paper moved from p1 into the hook ("Black", "Friday"); the disc shakes on "não" in place of the hop on "metade". No legal claim is in the new words.
Not taken from the blind review: fix 2 (hook card "Você paga preço cheio") and fix 3 (narration "comparador" in p2), because the account owner picked the script as written.

## 5. Legal provisions (re-read in this run, 2026-11-12 17:05 -03, by HTTP GET; raw bodies in the vault at scratch/fable-reel-objetos-v2b/fable/legal/)
1. Lei 8.078/1990 (Código de Defesa do Consumidor), art. 37, caput and § 1º. Used in p3.
   - Text (FACT, read): "Art. 37. É proibida toda publicidade enganosa ou abusiva." and "§ 1º É enganosa qualquer modalidade de informação ou comunicação de caráter publicitário, inteira ou parcialmente falsa, ou, por qualquer outro modo, mesmo por omissão, capaz de induzir em erro o consumidor a respeito da natureza, características, qualidade, quantidade, propriedades, origem, preço e quaisquer outros dados sobre produtos e serviços."
   - URL (Câmara dos Deputados, updated text): https://www2.camara.leg.br/legin/fed/lei/1990/lei-8078-11-setembro-1990-365086-normaatualizada-pl.html . READ: HTTP 200, 220597 bytes, sha256 0f46ff9e5738563d855ff61d4d914017a7f265de248f331239da36d30af3a39d.
   - URL (Câmara dos Deputados, original publication): https://www2.camara.leg.br/legin/fed/lei/1990/lei-8078-11-setembro-1990-365086-publicacaooriginal-1-pl.html . READ: HTTP 200, 124279 bytes, sha256 c5101867d26a61105b711e8effbfdf79cb9fd958601cc7f90422d091cc38a7b6. FACT: the caput and § 1º have the same words in both pages.
   - Mapping: an old price that the product never had is advertising information that is false about the price (§ 1º); the caput forbids it.
2. Decreto 2.181/1997, art. 4º, caput, with art. 3º, II. Used in p4 ("denuncie no Procon").
   - Text (FACT, read): "Art . 4º No âmbito de sua jurisdição e competência, caberá ao órgão estadual, do Distrito Federal e municipal de proteção e defesa do consumidor, criado, na forma da lei, especificamente para este fim, exercitar as atividades contidas nos incisos II a XII do art. 3º deste Decreto e, ainda:" and, in art. 3º, "II - receber, analisar, avaliar e apurar consultas e denúncias apresentadas por entidades representativas ou pessoas jurídicas de direito público ou privado ou por consumidores individuais;".
   - URL (Senado Federal, original publication of 1997): https://legis.senado.leg.br/norma/395770/publicacao/15684699 . READ: HTTP 200, 123750 bytes, sha256 275289ebf0c9087268e116d2ab193f469a2e0146d732d6a8163f4c4a07881626.
   - Later changes, from the Senado record https://legis.senado.leg.br/dadosabertos/legislacao/DEC/2181/1997 (READ: HTTP 200, 40193 bytes). FACT: it lists three decrees. Decreto 7.738/2012: arts. 2, 3 (caput and item XII), 4 (item V), 5, 9, 16, 50, 56, 63. Decreto 10.417/2020: art. 5, parágrafo único, and art. 16, caput. Decreto 10.887/2021: arts. 6 and onward (6, 6-A, 12, 13, 14, 14-A, 15, 25, 26, 26-A, 28, 28-A, 28-B, 30 and later ones); none to art. 3 or art. 4.
   - Decreto 7.738/2012 text READ at https://legis.senado.leg.br/norma/412768/publicacao/15764514 (HTTP 200, 73926 bytes, sha256 adb15436e476ba2f591c2da4739844f6312233b53e52e9f52475026ff0a95193). FACT: its art. 7º rewrites the caput and item XII of art. 3º (the caput now names the Secretaria Nacional do Consumidor) and item V of art. 4º; item II of art. 3º and the caput of art. 4º are not in it.
   - NOT READ: a compiled current text of Decreto 2.181/1997; the texts of Decreto 10.417/2020 and Decreto 10.887/2021 (only the record's list of changed articles); Planalto.
3. Not legal claims: "abra um comparador de preços", "confira o histórico" and "tire print" are practical steps to keep proof; no provision is cited for them.

## 6. Not claimed
- That a comparator's history proves by itself that the old price is false: the script asks "não aparece?" and sends the viewer to print and report; the Procon examines it.
- Any fine, penalty, crime, deadline or result of the report; any refund, exchange or compensation.
- Any minimum time a price must have been charged before it can be shown as the old price.
- Whether to buy the TV or not.
- Any real store, brand, product model or price comparator: the TV, the store and the prices are invented examples.
- That every city has a Procon; anything about a physical store.

## 7. OAB check (carrossel-advocacia step 4; the writer's own check, not a review)
PASS. No fees, prices of services, payment terms or free services; no results, cases or promises; no praise, comparison or description of the lawyer or the office; no offer of legal services and no request for tags or referrals; one call to action, a send-ask to a buyer on an informative post; the name and the OAB number appear only on the end card, which carries "Conteúdo informativo. Não substitui a análise de um caso concreto."; no personal photo; sober props (matte paper, no burst, no neon, no flashing; the "−50%" disc, the "BLACK FRIDAY" banner and the timer show the store's ad that the Reel takes apart).

## 8. Files
- `src/beats.json` (segments, cards, bar cells, fx words), `src/mesa_cues.py` (unchanged from reelPR v1), `src/sfx.py`.
- `labrig/mesa.html`, `labrig/textures/` (six maps), `labrig/fonts/`, `labrig/cues_mesa.json` (estimate cues until the audio run), `labrig/cues-est115.json` (estimate at EST_SPEED=1.15, a test file; the lab does not need it).
- `tools/gen_textures.py` (makes the six maps), `tools/scene.js` (Mac preview frames and the safe-zone check of DOM and 3D text), `tools/sheet.py` (preview sheet).
