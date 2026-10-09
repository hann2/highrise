import { Character, CHARACTERS } from "../characters/Character";
import Human from "../human/Human";
import { BOSS_ITEMS } from "../items/bossItems";
import { Item } from "../items/Item";
import { ITEMS } from "../items/items";
import { loadSaveData } from "../persistence/SaveData";
import { CONSUMABLES } from "../weapons/consumables/consumable-stats/consumableStats";
import { ConsumableStats } from "../weapons/consumables/ConsumableStats";
import { AMMO_CLASSES, MAX_RESERVE } from "../weapons/guns/ammo";
import Gun from "../weapons/guns/Gun";
import MeleeWeapon from "../weapons/melee/MeleeWeapon";
import { USABLES } from "../weapons/usables/usables";
import { UsableStats } from "../weapons/usables/UsableStats";
import { WEAPONS } from "../weapons/weapons";
import { WeaponStats } from "../weapons/WeaponStats";

// Who the player is and what they carry in the test scenes (the arena and the
// boss test scene), read from and written to the URL the same way in both

/** Every item a test scene can hand out: the store's, and the bosses' */
export const ARENA_ITEMS: ReadonlyArray<Item> = [...ITEMS, ...BOSS_ITEMS];

export interface Loadout {
  character: Character;
  /** The two weapon slots */
  weapons: [WeaponStats | undefined, WeaponStats | undefined];
  /** Items in the order they're taken; one entry per stack */
  items: Item[];
  throwable?: ConsumableStats;
  throwableCount: number;
  usable?: UsableStats;
}

/** The URL parameters a loadout uses */
export const LOADOUT_PARAMS: readonly string[] = [
  "char",
  "weapons",
  "items",
  "throwable",
  "usable",
];

/** Lower case with only letters and digits, for names in the URL: "Dragon's Breath" is "dragonsbreath" */
export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function bySlug<T extends { name: string }>(
  list: ReadonlyArray<T>,
  name: string | null | undefined,
): T | undefined {
  if (!name) {
    return undefined;
  }
  const wanted = slug(name);
  return list.find((thing) => slug(thing.name) === wanted);
}

/** "a*2,b" into [["a", 2], ["b", 1]] */
export function parseCounts(value: string | null): [string, number][] {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .filter((part) => part.length > 0)
    .map((part) => {
      const [name, count] = part.split("*");
      const n = count == undefined ? 1 : parseInt(count, 10);
      return [name, isNaN(n) ? 1 : n];
    });
}

export function formatCount(name: string, count: number): string {
  return count === 1 ? slug(name) : `${slug(name)}*${count}`;
}

function defaultCharacter(): Character {
  const last = loadSaveData().lastCharacter;
  return CHARACTERS.find((c) => c.name === last) ?? CHARACTERS[0];
}

/** A character's starting weapons, in the two slots */
export function startingSlots(
  character: Character,
): [WeaponStats | undefined, WeaponStats | undefined] {
  const [first, second] = character.startingWeapons;
  return [first, second];
}

/**
 * Reads a loadout from the URL; anything not given (or not recognized) gets a
 * default, and the weapons default to the character's own:
 * `char=chad&weapons=spas12,glock&items=buckshotbounce*2,choke&throwable=molotov*3&usable=stimpack`
 */
export function parseLoadout(params: URLSearchParams): Loadout {
  const character =
    bySlug(CHARACTERS, params.get("char")) ?? defaultCharacter();

  let weapons = startingSlots(character);
  if (params.has("weapons")) {
    const names = (params.get("weapons") ?? "").split(",");
    weapons = [bySlug(WEAPONS, names[0]), bySlug(WEAPONS, names[1])];
  }

  const items: Item[] = [];
  for (const [name, count] of parseCounts(params.get("items"))) {
    const item = bySlug(ARENA_ITEMS, name);
    for (let i = 0; item && i < count; i++) {
      items.push(item);
    }
  }

  const [throwableName, throwableCount] = parseCounts(
    params.get("throwable"),
  )[0] ?? [undefined, 0];
  const throwable = bySlug(CONSUMABLES, throwableName);

  return {
    character,
    weapons,
    items,
    throwable,
    throwableCount: throwable ? throwableCount : 0,
    usable: bySlug(USABLES, params.get("usable")),
  };
}

/** A loadout as URL parameters (see `parseLoadout`) */
export function loadoutQueryParts(loadout: Loadout): string[] {
  const parts: string[] = [`char=${slug(loadout.character.name)}`];
  parts.push(
    `weapons=${loadout.weapons.map((w) => (w ? slug(w.name) : "")).join(",")}`,
  );

  const itemCounts = new Map<Item, number>();
  for (const item of loadout.items) {
    itemCounts.set(item, (itemCounts.get(item) ?? 0) + 1);
  }
  if (itemCounts.size > 0) {
    const items = [...itemCounts].map(([item, n]) => formatCount(item.name, n));
    parts.push(`items=${items.join(",")}`);
  }
  if (loadout.throwable && loadout.throwableCount > 0) {
    parts.push(
      `throwable=${formatCount(loadout.throwable.name, loadout.throwableCount)}`,
    );
  }
  if (loadout.usable) {
    parts.push(`usable=${slug(loadout.usable.name)}`);
  }
  return parts;
}

/** The parameters in the page's URL that aren't in `own`, like ?seed, to keep when rewriting it */
export function otherQueryParts(own: Iterable<string>): string[] {
  const owned = new Set(own);
  const parts: string[] = [];
  for (const [key, value] of new URLSearchParams(window.location.search)) {
    if (!owned.has(key)) {
      parts.push(value ? `${key}=${encodeURIComponent(value)}` : key);
    }
  }
  return parts;
}

export function makeWeapon(stats: WeaponStats): Gun | MeleeWeapon {
  return "ammoClass" in stats ? new Gun(stats) : new MeleeWeapon(stats);
}

/**
 * Gives a fresh human the loadout's weapons (the first in hand), items,
 * throwables and usable. Items are applied directly rather than with
 * `giveItem`, so nothing is marked seen or saved.
 */
export function equipLoadout(human: Human, loadout: Loadout) {
  for (const stats of loadout.weapons) {
    if (stats) {
      human.giveWeapon(makeWeapon(stats), false);
    }
  }
  human.activeSlot = 0;
  human.refreshWeaponSprite();
  for (const item of loadout.items) {
    item.apply(human);
    human.items.push(item);
  }
  if (loadout.throwable && loadout.throwableCount > 0) {
    human.giveConsumable(loadout.throwable, loadout.throwableCount);
  }
  if (loadout.usable) {
    human.giveUsable(loadout.usable);
  }
}

/** Reserve ammo, the loadout's throwables and usable charges back up */
export function refillLoadout(human: Human, loadout: Loadout) {
  for (const ammoClass of AMMO_CLASSES) {
    human.reserve[ammoClass] = MAX_RESERVE[ammoClass];
  }
  const { throwable, throwableCount } = loadout;
  if (throwable && human.consumableCount < throwableCount) {
    human.giveConsumable(throwable, throwableCount - human.consumableCount);
  }
  if (human.usable) {
    human.usable.charges = human.usable.stats.charges;
  }
}

/** A copy that can be edited without changing `loadout` */
export function copyLoadout<T extends Loadout>(loadout: T): T {
  return {
    ...loadout,
    weapons: [...loadout.weapons],
    items: [...loadout.items],
  };
}
