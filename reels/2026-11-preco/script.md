# reelPR — "As 4 peças do preço" (3D desk pieces) — draft v4 (look v2 after OP feedback 1; three fixes after OP feedback 2; color system after OP feedback 3), 2026-11-12

Theme: price and discount on Black Friday. Account @alvesaguiar.adv. Posting date before Black Friday 2026, so the text speaks to people who will buy.
Format: style-bank S-01 / S-03. Reel B is used for the pipeline only (setT scene, cues, lab render); the look is new.
Files: `src/beats.json` (beat plan), `labrig/mesa.html` (scene), `src/sfx.py` (sfx), `labrig/fonts/` (Poppins Bold, Newsreader, Hanken Grotesk).
Estimated length (no audio, `src/mesa_cues.py`, gap 0.25 s): dur 41.341 s, end card from 38.741 s; with `EST_SPEED=1.15` dur 36.601 s, end card from 34.001 s. Reel B's estimate ran 2.5% above its real audio.
The narration is the same as draft v1 (no TTS clip existed); only the look, the opening and the on-screen texts changed.

## Look v2 (answers to OP feedback 1, /Users/valmirjunior/dev/vision/scratch/fable-reel-objetos/op-feedback-1.md)
1. More color: one color per piece, all from the account's carousel palette: piece 1 mint #7FD3A0 with a green #1E7A46 phone; piece 2 coral #F08A5D clipboard with brick #B4532A marks; piece 3 yellow #F2C14E label with a blue #2D5A9A terminal; piece 4 sky #7FA6DE tray with mint, yellow and coral tiles. The four progress cells, the "PEÇA n" chip, the last word of each title and the citation outline take the color of the piece. Matte materials, no neon, no flashing.
2. Black mat: the mat is matte black (#050608) with a grey stitched edge; a dark walnut desk shows only as a strip at the top.
3. Opening (0 to 2 s): the whole price tag is in frame from 0 s and swings into place (to 0.45 s); the yellow sticker "DE R$ 1.999" peels off by one corner (0.22 to 1.17 s) and shows the price printed under it, "ANTES R$ 999"; the sticker flies off (to 1.67 s); the camera arcs and pulls back the whole time; on "metade" the coral "−50%" disc flips over to "0%". The title "Desconto de verdade?" is on screen from frame 0.
4. Titles never sit on objects: the header band (y 314 to 565: "PEÇA n" and the title, left aligned, white with one colored word) is kept free; every object stays in y 575 to 1310; captions (y 1346 to 1468) and the citation pill (y 1504 to 1578) sit below.
- Captions: phrases of 1 to 3 words in a dark pill, Poppins Bold 86 px, the spoken word lit yellow (no stroke, no one-word flashing). Chat bubbles were dropped.
- Every piece lies on the mat from the start, 3.6 units apart and without text (phone screen off, blank paper, blank label, tile backs without numbers). While the camera travels (0.5 s) the piece that leaves and the next one are both in view, so no frame shows only the mat. When the camera has arrived the piece wakes with a small hop and its text turns on. The terminal slides in from the right (its text stays above y 940); the three tiles lie face down and flip over one by one.
- The final board is built where piece 4 stands, with no camera travel: the tray shrinks into its cell and the other three pieces pop in around it.

## OP feedback 2 (/Users/valmirjunior/dev/vision/scratch/fable-reel-objetos/op-feedback-2.md)
- Whole tag at 0 s: done (no slide-in; the tag swings and settles inside the frame).
- No empty frames near 7 s and 36 s: done as described above (pieces 3.6 apart and present from the start; final board in place).
- Chip label: "PEÇA 1" to "PEÇA 4".
- Pace: `gap` 0.25 s, no per-segment gap; the scene was previewed and audited with the estimate at speed 1 and at speed 1.15. Narration texts unchanged (src/tts.tsv stays valid).

## Color system (OP feedback 3, /Users/valmirjunior/dev/vision/scratch/fable-reel-objetos/op-feedback-3.md; source /Users/valmirjunior/dev/vision/areas/work/content/brand-guide.md)
This section replaces every color named elsewhere in this file (Look v2 item 1, the beats table, the OAB line). Composition, motion, timing and every text are unchanged.
Ramps, tone 1 darkest to tone 5 lightest: Verde #0A1F14 #12452A #1E7A46 #7FD3A0 #DDF5E7 · Âmbar #1E1206 #5C3A0E #9A6110 #F2C14E #FFF0C9 · Tijolo #24100A #6E2A14 #B4532A #F08A5D #FDE3D4 · Aço #0B1424 #1F3F6E #2D5A9A #9DB4D6 #E3ECF7. Mat Noite #0A0C10; neutral text #F2F4F7; Marinho #1F3F6E.
Tone use in every ramp: object faces tone 3 or 4; sides tone 2; paper, screens and small highlights tone 5; ink on a light tone in tone 1 or 2; overlay text on the mat in tone 4.

| Element | Ramp and tones |
|---|---|
| Opening tag | Âmbar: face 4, sides 2, print 1, eyelet 5; the row "ANTES R$ 999" in Tijolo 2 |
| Opening sticker, cord and disc | Tijolo: sticker 4 with text 1 (back 5); cord 3; disc "−50%" side 4, "0%" side 3 with text 5, edge 2 |
| Piece 1 (phone, print, check coin) | Verde: body 3, sides 2, screen 5 with marks in 2, 3 and 4, coin 4 |
| Piece 2 (clipboard, chart, stamp) | Tijolo: board 4, sides 2, paper 5, real bars 4, invented bar and "ENGANOSA" 3, ink 1 and 2, stamp 3 with a 4 knob |
| Piece 3 (label, terminal, frame, check coin) | Âmbar: label 4 with paper 5 and a 3 band, terminal 3 with sides 2 and keys 5, strike 3, frame 5, coin 4 |
| Piece 4 (tray, tiles) | Aço: tray 3, sides 2, the three tile backs 4, tile faces 5 with text 2 and number discs 3 |
| Final board | Aço only: pieces 1 to 3 come back as Aço copies beside the Aço tray |
| Progress bar | one cell per piece in its ramp: tone 4 while the piece is the current one, tone 3 after the next piece wakes |
| Captions | white, the spoken word in tone 4 of the ramp of its beat (opening Âmbar, final board Aço) |
| Titles | white, one word in tone 4 of the beat's ramp; the rule under the title in the same tone |
| Chip "PEÇA n" | chip and label in tone 4 of the piece's ramp, the number in tone 1 |
| Citation pills | Noite pill, white text, outline in tone 4 of the piece's ramp |
| AA badge | Marinho with a neutral #F2F4F7 mark |
| End card | unchanged: Marinho, with its yellow (= Âmbar 4) and its light blue (= Aço 4) |

Two accent ramps per frame (plus Marinho), objects and texts: opening Âmbar and Tijolo; pieces 1 to 4 one ramp each; camera travel between two pieces shows two ramps; final board Aço. Two things go over the rule: (1) the progress bar, kept in the OP's wording ("segments in the same ramps"), shows up to four ramps from piece 3 on; (2) for about 0.1 s in the travel from the opening to piece 1 the frame holds Âmbar, Tijolo and the edge of the Verde phone, because both objects must be in view (no frame with only the mat). The walnut desk strip at the top of the frame is kept as approved; it is not a palette color.

## Hook options and the pick
| # | Type | Spoken line | On-screen title | Image |
|---|---|---|---|---|
| A (pick) | curiosity gap | "Desconto de verdade, ou metade do dobro?" | Desconto de verdade? | a "DE R$ 1.999" sticker peels off a price tag and shows "ANTES R$ 999" above "POR R$ 999" |
| B | specificity | "De mil novecentos e noventa e nove por novecentos e noventa e nove. Esse preço antigo existiu?" | De 1.999 por 999? | same tag |
| C | stakes | "A loja anunciou um preço e na hora cobrou outro?" | Anunciou um, cobrou outro? | label and checkout terminal |

Pick A: the shortest; it names the doubt every Black Friday buyer has; "metade do dobro" is the popular phrase for a fake discount, and the peel shows it without a word of explanation.

## Beats (6 segments, one TTS clip each)
| id | piece (object, color) | narration (PT-BR, also the caption source) | header | citation on screen |
|---|---|---|---|---|
| p0 | hook: cream price tag, whole in frame from 0 s; sticker peels (0.22 s); disc flips to "0%" on "metade"; camera pushes in on "Antes"; the 4 bar cells tick on "quatro" | Desconto de verdade, ou metade do dobro? Antes da Black Friday, guarde quatro peças. | Desconto de verdade? | — |
| p1 | print (mint): green phone, the ad turns on when the piece wakes; screenshot flash on "print"; check coin on "cumprir" | Primeiro, o anúncio. Tire print: o preço que a loja anuncia, ela tem que cumprir. | PEÇA 1 · A oferta obriga | CDC, art. 30 |
| p2 | chart (coral): clipboard "Histórico de preço", four months at 999; the dashed "DE" bar 1.999 with "?" appears on "inventado"; stamp ENGANOSA on "enganosa" | Mas o preço antigo foi inventado? Desconto falso é publicidade enganosa, e a lei proíbe. | PEÇA 2 · Publicidade enganosa | CDC, art. 37, caput e § 1º |
| p3 | menor (yellow): shelf label R$ 89,90; blue checkout terminal R$ 99,90 slides in on "caixa"; mint frame and check on the label on "menor", the terminal price is struck | E se a etiqueta mostra um preço e o caixa cobra outro? Você paga o menor. | PEÇA 3 · Vale o menor | Lei 10.962/2004, art. 5º |
| p4 | escolha (sky): tray with three face-down tiles (numbers 1, 2, 3 show when the piece wakes); each flips on "exigir", "aceitar", "cancelar" | Mas a loja se recusa a cumprir? Então a escolha é sua: exigir a oferta, aceitar outro produto equivalente, ou cancelar e receber o dinheiro de volta. | PEÇA 4 · A escolha é sua | CDC, art. 35 |
| p5 | final: the four pieces come back small in a 2 x 2 board; then the end card | Quatro peças. Salve pra lembrar na Black Friday. | As 4 peças do preço | — |

Turn words: "Primeiro" (p1), "Mas" (p2), "E" (p3), "Mas … Então" (p4). One idea per beat. Progress cue: 4 cells at the top, one fills in the color of its piece when the piece wakes, plus the "PEÇA n" chip.
CTA (the only one): "Salve pra lembrar na Black Friday." (spoken in p5 and as the end card headline).
Header timing: the chip shows when the piece wakes; the title shows on the key word ("anuncia", "enganosa", "outro", "escolha") and stays to the end of the beat.

## Every on-screen text
- Overlays: the headers and citations of the table (citation: 44 px pill under the caption, from the waking of the piece to the end of its beat); captions = the narration in phrases of 1 to 3 words.
- Hook tag: "BLACK FRIDAY"; sticker "DE R$ 1.999" (peels off); under it "ANTES R$ 999"; "POR", "R$ 999"; disc "−50%", other side "0%".
- Phone: "Loja Online", "Fone sem fio", "R$ 999", "Black Friday", "Comprar", then "Print salvo".
- Clipboard: "HISTÓRICO DE PREÇO"; bars "999" AGO, SET, OUT, NOV; dashed bar "1.999", "DE", "?"; "De R$ 1.999 por R$ 999"; stamp "ENGANOSA".
- Label: "ETIQUETA", "R$ 89,90". Terminal: "CAIXA", "R$ 99,90" (struck on "menor").
- Tiles: backs "1", "2", "3"; faces "1 EXIGIR A OFERTA", "2 PRODUTO EQUIVALENTE", "3 DINHEIRO DE VOLTA, CORRIGIDO".
- All prices, the product and the store are invented examples; no real store, brand or case.
- AA mark badge (no text) bottom left at 60% opacity during the scene.

## End card (in the scene, from end_t to dur, 2.6 s; unchanged)
- "ALVES AGUIAR ADVOCACIA" (AA mark) · "DIREITO DO CONSUMIDOR" · "Salve pra lembrar na Black Friday." · "Conteúdo informativo. Não substitui a análise de um caso concreto." · "Valmir Aguiar" · "OAB/CE 33.267" · "alvesaguiar.adv.br"
- Newsreader 500 (headline), Newsreader 400 italic (name), Hanken Grotesk 400/600/700; navy #1F3F6E, yellow #F2C14E, light #F2F4F7, grey #C3CCDA. Name and OAB number appear only here.

## Legal check (read on 2026-11-12, about 09:25 -03, by HTTP GET; captures in /Users/valmirjunior/dev/vision/scratch/fable-reel-objetos/fable/legal/)
### Lei 8.078/1990 (Código de Defesa do Consumidor, CDC)
Source (Câmara dos Deputados, updated text): https://www2.camara.leg.br/legin/fed/lei/1990/lei-8078-11-setembro-1990-365086-normaatualizada-pl.html — read worked (HTTP 200).
Second read (Câmara, original publication): https://www2.camara.leg.br/legin/fed/lei/1990/lei-8078-11-setembro-1990-365086-publicacaooriginal-1-pl.html — read worked (HTTP 200); arts. 30, 35 and 37 have the same text in both pages.

- Art. 30 (beat p1): "Art. 30. Toda informação ou publicidade, suficientemente precisa, veiculada por qualquer forma ou meio de comunicação com relação a produtos e serviços oferecidos ou apresentados, obriga o fornecedor que a fizer veicular ou dela se utilizar e integra o contrato que vier a ser celebrado."
- Art. 37, caput and § 1º (beat p2): "Art. 37. É proibida toda publicidade enganosa ou abusiva. § 1º É enganosa qualquer modalidade de informação ou comunicação de caráter publicitário, inteira ou parcialmente falsa, ou, por qualquer outro modo, mesmo por omissão, capaz de induzir em erro o consumidor a respeito da natureza, características, qualidade, quantidade, propriedades, origem, preço e quaisquer outros dados sobre produtos e serviços."
- Art. 35 (beat p4): "Art. 35. Se o fornecedor de produtos ou serviços recusar cumprimento à oferta, apresentação ou publicidade, o consumidor poderá, alternativamente e à sua livre escolha: I - exigir o cumprimento forçado da obrigação, nos termos da oferta, apresentação ou publicidade; II - aceitar outro produto ou prestação de serviço equivalente; III - rescindir o contrato, com direito à restituição de quantia eventualmente antecipada, monetariamente atualizada, e a perdas e danos."

### Lei 10.962/2004 (oferta e afixação de preços)
Source (Senado Federal, original publication, DOU 13/10/2004): https://legis.senado.leg.br/norma/552838/publicacao/15716870 — read worked (HTTP 200).
Second read (Senado Federal, compiled text "Compilação Monovigente na CD"): https://legis.senado.leg.br/norma/552838/publicacao/34620893 — read worked (HTTP 200); art. 5º has the same text in both.
Norm record: https://legis.senado.leg.br/dadosabertos/legislacao/LEI/10962/2004 (id 552838; lists the later changes: art. 2º-A by Lei 13.175/2015, art. 5º-A by Lei 13.455/2017, art. 2º III by Lei 13.543/2017; none changes art. 5º).
A guessed Câmara URL for this law returned 404; the Senado pages above are the source.

- Art. 5º (beat p3): "Art. 5º No caso de divergência de preços para o mesmo produto entre os sistemas de informação de preços utilizados pelo estabelecimento, o consumidor pagará o menor dentre eles."

### How each line maps to its provision
- p1 "o preço que a loja anuncia, ela tem que cumprir": art. 30 (precise information or advertising binds the supplier and is part of the contract). "Tire print" is practical advice (keeping proof of the ad), not a legal requirement.
- p2 "Desconto falso é publicidade enganosa, e a lei proíbe": art. 37 § 1º (advertising information that is false, or able to mislead, about price) and art. 37 caput (prohibited). The beat's premise is an old price that was invented: the chart shows four months at 999 and a dashed "DE" bar at 1.999 that never existed; the hook tag shows the same story (the "DE R$ 1.999" sticker peels off the printed "ANTES R$ 999").
- p3 "a etiqueta mostra um preço e o caixa cobra outro? Você paga o menor": Lei 10.962/2004 art. 5º (label and checkout are two price information systems of the same store).
- p4 the three choices: art. 35 I, II and III. Tile 3 says "dinheiro de volta, corrigido" for "restituição de quantia eventualmente antecipada, monetariamente atualizada".

### Not claimed
- No exception for an obvious pricing mistake ("erro grosseiro") is stated or denied: that is case law, not read at a source.
- No minimum time a price must have been charged before it can be shown as the old price, and no percentage or deadline of any kind.
- No fine, penalty, crime (CDC art. 67 not used) or Procon procedure.
- Art. 5º of Lei 10.962/2004 is claimed only for label versus checkout in a store; nothing is said about a site price versus a cart price.
- "Perdas e danos" (art. 35 III) is not narrated or valued; no promise of compensation.
- The right of withdrawal (CDC art. 49) is not in this Reel (Reel B covers it).
- Lei 10.962/2004 art. 2º III and art. 5º-A were read and are not used.
- Planalto was not read (automated reads are blocked); the OP may confirm the four provisions there before posting.

## OAB checklist (skill step 4, adapted to video) — one line
PASS (builder's own check, not a review): no fees, prices of legal services, offers, free services, results, cases, promises, self-praise or office description; no request for referrals or tags; one informative CTA ("Salve pra lembrar na Black Friday."); name and OAB number only on the end card, which carries the disclaimer; sober look: black mat, flat matte colors from the account's carousel palette, no neon, no flashing, no sale bursts (the discount mark is a plain coral disc; the stamp uses the brand brick #B4532A).
