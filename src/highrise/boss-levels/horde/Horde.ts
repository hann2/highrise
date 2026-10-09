import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { on } from "../../../core/entity/handler";
import { lerp, polarToVec } from "../../../core/util/MathUtil";
import { choose, rBool, rDirection, rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { BaseEnemy } from "../../enemies/base/Enemy";
import Crawler from "../../enemies/crawler/Crawler";
import Sprinter from "../../enemies/sprinter/Sprinter";
import Zombie from "../../enemies/zombie/Zombie";
import { getPartyLeader } from "../../environment/PartyManager";
import { getBossFight } from "../BossFight";
import { SurviveGoal } from "../BossGoal";

/** Seconds between zombies at the start of the fight, and at the end */
const START_INTERVAL = 1.3;
const END_INTERVAL = 0.35;
/** No more than this many of the horde at once */
const MAX_ALIVE = 30;
/** They don't come in closer than this to the leader (meters) */
const MIN_DISTANCE = 6;
/** How many come in at once, now and then */
const BURST = 4;
const BURST_CHANCE = 0.15;

/**
 * Zombies pouring in at `spots` for as long as the fight lasts, faster and
 * nastier as its time runs out (more sprinters toward the end). They stop
 * coming once it's won; the ones already in stay.
 */
export default class Horde extends BaseEntity implements Entity {
  tickLayer = "enemies" as const;
  private untilNext = 0;
  private alive: BaseEnemy[] = [];

  constructor(
    private spots: V2d[],
    private goal: SurviveGoal,
  ) {
    super();
  }

  /** How far through the fight it is, 0 to 1 */
  get progress(): number {
    return 1 - this.goal.timeLeft / this.goal.seconds;
  }

  @on("tick")
  onTick(dt: number) {
    const fight = getBossFight(this.game);
    if (!fight?.started || fight.won) {
      return;
    }
    this.untilNext -= dt;
    if (this.untilNext > 0) {
      return;
    }
    this.untilNext += lerp(START_INTERVAL, END_INTERVAL, this.progress);
    const count = rBool(BURST_CHANCE) ? BURST : 1;
    for (let i = 0; i < count; i++) {
      this.spawn();
    }
  }

  private spawn() {
    this.alive = this.alive.filter((enemy) => !enemy.isDestroyed);
    if (this.alive.length >= MAX_ALIVE) {
      return;
    }
    const leader = getPartyLeader(this.game)?.getPosition();
    const spots = this.spots.filter(
      (spot) => !leader || spot.distanceTo(leader) >= MIN_DISTANCE,
    );
    if (spots.length === 0) {
      return;
    }
    const at = choose(...spots).add(polarToVec(rDirection(), rUniform(0, 0.3)));
    const roll = rUniform(0, 1);
    const sprinters = lerp(0.05, 0.35, this.progress);
    const enemy =
      roll < sprinters
        ? new Sprinter(at)
        : roll < sprinters + 0.15
          ? new Crawler(at)
          : new Zombie(at);
    if (leader) {
      enemy.body.angle = leader.sub(at).angle;
    }
    this.alive.push(this.game.addEntity(enemy));
  }
}
