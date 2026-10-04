# Art ideas

Started 2026-10-03.

- Procedurally generate character sprites? They're mostly made from the same general formula with some tweaks already.
- Give the characters visible legs.
  - 2026-10-03: done on branch `legs` (`core/animation/Gait.ts`, `BodySprite`, `?scene=walk`). Left: real leg and shoe art (the tinted ones in `characters/legs/` are placeholders, and the same for everyone, so skirts or bare legs would need their own); bodies don't shuffle their feet turning on the spot; corpses still use the separate lying-down legs, and humans don't leave corpses.
- Better reload animations.
  - 2026-10-03: done on branch `rig-animations` (keyframed per gun family, see `CLAUDE.md`). Left: real magazine, shell and round art (the ones in `weapons/magazines/` are placeholders); the P90's magazine is drawn into its holding image, so it stays on the gun while the hand carries the new one; the revolver's cylinder and the double barrel don't open (no art for it); the animations could be tuned by eye in `?scene=rig`. Melee swings, the push and the zombies' attacks are still code, and could move onto `core/animation` when they're next touched.
