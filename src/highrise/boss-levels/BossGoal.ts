import { V2d } from "../../core/Vector";
import { BaseEnemy } from "../enemies/base/Enemy";

/** What the boss bar shows */
export interface BossReadout {
  /** How full the bar is, 0 to 1 */
  fraction: number;
  /** Under the bar, if anything (a time left, a count) */
  text?: string;
}

/**
 * What a boss level asks of the player, which `BossFight` checks every tick:
 * kill the boss, survive so long, kill so many. A boss level makes its own.
 */
export interface BossGoal {
  /**
   * Brings it up to date, and says whether it's done. `started` is whether
   * the fight's begun (the leader is out of the arrival room); a timer only
   * counts once it has.
   */
  update(dt: number, started: boolean): boolean;
  readout(): BossReadout;
  /** Where the loot goes once it's done */
  rewardPosition(): V2d;
}

/**
 * Done when every one of `bosses` is dead. The bar is how much health they
 * have left between them, and the loot goes where the last one fell.
 */
export function killBosses(bosses: BaseEnemy[]): BossGoal {
  // Their health as they came in, once they're in the game (their act's
  // scaling is applied when they're added)
  const startingHp = new Map<BaseEnemy, number>();
  let lastPosition = bosses[0].getPosition().clone();

  return {
    update() {
      for (const boss of bosses) {
        if (!boss.isDestroyed) {
          startingHp.set(boss, Math.max(startingHp.get(boss) ?? 0, boss.hp));
          lastPosition = boss.getPosition().clone();
        }
      }
      return bosses.every((boss) => boss.isDestroyed);
    },

    readout() {
      let hp = 0;
      let total = 0;
      for (const boss of bosses) {
        const start = startingHp.get(boss) ?? boss.hp;
        total += start;
        hp += boss.isDestroyed ? 0 : Math.max(0, boss.hp);
      }
      return { fraction: total > 0 ? hp / total : 0 };
    },

    rewardPosition() {
      return lastPosition;
    },
  };
}
