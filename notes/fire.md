# Fire

Written 2026-09-25 from a design conversation. Fire is its own mechanic, not part of the roguelike loop: things catch fire and take damage over time, fire comes from incendiary ammo, molotovs, the level itself and maybe a flamethrower, and it's drawn entirely procedurally.

**Built 2026-09-25 (`src/highrise/fire/`), mechanics first with placeholder looks:** burning (enemies and humans), the fire grid, incendiary rounds and molotovs. Not built: the look (heat buffer, flame shader, embers, smoke, scorch texture), fire sounds (stand-ins for now), level fires and the flamethrower.

## Decisions so far

- Fire is a temporary, localized effect, not a building sim. It spreads only along fuel (spilled fuel, flammable floor, props) and burns out. Some levels can have permanent fires as part of their design.
- Enemies don't change their behavior around ground fire for now. Zombies walk straight through it, which makes fire a strong tool for controlling space. Burning zombies might later move faster and make different sounds.
- Don't worry about lighting cost. A fire light that flickers rebakes every frame, and that's fine: baking is there so hundreds of static lights are cheap, not a rule that lights must be static. If it turns out to cost too much, fix it then (e.g. flicker at composite time with the baked sprite's alpha/tint instead of `setIntensity`, which marks the light dirty).

## The model

Two systems that feed each other.

### Burning (a status on things)

`BaseEnemy` (and probably `Human`) gets a burning state: time left, damage per second, and who lit it.

- Damage goes through `takeHit`, in small chunks, and credits the one who lit it (`RunStats`, kill attribution).
- Lighting something that's already burning refreshes the timer; it doesn't stack without limit.
- Burning carries over when a zombie turns into a crawler. Heavies might burn longer.
- A burning thing lights the fuel it walks over, and maybe whoever it grabs.
- Burning zombies keep coming at you. A burning horde is still a horde.

### Ground fire (a grid)

A coarse grid over the level (about 0.5 m cells), each cell with fuel, heat and whether it's burning. Only burning or hot cells are updated, so the cost scales with how much is on fire. Walls hold no fuel and block spread.

- A burning cell heats its neighbors; a neighbor with fuel catches. A cell with no fuel never burns. That's the whole spread rule.
- Floors can have fuel of their own per room or floor type (carpet burns briefly, tile doesn't).
- A molotov splash floods fuel into cells around where it breaks, stopped by walls, instead of being a circle through them.
- Anything standing in a burning cell catches fire; anything burning heats its cell.
- Burned-out cells leave a scorch mark.
- The grid is also what the renderer draws from (see below).

A grid rather than one entity per fire patch because it gives splashes that respect walls, fire running along a fuel trail and per-floor flammability almost for free.

## Where fire comes from

Roughly from least to most work:

- **Incendiary rounds.** An upgrade in the `PlayerStats` style (a rule flag, or a chance to ignite), checked in `hitByBullet`. "Dragon's breath" shotgun shells could be a weapon-card variant. The smallest version of fire that works start to finish.
- **Molotovs.** A consumable (already on the roguelike backlog as one). `ThrownConsumable` breaks on impact and spills burning fuel into the grid instead of making a `Detonation`. Glass smash + whoosh.
- **Level fires.**
  - A "the building is on fire" floor theme with cells burning from the start.
  - Broken gas lines as permanent flame jets.
  - Flammable decorations (sofas, paper piles).
  - Fuel cans or barrels that leak fuel when shot. Unlit fuel is a great setup: a grenade, a muzzle flash or a burning zombie sets it off.
  - Wooden doors that burn and eventually break.
- **Flamethrower.** A primary weapon with its own fuel ammo, but not a `Gun`. It sprays short-lived flame particles (a few dozen, no physics bodies, cheap raycasts against walls) that light enemies and put burning fuel on the floor. Probably its own `Weapon` class that borrows reload and ammo from `Gun`.
- **Later combinations:** flammable spitter goo, burning enemies that explode on death, a burning melee weapon, a fire-resistance upgrade, a character who starts with molotovs.

## Rendering

Everything that burns draws into one heat buffer, and one shader turns heat into flames.

1. **Heat buffer.** A low-resolution render texture around the camera (about 8–16 px per meter). Sources draw soft heat blobs into it additively:
   - the fire grid, as a small data texture drawn scaled up;
   - each burning enemy, as a blob with a tail stretched opposite its velocity so the flames trail behind it;
   - flamethrower particles.
2. **Flame shader.** A mesh on `EMISSIVES` with a custom GLSL shader (a mesh, not a filter, so the "filters don't work in render passes" problem doesn't apply). It samples the heat buffer, warps the lookup with scrolling fbm noise, thresholds heat plus noise into ragged tongues, and maps the result through a color ramp: white-yellow core, orange, red, transparent. Because every source goes through the same shader, flames from different sources merge: a burning zombie walking into a molotov patch is one fire.
3. **Top-down flames.** Flames rise toward the camera, so the usual "scroll the noise upward" doesn't work. Instead: noise that swirls in place over time, a slight global drift (a draught), and velocity-based drift on burning enemies. Prototype this before anything else.
4. **Particles.** Embers (additive specks that drift, slow and fade) and smoke (large soft dark blobs in `WORLD_FRONT` that grow as they rise).
5. **Scorch marks.** A level-sized texture on `FLOOR_DECALS`, written as fuel burns off, like `ExploredMap`.
6. **Light.** Fire lights flicker (intensity and color). One per burning region of the grid rather than per cell; one per burning enemy.
7. **Heat haze** (later). A stage-level displacement filter like `DamagedOverlay`, masked by the heat buffer.

**Sound:** a looping positional crackle per burning region, a whoosh on ignition, burning zombie screams. The ElevenLabs sound-effects skill can make these.

## Order

Built so far: 2 and 3, apart from their looks and sounds (mechanics came first).

1. **The look.** A cheat key that drops heat blobs; iterate on the heat buffer and the shader until it looks right, with no gameplay.
2. **Burning status + incendiary rounds**, with the shader on burning enemies. The smallest playable version.
3. **The fire grid + molotovs**, then scorch marks, fire lights and crackle.
4. **Level fires:** fuel cans, flammable props, a burning floor theme, burning doors.
5. **Flamethrower.** Reuses everything above; new are the particle stream and fuel ammo.

## Open questions

- Does fire hurt the player? Probably yes, for less time than enemies. Friendly fire from your own molotov is part of the genre, but could get annoying.
- Should smoke block vision? `visibility.ts` already supports occluders that only partly block sight. Good for atmosphere, but a bigger change.
- Do burning zombies move faster or sound different? Later.
