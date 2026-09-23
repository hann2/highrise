import { rUniform } from "../../core/util/Random";
import type Human from "../human/Human";
import { markSeen } from "../persistence/SaveData";
import {
  Bloodthirsty,
  CurbStomp,
  SecondWind,
  SpeedLoader,
} from "./ruleUpgrades";
import {
  ExtendedMags,
  FreshBatteries,
  GlassCannon,
  HairTrigger,
  HollowPoints,
  Linebacker,
  NightEyes,
  QuickHands,
  RunningShoes,
  SteadyAim,
  Vitamins,
} from "./statUpgrades";
import { RARITY_WEIGHTS, Upgrade } from "./Upgrade";

// Every upgrade that can be offered
export const UPGRADES: ReadonlyArray<Upgrade> = [
  RunningShoes,
  Vitamins,
  QuickHands,
  SteadyAim,
  Linebacker,
  FreshBatteries,
  HollowPoints,
  HairTrigger,
  ExtendedMags,
  NightEyes,
  GlassCannon,
  Bloodthirsty,
  SpeedLoader,
  CurbStomp,
  SecondWind,
];

/** Whether `human` can take `upgrade` (again) */
export function canTake(human: Human, upgrade: Upgrade): boolean {
  const taken = human.upgrades.filter((u) => u === upgrade).length;
  return taken < (upgrade.maxStacks ?? Infinity);
}

/** Picks `count` different upgrades that `human` can take, rarer ones less often */
export function drawUpgrades(human: Human, count: number = 3): Upgrade[] {
  const pool = UPGRADES.filter((upgrade) => canTake(human, upgrade));
  const drawn: Upgrade[] = [];
  while (drawn.length < count && pool.length > 0) {
    const total = pool.reduce((sum, u) => sum + RARITY_WEIGHTS[u.rarity], 0);
    let roll = rUniform(0, total);
    let index = 0;
    while (
      index < pool.length - 1 &&
      roll >= RARITY_WEIGHTS[pool[index].rarity]
    ) {
      roll -= RARITY_WEIGHTS[pool[index].rarity];
      index++;
    }
    drawn.push(...pool.splice(index, 1));
  }
  return drawn;
}

/** Gives `upgrade` to `human` for the rest of the run */
export function takeUpgrade(human: Human, upgrade: Upgrade) {
  upgrade.apply(human);
  human.upgrades.push(upgrade);
  markSeen("upgrades", upgrade.name);
}
