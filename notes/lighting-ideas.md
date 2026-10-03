# Lighting ideas

Written 2026-09-25 while working on fire, and brought up to date 2026-10-02 after the lighting perf work (the light atlas, GPU shadows in chunks, static and dynamic lights, doors). Features for `src/highrise/lighting-and-vision/`, talked through and tabled for later. None is built.

How lighting works now, for reference (more in `CLAUDE.md` and the classes' doc comments): each light gets a square of a light atlas (`LightAtlas.ts`, pages of two 8-bit textures, a mask and a light, at `LIGHT_RESOLUTION`, 32 px/m). Per page, one instanced draw puts every light's shadows into the mask page (`ShadowCasters`, which keeps every static `cast_shadow` shape's edges on the GPU in 16 m chunks; `shadowMask.vert` pushes each edge away from the light into its shadow, and `shadowMask.frag` works out how much of the light's disc it hides, penumbra included), and one pass draws the lights' `lightSprite`s into the light page and erases what the masks cover. Static lights keep their squares in the `StaticLightAtlas` and are drawn again only when they change; dynamic ones are drawn every frame. Then the composite pass adds every light's square (its `compositeSprite`, with brightness as `alpha` and color as `tint`, blend mode `add`) onto a screen-sized 8-bit texture cleared to the ambient color, which is multiplied over the world. Walls and doors cast shadows; doors are moving casters, kept in one more chunk that's rebuilt when one moves, and the static lights where one moved are drawn again (`StaticLightAtlas.invalidateArea`). Every shadow is infinite: each edge is pushed far past the light's reach.

## Heights for lights and shadow casters

Give lights a `z` and shadow casters a height, so short things cast shadows of a finite length.

- **The math.** A light at height `H`, a caster of height `h`: if `h >= H` the shadow is infinite (today's behavior; walls always are). Otherwise a point at distance `d` from the light casts its shadow to distance `d * H / (H - h)`. For a solid caster, the shadow is its base outline together with its top corners projected out that far. That's a change to where `shadowMask.vert` puts an edge's far corners (2 and 3, now pushed off to infinity), with the light's height and the caster's height passed in (the light's per instance, next to `aLight`; the caster's per vertex, in the chunk meshes), and to `shadowMask.frag`, which would have to stop counting coverage past the shadow's end. The math itself is pure geometry, so it can be node-tested like `visibility.ts`.
- **Defaults.** Walls: infinite. Ceiling lights at a ceiling height (about 2.5 m); the flashlight and muzzle flashes about 1.2 m; fire about 0.3–1 m. Furniture, and people and zombies if they cast shadows, get real heights (desks about 0.75 m, people about 1.7 m).
- **Soft shadows are the fiddly part.** With a source radius, a finite shadow should also fade out at its far end, not only along its sides (which the penumbra wedges do now). Start with hard shadows plus heights; add the faded end if the hard end looks wrong.
- **Where it matters.** Fire is low, so anything taller than the flames still casts an infinite shadow from it (correct: low light, long shadows). The payoff is ceiling lights and furniture (short shadows), people under ceiling lights (long but finite shadows), and low fire behind low cover (lighting over a counter).

### Moving shadow casters (goes with heights)

Moving casters exist now, for doors: any `cast_shadow` body that isn't static goes in `ShadowCasters`' moving chunk, which every light in view draws, and static lights are drawn again where one moved. That's option 2 below, built. It's fine for doors, which are few and mostly still, but zombies and people move all the time: the moving chunk would be rebuilt every frame, and every static light near a crowd drawn every frame, which makes them dynamic in all but name. Options for those, cheapest first:

1. **Only dynamic lights** (fire, burning enemies, the flashlight, bullets, sparks; they're drawn every frame anyway) get shadows from people and zombies. Static lights would skip them: a second moving set, of casters that don't invalidate static lights, drawn only for the dynamic pages. Cheap, and they're the lights where it sells the look. Start here.
2. **Draw a static light again when a moving caster within its reach moved.** What doors do now. Costs only where things move near lights, but with crowds that's most lights in view.
3. **Split each light into static and moving parts.** Keep the static square with the wall shadows as now; each frame draw only the moving casters' shadows into a separate mask over it. Scales best, most code.

People and zombies also need tagging (`cast_shadow`) and a shape: they're circles, and `getShapeCorners` would turn each into a polygon (a few corners are enough for a soft shadow). With heights, only lights above them get finite shadows; everything else (fire) gets infinite ones.

## Light brighter than 1 (overbright, and maybe bloom)

The screen's light texture is 8-bit, so it clamps at 1, and it's multiplied over the world, so lit art can never be brighter than itself, and overlapping lights saturate one channel at a time (red caps first while green keeps climbing), drifting towards yellow, green and white. The goal: a really big fire makes its surroundings deeply fire-colored instead of washed out.

- **The core change.** Add the lights into a half-float texture (WebGL2 supports rendering to one; check how Pixi 8 exposes it) so values above 1 survive. Replace the multiply blend with a small full-screen shader pass: `world × f(light)`. It has to be a shader, since blending can't go past 1 on the canvas. It works like the stage filter in `DamagedOverlay`, and emissives stay drawn on top as now.
- **The atlas stays 8-bit.** Its squares hold each light's shape and shadows; brightness and color are already applied only in the composite pass (each light's `compositeSprite`'s `alpha` and `tint`). Brightness above 1 can't be an `alpha`, so the composite needs a small shader that multiplies by an intensity uniform or attribute (or a sprite drawn more than once). Float atlas pages would double their memory for nothing.
- **What `f` does above 1 is the real choice:**
  - (a) plain overbright: allow up to 2× or 4× and clip. Simple, but channels clip separately, so hot spots still drift to yellow and white, just later;
  - (b) color-keeping soft clip: past 1, scale the whole color down together with a smooth roll-off, so bright areas stay saturated and fire-colored. Closest to what we want for fire;
  - (c) filmic tone mapping: very bright light desaturates to white like a camera. Realistic, but the opposite of "stays fire-colored".
- **Bloom, optionally on top.** Nothing blurs anything today; glows are faked with additive sprites (vending machine glow images, pickup glows, the keycard lock, muzzle flashes). Bloom would blur whatever is above 1 (at lower resolution) and add it back, so bright things halo on their own and bleed glow over nearby sprites and walls. Costs a blur each frame.
- It affects every light in the game, so check it against a ceiling light and the flashlight as well as fire (a test scene like `fire/FireTestScene.ts`).
- Full HDR (a float scene, exposure, adaptation) isn't needed; only the light buffer needs the range.

## Ambient occlusion for walls and doors

Added 2026-10-01. Many of our sprites have fake ambient occlusion painted in (a darkening where they meet the floor). Walls and doors don't, because shading their edges would mean the shadow overlapping neighboring tiles, and walls join up in too many ways for a baked edge to look right. So walls and doors meet the floor with no contact shadow, and look flatter than everything else.

Do it dynamically instead: draw the occlusion from the actual wall and door geometry, so it follows whatever shape the level ends up with. Some ways, not yet weighed:

- Bake it per level: walls are static, so render a soft darkening along every wall outline into a level-sized texture once when the level is generated (like `ExploredMap` or `FloorMarks`), drawn on the floor under the walls.
- Doors move, so give them their own soft shadow that moves with them (a blurred sprite or mesh following the door), or fold them into the baked texture when they're closed and draw them separately while swinging.
- Soft edges as mesh geometry (the way `visionMesh.ts` does penumbras) rather than a blur filter, since filters don't work in render-to-texture passes.

Suggested order when we come back: overbright with (b) first (it fixes the fire washing out), then heights with hard shadows, furniture and ceiling lights, then people and zombies as casters starting with option 1.
