# Gun art

Each gun as it's held, seen from above, one SVG per gun. The game rasterizes them when it starts (`../gunArt.ts`), so these files are the source: edit them (by hand, in BoxySVG, or by an agent) and reload.

- The gun points along +x: the muzzle on the right, the stock on the left.
- 1 unit is 1/300 m (`GUN_ART_METERS_PER_UNIT`), with the viewBox from 0,0 to the gun's size. The middle of the viewBox is the gun's origin, which `GunStats.points` and `holdPosition` are measured from.
- Plain SVG: shapes, groups, linear gradients and clip paths. No transforms, filters, text or embedded images. Colors and gradients are attributes, not CSS.
- Gradient and clip ids start with the file's name, so they don't clash when several guns share a document.
- A new gun's file has to be imported in `gunArt.ts`, and named by the gun's `art`.

They were drawn in Affinity Designer (`assets/source/images/weapons/{pistols,rifles,shotguns}.afdesign`), exported, and tidied by `bin/clean-svg.ts`.
