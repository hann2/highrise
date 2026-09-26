# Roguelike redesign

Written 2026-09-22 from a design conversation. The game started as a Left 4 Dead-style run-and-gun; the base gameplay alone won't carry it, so the direction is a modern roguelike: a run through a building, progression through a few simple choices, resources to manage, and unlocks between runs. Features should be diegetic where possible. The progression loop was redesigned on 2026-09-25 (see "Progression, revised" below): a vending machine store in every stairwell instead of a free pick per floor.

Each feature's "Current" note describes the code before the feature was built (as of 2026-09-22 unless it says otherwise: 5 fixed floors, no stats, infinite ammo, one weapon slot, survivors auto-join and follow, vending machines do nothing, nothing persists except the tutorial flag). This doc is the backlog: the unfinished features, the open questions and the leftovers at the end are what's next.

## Decisions so far

- Upgrades are permanent, named equipment on the character, or attachments that follow the compatible gun. (Revised 2026-09-25.)
- Floors + stairs stay. No elevators between floors (raises "why not ride to the top?"). The lobby elevators go, or become cosmetic.
- Safe zones are stairwells, entered through one-way locking doors.
- Ammo is limited, but running out must never be a dead end: push/melee has to be a viable (bad) way through a floor.
- Two free weapon slots; you start with a pistol whose ammo is cheap rather than unlimited. (Revised 2026-09-25; see feature 4 and "Guns".)
- Quarters are the currency, and the only progression: everything is bought. Bosses are strictly good. Guns are rare. (2026-09-25.)
- Survivors are not extra lives. Finding one and getting them to the stairwell unlocks them as a playable character in the lobby. While with you they're a bonus that you want to keep alive.
- Survivors don't take pickups; when their ammo is gone they're out.
- Glowsticks are not a core mechanic. Remove them, or keep as a rare consumable.
- One-time-use weapons (grenades etc.) are a resource.
- An encyclopedia shows everything found/unlocked, viewable during and between runs.

## Progression, revised 2026-09-25

From a second design conversation, which replaced the "pick one of three" loop (feature 2) and reframed features 4–7 and 10. The idea behind it: a build is a choice made among dealt options. The game deals (what's on the shelf) and the player chooses (what to buy), so no one can run the same build every time, and being handed something and knowing what's good with it is the skill. Bosses are always good news. Guns are rare.

### Run shape

- 15 floors in acts of 4: a landmark floor (boss or siege) at 4, 8 and 12, then 13–15 up to the finale on the roof. Each act has a gun tier: act 1 is the tier 1 starting guns, acts 2–4 put tiers 2–4 on the shelves.
- The directory shows floor types and landmarks. It never shows what a floor holds or what's for sale.

### The loop: floor → stairwell vending machine → next floor

- No free pick per floor. `menu/UpgradeSelect`, the `upgrades/` pool and weapon cards go.
- Every exit stairwell has a vending machine, the store. E opens a modal styled as the machine's front: three rows, a 2×2 of equipment and gun attachments, and a bottom row holding one gun. Buying makes the item come forward (scale up a little) and wiggle until it drops. One screen, seconds to clear. The contents are dealt per floor and lean toward the gun families you hold.
- Bigger stores on some floors (a pawn shop, a gun shop) with more shelves. Still dealt.
- Quarters are the floor's reward: zombies drop them, desks and registers hold them, bosses pile them up. Killing spends ammo and earns quarters, so whether a zombie is worth a bullet is a live question. The cheapest slot is always affordable from one floor's take.
- No interest mechanic. Maybe an investment item: buy for X, sell three floors later for 2X.
- The existing floor vending machines (ammo, health, grenades) stay as small resource machines scattered through the floor, 1–2 per floor. Ammo is bought there, mid-floor, not in the stairwell. (Open: whether consumables are on the stairwell machine too.)

### Quarters and ammo (open)

- Ammo is a running cost rather than a scarcity. Pistol ammo is not unlimited but is cheap and carried in bulk; rifle and shotgun rounds cost more. The question is how much it costs to keep shooting, not whether you'll run out.
- Guardrail: a floor's quarters cover a floor's pistol ammo, so going broke only happens by choosing items over ammo. Push and melee stay the viable bad way through when it does.
- Ammo price per family is a balancing lever and an equipment target ("shotgun shells cost half").
- Numbers to find: drop rates, prices, carry limits.

### Bosses

- Strictly good. A heap of quarters, consumables, and one item from a boss pool with no downsides (Night Vision; Akimbo as "two pistols fire together"). Never a gun, never anything that could make the build worse.
- A big store on the floor after a boss, so the cash has somewhere to go.

### Guns

- Rare: 3–4 encounters a run, all bought from the machine's gun row, priced by tier, with a trade-in (the gun you replace sells back). Never three guns side by side, never known ahead of time.
- Families are the ammo types: pistol, rifle, shotgun, and melee on its own. Attachments fit by family (a choke on shotguns, a scope on rifles and revolvers), so staying in a family is rewarded and holding two families is an ammo advantage that costs attachment focus.
- Re-bucket `GUN_TIERS` to one gun per family per tier. Tier 3 needs filling and pistols need a ladder (Revolver and Five-seveN move up).
- Two free weapon slots, no primary/secondary. You start with a pistol; taking two pricier guns means giving up the cheap fallback, which is a deliberate choice. Melee takes a slot.
- Characters' starting weapons are the one chosen gun, the build's seed, so characters should spread across families.

### Items

- Slots: 2 weapons, 1 throwable, 1 usable (with charges: a health pack is 3 uses, a stim 2). Everything else is unlimited, relic-style equipment. No clothing or armor slots.
- Every item is named and has a rule. A stat multiplier only survives inside a named item; no generic "+10% damage" cards. Where possible an item's value depends on the gun family ("pellets ricochet once", "the last round in a magazine does triple damage", "pistol kills refund the shot"), so the dealt gun shapes the build.
- Gun attachments: per-gun slots (magazine, ammo type, rail). Owned as items, mounted automatically on the compatible gun in hand, carried over to the next compatible gun, unused otherwise. No attachment management screen; the card says "Fits: shotguns".
- Ammo-type attachments convert the family's ammo (incendiary shells make every shell incendiary). A limited box of special rounds would be a consumable instead.
- Items with a restriction (Bloodlust: melee only, kills heal) are shop items, never boss drops.
- Candidates: Armored Vest (damage reduction), Night Vision (boss), Akimbo (boss), Brass Knuckles (push damage), Bicep Curls (push knockback; maybe a tier of Brass Knuckles), Bloodlust, Tennis Shoes (better sprint), Galoshes (acid immunity; only once acid exists, and cheap). Attachments: Laser, Extended Magazine, Exploding ammo, Incendiary ammo (needs a fire status: burn, spread, visuals; shared with molotovs), Armor Piercing (penetrates), Bayonet (push damage with that gun). Consumables: Frag Grenade, Incendiary Grenade, Health Pack, Stim Pack (faster and tougher for a few seconds).
- Pool size: ~50 items to start, ~80 done. Build the structure with the cheap items first; fire, sprint and Akimbo are features of their own.
- Keycard armory/infirmary on at most one floor per act, not every floor. Armory: ammo and an attachment. Infirmary: health. The one reward that's found rather than bought.

### Sprint

- Shift sprints by default (it's what you reach for anyway). Downside: no shooting while sprinting (reloading too?). Tennis Shoes and the like improve it.

### Deferred

- Rerolls: not on the machine. Maybe a special room on some floors.
- Booster packs and gambling: category packs, an arcade machine.
- Combining: gun + attachments evolving into a named gun.

### Rejected

- Dead Cells-style stat colours (would replace the stat model).
- XP and level-ups: pushes clearing every room, which fights limited ammo and fog of war. Quarters reward kills the same way and are spendable.
- Pure skill points ("put it in one of five"): chosen, not dealt, so the same build every run.
- Guns from bosses: a wrong-family gun after a boss is a punishment.
- Guns as a pick of three: a family menu becomes a habit.
- Guns known ahead of time (on the directory).
- Clothing/armor slots, interest, rerolls on the machine.

### Open

- Whether a free dealt stat pick (three of the stats, raise one) comes back as a fallback if empty-pocket stairwells feel bad.
- Consumable carry limits, and whether the stairwell machine sells them.
- What the bigger store floors look like.
- Ammo numbers (above).

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

**Done 2026-09-22 (`upgrades/`, `menu/UpgradeSelect.tsx`; shown on `levelComplete`, not yet on the stairwell landing). Superseded 2026-09-25: the free pick and this pool go; the stairwell vending machine replaces it (see "Progression, revised"). The pick screen's bones may become the machine modal.**

Current: nothing is a choice. Every floor has the same closet contents (health, T0 gun, melee, survivor, plus a higher-tier gun on later floors).

- At the end of each floor, in the stairwell landing (feature 3), the player is offered three options and takes one; the other two disappear. Diegetic version: three items laid out on the landing (a duffel bag, a locker, a body); taking one removes the rest. Overlay version: a Preact screen on the stairs. Try the diegetic version first.
- Pool:
  - Stat cards (feature 1).
  - Rule cards, which make builds feel different: kills sometimes drop ammo; reloading from empty is instant; melee kills heal a little; pushes chain stuns; crawlers die in one hit; allies deal more damage.
  - Weapon offers: a specific gun, possibly with a gun-attached upgrade (extended mag, laser, choke). **Guns done 2026-09-23 (`upgrades/weaponOffers.ts`): at most one per offer, from the floor's closet tier or the one above; no gun-attached upgrades yet.**
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

**Done 2026-09-22 (`weapons/guns/ammo.ts`, `Human` `primary`/`secondary`, `environment/AmmoPickup.ts`, `controllers/AmmoDropper.ts`, Scavenger upgrade). Swap is Q / wheel / gamepad Y; gamepad interact moved to B. Push: 10 damage, ~0.5 s per push. Not done: ammo from vending machines/stores. Revised 2026-09-25: the slots become two free slots (no primary/secondary), pistol ammo becomes cheap rather than unlimited, and ammo is a running cost bought at floor machines (see "Quarters and ammo").**

Current: reserve ammo is infinite (reload always refills). One weapon slot; pickup drops the current weapon. Push does no damage, 110 knockback, 0.75 s stun.

- Reserve ammo per weapon class (pistol / rifle / shotgun) rather than per gun, so swapping within a class isn't punished. Ammo pickups, ammo from kills (rule card), ammo from stores.
- Two slots: primary (limited ammo: rifles, shotguns, SMGs) and secondary (unlimited: pistols and melee). Quick swap on one button (scroll wheel / gamepad Y). Reload-vs-swap becomes a decision, which is the whole point of the L4D layout.
  - Alternative: one slot plus melee always available on a separate button. Simpler, but loses the pistol-vs-melee choice. Two slots is the better fit with the ammo economy.
- Push becomes a real melee attack: a little damage (10–15?), knockback and a short stun, with a cooldown, so an empty-handed run is slow and scary but possible. Melee weapons stay much better than the push.
- HUD needs a reserve count next to the shells, and a secondary-weapon indicator.
- Fix the melee windup/winddown damage bug in `Enemy.ts:192` while here (full damage is applied for windup hits with non-zero damage).

### 5. Quarters, vending machines, stores (M)

**Partly done 2026-09-22: quarters drop from enemies (25%), vending machines sell a health pickup for 3 quarters, HUD counter, cheat `K`. Not done: stores, machines alerting zombies. Revised 2026-09-25: the store is a vending machine in every exit stairwell (equipment, attachments, one gun), the floor machines are the ammo/health/grenade source at 1–2 per floor, and bigger stores are occasional floors (see "The loop").**

Current: vending machines play a coin sound on interact and can be destroyed. Nubbies (single-cell dead ends) get a vending machine or water cooler 80% of the time.

- Quarters drop from zombies (low chance, scaled by a stat) and are found on desks, in registers (the shop rooms have counters), in bathrooms. Diegetic and retro.
- Vending machines dispense for quarters: snack machines give health, and there could be ammo machines on maintenance floors and a mystery machine. Shooting a machine open gives a random item once and alerts nearby zombies. This gives the nubbies a purpose.
- Stores: a room on roughly every third floor with several things for sale (ammo, consumables, an upgrade, a weapon), shown on the directory so the player can save up. The `Shop` room template already exists as decoration. A store is a safe-ish room with a locked door? Or just a shopkeeper machine. Decide when building.
- HUD: quarter count.

### 6. Keycards and locked rooms (S–M)

**Done 2026-09-22 (`environment/Keycard.ts`, `KeycardLock.ts`; one keycard, an ARMORY and a SUPPLY closet per floor). Revised 2026-09-25: at most one keycard floor per act, armory = ammo + an attachment, infirmary = health.**

- Each floor has a keycard (on a body, in a desk) and two or three locked rooms: armory, infirmary, supply closet, a survivor's holding cell. One keycard, so the player picks which door to open.
- The directory (feature 9) can show what's behind the locked doors on each floor, so the choice can be planned before arriving.
- The closet system already produces the right room shape; needs the locked door state from feature 3 and a `Keycard` pickup.

### 7. Consumables: grenades etc. (S–M)

**Done 2026-09-22 (`weapons/consumables/`, `effects/Detonation.ts`): frag grenades and flashbangs, thrown with G / LB, found in closets (the ARMORY always has one) and offered as upgrade picks. Not done: molotovs, pipe bombs, medkits, stores. Revised 2026-09-25: one throwable slot and one usable slot with charges (health pack, stim); bought at floor machines and dropped by bosses.**

Current: unlimited glowsticks on Q/LB, made to test the lighting.

- Replace the glowstick slot with a consumable slot: grenades, molotovs, pipe bombs (L4D style: zombies run to it), flashbangs (stun), medkits. Rare, valuable, one or a few carried at a time. Found on floors, bought in stores, offered as upgrade picks.
- Glowsticks could survive as one consumable (a light in a dark floor is legitimately useful on the maintenance floors), but not as a free unlimited thing.
- The explosion/fire effects don't exist yet and are a chunk of the work.

### 8. Survivors become unlockable characters (M)

**Done 2026-09-22 (`PartyManager`, `AllyController`, `hud/SurvivorToast.tsx`, `CharacterSelect`). Andy, Chad and Nancy are unlocked from the start. Allies in the exit stairwell when the floor completes are unlocked and leave; the rest are left behind. Leader death ends the run. Allies don't take pickups and fall back to following and pushing when their gun won't reload. No pathfinding yet: allies only get help finding the stairwell door once the leader is inside. Cheat `U` unlocks everyone, `Shift+U` resets.**

Current: one survivor per floor in a closet, auto-joins at 2 m with line of sight, follows the leader, takes pickups by an etiquette rule, shoots within 6 m. When the leader dies control goes to the oldest ally.

- A survivor follows you for the rest of the floor. When you reach the exit stairwell with them alive, they exit (walk off up the stairs) and are unlocked as a playable character in the lobby, permanently (localStorage).
- While with you they're a bonus: extra gun, extra target for zombies. You want them alive until the stairwell, which makes rescuing a mini-objective with tension.
- They never pick things up. Out of ammo means out; they fall back to pushing or just following.
- Should they ever join for more than a floor? Not for now: unlock is the reward.
- When the leader dies the run ends (no more control handover). Unless: the ally is still alive, and you take them over for the rest of the floor only? Probably not; keep it simple.
- Which characters spawn as survivors: those not yet unlocked, preferring ones the player hasn't met.
- Getting stuck on furniture (an old note) matters more if they need to reach the stairwell alive. Consider a simple pathfinder or a teleport-if-far rule.

### 9. Lobby hub: character select and floor directory (M–L)

**Done 2026-09-23 (`lobby/`, `run/RunPlan.ts`, `menu/TitleScreen.tsx`, `environment/DirectoryPlaque.ts`, `menu/FloorDirectory.tsx`; `CharacterSelect` and `MainMenu` are gone).** Decisions:

- The game boots into the lobby with the player in a closed elevator (the only lit one) behind the HIGHRISE title; Enter/START fades the title, the elevator dings open (`ElevatorDoor.open`), and the player walks out. The rest of the bank stays shut. After a run the summary's "Back to the lobby" does the same without the title.
- The lobby is hand-built (`LobbyRoomTemplate` + `generateLobby`, no maze): elevator bank, reception desk, sitting area, piano, the stairwell, and two bookcases that open the encyclopedia. Lobby ambient light, no enemies, no run HUD. Fog of war is on: the explored map is unexplored the first time and then kept in `SaveData.lobbyExplored` between visits and page loads. The pause menu has Credits there instead of Quit Run.
- Bob stays as a joke: `ReceptionistBob` is a heavy's body behind the desk that turns to watch you and groans when you press E on him. He's not an enemy.
- Every rescued character except the one you are stands around the lobby. Characters not rescued yet aren't there at all (not silhouettes), and newly rescued ones turn up while the lobby is open. They mill about near their spot and turn to look at you when you're close; they never fight. E swaps you into them, and who you were stays where you left them. An HTML prompt names whoever is nearest. You arrive as the last character you started a run with (`SaveData.lastCharacter`), or the first unlocked one.
- The run ahead is deliberately not shown in the lobby. From floor 2 on, the spawn room has a wall plaque that opens an HTML directory popup (game paused) listing the `RunPlan` top floor first, with "You are here". The plan is made when you arrive in the lobby: Shops → Maintenance → Generator → Chapel. The lobby is not a floor: the level number is the floor number, and each floor carries a separate `difficulty` (floor number + 1, so the tuning from when the lobby was level 1 still applies). Templates carry `floorName`/`floorNotes` (Maintenance: "Dark", Chapel: "Boss").
- The stairwell has a one-way door; stepping on the stairs starts the run as whoever you are.
- Not done: character traits/starting weapons. Characters are JSON with `stats` and `startingWeapons` now (2026-09-24), but every character has neither set; a character editor is meant to tune them. Still open: one rule-like trait each on top of stats? Santa's toy bag is the obvious first one. Also not done: store/infirmary/survivor icons on the directory (the plan doesn't know about them yet), a run history in the lobby. Open: whether a "start at floor N" unlock should ever exist, or the directory stays a preview.

### 10. Run structure, building generation, landmark floors (L)

Current (2026-09-23): `run/RunPlan.ts` fixes the run as Shops → Maintenance → Generator → Chapel, each floor with a difficulty of its number + 1. Floors are a 14×14 grid of 2 m cells with the exit at the furthest dead end. The Necromancer arena is on the Chapel floor but optional (the exit is placed independently). Enemy count is `20 + 10×difficulty`, and difficulty also picks the specials and the closet gun tiers; nothing else scales.

- The building is the run: a fixed skeleton with random blanks. 15 floors in acts of 4 with a landmark at 4, 8 and 12 and the finale at 15 (decided 2026-09-25; see "Run shape"); earlier thinking was 3 blocks of 2–3 themed floors plus a landmark, ~10 floors, 20–30 minutes. `level-ideas.txt` has the 100-floor theme list; use it as the pool (shops, maintenance, apartments, offices, gym, arcade, spa, penthouse, roof with helicopter as the end).
- Landmark floors:
  - Siege floor (generator): flip the generator, lights come on floor-wide with the existing distance delay, the stairwell door unlocks in N seconds while a horde comes. L4D crescendo event; cheaper than a boss.
  - Arena floor (Necromancer): the stairwell is inside or behind the arena and stays locked until the boss dies. The boss drops quarters, consumables and one boss-pool item (see "Bosses"). Later a second boss (Heavy as a proper tank fight).
- Scaling: enemy HP/damage/speed per floor as well as counts, and more specials.
- Floor size: smaller floors (10×10?) with more of them make a faster choice cadence and read more like a building. Playtest.
- Random room events: a rescue that triggers a wave; a store; a dark floor; a flooded floor (slow); an alarm.

### 11. Encyclopedia (S–M)

**Done 2026-09-22 (`encyclopedia/`, `menu/Encyclopedia.tsx`; `E`/`Y` from the main menu, pause menu and run summary; seen flags in `SaveData.seen`). Consumables section added 2026-09-23.**

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

**Done 2026-09-22 (`persistence/SaveData.ts`; holds unlocked characters, run history and encyclopedia seen flags).**

- One `SaveData` object in localStorage (versioned): unlocked characters, encyclopedia found flags, run history, settings. Everything that persists goes through it. Needed by 8, 9, 11, 12.

## Build briefs for the 2026-09-25 progression

Written 2026-09-25 against the code as of that day. Each brief is one branch of work: what it replaces, what's in and out, the data model and names (the decisions that are expensive to change later), defaults for every open question (numbers are first guesses, tune in playtest), and the test plan. Order and parallelism are in "Suggested order" below. Facts about the current code are stated with the file they live in; verify before relying on line-level detail.

Conventions shared by all briefs:

- Every brief re-pins `LEVEL_2_FINGERPRINT` and any other pin it changes in `tests/smoke.spec.ts` (read the new values with a throwaway `tests/tmp-*.spec.ts`, delete it after). `npm run tsc`, `npm test`, and `npm run test:characters` when character data or weapon names change.
- New persistent state goes in `SaveData` (bump `SAVE_DATA_VERSION`, migrate in `parseSaveData`). Run state goes in `RunStats`.
- Numbers live in one constants file per system (`items/prices.ts`, `weapons/guns/ammo.ts`, `run/acts.ts`), never inline.
- Randomness through `core/util/Random.ts`; anything dealt is dealt during level generation (`LevelController.generateLevel`, reseeded per level) so a seed reproduces the run.

### 15. Item model and the stairwell store (M)

The loop. Replaces the free pick with a vending machine store in every exit stairwell. Play this before building anything else.

Current: `upgrades/` (20 `Upgrade`s, `drawUpgrades`, `takeUpgrade`, `weaponOffers.ts`), `menu/UpgradeSelect.tsx` (paused modal, keyboard/gamepad/mouse, `picked` promise), `LevelController.onLevelComplete` (generate → `offerUpgrades` when `currentLevel > 1` → `startLevel` → `giveUpgrade`), `Human.upgrades`, `RunStats.upgrades`, `SaveData.seen.upgrades`, the encyclopedia's Upgrades section, `GameOverScreen`'s "Upgrades" line, and the `UPGRADE_OFFER` pin. Quarters: `PartyManager.quarters` (`addQuarters`/`spendQuarters`, events `quartersCollected`/`quartersSpent`), `QuarterDropper` at 25% per zombie, `QuarterCounter` HUD, cheat K. The exit stairwell (`levels/rooms/ExitStairwell.ts`) is 2×2 cells with the `Exit` sensor on cell (1,0), one door, a light, a floor label.

In:

- **Data model**, new folder `src/highrise/items/` (delete `upgrades/`):
  - `Item.ts`: `type ItemCategory = "equipment" | "attachment" | "boss"`; `type Rarity = "common" | "uncommon" | "rare"`; `interface Item { name; description; rarity; category; price?: number (default from rarity); maxStacks?: number (1 for almost everything; unlimited when left out); apply(human: Human): void }`. Attachments extend it in brief 17; leave the category in the union now so the encyclopedia and shelf code don't change shape later.
  - `items.ts`: `ITEMS: ReadonlyArray<Item>` (the pool), `timesTaken`, `canTake`, `giveItem(human, item)` (apply, push onto `human.items`, mark seen, `RunStats.recordItem`).
  - `equipment.ts`: the starting pool (below). `bossItems.ts`: empty list now, filled in brief 18.
  - `gunItem.ts`: `gunItem(stats: GunStats, price): Item` (the old `makeWeaponOffer`, `weapon` field kept so cards can show the pickup image). Its `apply` gives a `Gun` with a full magazine via `giveWeapon` and refunds the trade-in of the gun it replaced (below).
  - `prices.ts`: `PRICE_BY_RARITY = { common: 8, uncommon: 14, rare: 22 }`, `GUN_PRICE_BY_TIER = [0, 20, 30, 40]` (index = tier index), `TRADE_IN = 0.5` (fraction of the replaced gun's tier price, rounded down), `QUARTER_PILE = [3, 5]`.
  - `shelf.ts`: `interface Shelf { slots: (Item | null)[]; gun: Item | null }` with `slots.length === 4`; `dealShelf(human, floorNumber): Shelf`. Draws 4 different items the human `canTake`, weighted by `RARITY_WEIGHTS` (6/3/1 as now), plus, with `GUN_ON_SHELF_CHANCE = 0.5`, one gun of the floor's tier (brief 18 defines acts; until then use `LevelTemplate.getBestGunTier()`), never a gun the human holds. Called from `LevelController.generateLevel` after `makeTemplate`, and handed to the template so the stairwell can own it. Dealt with the leader's state at the start of the floor.
- **`Human.items: Item[]`** replaces `upgrades`. `RunStats.items`/`recordItem` replaces `upgrades`. `SaveData.seen.items` replaces `seen.upgrades` (bump the version, migrate by renaming the key). `RunSummary.items`. The encyclopedia's Upgrades section becomes Items: name, rarity tag, description, category, "Fits" later.
- **The machine**: `environment/StoreMachine.ts`, a static body with a sprite (reuse the vending machine texture until there's art), tag `store_machine`, an `Interactable` with prompt `{ title: "Vending machine", action: "Browse" }`, range 1.5. Placed by `ExitStairwell` on a cell that isn't the stairs cell, against a wall, with its interact range not reaching the `Exit` sensor (the player must be able to browse without finishing the floor). Holds the `Shelf`. Not in the tutorial. Every floor including floor 1.
- **The modal**: `menu/StoreScreen.tsx` + styles in `menu/menu.css`, a `ReactEntity` following `UpgradeSelect`'s pattern exactly (`persistenceLevel: Game`, `pausable = false`, `game.pause()` on add, `INPUT_DELAY`, index selection, `onKeyDown`/`onButtonDown`/stick poll, mouse hover and click, `isStoreOpen(game)` for `PauseMenu.takingInput`). Styled as the front of a vending machine: quarters count at the top, a 2×2 grid of item slots, one full-width gun row below, each slot with name, rarity color, price, description on the selected one. Keys: arrows/WASD/D-pad move, Enter/Space/A buy, Esc/E/B close. A slot you can't afford is dimmed with "not enough quarters"; an empty slot shows "SOLD OUT". Buying: `spendQuarters(price)`, the slot's card scales to 1.08 and wiggles for 0.6 s, then drops (translate down, fade), then the slot is empty; the item is applied when the drop ends and input is ignored during it. Coin sound on buy (the vending machine's), a thunk at the drop. Closing resumes the game; the machine can be reopened until the floor ends.
- **Selling**: only guns, and only as the trade-in inside a gun purchase. No sell screen.
- **Quarters**: `QUARTER_DROP_CHANCE` stays 0.25 (with 40–70 zombies a floor that's roughly 10–17 from kills). Add `environment/QuarterPile.ts`, a pickup of 3–5 quarters, and place `QUARTER_PILES_PER_FLOOR = 2` of them through `getPickups` closets (the "desks and registers" version can come with room decoration later). Target take per floor: 15–25. Cheat K stays.
- **Delete** the pick: `UpgradeSelect`, `offerUpgrades`, `drawOffer`, `giveUpgrade`; `onLevelComplete` becomes generate → `startLevel`. `LEVEL_FADE_TIME` unchanged.
- **Starting pool** (`equipment.ts`, all `maxStacks: 1` unless noted; reuses `PlayerStats` fields, adding `damageTaken = 1` and `quarterDropChance = 0` to it and reading them in `Human.inflictDamage` and `QuarterDropper`):
  - Common: Vitamins (+20 max HP, stacks 3), Quick Hands (reload ×1.3), Steady Aim (spread ×0.6), Fresh Batteries (flashlight ×1.35, stacks 2), Linebacker (push knockback ×1.4, stun ×1.3), Brass Knuckles (push damage +15), Coffee (move ×1.1, stacks 2).
  - Uncommon: Hollow Points (damage ×1.2), Hair Trigger (fire rate ×1.2), Night Eyes (vision ×1.2, stacks 2), Bloodthirsty (melee kills heal 10), Curb Stomp (crawlers die in one hit), Second Wind (heal 25 each floor), Scavenger (kills drop ammo 15%), Armored Vest (damage taken ×0.8), Coin Purse (quarter drop chance +0.15).
  - Rare: Speed Loader (empty reload is instant), Glass Cannon (damage ×1.5, max HP −30), Big Magazines (magazine ×1.5).
  - That's 19. Every card has a one-line description in the existing voice. Don't port `GrenadePack`/`FlashbangPack`/`MolotovPack`; consumables come from floor machines (brief 16).

Out: attachments and the gun row's family logic (17), two free slots (16), acts and boss rewards (18), big stores (18), rerolls, packs, selling equipment, art for the machine.

Defaults chosen: the machine is in the exit stairwell only (not the spawn room); the shelf is dealt at generation, not at browse time; quarters stay on `PartyManager`; unaffordable items stay visible; buying a gun with both slots full replaces the gun in hand (slots are still primary/secondary in this brief, so `slotFor` decides).

Tests: `UPGRADE_OFFER` becomes `STORE_SHELF` (the four names plus the gun or `null` on floor 2 with seed 12345); the smoke test's steps 18, 19 and 22 (offer → take → effect → weapon cards) become: walk to the machine, E opens it paused, buy with K-cheated quarters, the effect is visible (`stats.reloadSpeed` or similar), a refused purchase, sold-out slot, close, finish the floor; the run summary lists items; the encyclopedia shows Items with seen flags. Re-pin `LEVEL_2_FINGERPRINT` (the stairwell gains a machine and closets gain piles).

### 16. Weapon slots, ammo as a cost, floor machines, the usable slot (M)

Current: `Human.primary?: Gun` / `secondary?: Gun | MeleeWeapon` / `activeSlot`, `slotFor` (`weapons/weapons.ts`), `giveWeapon` (drops what's in the slot, gives `NEW_GUN_RESERVE_BONUS` once), `reserve: Record<LimitedAmmoClass, number>` with `getReserve` returning `Infinity` for pistols, `ammo.ts` constants (rifle 60/240, shotgun 14/48, pickup 45/12, drop 3%), `AmmoDropper`, `AmmoPickup`, `Human.consumable`/`consumableCount`/`useConsumable` (G / LB), `ConsumableStats.maxCarry`, `hud/AmmoOverlay.tsx` (∞ for pistols, a `WeaponCard` per slot, consumable card), `furniture-plus/VendingMachine.ts` (health for 3, breakable, spills quarters) placed on ~80% of nubbies by `nubbyHelpers.ts`, `SpawnRoom` starter pickups (a melee or tier 0 gun at `levelIndex > 0`, a second gun by difficulty, health), `LevelTemplate.getPickups` closets (tier 0 gun, melee, ammo, survivor, health, consumable every other floor, higher-tier guns by difficulty). Characters: `startingWeapons` (none set yet); `PartyManager` gives the leader theirs.

In:

- **Two free slots.** `Human.weapons: [Weapon | undefined, Weapon | undefined]`, `activeSlot: 0 | 1`, `weapon` getter unchanged in meaning. `giveWeapon`: into a free slot and make it active; if both are full, replace the active slot (drop the old one as a `WeaponPickup`, or trade it in when bought). `slotFor`/`WeaponSlot` go; melee is any slot. Swap stays Q / wheel / Y. `die` drops both. `setWeaponInSlot`'s "no melee in primary" check goes.
- **Starting kit**: a character's `startingWeapons`, else an M1911. Set `startingWeapons` in the character JSON so every character has one (spread: 6 pistol, 4 rifle, 3 shotgun; pick per character by personality, `npm run test:characters` checks the names). Survivors keep the closet logic.
- **Pistol ammo is finite.** `AmmoClass` all limited (`LimitedAmmoClass` and `isLimitedAmmo` go). `ammo.ts`: `STARTING_RESERVE = { pistol: 90, rifle: 0, shotgun: 0 }`, `MAX_RESERVE = { pistol: 300, rifle: 240, shotgun: 48 }`, `NEW_GUN_RESERVE_BONUS = { pistol: 30, rifle: 30, shotgun: 8 }`, `AMMO_BOX = { pistol: 30, rifle: 30, shotgun: 8 }` (what a box or a machine gives), `AMMO_PRICE = { pistol: 2, rifle: 4, shotgun: 5 }`, `AMMO_DROP_CHANCE` stays 0.03 (drops the class of the gun in hand). Guardrail to check in playtest: a floor's take (15–25) covers a floor's pistol ammo at these prices; if not, drop the pistol price to 1 or raise the box.
- **Floor machines, at most 2 per floor.** `nubbyHelpers.ts`: the first `MACHINES_PER_FLOOR = 2` nubbies (seeded shuffle) get a machine, the rest water coolers. Three machine kinds, `VendingMachine` gets a `kind: "snack" | "ammo" | "grenade"` and a texture tint per kind until there's art: snack sells a `HealthPickup` for 3 (as now); ammo sells a box for the ammo class of the gun in hand at `AMMO_PRICE[class]` (prompt "Ammo machine · 30 pistol rounds · 2 quarters"; with a melee weapon in hand, "nothing fits"); grenade sells one throwable of a fixed kind chosen at placement (frag or molotov) for 4. Kind weights 2 snack : 2 ammo : 1 grenade. Breaking still spills quarters. Machines alerting zombies stays out.
- **Throwable and usable slots.** `Human.throwable?: { stats: ConsumableStats; count }` (today's consumable, G / LB) and `Human.usable?: { stats: UsableStats; charges }` (new, key V / RB). `weapons/usables/UsableStats.ts`: `{ name, description, charges, use(human): boolean }`; `usables.ts` index with Health Pack (3 charges, heal 40 over 2 s, 1 s use time) and Stim Pack (2 charges, 8 s of move ×1.3 and damage taken ×0.6, via a timed modifier on `PlayerStats`; add `Human.applyTimedStats(partial, seconds)`). Picking up a different usable drops the current one (`UsablePickup`). Both show in `AmmoOverlay`'s inventory row. Encyclopedia: Consumables section lists both kinds.
- **Closets and spawn room**: `getPickups` loses every gun (guns are bought), keeps melee, health, ammo, survivor, consumable; add a usable pickup every third floor. `SpawnRoom` loses its guns; keeps health at difficulty > 1. `getBestGunTier` stays for the shelf until brief 18.
- **HUD**: reserve counts for every class (no ∞), the two weapon cards identical in kind, the usable card.

Out: attachments (17), boss consumable drops (18), sprint (19), "restriction" items like Bloodlust (20).

Defaults chosen: melee weapons take a slot and don't use ammo; there is no way to hold three weapons; the ammo machine reads the gun in hand rather than offering a menu; pistol reserve shows in the HUD like the others; allies unchanged (they never buy).

Tests: the smoke test's step 9 (two slots) becomes free slots (pick up a rifle with a pistol held → slot 2, pick up a third → replaces the active one); step 10 reload from reserve now includes pistols; step 15 covers all three machine kinds (find by `kind`); ammo machine refuses with melee in hand; usable use heals; consumable steps unchanged. `npm run test:characters` for the JSON. Re-pin the fingerprint (nubby contents change).

### 17. Gun families, tiers, attachments (M)

Current: family is `GunStats.ammoClass` (`PISTOLS`/`RIFLES`/`SHOTGUNS` lists in `gun-stats/gunStats.ts`), `GUN_TIERS` has 4 pistols at tier 0 and one gun at tier 2; 11 guns (M1911, Glock, S&W Revolver, Five Seven, Desert Eagle, AR-15, Sawn Off, Remington, AK-47, SPAS12, P90). `PlayerStats.magazineSize`/`incendiaryRounds` are stat-level stand-ins for attachments; `GunStats.laserSightColor` draws a `LaserSight`. `Gun.getCapacity(shooter)`, `Gun.makeProjectile` (`bulletsPerShot`, spread), `Bullet.ts` (damage × `stats.damage`), `Enemy.ts` bullet hit (incendiary check), `Human.push` (push damage). `weaponOffers.ts` is gone (brief 15).

In:

- **Family = `ammoClass`.** No new field. `gunFamilyName(class)` for cards ("pistols", "rifles", "shotguns").
- **Re-bucket `GUN_TIERS`** to one gun per family per tier for the shelf, plus the starting pistols:
  - Tier 0 (starting kit only, never on a shelf): M1911, Glock.
  - Tier 1 (act 2): Five Seven, AR-15, Sawn Off.
  - Tier 2 (act 3): S&W Revolver, P90, Remington.
  - Tier 3 (act 4): Desert Eagle, AK-47, SPAS12.
  - Retune the moved guns so the ladder holds (Revolver and Five Seven damage/capacity up a notch; first guesses in their files). `getGunTier`/`gunTierOf` unchanged. The encyclopedia tag stays "Tier N".
- **Attachments** (`items/attachments.ts`): `interface Attachment extends Item { category: "attachment"; slot: "magazine" | "ammo" | "rail"; fits: AmmoClass[]; modify?(stats: GunStats): Partial<GunStats> }`. Owned in `Human.attachments: Attachment[]`, at most one per (family, slot): buying a second for the same family and slot replaces it (the shelf never offers a duplicate pair). `Human.attachmentsFor(gun): Attachment[]` returns the ones whose `fits` includes the gun's class; `Gun` reads its effective stats through `gun.effectiveStats(shooter)` = `stats` overlaid with each attachment's `modify` (capacity, spread, fire rate, `laserSightColor`, `bulletStats`), cached per gun and invalidated when `attachments` changes. Rule attachments read `human.attachmentsFor(weapon)` at use time (a bayonet in `push`, ammo types in `Bullet`/`Enemy`). Remove `PlayerStats.magazineSize` and `incendiaryRounds` (they become attachments; Big Magazines from brief 15 becomes the Extended Magazine attachment).
- **Starting attachments** (prices by rarity; "Fits" on the card and in the encyclopedia):
  - Magazine: Extended Magazine (capacity ×1.5, fits all; one per family so it's three items: Extended Pistol Mag, Rifle Drum, Shell Tube), common.
  - Ammo: Hollow Points moves here (damage ×1.2, fits all, one per family), uncommon; Incendiary Rounds (the existing flag, fits rifles and pistols), rare; Dragon's Breath (incendiary, shotguns), rare; Armor Piercing (bullets pass through the first enemy, rifles and pistols), uncommon; Exploding Rounds (a small `Detonation`, 30 damage in 1 m, on every 4th hit, rifles), rare.
  - Rail: Laser Sight (sets `laserSightColor`, spread ×0.7, fits all), common; Bayonet (push damage +25 while that gun is in hand, rifles and shotguns), uncommon; Choke (spread ×0.5, shotguns), uncommon; Compensator (recoil ×0.5, fire rate ×1.1, pistols), uncommon.
- **Family-dependent equipment** (`equipment.ts`, the items that make a dealt gun a build): Buckshot Bounce (pellets ricochet once off walls; shotguns), Last Round (the last round in a magazine does ×3 damage), Quick Draw (pistol kills refund the shot), Marksman (rifle bullets do +30% beyond 8 m). All uncommon.
- **The shelf leans toward your families.** `dealShelf`: an attachment or family item for a family the human holds has weight ×1, one for a family they don't hold ×0.25. The gun row: one gun of the act's tier, family random among the two the human doesn't hold in that slot's sense (never a gun already held). Gun cards say which of your attachments fit ("2 of your attachments fit").
- **Trade-in** finishes: buying a gun with both slots full sells the active one back at `TRADE_IN` of its tier price. Attachments stay with the human, not the gun.

Out: attachment management UI, combining/evolutions, melee mods, art per attachment (cards are text plus the gun's family icon).

Defaults chosen: one attachment per family and slot (no stacking); attachments are never lost; Extended Magazine is three family items rather than one universal one so the shelf's lean means something; `Bullet` gets an `attachments` list at fire time rather than reading the human.

Tests: attachments modify capacity (`getCapacity` with Extended Rifle Drum); a fits-check (a shotgun choke does nothing for a rifle); the shelf never offers a held gun or a duplicate pair; trade-in adds quarters; encyclopedia "Fits" text. Re-pin `STORE_SHELF`.

### 18. Run shape: acts, landmarks, keycard floors, boss rewards, big stores (M–L)

Current: `run/RunPlan.ts` fixes 4 floors (Shops, Maintenance, Generator, Chapel), difficulty = floor + 1, no randomness; `generateRunPlan` runs in the lobby after `reseedIfSeeded(1000)`. `LevelController.maxLevel = plan.length`; victory when `currentLevel > maxLevel`. Templates: `ShopLevel`, `MaintenanceLevel` (dark), `GeneratorLevel` (no generator entity; a plain floor), `ChapelLevel` (`NecromancerArena`, exit placed independently), base `LevelTemplate` ("Offices"), `BathroomLevel` (test), `TutorialLevel`. Enemies `20 + 10 × difficulty` (75/25 zombie/crawler), +5 sprinters at difficulty > 1, spitters and a heavy from 3 and 4. Locked rooms every floor (ARMORY: gun + consumable; SUPPLY: 2 health + ammo), one keycard at ≥ (w+h)/3 from spawn, pinned as 1 keycard / 2 locks. Necromancer (2000 HP) dies through `BaseEnemy.die` with nothing boss-specific. `FloorDirectory` lists the plan with notes.

In:

- **`run/acts.ts`**: `FLOORS = 15`, `ACT_LENGTH = 4`, `actOf(floor)` (1–4, floors 13–15 are act 4), `gunTierForAct = [0, 1, 2, 3]` (index = act − 1; act 1 shelves have no gun row), `LANDMARK_FLOORS = [4, 8, 12]`, `FINAL_FLOOR = 15`, `KEYCARD_FLOOR_IN_ACT` chosen per act at plan time (one of the act's non-landmark floors), `BIG_STORE_FLOORS = [5, 9, 13]`.
- **`generateRunPlan`**: 15 `FloorPlan`s. Filler floors draw a theme from the pool `[ShopLevel, MaintenanceLevel, LevelTemplate (Offices)]` with no theme twice in a row; landmarks: 4 → `GeneratorLevel` (a siege floor once the siege event exists; until then it's the generator theme with the note "Landmark"), 8 → `ChapelLevel` (Necromancer), 12 → `GeneratorLevel`, 15 → `ChapelLevel` (final boss; a Heavy fight and the roof come later). `FloorPlan` gains `act`, `landmark: "boss" | "siege" | null`, `keycard: boolean`, `bigStore: boolean`, `gunTier`. Notes on the directory: "Boss", "Dark", "Store" for big-store floors; keycards and shelves are not shown.
- **Difficulty**: `difficulty = floor number`. `generateEnemies`: `ENEMY_BASE = 24`, `ENEMY_PER_FLOOR = 4` (24–84, capped by locations), sprinters from floor 2 (`2 + floor`), spitters from 5, heavies from 8 (`floor − 7`), and per-act enemy HP × `[1, 1.15, 1.3, 1.5]` and damage × `[1, 1.1, 1.25, 1.4]` through a `difficultyScale(act)` read by `BaseEnemy` at spawn. First guesses; the goal is that act 1 plays like today's floors 1–2.
- **Keycards once per act**: `getLockedRooms` returns rooms only when `floor.keycard`; ARMORY = an `AmmoPickup` of each class plus an `ItemPickup` of a random attachment (`environment/ItemPickup.ts`, new: an `Interactable` that `giveItem`s and destroys itself, with the item's name as its prompt); INFIRMARY replaces SUPPLY = 2 `HealthPickup`s plus a Health Pack usable. The keycard pin becomes per-floor.
- **Boss rewards**: `bossDied { boss }` event dispatched from `Necromancer.die` (override, then `super.die`). `controllers/BossRewards.ts` listens: spills `BOSS_QUARTERS = 40` quarters in a ring, drops 2 throwable pickups and 1 usable pickup, and one `ItemPickup` from `bossItems.ts`. Boss pool (all rare, `category: "boss"`, no downsides, never on a shelf): Night Vision (a dim wide `PointLight` child on the leader, radius 12, and vision ×1.2), Heavy Wallet (quarter drops ×2), Second Heart (once per run, death becomes 50 HP and 2 s of invulnerability), Adrenal Gland (Stim effect for 6 s at the start of every floor), Akimbo placeholder (brief 20; until then not in the list). The arena's doors stay open; the stairwell placement is unchanged (the run's exit isn't gated on the boss yet; gating is part of the siege/arena work later).
- **Big stores**: on `bigStore` floors the stairwell machine has 8 item slots (4×2) and the gun row, and its gun is guaranteed. The room version (a `Shop` template with a shopkeeper machine) stays out.
- **Directory**: 15 rows plus the lobby; long lists scroll. Row notes as above.
- **Victory**: after floor 15's stairwell, `gameOver { victory: true }` as now.

Out: the siege event (generator, floor-wide lights, timed door, horde), the Heavy boss, the roof finale, room events, the store room.

Defaults chosen: filler themes are drawn with no repeats in a row and no guarantee of variety beyond that; the keycard floor is random within the act; big stores are the floor after each landmark; boss loot is dropped in the world rather than shown as a screen; Necromancer difficulty per act is the enemy scaling only.

Tests: plan length 15, act and tier per floor, one keycard floor per act (the 1/2 pins move to that floor), boss death spills quarters and one boss item (kill the Necromancer with a cheat: add `Shift+L` = kill every enemy), big store slot count, directory rows for 15 floors. The smoke test's floor-by-floor expectations (plan names, directory regexes) are rewritten around seed 12345's new plan. Re-pin the fingerprint.

### 19. Sprint (S)

Current: `Human` speed 5 m/s (3 hurt) × `stats.moveSpeed` through `WalkSpring`; `PlayerHumanController` binds WASD/stick, Shift unused, gamepad LT/L3/RB/D-pad unused in play.

In:

- Hold Shift / LT to sprint: `walkSpring.speed × SPRINT_MULTIPLIER = 1.6`, only while moving. While sprinting: `useWeapon` and `reload` do nothing (a reload in progress is cancelled when sprinting starts), push still works, the flashlight stays on, turn rate unchanged. `Human.sprinting` flag read by the walk code and the gun code; `PlayerStats.sprintSpeed = 1` multiplier and `canShootWhileSprinting = false` flag for items.
- No stamina. The cost is not shooting.
- Footstep sound rate follows speed if footsteps exist; otherwise nothing.
- Items (`equipment.ts`): Tennis Shoes (sprint ×1.25, common), Hip Fire (shoot while sprinting, rare). Coffee stays as walk speed.
- Allies never sprint. The tutorial's WASD hint mentions Shift.

Out: dodge/dash, sprint animation.

Defaults chosen: LT on gamepad (L3 is the alternative if LT feels wrong with RT firing); sprinting cancels reloads.

Tests: a sprinting human moves faster over a fixed interval; firing while sprinting does nothing; reload cancelled.

### 20. Items, second wave (L, split as needed)

The expensive items, each its own branch after 15–19:

- **Akimbo** (boss pool): two pistols in one slot fire together on one trigger, draw 2 rounds, 1 reload for both, two sprites; needs `Gun` to support a paired gun and the HUD to show it. Only pistols. The other slot stays free.
- **Bloodlust** (shop, rare, restriction): when taken, drops every gun and refuses gun pickups and purchases (the gun row shows "not with Bloodlust"), melee kills heal 20 and melee damage ×1.3. `Human.canHoldGuns()` gate in `giveWeapon` and `gunItem`.
- **Fire wave**: Incendiary Grenade already exists as the Molotov; Dragon's Breath and Incendiary Rounds ship in 17. What's left is `notes/fire.md`'s look and level fires.
- **Galoshes**: acid puddles don't exist; build with the first acid floor.
- **Investment**: a Rare Stamp that costs 10 and sells for 25 three floors later needs a sell button on the store screen; add the button only for items that declare `sellPrice(floorsHeld)`.
- **Rerolls and packs** stay deferred until the store has been played.

## Suggested order

Features 1–14 (done, in the order they were built): stats, pick-three and stairwells; ammo and slots; quarters, keycards, consumables; persistence, survivors, lobby; encyclopedia and summary.

The 2026-09-25 briefs, each playable on its own:

1. Item model and the stairwell store (15). Alone, first: everything hangs off it. Playtest the loop before going on.
2. Then in parallel on disjoint files: slots, ammo and floor machines (16: `Human`, `ammo.ts`, `AmmoOverlay`, nubbies, closets) and run shape (18: `RunPlan`, `acts.ts`, templates' enemy counts, `Necromancer`, directory). Both touch `LevelTemplate.getPickups`/`getLockedRooms`; 18 merges second and takes the conflict.
3. Gun families and attachments (17), after 16 (it needs free slots and finite pistol ammo).
4. Sprint (19), after 16 (both edit `Human` and `PlayerHumanController`).
5. Second-wave items (20), one branch each, any order.

## Open questions

- Can the player retreat into the arrival stairwell (panic room), or is it one-way too?
- Should any "start at floor N" unlock exist, or is the directory purely a preview?
- Floor size and count.
- Starting-character traits: stats only, or one rule-like trait each?
- The 2026-09-25 progression section has its own open list (ammo numbers, consumable limits, the stat-pick fallback, big store floors).

## Leftovers

Small things noticed while building the features, plus what was still relevant in the old `simon-random-todos.txt` (folded in here 2026-09-23):

- Many zombies playing the same sound at once stack into one loud sound.
- The human collision shape doesn't match the sprite.
- The baseball bat uses a sword sound.
- Light switches are drawn in the wrong place in rotated rooms (fixing it changes `LEVEL_2_FINGERPRINT`).
- Grenades vanish when their carrier dies instead of dropping.
- Survivor relief lines wait in game time, so they play late after a pause.
- The `glowStick1-3` images are unused (feature 13).
- Ammo vending machines and stores (feature 5).
- Gun attachments and molotovs/pipe bombs (see "Items" and feature 7).
- Sprint on Shift, no shooting while sprinting (see "Sprint").
