# Roguelike redesign

Written 2026-09-22 from a design conversation. The game started as a Left 4 Dead-style run-and-gun; the base gameplay alone won't carry it, so the direction is a modern roguelike: a run through a building, progression through a few simple choices ("pick one of three"), resources to manage, and unlocks between runs. Features should be diegetic where possible.

The "Current state" notes describe the code as of 2026-09-22 (5 fixed floors, no stats, infinite ammo, one weapon slot, survivors auto-join and follow, vending machines do nothing, nothing persists except the tutorial flag).

## Decisions so far

- Stat upgrades are permanent and live on the character. Some upgrades can live on a gun.
- Floors + stairs stay. No elevators between floors (raises "why not ride to the top?"). The lobby elevators go, or become cosmetic.
- Safe zones are stairwells, entered through one-way locking doors.
- Ammo is limited, but running out must never be a dead end: push/melee has to be a viable (bad) way through a floor.
- Two weapon slots, L4D style: a primary with limited ammo and a secondary with unlimited ammo. (Proposed, not yet decided; see feature 4.)
- Quarters are the currency.
- Survivors are not extra lives. Finding one and getting them to the stairwell unlocks them as a playable character in the lobby. While with you they're a bonus that you want to keep alive.
- Survivors don't take pickups; when their ammo is gone they're out.
- Glowsticks are not a core mechanic. Remove them, or keep as a rare consumable.
- One-time-use weapons (grenades etc.) are a resource.
- An encyclopedia shows everything found/unlocked, viewable during and between runs.

## Features

Each of these can be built and played on its own. Dependencies are noted. Sizes are rough (S = a session, M = a few, L = a project).

### 1. Player stats (S)

**Done 2026-09-22 (`human/PlayerStats.ts`).**

Current: `Human.ts` uses constants for speed (5 m/s, 3 m/s when hurt), max HP (100), push range/knockback/stun. Reload time, fire rate and spread live on the shared read-only `GunStats` objects.

- A `PlayerStats` object on `Human`: move speed, max HP, damage multiplier, reload speed multiplier, fire rate multiplier, spread multiplier, magazine size bonus, push damage/knockback/stun, flashlight range, vision range, quarter drop rate, etc. Defaults are 1×/0.
- `Gun`, `WalkSpring`, `push`, `Flashlight` and `VisionController` read the multipliers at use time. `GunStats` stays read-only.
- Vision range is an unusual and interesting stat because of the fog of war.
- Prerequisite for 2 and 9.

### 2. Pick one of three (M)

**Done 2026-09-22 (`upgrades/`, `menu/UpgradeSelect.tsx`; shown on `levelComplete`, not yet on the stairwell landing). Upgrades are lost if the leader dies and an ally takes over.**

Current: nothing is a choice. Every floor has the same closet contents (health, T0 gun, melee, survivor, plus a higher-tier gun on later floors).

- At the end of each floor, in the stairwell landing (feature 3), the player is offered three options and takes one; the other two disappear. Diegetic version: three items laid out on the landing (a duffel bag, a locker, a body); taking one removes the rest. Overlay version: a Preact screen on the stairs. Try the diegetic version first.
- Pool:
  - Stat cards (feature 1).
  - Rule cards, which make builds feel different: kills sometimes drop ammo; reloading from empty is instant; melee kills heal a little; pushes chain stuns; crawlers die in one hit; allies deal more damage.
  - Weapon offers: a specific gun, possibly with a gun-attached upgrade (extended mag, laser, choke).
  - Consumables (feature 7) and quarters.
- Rarity tiers, and boss/landmark floors offer a guaranteed rare.
- Data model: `Upgrade = { name, description, rarity, apply(human) }`, collected in one index file like `gunStats.ts`. The encyclopedia (feature 11) reads the same list.

### 3. Stairwell safe zones with one-way doors (M)

**Done 2026-09-22 (`levels/rooms/ExitStairwell.ts`, `environment/Stairwell.ts`, `Door` `locked`/`oneWay`). Spawn room door left two-way (panic room) pending playtest.**

Current: the spawn room is the arrival point; the exit is a stairs tile at the furthest dead end; enemies can go anywhere.

- Each floor: arrive in a stairwell (spawn room), cross the floor, enter the exit stairwell through a one-way locking door. The door locks behind you: enemies can't follow, and you can't go back. The landing is where the pick-one-of-three happens, and where allies "exit" (feature 8).
- Enemies never spawn in or path into stairwells. Doors between hallway and stairwell are the only entrance.
- The arrival stairwell's door out is one-way too, so the floor is committed once you leave it (or not; maybe you can retreat into it as a panic room, which is a different feel. Decide in playtest).
- Gives the floor a shape: safe → danger → safe.
- Needs a locked/one-way state on `Door` (currently spring-hinged, pushable from either side, no locks). Also needed by keycards (feature 6).

### 4. Limited ammo, two weapon slots, viable melee (M)

**Done 2026-09-22 (`weapons/guns/ammo.ts`, `Human` `primary`/`secondary`, `environment/AmmoPickup.ts`, `controllers/AmmoDropper.ts`, Scavenger upgrade). Swap is Q / wheel / gamepad Y; gamepad interact moved to B. Push: 10 damage, ~0.5 s per push. Not done: ammo from vending machines/stores.**

Current: reserve ammo is infinite (reload always refills). One weapon slot; pickup drops the current weapon. Push does no damage, 110 knockback, 0.75 s stun.

- Reserve ammo per weapon class (pistol / rifle / shotgun) rather than per gun, so swapping within a class isn't punished. Ammo pickups, ammo from kills (rule card), ammo from stores.
- Two slots: primary (limited ammo: rifles, shotguns, SMGs) and secondary (unlimited: pistols and melee). Quick swap on one button (scroll wheel / gamepad Y). Reload-vs-swap becomes a decision, which is the whole point of the L4D layout.
  - Alternative: one slot plus melee always available on a separate button. Simpler, but loses the pistol-vs-melee choice. Two slots is the better fit with the ammo economy.
- Push becomes a real melee attack: a little damage (10–15?), knockback and a short stun, with a cooldown, so an empty-handed run is slow and scary but possible. Melee weapons stay much better than the push.
- HUD needs a reserve count next to the shells, and a secondary-weapon indicator.
- Fix the melee windup/winddown damage bug in `Enemy.ts:192` while here (full damage is applied for windup hits with non-zero damage).

### 5. Quarters, vending machines, stores (M)

**Partly done 2026-09-22: quarters drop from enemies (25%), vending machines sell a health pickup for 3 quarters, HUD counter, cheat `K`. Not done: stores, machines alerting zombies.**

Current: vending machines play a coin sound on interact and can be destroyed. Nubbies (single-cell dead ends) get a vending machine or water cooler 80% of the time.

- Quarters drop from zombies (low chance, scaled by a stat) and are found on desks, in registers (the shop rooms have counters), in bathrooms. Diegetic and retro.
- Vending machines dispense for quarters: snack machines give health, and there could be ammo machines on maintenance floors and a mystery machine. Shooting a machine open gives a random item once and alerts nearby zombies. This gives the nubbies a purpose.
- Stores: a room on roughly every third floor with several things for sale (ammo, consumables, an upgrade, a weapon), shown on the directory so the player can save up. The `Shop` room template already exists as decoration. A store is a safe-ish room with a locked door? Or just a shopkeeper machine. Decide when building.
- HUD: quarter count.

### 6. Keycards and locked rooms (S–M)

**Done 2026-09-22 (`environment/Keycard.ts`, `KeycardLock.ts`; one keycard, an ARMORY and a SUPPLY closet per floor).**

- Each floor has a keycard (on a body, in a desk) and two or three locked rooms: armory, infirmary, supply closet, a survivor's holding cell. One keycard, so the player picks which door to open.
- The directory (feature 9) can show what's behind the locked doors on each floor, so the choice can be planned before arriving.
- The closet system already produces the right room shape; needs the locked door state from feature 3 and a `Keycard` pickup.

### 7. Consumables: grenades etc. (S–M)

**Done 2026-09-22 (`weapons/consumables/`, `effects/Detonation.ts`): frag grenades and flashbangs, thrown with G / LB, found in closets (the ARMORY always has one) and offered as upgrade picks. Not done: molotovs, pipe bombs, medkits, stores.**

Current: unlimited glowsticks on Q/LB, made to test the lighting.

- Replace the glowstick slot with a consumable slot: grenades, molotovs, pipe bombs (L4D style: zombies run to it), flashbangs (stun), medkits. Rare, valuable, one or a few carried at a time. Found on floors, bought in stores, offered as upgrade picks.
- Glowsticks could survive as one consumable (a light in a dark floor is legitimately useful on the maintenance floors), but not as a free unlimited thing.
- The explosion/fire effects don't exist yet and are a chunk of the work.

### 8. Survivors become unlockable characters (M)

Current: one survivor per floor in a closet, auto-joins at 2 m with line of sight, follows the leader, takes pickups by an etiquette rule, shoots within 6 m. When the leader dies control goes to the oldest ally.

- A survivor follows you for the rest of the floor. When you reach the exit stairwell with them alive, they exit (walk off up the stairs) and are unlocked as a playable character in the lobby, permanently (localStorage).
- While with you they're a bonus: extra gun, extra target for zombies. You want them alive until the stairwell, which makes rescuing a mini-objective with tension.
- They never pick things up. Out of ammo means out; they fall back to pushing or just following.
- Should they ever join for more than a floor? Not for now: unlock is the reward.
- When the leader dies the run ends (no more control handover). Unless: the ally is still alive, and you take them over for the rest of the floor only? Probably not; keep it simple.
- Which characters spawn as survivors: those not yet unlocked, preferring ones the player hasn't met.
- Getting stuck on furniture (an old note) matters more if they need to reach the stairwell alive. Consider a simple pathfinder or a teleport-if-far rule.

### 9. Lobby hub: character select and floor directory (M–L)

Current: the lobby is level 1 (a room with cosmetic elevators, a desk, a piano and Bob the Heavy). The main menu is HTML. Character is random from a shuffle ring.

- Done 2026-09-22: a character select screen (`menu/CharacterSelect.tsx`) between the main menu and the game, all 13 characters, no unlocking yet. The lobby version below can replace it later.
- The lobby becomes the between-runs hub, not a floor. It is the diegetic main menu.
- Character select: unlocked characters stand in the lobby; walk to one and interact to pick them. Each starting character has unique stats and a starting weapon (and maybe one trait: Takeshi has the katana and fast melee, Santa has a toy bag that hands out consumables, etc.). Locked characters could be visible as silhouettes/empty chairs so the player knows there's more.
- Floor directory: the building directory board by the stairs shows the run: each floor's theme and icons for what's notable (store, infirmary, survivor, siege, boss). This is the see-what's-coming run map, not a level select. Whether there is ever a "start at floor 5" unlock is an open question.
- Encyclopedia (feature 11) and settings are also lobby objects (a bookshelf, the reception desk). A keyboard shortcut still opens them.
- The stairwell door is the start button.
- Bob stays as a joke.

### 10. Run structure, building generation, landmark floors (L)

Current: 5 fixed templates in fixed order, 14×14 grid of 2 m cells, exit at the furthest dead end. The Necromancer arena is on floor 5 but is optional (the exit is placed independently). Enemy count is `20 + 10×level`; nothing else scales.

- The building is the run: a fixed skeleton with random blanks. Something like 3 blocks of 2–3 themed floors plus a landmark floor, ~10 floors, 20–30 minutes. `level-ideas.txt` has the 100-floor theme list; use it as the pool (shops, maintenance, apartments, offices, gym, arcade, spa, penthouse, roof with helicopter as the end).
- Landmark floors:
  - Siege floor (generator): flip the generator, lights come on floor-wide with the existing distance delay, the stairwell door unlocks in N seconds while a horde comes. L4D crescendo event; cheaper than a boss.
  - Arena floor (Necromancer): the stairwell is inside or behind the arena and stays locked until the boss dies. Boss drops a guaranteed rare pick. Later a second boss (Heavy as a proper tank fight).
- Scaling: enemy HP/damage/speed per floor as well as counts, and more specials.
- Floor size: smaller floors (10×10?) with more of them make a faster choice cadence and read more like a building. Playtest.
- Random room events: a rescue that triggers a wave; a store; a dark floor; a flooded floor (slow); an alarm.

### 11. Encyclopedia (S–M)

- A screen listing all guns, melee weapons, consumables, upgrades, characters and enemies, with the ones found/unlocked revealed and the rest as "???". Viewable from the pause menu during a run and from the lobby.
- Reads the same data indexes (`gunStats.ts`, `weapons.ts`, the upgrade list, `Character.ts`, enemy variants) so it stays in sync automatically. "Found" flags persist (feature 14).
- Preact, plain CSS, like the other menus.

### 12. Game over / run summary screen (S)

**Done 2026-09-22 (`run/RunStats.ts`, `menu/GameOverScreen.tsx`).**

Current: "You Win" or "You Lose" on a coloured screen, then the main menu.

- Floors reached, cause of death, kills by type, quarters collected, upgrades taken, characters unlocked this run, time. "Return to lobby" button. Unlocks earned this run are called out.
- Later: a run history / best run in the lobby.

### 13. Remove glowsticks (S)

**Done 2026-09-22. The tutorial's glowstick step teaches the flashlight instead. The glowstick drop sounds live on as grenade bounces; the `glowStick1-3` images are unused.**

- Remove the Q/LB glowstick and its cooldown from `Human`, the tutorial room step that teaches it, and the `GlowStick` entity if nothing else uses it. The `Flashlight` covers the "I need light" case. Possibly re-add as a consumable (feature 7).

### 14. Meta persistence (S)

**Done 2026-09-22 (`persistence/SaveData.ts`; nothing unlocks characters yet).**

- One `SaveData` object in localStorage (versioned): unlocked characters, encyclopedia found flags, run history, settings. Everything that persists goes through it. Needed by 8, 9, 11, 12.

## Suggested order

Each step is playable and testable on its own.

1. Player stats (1) + pick one of three (2) + stairwell safe zones (3). This is the core loop. Playtest before anything else.
2. Limited ammo, two slots, viable push (4). Now there's a resource, and the picks include the ammo economy.
3. Quarters + vending machines + stores (5), keycards (6), consumables (7), remove glowsticks (13).
4. Meta persistence (14) + survivors as unlocks (8) + lobby hub with character select and directory (9).
5. Run structure and landmark floors (10).
6. Encyclopedia (11) and run summary (12) can slot in anywhere after 14.

## Open questions

- Two weapon slots or one slot + always-available melee?
- Can the player retreat into the arrival stairwell (panic room), or is it one-way too?
- Should any "start at floor N" unlock exist, or is the directory purely a preview?
- Ally death: does the run end when the leader dies, even with an ally alive?
- Floor size and count.
- Starting-character traits: stats only, or one rule-like trait each?
