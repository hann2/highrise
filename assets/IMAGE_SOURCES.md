# Image sources

Where each image in `resources/images/` came from, so the credits (`src/highrise/menu/Credits.ts`) can be checked against what ships. When you add an image, add a row.

This was reconstructed in 2026 from git history, the design files in `assets/source/`, and what the images look like, so much of it is a guess. The **Confidence** column says how sure it is:

- **known**: made from a design file in this repo, or the history says so
- **likely**: a reasonable guess (e.g. photo-realistic textures, which were mostly from Free PBR)
- **?**: unknown. Fill it in if you remember

"Simon" and "Philip" mean made by Simon Baumgardt-Wellander and Philip Hann. "Added by" is who committed it first, which is a clue for the unknown ones.

## Still open

- Which images are from **GameTextures.com**, **3dtextures.me**, **juliovii.itch.io**, and **Kenney**? The credits list them, but nothing here is known to be theirs.
- Philip added several RPG Maker-style tileset sheets (marked "tileset" below). They're probably from the RPG Maker artists in the credits (**PWL, Panda Maru, Nicnubill, Ayene Chan, Caym, loutpany, Starder**), but which sheet is whose isn't recorded. Ask Philip.
- The skin textures on the zombies may come from the skin material pack in `assets/source/images/textures/Materials_Skin/`, whose origin isn't recorded.

## Characters (`characters/`)

Characters', zombies' and Bob's bodies aren't images: they're drawn by code from each one's look (`src/highrise/looks/`), by Claude, from Simon's hand-drawn originals (which were in `assets/source/images/characters/characters.afdesign`).

| Files                                                                                 | Source                                                                         | Confidence |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------- |
| `legs/footprint` (placeholder: a shoe's print, white, tinted with what it stepped in) | Claude, drawn as SVG in `assets/source/images/characters/legs/`, rendered by `bin/render-svg.ts` | known      |

## Zombies (`zombies/`)

| Files                                                                       | Source                                                         | Confidence         |
| --------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------ |
| `zombie-1..3`, `crawler-1..3` (whole bodies, inside the necromancer's eggs) | Simon. Skin texture maybe from `assets/source/images/textures/Materials_Skin/` | known (texture: ?) |
| `crawler.png`, `heavy.png`, `necromancer.png`, `spitter.png`                | Philip, in `assets/source/images/enemies/enemies.afdesign`                    | known              |

## Weapons (`weapons/`)

Guns as they're held aren't images any more: they're SVGs in `src/highrise/weapons/guns/art/`, rasterized when the game starts. Simon drew them in `assets/source/images/weapons/{pistols,rifles,shotguns}.afdesign`, probably from the pickups, and exported them to SVG in 2026; they're edited as SVG from now on. Claude drew what the moving parts uncover (barrels and frames under the slides, magazine tubes, the revolver's cylinder window, the P90's magazine well) and the AK's and AR's charging handles.

| Files                                                                                                                        | Source                                                                                                       | Confidence |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------- |
| `ak-47-pickup.svg`, `ar-15-pickup.svg`, `p90-pickup.svg`, `remington-870-pickup.svg`, `spas-12-pickup.svg`, `double-barrel-shotgun-pickup.svg` (a milled AK-47; a KAC SR-15 with a 13.5" barrel, a Magpul DT-PR stock, a Vortex AMG UH-1 Gen II and a Hexmag; an FN P90; a Remington 870 Marine Magnum; a stockless Franchi SPAS-12; a sawn-off hammer coach gun with brass locks) | Claude, drawn by code (`bin/gun-art/guns/<name>.ts`, one agent per gun) over photos Simon chose (the photos aren't kept in the repo), checked against views rendered from 3D models: "AK-47" by Mateusz Woliński (Sketchfab Standard), "Spas-12" by Kerridge1 (CC-BY-NC-4.0), https://sketchfab.com/3d-models/ak-47-c73d1429d16e4a02b48025046e20db50 and https://sketchfab.com/3d-models/spas-12-9ccdf2067b464c249c656a5f916583f6 | known |
| `m1911-pickup.svg` (the first pickup drawn as SVG: the gun from its right side, shipped as the SVG itself) | Claude, drawn by code (`bin/gun-art/guns/m1911.ts`) over photos of M1911s that Simon chose (the photos aren't kept in the repo), then simplified | known |
| `glock-pickup.svg`, `five-seven-pickup.svg`, `desert-eagle-pickup.svg`, `revolver-pickup.svg` (a Glock 19 Gen 5; a Five-seven MK3 MRD in FDE with its red dot; a stainless Desert Eagle Mark XIX with the integral brake; an 8⅜" S&W 629, its left side mirrored) | Claude, drawn by code (`bin/gun-art/guns/<name>.ts`, one agent per gun) over photos Simon chose (the photos aren't kept in the repo) | known |
| `axe.png`                                                                                                                    | Simon (`assets/source/images/weapons/axe.afdesign`; it replaced an earlier axe of Philip's)                                 | known      |
| `baseball-bat-hold.png`, `baseball-bat-pickup.png`                                                                           | Simon (`assets/source/images/weapons/bat.afdesign`)                                                                         | known      |
| `katana.png`                                                                                                                 | Simon (`assets/source/images/weapons/katana.afdesign`)                                                                      | known      |
| `magazines/*` (placeholders, for reload animations: magazines, shells, a revolver round)                                     | Claude, drawn as SVG in `assets/source/images/weapons/magazines/`, rendered by `bin/render-svg.ts`                          | known      |

## Floors (`environment/floor/`)

| File                               | Looks like                             | Source                                                                                                      | Confidence | Added by |
| ---------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------- | -------- |
| `IndustrialCarpet-001.jpg`, `-002` | photo, gray carpet                     | Free PBR                                                                                                    | likely     | Simon    |
| `bathroom-tile-floor-1..4.png`     | flat, 64 px tiles                      | Simon                                                                                                       | likely     | Simon    |
| `carpet.png`                       | tileset of rugs and carpets            | an RPG Maker artist (see above)                                                                             | ?          | Philip   |
| `cement.png`                       | photo, concrete                        | Free PBR                                                                                                    | likely     | Philip   |
| `granite-1..3.jpg`                 | photo, granite                         | Free PBR, or 3dtextures.me: the originals in `assets/source/images/textures/Granite_*_COLOR.jpg` use 3dtextures.me's naming | ?          | Simon    |
| `marble-1.jpg`                     | photo, marble                          | Free PBR                                                                                                    | likely     | Simon    |
| `old-plank-flooring-1.png`, `-2`   | photo, worn planks                     | Free PBR                                                                                                    | likely     | Simon    |
| `steel-floor.png`                  | tileset of metal floor panels          | an RPG Maker artist (see above)                                                                             | ?          | Philip   |
| `tile-floor-1.png`                 | photo, gold mosaic tiles               | Free PBR                                                                                                    | likely     | Simon    |
| `tile-floor-2.png`                 | photo, dark blue-gray tiles            | Free PBR                                                                                                    | likely     | Simon    |
| `tile-floor-3.png`                 | photo, stone and metal panels          | Free PBR                                                                                                    | likely     | Simon    |
| `tile-floor-4.png`                 | black tiles, gold grout                | Simon, or Free PBR                                                                                          | ?          | Simon    |
| `tile-floor-5.png`                 | green tiles, dark grout                | Simon, or Free PBR                                                                                          | ?          | Simon    |
| `tile-floor-6.png`                 | flat gray squares                      | Simon                                                                                                       | likely     | Simon    |
| `tile-floor-7.png`                 | photo, marble squares                  | Free PBR                                                                                                    | likely     | Simon    |
| `tile-floor-8.png`                 | photo, white tiles                     | Free PBR                                                                                                    | likely     | Simon    |
| `tile-floor-9.jpg`                 | photo, red tiles                       | Free PBR                                                                                                    | likely     | Simon    |
| `tile-floor-10.jpg`                | white geometric line pattern           | ?                                                                                                           | ?          | Simon    |
| `tile-floor-11.jpg`                | red floral pattern, 1024 px            | ?                                                                                                           | ?          | Simon    |
| `tile-floor-12.jpg`                | photo, blue-green herringbone          | Free PBR                                                                                                    | likely     | Simon    |
| `tile-floor-13.jpg`                | photo, blue patterned (encaustic) tile | Free PBR                                                                                                    | likely     | Simon    |
| `tile-floor-14.jpg`                | photo, blue square tiles               | Free PBR                                                                                                    | likely     | Simon    |
| `tile-floor-15.jpg`                | glossy blue fish-scale tiles           | ?                                                                                                           | ?          | Simon    |
| `wood-floor-1.png`, `-2`           | photo, planks                          | Free PBR                                                                                                    | likely     | Simon    |
| `wood-floor-3.png`                 | light planks                           | Simon (`assets/source/images/environment/wood-floor-3.afdesign`)                                                               | known      | Simon    |
| `wooden-floor.png`                 | tileset of parquet patterns            | an RPG Maker artist (see above)                                                                             | ?          | Philip   |

## Environment (`environment/`)

| Files                                                                   | Source                                                                                          | Confidence              |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------- |
| `bathroom.png`, `furniture.png`, `fancy-furniture.png` (tileset sheets) | an RPG Maker artist (see above), added by Philip                                                | ?                       |
| `bathroom/` (sinks, sink groups, toilets)                               | Simon (`assets/source/images/environment/bathroom.afdesign`); the sink groups' counters use the floor textures     | known                   |
| `furniture/` (fancy chair, tables, lobby desk, piano)                   | Simon (`assets/source/images/environment/fancy-furniture.afdesign`); the wood grain is probably a Free PBR texture | known (texture: likely) |
| `fancy-rug-1.png`                                                       | Simon (`assets/source/images/environment/fancy-furniture.afdesign`)                                                | known                   |
| `shops/` (shelf, shop counters)                                         | Simon (`assets/source/images/environment/shops.afdesign`); counter tops probably Free PBR textures                 | known (texture: likely) |
| `vending-machines/`                                                     | Simon (`assets/source/images/environment/vending-machine.afdesign`)                                                | known                   |
| `bookcase-1.png`, `-2`                                                  | Simon (`assets/source/images/environment/shelves.afdesign`)                                                        | known                   |
| `box-pile-1.png`, `-2`, `box-shelf-1.png`, `-2`                         | Simon (`assets/source/images/environment/boxes.afdesign`)                                                          | known                   |
| `chain-link-fence.png`                                                  | Simon (`assets/source/images/environment/fence.afdesign`)                                                          | known                   |
| `fence.png`                                                             | Philip                                                                                          | known                   |
| `doors/door-1.png`, `-2`                                                | Simon (`assets/source/images/environment/door.afdesign`)                                                           | known                   |
| `maintenance/transformer.png`                                           | Philip (`assets/source/images/environment/maintenance.afdesign`)                                                   | known                   |
| `stairs.png`                                                            | Simon (`assets/source/images/environment/stairs.afdesign`)                                                         | known                   |
| `wall-1.png`, `wall-ao-1.png`                                           | Simon (`assets/source/images/environment/wall.afdesign`, `ambient-occlusion.afdesign`)                             | known                   |
| `water-cooler.png`                                                      | Simon (`assets/source/images/environment/water-cooler.afdesign`)                                                   | known                   |

## Effects and everything else

| Files                                                                       | Source                                                          | Confidence |
| --------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- |
| `splats/` (blobs, splats, glows)                                            | Simon (`assets/source/images/effects/splats-and-blobs.afdesign`) | known      |
| `shell-casings/`                                                            | Simon (`assets/source/images/weapons/shell-casings.afdesign`)                  | known      |
| `effects/glow-stick-1..3.png`                                               | Simon (`assets/source/images/effects/glow-stick.afdesign`)                     | known      |
| `effects/health-overlay.png`                                                | Simon (`assets/source/images/effects/health-overlay.afdesign`)                 | known      |
| `effects/impact-particle.png`, `solid-circle.png`, `lights/point-light.png` | Simon (simple generated shapes)                                 | likely     |
| `health-kit.png`                                                            | Simon (`assets/source/images/items/items.afdesign`)                          | known      |
| `favicon.png`                                                               | ?                                                               | ?          |
