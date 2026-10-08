---
name: gun-art
description: Draw a gun as SVG from reference photos (its side view, the pickup, and later its top view), with a generator in bin/gun-art/guns/ as the source. Use when Simon asks for art for a new gun, to remake a pixel-art pickup, or to change a gun drawn this way.
argument-hint: <gun, and reference photos if any>
---

Guns are drawn by code: each has a generator, `bin/gun-art/guns/<name>.ts`, that draws it from named numbers in the pixels of a reference photo, and `npx tsx bin/gun-art/cli.ts build` writes the SVGs the game ships (`resources/images/weapons/<name>-pickup.svg`). **The generator is the source**: never edit a generated SVG by hand (`npm run test:gun-art` fails if one doesn't match its generator). `guns/m1911.ts` is the worked example; read it before starting another.

The aim is few rounds with Simon. The M1911 took about fifteen; almost all were things this skill now says to do up front.

## 1. References

- Ask Simon for photos (or use his), and look for a second, **evenly lit** one: the first photo's lighting misleads (blown-out highlights read as background, shadows as edges). Ideally a straight side view from the right (muzzle to the right), plus anything showing what the side view can't (the back of the grip, the top).
- Put them in `assets/source/images/weapons/references/<name>/` (gitignored: we don't own them), and list them in the generator (`photo`, `otherPhotos`, with what each shows).
- A 3D model (glTF) is a good reference too, kept in `references/<name>/model/` (and its license with it; reference only, never shipped): `model <name>` renders its six views straight on with no perspective, to find its right side and up, and `model <name> --from +z` writes one into the references folder to grid and measure like a photo (`--photo model-pz.png`). Best for the top, back and front, which photos rarely show square on; take colors from photos, not the model's textures, and check its proportions against the real gun.
- Find the real gun's length and barrel length. The scale is the real length over its length in the photo's pixels (`scale.mmPerPixel`); the origin is the gun's middle on the bore (`scale.origin`), the same origin as the top view's art in `src/highrise/weapons/guns/art/`.

## 2. Construction pass, before drawing

Grid the photos region by region (`grid --mode photo`, both photos) and write down, as comments in the generator, how the gun is built. Most of the M1911's rounds were construction mistakes:

- **Layers and planes.** Which parts sit on which (a grip panel on a frame; a grip safety under the frame's edge but standing proud of its back), and where a surface steps down to another plane (the frame's face ending at an edge, with the trigger guard and front strap on a lower one). Draw each as its own shape, in order, with the step shaded: a thin light line on the upper edge, a shadow just below it.
- **What's flush and what stands proud.** A magazine base flush with the grip; a part that's flush with the frame (the M1911's flat mainspring housing) is drawn as the frame, only lit differently.
- **What goes through what.** A trigger goes behind the frame and shows through the guard; a ring on a lanyard loop touches the gun; panels are notched round pins and plates.
- **True shapes.** Ports, openings and triggers are usually real circles and straight lines (a pill, a U, a crescent), not whatever the photo's perspective and lighting suggest.
- **One axis per assembly.** Everything on a grip shares its lean (`SlantedAxis`): the panel's sides, the front strap, the back, even the shading.

Show Simon the construction notes with a gridded photo before drawing much. He knows guns; a question now saves rounds later.

## 3. Draw

In the generator, in the photo's pixels. Rules:

- **Named numbers, not hand-placed points**, for anything that depends on anything else, so a change is one number.
- **Long edges are one smooth curve**: `smoothCurve` through points (a clamped spline, no curvature jumps), with the directions it leaves and arrives at. Hand-placed Béziers show their joints.
- **Round things are true arcs** (`arc`, `on`).
- **Shapes from the true structure**, not traced: measure (`measure edges`, `measure runs`), don't eyeball against the lighting. By-eye corrections against the photo were always wrong; when an edge is ambiguous, check the second photo or ask Simon to trace it.
- **Gradients run along the part's own axis** (a grip panel's highlight down its centerline, square to the grip's lean).
- **Outlines follow cutouts at full width**: a stroke is centered on its line, so one clipped to a shape loses half; stroke notches on the shape's side.
- **Holes are holes**: what you'd see through (a brake's ports, a guard's opening, the gaps round a revolver's cylinder, between a rail's lugs) is cut out so the floor shows, not painted dark.
- **Shadows under overhangs**: where a part stands over a lower plane (a rail on a barrel's face, a slide's bottom edge on the frame), a short dark gradient fading down from it, so it reads as recessed.
- **The outline** (the set's rule): 0.4 mm round the silhouette, in each part's own `dark` (a mid gray on stainless, never near-black), as an `outline` option: each part's shape stroked twice as wide under everything, so only the outer half shows. Dark guns also want a thin lit rim along their top edges, or they vanish on the dark floor (the Glock's `rimLight`).
- Paths use absolute M/L/C/Z only (the conversion to millimeters relies on it), and no `transform`, `gradientTransform`, `rx` or `ry` (they'd stay in pixels; `toMillimeters` refuses them): build shapes where they go. Ids are `<name>-<what>`, and groups are named parts in drawing order with comments on what isn't obvious.

## 4. Check, region by region

For each region (sights and slide, ejection port, grip, trigger area, muzzle), before showing Simon:

1. `grid <gun> --crop x,y,w,h --scale 2` (photo and drawing side by side, labeled grid in the photo's pixels), and `--mode over` (the drawing over the photo).
2. Write down every difference, then fix them.
3. Repeat until the only differences are deliberate simplifications.

Then show Simon the region close up with the grid, saying what changed and what was deliberately simplified. When he traces a line on a grid image, read points off it and fit `smoothCurve` through them (`--trace` draws it back over the result to check).

## 5. Materials early

As soon as the shapes are roughly right, make an options sheet (`options <gun> variants.json --crop ...`, each variant an object of generator options) of colors and shading, so Simon picks while the rest is refined. Show them at full size, at the pickups' 128 px on white, and on the floor's dark gray: the pickup has to read against both.

## 6. In the game

- `build`, then `sheet <gun>` (photo, pickup, at size beside the other pickups) and `ingame <gun> --port <dev server>` (the pickup on the arena's floor, close up, and in the HUD).
- A new gun is a `draft` while it's drawn: `build <name>` writes it into `tests/output/gun-art/` (not over the old pickup) and the tests leave it alone. Remove `draft` to put it in the game.
- `npm run test:gun-art`, `npm run tsc`, and a row in `assets/IMAGE_SOURCES.md` (drawn by Claude over reference photos).
- Point the gun's stats at the pickup (`textures.pickup: "<name>Pickup"`) and regenerate the manifest, and set its `size` to the pickup's square in meters (`frame.side / 1000`), which `WeaponPickup` stretches the image to, so it lies on the floor at the scale it's held at (`test:gun-art` checks).

## Simon's style so far

- The materials he picked are in `bin/gun-art/lib/style.ts`; use them (and add new ones there once picked):
- Blued steel: grays around `#4a4d54`, lit faces lighter, edges darker, a bright line where an edge catches the light. Bright steel parts (`#8d9199`, with a `#c4c7cc` highlight) stand out.
- Wood (M1911): cocoa, `#6a3a24` at the edges to `#a3633f` down the middle, `#3e2013` for checkering and outline; smooth diamonds the same wood, faintly lighter.
- Polished parts in openings (a barrel through the port, and under a slide that's back) bright and shiny.
- Top views at true scale, the same as the side view (he liked the 1911 that way next to the bodies).
- Where models differ, the gun's own era over the photo's: the M1911's early wide checkered hammer, not the A1's knurled one.
- Flat color and gradients, no textures; detail that still reads at 128 px. Grip texture is fine drawn as shapes (the Glock's studs as a regular grid of small squares along the grip's axis, the Five-seven's stipple as speckled panels), but no lettering or logos.
- Black nitride for the Glock's slide (`BLACK_NITRIDE`), a step bluer than its polymer frame; FDE with the slide clearly lighter than the frame (Five-seven); a shiny black barrel through a port (Five-seven).
- Polished stainless as chrome (`Polish`): faces reflecting a bright sky above and a dark floor below, two or three hard bands per face along its own axis, cylinders banded round (`roundStops`), flutes the other way up (`grooveStops`), bead-blasted planes matte. The revolver's floor is lighter (`REVOLVER_POLISH`).
- Black parts on a bright gun stay black (the Desert Eagle's hammer and sights); parts of one material share one color (its grip panel, safety and magazine catch).
- Draw what's really there at the moment you'd see it: the Desert Eagle's well under its slide is empty, since the slide only stays back once it's empty. Optics as photographed (the Five-seven's red dot).

## Tools

`npx tsx bin/gun-art/cli.ts` (see the top of `bin/gun-art/cli.ts` for every option); images go to `tests/output/gun-art/`.

| Command | What it's for |
|---|---|
| `build [gun] [--check]` | Write the pickups from the generators |
| `grid <gun> --crop x,y,w,h [--mode side\|over\|photo\|drawing] [--photo other.png] [--trace "x,y ..."] [--view top]` | Compare a region with a labeled grid (`--view top`: the top view in millimeters, over a registered photo) |
| `measure <gun> edges x=600 y=340` / `runs rows 300 1200 10` / `sample x,y` | Exact edges, extents and colors in the photo |
| `options <gun> variants.json [--crop ...]` | A sheet of variations |
| `sheet <gun>` | The photo, the pickup, and the pickup beside the others |
| `cutout <gun>` | The photo without its background, beside the drawing |
| `ingame <gun> --port 1234` | The pickup in the running game |
| `model <gun> [folder] [--from +z] [--up +y] [--mirror]` | Render a 3D model straight on (all six views without `--from`) |

The geometry is in `bin/gun-art/lib/geometry.ts` (`SlantedAxis`, `smoothCurve`, `arc`, `on`, `rounded`, `polygon`, `fixed`/`fmt`), the conversion to millimeters in `lib/svg.ts`.

## Top views

The gun as it's held (`src/highrise/weapons/guns/art/<name>.svg`, registered in `gunArt.ts` and named by the gun's `art`) is drawn by the same generator (`top.draw`), straight in millimeters, **at the same scale as the side view** (the older guns' art is exaggerated about 1.4× along and 2× across, not on purpose; drawn to scale, the 1911 still reads as big as the Glock in hand). See the conventions in that folder's README.md.

- **Lengths along the gun come from the side view's numbers** (`sx(px)` converts its photo's pixels), so the two can't disagree. Widths are the real gun's, checked against photos.
- **Photos from above are rare and bad** (held in a hand, tilted, in perspective, often another model). Register one instead of drawing over it: four points in it whose places in millimeters we know (the slide's corners) in `top.registrations`, and `grid <gun> --view top` lays it under the drawing, straightened (a homography, `lib/homography.ts`). Use it for what parts look like from above and how far they stand out sideways; trust the side view for lengths. A photo from behind gives the widths of the stacked parts (slide, frame, grips, hammer).
- **Specs mislead too**: the M1911's grips are 1.3" across on paper, but stand only 2.5 mm past the slide in both photos. Measure the photos.
- **What moves, and what it uncovers**: decide with Simon. The slide goes over the frame's top and rails, the barrel (polished, it shows through the port) and the dust cover; a hammer can fall at each shot (a `stretch` about where it meets the slide, in `cycles`). Draw the moving parts as top-level groups, uncovered parts under them.
- **Then the stats**: `art`, `points` (grip, action, magazine) where the drawing has them, the `parts` strokes, `cycles`, and `muzzleLength` (the muzzle's x in the gun's frame, in meters). Every pistol's hands go in the same place: `holdPosition` is 0.415 m plus how far back its grip is (the M1911's 0.5 for its -0.085), so a gun with its grip further forward is held further back. A part's stroke is the real one (a slide clears its cartridge; a revolver's cylinder swings just clear of the frame). Check in the rig: `npm run clip -- --scene rig --query "gun=<slug>&zoom=2400&speed=0.1&follow"` for the slide and hammer close up, and at `zoom=500` beside another gun for the size.
- `options <gun> variants.json --view top --crop x,y,w,h` compares variations of the top view (in millimeters).

## A team of agents

The pistols were drawn by one agent per gun, in parallel (`notes/gun-art-pistols-plan.md`), with the lead integrating. What worked:

- **Setup first, by the lead**: photos sorted into `references/<name>/`, the shared materials in `style.ts`, and a `draft` stub generator per gun registered in `guns/index.ts`, all committed, so agents only ever write their own `guns/<name>.ts`.
- **Agents in worktrees**: they symlink `node_modules` and the gitignored references from the main checkout. A worktree can start on an old commit: fast-forward it to master first. Once the lead has merged an agent's branch, the agent only ever `git merge master`, never rebases.
- **Rounds**: construction (dimensions, notes, a flat blockout over the photo), then drawing (shaded, region by region, plus a materials options sheet), then polish, then top views. Each agent stops at the end of a round; the lead makes one combined sheet (each gun beside its photo, all of them together at true scale and at 128 px on white and the floor's #3a3a3a) and one list of questions, and continues each agent with Simon's notes.
- **Shared fixes go through the lead**: an agent that finds a shared tool's bug reports it; the lead fixes it on master and tells the others.
