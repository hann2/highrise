import { CollisionGroups } from "../../../config/CollisionGroups";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { on } from "../../../core/entity/handler";
import { choose, rBool, rNormal } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import Human, { isHuman } from "../../human/Human";
import { CARDINAL_DIRECTIONS_VALUES } from "../../utils/directions";
import { testLineOfSight } from "../../utils/visionUtils";
import { BaseEnemy } from "./Enemy";

const NORMAL_SPEED = 1.0;
const SHAMBLE_SPEED = 0.2;

export default class SimpleEnemyController
  extends BaseEntity
  implements Entity
{
  target?: Human;
  moveTarget?: V2d;
  objective?: "SHAMBLE" | "CLOSE_IN" | "SEARCH" | "ATTACK";

  constructor(
    public enemy: BaseEnemy,
    private attackRange: number,
    private bodySize: number,
  ) {
    super();
  }

  @on("tick")
  onTick(dt: number) {
    switch (this.objective) {
      case "ATTACK":
        if (this.targetInAttackRange()) {
          if (this.target!.isDestroyed) {
            this.objective = "SEARCH";
          } else {
            this.enemy.attack();
          }
        } else if (this.targetInVision()) {
          this.moveTarget = this.target!.getPosition();
          this.objective = "CLOSE_IN";
        } else {
          this.objective = "SEARCH";
        }
        break;
      case "SEARCH":
        // May be too aggressive to check vision every tick while in SEARCH
        const newTarget = this.anyoneInVision();
        if (newTarget) {
          this.enemy.voice.speak("targetAquired");
          this.objective = "CLOSE_IN";
          this.target = newTarget;
          this.moveTarget = newTarget.getPosition();
        } else if (this.atMoveTarget()) {
          this.shamble();
        } else {
          this.moveTowardsTarget(rNormal(NORMAL_SPEED, 0.5));
        }
        break;
      case "CLOSE_IN":
        if (this.targetInAttackRange()) {
          this.objective = "ATTACK";
        } else if (!this.targetInVision()) {
          this.objective = "SEARCH";
        } else {
          this.moveTarget = this.target!.getPosition();
          this.moveTowardsTarget(rNormal(NORMAL_SPEED, 0.5));
        }
        break;
      case "SHAMBLE":
        let guyInVision;
        if (rBool(2 * dt) && (guyInVision = this.anyoneInVision())) {
          this.target = guyInVision;
          this.moveTarget = guyInVision.getPosition();
          this.objective = "CLOSE_IN";
        } else if (this.atMoveTarget()) {
          this.shamble();
        } else {
          this.moveTowardsTarget(rNormal(SHAMBLE_SPEED, 0.1));
        }
        break;
      default:
        this.shamble();
    }
  }

  targetInAttackRange(): boolean {
    return !!this.target && this.inAttackRange(this.target);
  }

  inAttackRange(human: Human): boolean {
    return (
      human.getPosition().distanceTo(this.enemy.body.position) <
      this.attackRange
    );
  }

  targetInVision(): boolean {
    return !!this.target && testLineOfSight(this.enemy, this.target);
  }

  inVision(human: Human): boolean {
    return testLineOfSight(this.enemy, human);
  }

  atMoveTarget() {
    return (
      !!this.moveTarget &&
      this.enemy.getPosition().distanceTo(this.moveTarget) < 1.2 * this.bodySize
    );
  }

  shamble() {
    const shamblingDirection: V2d = choose(...CARDINAL_DIRECTIONS_VALUES);

    // Walk until we hit a wall
    const from = this.enemy.getPosition();
    const to = from.add(shamblingDirection.mul(100));
    const hit = this.game!.world.raycast(from, to, {
      skipBackfaces: true,
      collisionMask: CollisionGroups.Walls,
    });

    this.moveTarget = hit?.point ?? to;
    this.objective = "SHAMBLE";

    if (rBool(0.01)) {
      this.enemy.voice.speak("idle");
    }
  }

  moveTowardsTarget(speed: number = 1) {
    if (!this.moveTarget) {
      return;
    }
    const direction = this.moveTarget.sub(this.enemy.body.position);
    this.enemy.setTargetDirection(direction.angle);
    this.enemy.walkSpring.walkTowards(direction.angle, speed);
  }

  // Searches the map for the nearest human in range that is visible
  // This is slow, so be careful
  anyoneInVision(maxDistance: number = 15): Human | undefined {
    let nearestVisibleHuman: Human | undefined;
    let nearestDistance: number = maxDistance;

    for (const human of this.game!.entities.getByFilter(isHuman)) {
      const distance = human.body.position.distanceTo(this.enemy.body.position);
      if (distance < nearestDistance) {
        if (this.inVision(human)) {
          nearestDistance = distance;
          nearestVisibleHuman = human;
        }
      }
    }

    return nearestVisibleHuman;
  }
}
