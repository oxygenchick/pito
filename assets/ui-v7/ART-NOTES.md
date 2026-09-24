# UI art v7 — 24 September 2026

Built-in imagegen was used (not CLI). Style reference: project-root ui concept reference.png.
Original generated sources and cropped RGBA sprites are retained in this folder.
Only alpha-bound cropping was performed after generation; no stretching or generated slogan.
The logo reads «Пито — Пито». The live slogan belongs to start-screens.mjs: «Твой финансовый дружище».

## Style decision

The previous object set mixed material-heavy watercolor illustrations with flat navigation SVGs.
The new set removes paper grain and most highlight/shadow detail. Keep silhouettes simple, details large,
palette restrained, navigation SVGs flat. Meadow, pet position and gameplay are unchanged.
Final objects use front/side elevations without extruded edges. The initial redraw was rejected because the jar and coins still looked dimensional.
Judge transparency in a composited browser render, not from RGB-only source previews.

## Typography

Balsamiq Sans Regular 400 and Bold 700 from Google Fonts, bundled locally with OFL license in ../fonts/.
No runtime Google Fonts dependency. Server serves TTF with font/ttf MIME.

## Verification

- 298 Node tests passed, including four new branding/font/sprite regressions.
- Browser: start, three story pages, creation, money introduction, allowance, pet tap, food, bank and shop.
- Portrait checks at 360×640 and shop at 320×568; no horizontal overflow or missing visible images.
- Both Cyrillic font weights loaded in-browser; font routes return HTTP 200 with correct MIME.
- Browser console had no app warnings/errors in the inspected flows.
- Gameplay engine, saves, economy, tutorial sequence and hidden developer entry were not changed.

## Reproduction

slice-ui-v7.mjs extracts source atlas cells, preserves alpha, trims transparent margins and writes sprite-manifest.json.
All display sizing uses contain or 9-slice panels, with unchanged portrait game layout.

## Final prompts

## logo

Use case: logo-brand. Asset: original raster wordmark for a cheerful flat 2D mobile pet game for 7-year-olds. Image 1 is palette/mood reference only, NOT a logo to copy. Create an entirely original playful wordmark, loosely in the spirit of bouncy Japanese indie platformer lettering, NOT a copy of any existing logo. Exact Cyrillic text: "Пито — Пито". Spell each word П-и-т-о, with a visible short dash between the two words. One horizontal line, both words equally clear. Custom chunky softly irregular letters with lively gently tilted rhythm and open readable counters, dark plum and pet-purple flat color shapes; one subtle pair of tiny eyes can sit inside an о without sacrificing readability. Warm, silly, confident, not babyish. Wide compact composition approximately 3:1, generous transparent margin. Strictly flat 2D solid fills: no extruded letters, bevels, gradients, gloss, lighting, cast shadows, grain, stone/clay/3D effects, decorative background, badges or frames. Genuinely transparent PNG background. No additional text, NO slogan, no watermark. The slogan will be added as live UI text separately.

## objects — discarded first redraw

Use case: style-transfer. Image 1 is the edit target, a six-sprite atlas; image 2 is UI mood/palette reference. Redraw the ENTIRE atlas in one consistent FLAT 2D silhouette-based children’s game icon style. Preserve six object identities and EXACT 3 columns x 2 rows order: top-left small care basket with red apple and blue water bottle; top-middle simple toy box containing yellow-coral ball and lavender kite; top-right pale blue savings jar with three gold coins; bottom-left cream cloud and three blue raindrops; bottom-middle red toy drum with two sticks; bottom-right purple telescope on tripod. Each sprite isolated centered in its own equally sized cell with generous transparent margins, nothing crossing cell boundaries. Simplify brutally to 3-5 large solid flat color shapes per item. Straight-on front views, no dimensional material rendering, no perspective thickness, no wood texture, no glass shine, no volume, no watercolor shading, no gradients, no glow, no shadows. Gently irregular smooth cartoon silhouettes, clean edges. Match simple Pikuniku-like flat geometry; plum details, muted purple, coral, gold, mint, pale sky blue. Jar coins are simple gold ovals with one ochre inner oval ring (NO stars, no embossed symbols). No text, borders, labels or backgrounds. GENUINELY TRANSPARENT ALPHA outside the six silhouettes, not a checkerboard, not blurry colored backgrounds. Landscape 1536x1024 atlas. This is one production sprite sheet, not a presentation board.

## apple

Use case: style-transfer. Input image is the edit target. Redraw this apple sprite as a strictly FLAT 2D icon for a playful children’s mobile game. Keep recognizable round red apple with short brown stem and one green leaf, front view, same silhouette and proportions. Make the apple body ONE solid coral red (#ed6269), leaf ONE solid muted green (#6eaa89), stem ONE solid brown (#865a46). Only one thin dark green line down center of leaf allowed. NO other tonal regions. No shine, highlights, gradients, volume shading, watercolor texture, drop shadow, glow, outline, perspective or dimensionality. Smooth gently irregular hand-drawn contours, readable at 48 pixels. Center on genuinely transparent alpha background with generous clear margins. No text or other objects.

## panels

Use case: style-transfer. Input is an existing six-piece UI surface sprite sheet. Preserve the EXACT layout and shape proportions: 3 equal columns, 2 equal rows. Top left large softly irregular square cream panel; top middle purple wide horizontal pill button; top right cream circular button; bottom left mint rounded square tile; bottom middle peach rounded square tile; bottom right pale lavender rounded square tile. Redraw the surfaces as truly FLAT solid color paper-cut silhouettes. One uniform fill for each piece, clean soft handmade slightly irregular contours, no borders. Purple button must be dark enough for white text (#82509c); cream #fff8e9; mint #dcebdd; peach #fbe3cb; pale lavender #e8def0. Remove all volumetric shading, realistic paper texture, glow, halos, directional light, highlights, grain, bevel, gradients, shadows and blur. All exterior spaces between sprites and around contours must be genuine transparent alpha. No colored backdrop, no checkerboard, no labels, no text, no symbols. Generous transparent margins, each sprite fully inside its own cell. 1536x1024 landscape production sprite sheet.

## objects — final production prompt

Use case: stylized-concept. Asset: ONE cohesive production UI sprite sheet for a flat 2D pet game. Draw a 3-column 2-row atlas, 1536x1024, with six separated little screen-printed pictograms, genuinely transparent background. Six cells in reading order: (1) care basket containing an apple and a water bottle; (2) toy box with ball and kite; (3) savings jar containing three gold coins; (4) white rain cloud with three blue drops; (5) red toy drum and two sticks; (6) purple telescope on tripod. Each fully visible within its own 512x512 cell with at least 50px clear margins. STRICT ART DIRECTION: simple vector-like geometric cut-paper SHAPES, not renders or paintings. Front or pure side elevations only. No perspective, no elliptical tops of cylinders, no angled 3D planes, no extruded coin edges. Jar: one solid pale blue rounded-rectangle body, one flat purple horizontal lid bar, three flat gold circle coins each with a thin ochre inner circle; no glass transparency or shine. Cloud: a single cream silhouette plus three solid blue teardrops. Drum: frontal red rectangle with cream horizontal strips and two cream diagonal stripes; no oval drum head. Telescope: SIDE VIEW, three purple flat rectangles tilted together on a flat tripod, NO visible front lens ellipse. Basket and toy box: frontal flat silhouettes, no visible inside or top surface, no texture or weave. Colors: plum #513263, purple #9964b5, coral #ed6269, gold #f7c442, mint #75ad93, pale blue #96cae4, cream #fff8e9. 3-5 large color areas per item. Solid fills, lively gently imperfect contours. NO gradients, shadows, glow, lighting, bevels, specular highlights, texture, realistic materials, volumetric shading, faces, letters, numbers, captions, decorative borders, cell lines or background. Readable at 48px. Genuine transparent alpha outside shapes.
