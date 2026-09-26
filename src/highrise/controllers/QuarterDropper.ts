import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { polarToVec } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import { BaseEnemy } from "../enemies/base/Enemy";
import { getPartyLeader } from "../environment/PartyManager";
import Quarter from "../environment/Quarter";

/** Makes dead enemies drop the quarters they were given at generation. */
export default class QuarterDropper extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;

  @on("zombieDied")
  async onZombieDied({ zombie }: { zombie: BaseEnemy }) {
    const leader = getPartyLeader(this.game);
    const count = Math.round(
      zombie.quarters * (leader?.stats.quarterMultiplier ?? 1),
    );
    if (count > 0) {
      const position = zombie.getPosition().clone();
      // Melee kills happen in the middle of a physics step, which is no time
      // to be adding bodies
      await this.wait();
      for (let i = 0; i < count; i++) {
        // More than one spread around where it fell
        const offset =
          count > 1 ? polarToVec((i / count) * Math.PI * 2, 0.25) : V(0, 0);
        this.dropQuarter(position.add(offset), i === 0);
      }
    }
  }

  dropQuarter(position: V2d, playDropSound = true) {
    return this.game.addEntity(new Quarter(position, playDropSound));
  }
}
