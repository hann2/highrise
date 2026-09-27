import type Human from "../human/Human";
import { markSeen } from "../persistence/SaveData";
import { getRunStats } from "../run/RunStats";
import { ATTACHMENTS } from "./attachments";
import {
  Bloodthirsty,
  BuckshotBounce,
  CurbStomp,
  FreshBatteries,
  GlassCannon,
  HairTrigger,
  HipFire,
  LastRound,
  Linebacker,
  Marksman,
  NightEyes,
  QuickDraw,
  QuickHands,
  RunningShoes,
  Scavenger,
  SecondWind,
  SpeedLoader,
  SteadyAim,
  TennisShoes,
  Vitamins,
} from "./equipment";
import { Item } from "./Item";

// Every item that can be dealt onto a shelf: equipment and gun attachments.
// Guns and consumables aren't here; they're made up per shelf (`gunItem.ts`,
// `consumableItem.ts`). Boss items are in `bossItems.ts`.
export const ITEMS: ReadonlyArray<Item> = [
  RunningShoes,
  Vitamins,
  QuickHands,
  SteadyAim,
  Linebacker,
  FreshBatteries,
  HairTrigger,
  NightEyes,
  GlassCannon,
  TennisShoes,
  Bloodthirsty,
  SpeedLoader,
  CurbStomp,
  SecondWind,
  Scavenger,
  HipFire,
  BuckshotBounce,
  LastRound,
  QuickDraw,
  Marksman,
  ...ATTACHMENTS,
];

/** How many times `human` has taken `item` */
export function timesTaken(human: Human, item: Item): number {
  return human.items.filter((i) => i === item).length;
}

/** Whether `human` can take `item` (again) */
export function canTake(human: Human, item: Item): boolean {
  return timesTaken(human, item) < (item.maxStacks ?? Infinity);
}

/**
 * Gives `item` to `human` for the rest of the run, and keeps score of it. A
 * consumable is used up rather than kept, so it isn't one of their items.
 */
export function giveItem(human: Human, item: Item) {
  item.apply(human);
  markItemSeen(item);
  if (!item.consumable) {
    human.items.push(item);
    getRunStats(human.game)?.recordItem(item.name);
  }
}

/**
 * Records a dealt or bought item for the encyclopedia. A gun or a consumable
 * counts as seeing that weapon; they aren't items the encyclopedia lists.
 */
export function markItemSeen(item: Item) {
  if (item.weapon) {
    markSeen("guns", item.weapon.name);
  } else if (item.consumable) {
    markSeen("consumables", item.consumable.name);
  } else {
    markSeen("items", item.name);
  }
}
