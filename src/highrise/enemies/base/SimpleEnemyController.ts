import { Ray, RaycastResult, vec2 } from "p2";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import CustomWorld from "../../../core/physics/CustomWorld";
import { choose, rBool, rNormal } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../config/CollisionGroups";
import Human, { isHuman } from "../../human/Human";
import { CARDINAL_DIRECTIONS_VALUES } from "../../utils/directions";
import { testLineOfSight } from "../../utils/visionUtils";
import { BaseEnemy } from "./Enemy";

const NORMAL_SPEED = 1.0;
const SHAMBLE_SPEED = 0.2;

export default class SimpleEnemyController
  extends BaseEntity
  implements Entity {
  target?: Human;
  moveTarget?: V2d;
  objective?: "SHAMBLE" | "CLOSE_IN" | "SEARCH" | "ATTACK";

  constructor(
    public enemy: BaseEnemy,
    private attackRange: number,
    private bodySize: number
  ) {
    super();
  }

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

  anyoneInAttackRange(): Human | undefined {
    const humans = [...this.game!.entities.getByFilter(isHuman)];
    for (const human of humans) {
      if (this.inAttackRange(human)) {
        return human;
      }
    }
  }

  targetInAttackRange(): boolean {
    return !!this.target && this.inAttackRange(this.target);
  }

  inAttackRange(human: Human): boolean {
    const direction = human.getPosition().sub(this.enemy.body.position);
    return direction.magnitude < this.attackRange;
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
      this.enemy.getPosition().sub(this.moveTarget).magnitude <
        1.2 * this.bodySize
    );
  }

  shamble() {
    const shamblingDirection: V2d = choose(...CARDINAL_DIRECTIONS_VALUES);

    const ray = new Ray({
      mode: Ray.CLOSEST,
      from: this.enemy.getPosition(),
      to: this.enemy.getPosition().add(shamblingDirection.mul(100)),
      skipBackfaces: true,
      collisionMask: CollisionGroups.Walls,
    });
    const result = new RaycastResult();
    (this.game!.world as CustomWorld).raycast(result, ray, true);
    const out = vec2.create();
    result.getHitPoint(out, ray);

    this.moveTarget = V(out[0], out[1]);
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
    const humans = [...this.game!.entities.getByFilter(isHuman)];

    let nearestVisibleHuman: Human | undefined;
    let nearestDistance: number = maxDistance;

    for (const human of humans) {
      const distance = vec2.dist(human.body.position, this.enemy.body.position);
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
