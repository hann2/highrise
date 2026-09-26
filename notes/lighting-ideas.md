# Lighting ideas

Written 2026-09-25 while working on fire. Two engine features for `src/highrise/lighting-and-vision/`, talked through and tabled for later. Neither is built.

How lighting works now, for reference: each `Light` draws its gradient into its own 8-bit texture and erases its shadows from it (`Shadows`), re-rendering only when the light itself changes. The `LightingManager` adds the visible lights together over the ambient color into a screen-sized 8-bit texture, which is multiplied over the world. Only walls cast shadows from lights. Doors are tagged as casters, but lights never look at moving casters (`checkDynamicBodies` is never turned on), so doors block vision but not light. Every shadow is infinite: the caster's outline is stretched far past the light's reach.

## Heights for lights and shadow casters

Give lights a `z` and shadow casters a height, so short things cast shadows of a finite length.

- **The math.** A light at height `H`, a caster of height `h`: if `h >= H` the shadow is infinite (today's behavior; walls always are). Otherwise a point at distance `d` from the light casts its shadow to distance `d * H / (H - h)`. For a solid caster, the shadow is its base outline together with its top corners projected out that far. That's a change to the projection in `Shadows.getShadowGeometry` and nothing else in the pipeline. It's pure geometry, so it can be node-tested like `visibility.ts`.
- **Defaults.** Walls: infinite. Ceiling lights at a ceiling height (about 2.5 m); the flashlight and muzzle flashes about 1.2 m; fire about 0.3–1 m. Furniture, and people and zombies if they cast shadows, get real heights (desks about 0.75 m, people about 1.7 m).
- **Soft shadows are the fiddly part.** With a source radius, a finite shadow should also fade out at its far end, not only along its sides (which the penumbra wedges do now). Start with hard shadows plus heights; add the faded end if the hard end looks wrong.
- **Where it matters.** Fire is low, so anything taller than the flames still casts an infinite shadow from it (correct: low light, long shadows). The payoff is ceiling lights and furniture (short shadows), people under ceiling lights (long but finite shadows), and low fire behind low cover (lighting over a counter).

### Moving shadow casters (goes with heights)

Zombies and people casting shadows means casters that move, and baking only works because nothing tells a light when a caster near it moves. Switching moving casters on as-is would leave static lights with stale shadows. Options, cheapest first:

1. **Only lights that re-render every frame anyway** (fire, burning enemies, the flashlight, muzzle flashes, grenade flashes; they flicker or move) include moving casters. Nearly free, and they're the lights where it sells the look. Start here.
2. **Re-render a static light when a moving caster within its reach moved.** Simple; costs only where things move near lights.
3. **Split each light into static and moving parts.** Bake the wall shadows once as now; each frame draw only the moving casters' shadows into a separate mask over it. Scales best, most code.

Casters also need tagging (`cast_shadow`) and a shape: zombies and people are circles.

## Light brighter than 1 (overbright, and maybe bloom)

The light texture clamps at 1 and is multiplied over the world, so lit art can never be brighter than itself, and overlapping lights saturate one channel at a time (red caps first while green keeps climbing), drifting towards yellow, green and white. The goal: a really big fire makes its surroundings deeply fire-colored instead of washed out.

- **The core change.** Add the lights into a half-float texture (WebGL2 supports rendering to one; check how Pixi 8 exposes it) so values above 1 survive. Replace the multiply blend with a small full-screen shader pass: `world × f(light)`. It has to be a shader, since blending can't go past 1 on the canvas. It works like the stage filter in `DamagedOverlay`, and emissives stay drawn on top as now.
- **Per-light textures stay 8-bit.** They hold each light's shape and color; intensity above 1 is applied when they're added together (a small shader on the baked sprites). Float bakes would double GPU memory, and 200 fire cell lights already use about 80 MB.
- **What `f` does above 1 is the real choice:**
  - (a) plain overbright: allow up to 2× or 4× and clip. Simple, but channels clip separately, so hot spots still drift to yellow and white, just later;
  - (b) color-keeping soft clip: past 1, scale the whole color down together with a smooth roll-off, so bright areas stay saturated and fire-colored. Closest to what we want for fire;
  - (c) filmic tone mapping: very bright light desaturates to white like a camera. Realistic, but the opposite of "stays fire-colored".
- **Bloom, optionally on top.** Nothing blurs anything today; glows are faked with additive sprites (vending machine glow images, pickup glows, the keycard lock, muzzle flashes). Bloom would blur whatever is above 1 (at lower resolution) and add it back, so bright things halo on their own and bleed glow over nearby sprites and walls. Costs a blur each frame.
- It affects every light in the game, so check it against a ceiling light and the flashlight as well as fire (a test scene like `fire/FireTestScene.ts`).
- Full HDR (a float scene, exposure, adaptation) isn't needed; only the light buffer needs the range.

Suggested order when we come back: overbright with (b) first (it fixes the fire washing out), then heights with hard shadows, furniture and ceiling lights, then moving casters starting with option 1.
