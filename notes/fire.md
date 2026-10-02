# Fire

Written 2026-09-25 from a design conversation; brought up to date 2026-09-27 when the first round of fire was finished. Fire is its own mechanic, not part of the roguelike loop: things catch fire and take damage over time, fire comes from incendiary ammo, molotovs, the level itself and maybe a flamethrower, and it's drawn entirely procedurally. How the code works is in the `fire/` entry of `CLAUDE.md`; this file is the design, what's built, and what's left.

## Built

- **Burning** (`Burning.ts`): enemies and humans catch fire and take damage over time, credited to whoever lit it; lighting them again keeps them burning longer; a burning zombie that turns into a crawler keeps burning; something that dies burning leaves its fire to die down where it fell.
- **Fire on the floor** (`FireGrid.ts`): 0.5 m cells of fuel, fire spreads only along fuel and never through walls, anything standing in fire catches it and anything burning lights the fuel under it.
- **Sources:** the Incendiary Rounds upgrade and molotovs (in closets and the upgrade pool).
- **The look:** flames from a heat buffer and a shader (no grid shows), fire that grows in and dies down smoothly, one small flickering light per burning cell whose shadows move, soft fuel stains and scorch marks, and embers.
- **Smoke** (`SmokeField.ts`): a density per cell that fire, burning things, gunshots and explosions put in, that spreads through rooms and doorways but not walls, and clears on its own (about 10 seconds after a molotov goes out). Drawn with churning noise and dark sooty patches. Bullets carve tunnels through it that close up.
- **Tools:** `?scene=fire` (a test room; `?auto` plays it by itself), `npm run clip` (records the test scene to an mp4), and the backtick debug overlay (smoke per cell, the walls smoke sees, the cell under the mouse).

## Decisions

- Fire is a temporary, localized effect, not a building sim. It spreads only along fuel and burns out. Some levels can have permanent fires as part of their design.
- Enemies don't change their behavior around ground fire. Zombies walk straight through it, which makes fire a strong tool for controlling space.
- Fire hurts the player too (less than enemies), friendly fire from your own molotov included.
- **Lighting:** one light per burning cell, not one per patch of fire (patches lit from a single point made odd shadows). They flicker and wander, so they re-render every frame; measured at about 2 ms a frame for two molotovs on a fast machine, which is fine. Tried and dropped: one light per patch.
- **Smoke:** a field on the grid, not particles. Tried and dropped: puffs of smoke as sprites (they ignored walls), and making the smoke's look flow outward with flow-mapped noise (it read as flicking back and forth, then shimmered like pool caustics). The smoke churns in place.
- **Smoke thins two ways:** by a fraction (which thins thick smoke) and by a fixed amount per cell (which ends thin smoke, which otherwise lingered and crept through the level for over a minute).
- Randomness for looks never touches the seeded random numbers (they have their own generator, or use time-based `flicker`).

## Not done yet

Roughly in the order they'd be worth doing.

### Sounds

The molotov still uses stand-in sounds (a sped-up wall hit, a spitter splat, a slowed sword swoosh), and fire makes no sound at all. Wanted: a glass smash, a whoosh when fuel catches, a looping positional crackle per patch of fire (quieter as it dies down), and burning zombies screaming. The ElevenLabs sound-effects skill can generate these.

### Level fires

- Fuel cans or barrels that leak fuel when shot (a trail that something then lights: a grenade, a muzzle flash, a burning zombie).
- Flammable decorations: sofas, paper piles, crates.
- A "the building is on fire" floor theme with fires burning from the start (`FireGrid` already handles permanent fires: fuel of 1e9 never runs out).
- Floors with fuel of their own per room or floor type (carpet burns briefly, tile doesn't).
- Broken gas lines as permanent flame jets.
- Wooden doors that burn and eventually break.

### The flamethrower

A primary weapon with its own fuel ammo, but not a `Gun`: it sprays short-lived flame particles (a few dozen, no physics bodies, cheap raycasts against walls) that light enemies and put burning fuel on the floor. The heat buffer already takes blobs from anything, so its flames would merge with the rest.

### Smoke

- **Smoke that really moves.** The smoke only spreads evenly and churns in place; nothing drifts. Options talked through: (a) puffs as sprites drawn into a detail texture that the smoke shader uses instead of its noise, masked by the density field, so the detail moves for real and walls still contain the smoke (medium; the next step if it's wanted); (b) a real velocity field on the grid (stable fluids: advection, optionally a pressure solve), so smoke flows out of fire, curls around walls and pours through doorways, and bullets and explosions push it (large; the most CPU of anything in fire).
- **Closed doors don't stop smoke.** The smoke only knows about walls that don't move; doors would need their edges checked again as they move.
- **Should smoke block vision?** `visibility.ts` supports occluders that only partly block sight, and `SmokeField.densityAt` says how smoky any cell is. Good for atmosphere; changes how fights play.
- **Bullet tunnels drawn, not rasterized to the grid.** Tunnels are hidden 0.5 m cells now, so they look blocky and change width with angle. Instead: each bullet keeps a trail (from, to, the time at each end; only kept if it crossed smoke) and `smoke.frag` takes them as a uniform array (32–64, culled to the view), clearing by distance to each segment. The tunnel closes from the tail first and its edges fray with the existing warp/billow noise as it ages; a thicker band at the edge fakes the pushed-aside smoke. The grid side (`clearing`, the green channel, the density push) goes. If there are too many trails (a shotgun emptied into smoke), draw them as quads into a low-resolution clearing texture instead, which could also hold a displacement direction; the shader's `tunnelAt(world)` stays the same.
- **Explosions could blow smoke away** (a push outwards, like bullets' tunnels but round), which wants the velocity field above. Or without it, drawn like the tunnels above: a blast (center, radius, start time; a few slots) whose cleared disc grows fast with a thick rim, then closes back in over 1.5–2.5 s, fraying, and reveals the blast's own puff as it closes. To stop it clearing smoke through walls, flood fill from the center like `puff` and mark the reached cells in the freed green channel, which the shader multiplies the disc by (as coarse at walls as the smoke already is; exact would be `visibility.ts`'s polygon drawn into a texture). Only for explosives (a `blast` field on `ConsumableStats`), not molotovs. Optionally also push density out over the flood, so a grenade clears a room for good.

### Burning things

- Burning zombies moving faster or sounding different.
- Burning things setting fire to whoever they grab.
- Later combinations: flammable spitter goo, burning enemies that explode on death, a burning melee weapon, a fire-resistance upgrade (the Fire Retardant Jacket in `notes/roguelike-redesign.md`'s item candidates), a character who starts with molotovs, "dragon's breath" shotgun shells as a weapon card.

### Looks

- Heat haze: a stage-level displacement filter like `DamagedOverlay`, masked by the heat buffer.
- Fire brighter than the lighting allows: the light texture clamps at 1 and is multiplied over the world, so big fires wash out to full brightness rather than getting deeply fire-colored. See "Light brighter than 1" in `notes/lighting-ideas.md` (with the light and shadow height idea).
- People and zombies casting shadows from firelight (moving shadow casters, also in `notes/lighting-ideas.md`).

### Loose ends

- `Camera2d.getWorldViewport` had its x and y swapped (fixed here, in `src/core/`); worth upstreaming to `simonbw/game-engine`.
- The noise functions are copied between `flames.frag` and `smoke.frag`.
