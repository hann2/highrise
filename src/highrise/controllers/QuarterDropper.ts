import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { rBool } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import { BaseEnemy } from "../enemies/base/Enemy";
import Quarter from "../environment/Quarter";

/** Chance that an enemy drops a quarter when it dies */
export const QUARTER_DROP_CHANCE = 0.25;

/** Makes dead enemies drop quarters. */
export default class QuarterDropper extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;

  @on("zombieDied")
  async onZombieDied({ zombie }: { zombie: BaseEnemy }) {
    if (rBool(QUARTER_DROP_CHANCE)) {
      const position = zombie.getPosition().clone();
      // Melee kills happen in the middle of a physics step, which is no time
      // to be adding bodies
      await this.wait();
      this.dropQuarter(position);
    }
  }

  dropQuarter(position: V2d) {
    return this.game.addEntity(new Quarter(position));
  }
}
