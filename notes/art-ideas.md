# Art ideas

Started 2026-10-03.

- Procedurally generate character sprites? They're mostly made from the same general formula with some tweaks already.
  - 2026-10-04: done on branch `procedural-characters` (`src/highrise/looks/`, see `CLAUDE.md`): every body is drawn from a look by code and baked into an atlas at boot; characters' looks are in their JSON and edited in the character editor's Appearance tab; zombies are 48 random looks (and heavies 8 big ones) instead of 3 variants; hand-drawn SVG pieces for anything the generator doesn't draw. Left, and worth trying:
    - The style itself (`looks/style.ts` and the part drawings): this first pass copies the old hand-drawn look. Things to try: flatter cel shading, darker or no outlines, a light direction instead of shading from the middle, more face showing.
    - 2026-10-04: legs and shoes are generated too (trousers, jeans, shorts, a skirt; sneakers, boots, dress shoes, heels, sandals, bare feet; some zombies have lost their shoes). Footprints are still one shoe's print whatever's on the feet; bare feet and boots could leave their own.
    - The lying torso is always torn off at the waist (the legs cover it on a whole corpse); a whole lying body could be its own part.
    - More garments and hats (dresses, suits with a waistcoat, aprons, scrubs, police caps), done as top styles, hat styles or pieces.
    - Zombies' looks are the same every run (their own seed); they could be made per run or per floor while the elevator rides, from the run's seed.
    - More looks per body at no cost: heads and torsos are independent, so zombies could mix one look's head with another's torso; only the atlas grows.
    - Gibs: severed heads and arms use the look's parts; bits of clothing torn off could be drawn too.
    - Random survivors who aren't characters (looks from `randomLook(random, false)`) if there are ever extra humans.
    - The necromancer's eggs still show the old whole-body zombie images (`zombie-1..3`, `crawler-1..3`).
- Give the characters visible legs.
  - 2026-10-03: done on branch `legs` (`core/animation/Gait.ts`, `BodySprite`, `?scene=walk`). Left: real leg and shoe art (the tinted ones in `characters/legs/` are placeholders, and the same for everyone, so skirts or bare legs would need their own); corpses still use the separate lying-down legs, and humans don't leave corpses.
  - 2026-10-03: feet are planted now (branch `foot-planting`): each foot stays where it lands until it lifts, and standing or turning on the spot steps them back under the hips. `Gait.onLand` says when and where each foot comes down, for footprints and footstep sounds; it only fires for bodies in view, so footsteps heard out of sight would need the gait moved on for those too.
- Better reload animations.
  - 2026-10-03: done on branch `rig-animations` (keyframed per gun family, see `CLAUDE.md`). Left: real magazine, shell and round art (the ones in `weapons/magazines/` are placeholders); the P90's magazine is drawn into its holding image, so it stays on the gun while the hand carries the new one; the revolver's cylinder and the double barrel don't open (no art for it); the animations could be tuned by eye in `?scene=rig`. Melee swings, the push and the zombies' attacks are still code, and could move onto `core/animation` when they're next touched.
- The P90's magazine is see-through, so show the rounds inside it, and have it visibly empty as you shoot.
- Right and left handed characters.
- Hair, and maybe clothing or other things on the characters, that can have some dynamic movement.
- Cowboy boots for Rusty.
