import { V2d } from "../../core/Vector";
import { Character, CHARACTERS } from "../characters/Character";
import Crawler from "../enemies/crawler/Crawler";
import { BaseEnemy } from "../enemies/base/Enemy";
import Heavy from "../enemies/heavy/Heavy";
import Necromancer from "../enemies/necromancer/Necromancer";
import Spitter from "../enemies/spitter/Spitter";
import Sprinter from "../enemies/sprinter/Sprinter";
import Zombie from "../enemies/zombie/Zombie";
import { BOSS_ITEMS } from "../items/bossItems";
import { Item } from "../items/Item";
import { ITEMS } from "../items/items";
import { loadSaveData } from "../persistence/SaveData";
import { ACT_COUNT } from "../run/acts";
import { CONSUMABLES } from "../weapons/consumables/consumable-stats/consumableStats";
import { ConsumableStats } from "../weapons/consumables/ConsumableStats";
import { USABLES } from "../weapons/usables/usables";
import { UsableStats } from "../weapons/usables/UsableStats";
import { WEAPONS } from "../weapons/weapons";
import { WeaponStats } from "../weapons/WeaponStats";

/** What the arena can send at the player */
export interface ArenaEnemyType {
  name: string;
  /** `room` is the arena's size, for enemies that move around a room of their own */
  make(position: V2d, room: V2d): BaseEnemy;
}

export const ARENA_ENEMIES: ReadonlyArray<ArenaEnemyType> = [
  { name: "Zombie", make: (at) => new Zombie(at) },
  { name: "Crawler", make: (at) => new Crawler(at) },
  { name: "Sprinter", make: (at) => new Sprinter(at) },
  { name: "Heavy", make: (at) => new Heavy(at) },
  { name: "Spitter", make: (at) => new Spitter(at) },
  {
    name: "Necromancer",
    make: (at, room) => new Necromancer(at, at.mul(0), room),
  },
];

/** Every item the arena can hand out: the store's, and the bosses' */
export const ARENA_ITEMS: ReadonlyArray<Item> = [...ITEMS, ...BOSS_ITEMS];

/** How a wave comes in */
export type Arrival = "together" | "trickle" | "surround" | "spread";
export const ARRIVALS: ReadonlyArray<Arrival> = [
  "together",
  "trickle",
  "surround",
  "spread",
];

/** The shape of the arena (see `arenaLayouts.ts`) */
export type LayoutName = "open" | "pillars" | "corridor" | "hall";
export const LAYOUT_NAMES: ReadonlyArray<LayoutName> = [
  "open",
  "pillars",
  "corridor",
  "hall",
];

/** Everything about an arena setup. It all goes in the URL (see `arenaConfigToQuery`). */
export interface ArenaConfig {
  character: Character;
  /** The two weapon slots */
  weapons: [WeaponStats | undefined, WeaponStats | undefined];
  /** Items in the order they're taken; one entry per stack */
  items: Item[];
  throwable?: ConsumableStats;
  throwableCount: number;
  usable?: UsableStats;
  /** 1 to `ACT_COUNT`: how tough enemies are */
  act: number;
  /** How many of each enemy a wave has, by `ArenaEnemyType.name` */
  wave: Record<string, number>;
  arrival: Arrival;
  layout: LayoutName;
  /** The player can't die */
  god: boolean;
  /** Reserve ammo, throwables and usable charges never run out (magazines still need reloading) */
  infiniteAmmo: boolean;
  /** Fog of war, as in a run */
  fog: boolean;
  /** Enemies stand still and don't attack */
  dummies: boolean;
  /** As dark as a floor, rather than brightly lit */
  dark: boolean;
  /** Pools of fire spread over the room that never go out, for stress tests */
  fires: number;
}

/** Lower case with only letters and digits, for names in the URL: "Dragon's Breath" is "dragonsbreath" */
export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function bySlug<T extends { name: string }>(
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
function parseCounts(value: string | null): [string, number][] {
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

function formatCount(name: string, count: number): string {
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
 * Reads the setup from the URL. Names are matched by `slug`, and anything that
 * isn't given (or isn't recognized) gets a default:
 *
 * `?scene=arena&char=chad&weapons=spas12,glock&items=buckshotbounce*2,choke
 * &throwable=molotov*3&usable=stimpack&act=3&wave=zombie*12,heavy*2
 * &arrival=surround&layout=pillars&god&infammo&fog&dummies&dark&fires=8`
 */
export function parseArenaConfig(params: URLSearchParams): ArenaConfig {
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

  const wave: Record<string, number> = {};
  for (const [name, count] of parseCounts(params.get("wave"))) {
    const type = bySlug(ARENA_ENEMIES, name);
    if (type) {
      wave[type.name] = (wave[type.name] ?? 0) + count;
    }
  }
  if (!params.has("wave")) {
    wave["Zombie"] = 8;
  }

  const act = parseInt(params.get("act") ?? "1", 10);
  const fires = parseInt(params.get("fires") ?? "0", 10);
  const arrival = params.get("arrival") as Arrival;
  const layout = params.get("layout") as LayoutName;

  return {
    character,
    weapons,
    items,
    throwable,
    throwableCount: throwable ? throwableCount : 0,
    usable: bySlug(USABLES, params.get("usable")),
    act: isNaN(act) ? 1 : Math.min(Math.max(act, 1), ACT_COUNT),
    wave,
    arrival: ARRIVALS.includes(arrival) ? arrival : "together",
    layout: LAYOUT_NAMES.includes(layout) ? layout : "open",
    god: params.has("god"),
    infiniteAmmo: params.has("infammo"),
    fog: params.has("fog"),
    dummies: params.has("dummies"),
    dark: params.has("dark"),
    fires: isNaN(fires) ? 0 : Math.max(fires, 0),
  };
}

/** The query string for a setup, starting with `?scene=arena` (see `parseArenaConfig`) */
export function arenaConfigToQuery(config: ArenaConfig): string {
  const parts: string[] = [
    "scene=arena",
    `char=${slug(config.character.name)}`,
  ];
  parts.push(
    `weapons=${config.weapons.map((w) => (w ? slug(w.name) : "")).join(",")}`,
  );

  const itemCounts = new Map<Item, number>();
  for (const item of config.items) {
    itemCounts.set(item, (itemCounts.get(item) ?? 0) + 1);
  }
  if (itemCounts.size > 0) {
    const items = [...itemCounts].map(([item, n]) => formatCount(item.name, n));
    parts.push(`items=${items.join(",")}`);
  }
  if (config.throwable && config.throwableCount > 0) {
    parts.push(
      `throwable=${formatCount(config.throwable.name, config.throwableCount)}`,
    );
  }
  if (config.usable) {
    parts.push(`usable=${slug(config.usable.name)}`);
  }
  parts.push(`act=${config.act}`);
  const wave = Object.entries(config.wave)
    .filter(([, n]) => n > 0)
    .map(([name, n]) => formatCount(name, n));
  parts.push(`wave=${wave.join(",")}`);
  parts.push(`arrival=${config.arrival}`, `layout=${config.layout}`);
  if (config.fires > 0) {
    parts.push(`fires=${config.fires}`);
  }
  const flags: [boolean, string][] = [
    [config.god, "god"],
    [config.infiniteAmmo, "infammo"],
    [config.fog, "fog"],
    [config.dummies, "dummies"],
    [config.dark, "dark"],
  ];
  for (const [on, flag] of flags) {
    if (on) {
      parts.push(flag);
    }
  }

  // Keep anything that isn't the arena's, like ?seed
  const own = new Set([
    "scene",
    "char",
    "weapons",
    "items",
    "throwable",
    "usable",
    "act",
    "wave",
    "arrival",
    "layout",
    "fires",
    ...flags.map(([, flag]) => flag),
  ]);
  for (const [key, value] of new URLSearchParams(window.location.search)) {
    if (!own.has(key)) {
      parts.push(value ? `${key}=${encodeURIComponent(value)}` : key);
    }
  }
  return "?" + parts.join("&");
}
