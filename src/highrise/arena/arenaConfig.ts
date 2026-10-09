import { V2d } from "../../core/Vector";
import Crawler from "../enemies/crawler/Crawler";
import { BaseEnemy } from "../enemies/base/Enemy";
import Heavy from "../enemies/heavy/Heavy";
import Necromancer from "../enemies/necromancer/Necromancer";
import Spitter from "../enemies/spitter/Spitter";
import Sprinter from "../enemies/sprinter/Sprinter";
import Zombie from "../enemies/zombie/Zombie";
import { ACT_COUNT } from "../run/acts";
import { DEFAULT_BULLET_SLOWDOWN } from "../weapons/guns/GunStats";
import {
  bySlug,
  formatCount,
  Loadout,
  LOADOUT_PARAMS,
  loadoutQueryParts,
  otherQueryParts,
  parseCounts,
  parseLoadout,
} from "./loadout";

export { ARENA_ITEMS, slug, startingSlots } from "./loadout";

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

/** How a wave comes in */
export type Arrival = "together" | "trickle" | "surround" | "spread";
export const ARRIVALS: ReadonlyArray<Arrival> = [
  "together",
  "trickle",
  "surround",
  "spread",
];

/** The shape of the arena (see `arenaLayouts.ts`) */
export type LayoutName =
  "open" | "pillars" | "corridor" | "hall" | "offices" | "sprawl";
export const LAYOUT_NAMES: ReadonlyArray<LayoutName> = [
  "open",
  "pillars",
  "corridor",
  "hall",
  "offices",
  "sprawl",
];

/** Everything about an arena setup. It all goes in the URL (see `arenaConfigToQuery`). */
export interface ArenaConfig extends Loadout {
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
  /** A door in each of the layout's doorways */
  doors: boolean;
  /** Pools of fire spread over the room that never go out, for stress tests */
  fires: number;
  /** How many times slower than real bullets are (see `bulletSpeed`) */
  bulletSlowdown: number;
}

/**
 * Reads the setup from the URL. Names are matched by `slug`, and anything that
 * isn't given (or isn't recognized) gets a default:
 *
 * `?scene=arena&char=chad&weapons=spas12,glock&items=buckshotbounce*2,choke
 * &throwable=molotov*3&usable=stimpack&act=3&wave=zombie*12,heavy*2
 * &arrival=surround&layout=offices&god&infammo&fog&dummies&dark&doors&fires=8&slowdown=4`
 */
export function parseArenaConfig(params: URLSearchParams): ArenaConfig {
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
  const slowdown = parseInt(params.get("slowdown") ?? "", 10);
  const arrival = params.get("arrival") as Arrival;
  const layout = params.get("layout") as LayoutName;

  return {
    ...parseLoadout(params),
    act: isNaN(act) ? 1 : Math.min(Math.max(act, 1), ACT_COUNT),
    wave,
    arrival: ARRIVALS.includes(arrival) ? arrival : "together",
    layout: LAYOUT_NAMES.includes(layout) ? layout : "open",
    god: params.has("god"),
    infiniteAmmo: params.has("infammo"),
    fog: params.has("fog"),
    dummies: params.has("dummies"),
    dark: params.has("dark"),
    doors: params.has("doors"),
    fires: isNaN(fires) ? 0 : Math.max(fires, 0),
    bulletSlowdown: isNaN(slowdown)
      ? DEFAULT_BULLET_SLOWDOWN
      : Math.max(slowdown, 1),
  };
}

/** The query string for a setup, starting with `?scene=arena` (see `parseArenaConfig`) */
export function arenaConfigToQuery(config: ArenaConfig): string {
  const parts: string[] = ["scene=arena", ...loadoutQueryParts(config)];
  parts.push(`act=${config.act}`);
  const wave = Object.entries(config.wave)
    .filter(([, n]) => n > 0)
    .map(([name, n]) => formatCount(name, n));
  parts.push(`wave=${wave.join(",")}`);
  parts.push(`arrival=${config.arrival}`, `layout=${config.layout}`);
  if (config.fires > 0) {
    parts.push(`fires=${config.fires}`);
  }
  if (config.bulletSlowdown !== DEFAULT_BULLET_SLOWDOWN) {
    parts.push(`slowdown=${config.bulletSlowdown}`);
  }
  const flags: [boolean, string][] = [
    [config.god, "god"],
    [config.infiniteAmmo, "infammo"],
    [config.fog, "fog"],
    [config.dummies, "dummies"],
    [config.dark, "dark"],
    [config.doors, "doors"],
  ];
  for (const [on, flag] of flags) {
    if (on) {
      parts.push(flag);
    }
  }

  // Keep anything that isn't the arena's, like ?seed
  parts.push(
    ...otherQueryParts([
      "scene",
      ...LOADOUT_PARAMS,
      "act",
      "wave",
      "arrival",
      "layout",
      "fires",
      "slowdown",
      ...flags.map(([, flag]) => flag),
    ]),
  );
  return "?" + parts.join("&");
}
