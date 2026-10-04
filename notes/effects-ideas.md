# Effects ideas

Started 2026-10-01.

- Make explosions look much cooler.
- Switch to shader- or particle-based muzzle flashes/flares, to try to make them look cooler.
- Grenade blasts and any other explosions should leave a charred explosion decal on the ground.
- Screenshake during shooting and explosions.
- Only incendiary rounds should have a glowing bullet.
- Leave footprints after stepping in blood, acid, etc.
  - 2026-10-03: done for blood on branch `bloody-footprints` (`effects/FloorStains.ts`, `creature-stuff/Shoes.ts`, `?scene=walk&blood`). Left: other things to step in (spitter goo or acid would only need to spill into `FloorStains` with its own color; fuel has its own grid); real footprint art (the print is a placeholder); prints are only made for bodies in view, so a zombie that stepped in blood off screen comes into view with clean shoes.
