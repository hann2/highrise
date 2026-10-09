import { choose, rInteger } from "../../core/util/Random";
import { dealBossLevel } from "../boss-levels/bossLevels";
import GeneratorLevel from "../levels/level-templates/GeneratorLevel";
import LevelTemplate from "../levels/level-templates/LevelTemplate";
import MaintenanceLevel from "../levels/level-templates/MaintenanceLevel";
import ShopLevel from "../levels/level-templates/ShopLevel";
import {
  actOf,
  ACT_LENGTH,
  BIG_STORE_FLOORS,
  BOSS_FLOORS,
  BossTier,
  FLOORS,
  GUN_TIER_FOR_ACT,
} from "./acts";

/** A level template class, with the name and notes it shows on the directory */
export interface LevelTemplateClass {
  new (levelIndex: number, difficulty: number): LevelTemplate;
  readonly floorName: string;
  readonly floorNotes: readonly string[];
}

/** One floor of the run, as planned before it starts */
export interface FloorPlan {
  /** The floor number, which is also the level number (1 is the first floor of the run) */
  readonly number: number;
  /** Which act of the run it's in, 1 to 4 (see `acts.ts`) */
  readonly act: number;
  /** Made fresh for the floor when it's reached, after reseeding */
  readonly template: LevelTemplateClass;
  /** How hard the floor is (see `LevelTemplate.difficulty`): its number */
  readonly difficulty: number;
  /** What the directory calls it */
  readonly name: string;
  /** Short notes for the directory, like "Boss" */
  readonly notes: readonly string[];
  /**
   * A boss floor's tier, which pool its boss level was dealt from (its
   * `template` is a `BossLevel`); null on the others
   */
  readonly boss: BossTier | null;
  /** Has the act's keycard and its locked rooms */
  readonly keycard: boolean;
  /** The arrival room's store has more on its shelves */
  readonly bigStore: boolean;
  /** The gun tier (index into `GUN_TIERS`) its store deals from, and the one above */
  readonly gunTier: number;
}

/** The floors of a run, bottom to top. The run is over when the last one is done. */
export type RunPlan = readonly FloorPlan[];

/** Themes for the floors between the bosses */
const FILLER_TEMPLATES: readonly LevelTemplateClass[] = [
  ShopLevel,
  MaintenanceLevel,
  GeneratorLevel,
  LevelTemplate,
];

/**
 * Plans the building for a run. Made when the player arrives in the lobby.
 * Any randomness here goes through `core/util/Random` (the lobby reseeds
 * right before calling this).
 */
export function generateRunPlan(): RunPlan {
  // One keycard floor per act, on one of its floors that isn't a boss's
  const keycardFloors = new Set<number>();
  for (let act = 1; act <= actOf(FLOORS); act++) {
    const first = (act - 1) * ACT_LENGTH + 1;
    const last = act === actOf(FLOORS) ? FLOORS : act * ACT_LENGTH;
    const candidates: number[] = [];
    for (let floor = first; floor <= last; floor++) {
      if (!(floor in BOSS_FLOORS)) {
        candidates.push(floor);
      }
    }
    keycardFloors.add(candidates[rInteger(0, candidates.length)]);
  }

  const plan: FloorPlan[] = [];
  let lastTheme: LevelTemplateClass | undefined;
  for (let number = 1; number <= FLOORS; number++) {
    const act = actOf(number);
    const boss: BossTier | undefined = BOSS_FLOORS[number];
    // Filler themes never repeat back to back
    const template: LevelTemplateClass = boss
      ? dealBossLevel(boss)
      : choose(...FILLER_TEMPLATES.filter((theme) => theme !== lastTheme));
    lastTheme = template;
    const bigStore = BIG_STORE_FLOORS.includes(number);
    const notes = [...template.floorNotes];
    if (bigStore) {
      notes.push("Store");
    }
    plan.push({
      number,
      act,
      template,
      difficulty: number,
      name: template.floorName,
      notes,
      boss: boss ?? null,
      keycard: keycardFloors.has(number),
      bigStore,
      gunTier: GUN_TIER_FOR_ACT[act - 1],
    });
  }
  return plan;
}
