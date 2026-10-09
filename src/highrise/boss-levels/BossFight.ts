import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { PositionalSound } from "../../core/sound/PositionalSound";
import type ArrivalRoom from "../environment/ArrivalRoom";
import Stairwell from "../environment/Stairwell";
import BossBar from "../hud/BossBar";
import { BossGoal } from "./BossGoal";

/**
 * The fight on a boss level, whatever it is: every boss level puts one in.
 * The stairwell stays barred until the level's goal is met; the fight starts
 * when the leader leaves the arrival room, and the bar (`BossBar`) shows how
 * it's going from then. Winning unbars the stairwell and dispatches
 * `bossLevelWon`, which drops the loot.
 */
export default class BossFight extends BaseEntity implements Entity {
  tags = ["boss_fight"];
  /** The leader has left the arrival room */
  started = false;
  won = false;
  /** Seconds since it started */
  time = 0;
  /** Seconds since it was won */
  timeSinceWon = 0;

  constructor(
    /** What the bar calls it: the boss's name, or what the fight is */
    readonly title: string,
    readonly goal: BossGoal,
  ) {
    super();
    this.addChild(new BossBar(this));
  }

  @on("tick")
  onTick(dt: number) {
    if (this.won) {
      this.timeSinceWon += dt;
      return;
    }
    for (const stairwell of this.game.entities.getByConstructor(Stairwell)) {
      stairwell.barred = true;
    }
    if (!this.started) {
      const arrivalRoom = this.game.entities.getTagged("arrival_room")[0] as
        ArrivalRoom | undefined;
      this.started = !arrivalRoom || arrivalRoom.sealed;
    }
    if (this.started) {
      this.time += dt;
    }
    if (this.goal.update(dt, this.started)) {
      this.win();
    }
  }

  /** Done: the stairwell opens and the loot drops */
  win() {
    if (this.won) {
      return;
    }
    this.won = true;
    for (const stairwell of this.game.entities.getByConstructor(Stairwell)) {
      stairwell.barred = false;
      const door = stairwell.door;
      if (door) {
        this.game.addEntity(
          new PositionalSound("heavySwitchThrow", door.getDoorwayCenter()),
        );
      }
    }
    this.game.dispatch("bossLevelWon", {
      position: this.goal.rewardPosition().clone(),
    });
  }
}

/** The current floor's fight, if it's a boss level */
export function getBossFight(game: Game): BossFight | undefined {
  return game.entities.getTagged("boss_fight")[0] as BossFight | undefined;
}
