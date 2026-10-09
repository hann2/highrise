import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { polarToVec } from "../../core/util/MathUtil";
import { choose, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import ConsumablePickup from "../environment/ConsumablePickup";
import ItemPickup from "../environment/ItemPickup";
import { getPartyLeader } from "../environment/PartyManager";
import Quarter from "../environment/Quarter";
import UsablePickup from "../environment/UsablePickup";
import { BOSS_ITEMS } from "../items/bossItems";
import { canTake } from "../items/items";
import { CONSUMABLES } from "../weapons/consumables/consumable-stats/consumableStats";
import { USABLES } from "../weapons/usables/usables";

/** Quarters a boss leaves, in a ring where it fell */
export const BOSS_QUARTERS = 40;
/** Throwables and usables it leaves */
const BOSS_THROWABLES = 2;
const BOSS_USABLES = 1;

/**
 * Bosses are always good news: winning a boss level (`bossLevelWon`, from
 * `boss-levels/BossFight`) leaves a heap of quarters, some throwables and a
 * usable, and one item from the boss pool (`bossItems.ts`) that the leader
 * doesn't have yet, all on the floor.
 */
export default class BossRewards extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;

  @on("bossLevelWon")
  async onBossLevelWon({ position }: { position: V2d }) {
    // Bosses can die in the middle of a physics step (a melee kill), which is
    // no time to be adding bodies
    await this.wait();

    for (let i = 0; i < BOSS_QUARTERS; i++) {
      const angle = (i / BOSS_QUARTERS) * Math.PI * 2;
      const at = position.add(polarToVec(angle, rUniform(0.8, 1.6)));
      this.game.addEntity(new Quarter(at, i % 8 === 0));
    }

    // The rest spread around the middle of the ring
    const makers: ((at: V2d) => Entity)[] = [];
    for (let i = 0; i < BOSS_THROWABLES; i++) {
      const stats = choose(...CONSUMABLES);
      makers.push((at) => new ConsumablePickup(at, stats));
    }
    for (let i = 0; i < BOSS_USABLES; i++) {
      const stats = choose(...USABLES);
      makers.push((at) => new UsablePickup(at, stats));
    }
    const leader = getPartyLeader(this.game);
    const items = BOSS_ITEMS.filter((item) => !leader || canTake(leader, item));
    if (items.length > 0) {
      const item = choose(...items);
      makers.push((at) => new ItemPickup(at, item));
    }
    makers.forEach((make, i) => {
      const angle = (i / makers.length) * Math.PI * 2;
      this.game.addEntity(make(position.add(polarToVec(angle, 0.45))));
    });
  }
}
