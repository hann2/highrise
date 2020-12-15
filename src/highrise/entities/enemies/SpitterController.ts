import { Ray, RaycastResult, vec2 } from "p2";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import CustomWorld from "../../../core/physics/CustomWorld";
import { choose, rBool, rNormal } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { ZOMBIE_RADIUS } from "../../constants";
import { CollisionGroups } from "../../physics/CollisionGroups";
import { CARDINAL_DIRECTIONS_VALUES } from "../../utils/directions";
import { testLineOfSight } from "../../utils/visionUtils";
import Human, { isHuman } from "../human/Human";
import Spitter, { SPITTER_ATTACK_RANGE } from "./Spitter";

const NORMAL_SPEED = 1.0;
const SHAMBLE_SPEED = 0.2;

export default class SpitterController extends BaseEntity implements Entity {
  target?: Human;
  moveTarget?: V2d;
  objective?: "SHAMBLE" | "CLOSE_IN" | "SEARCH" | "ATTACK";

  constructor(public zombie: Spitter) {
    super();
  }

  onTick(dt: number) {
    switch (this.objective) {
      case "ATTACK":
        if (this.targetInAttackRange() && this.targetInVision()) {
          if (this.target!.isDestroyed) {
            this.objective = "SEARCH";
          } else {
            this.zombie.setDirection(
              this.target!.getPosition().isub(this.zombie.body.position).angle
            );
            this.zombie.attack();
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
    const direction = human.getPosition().sub(this.zombie.body.position);
    return direction.magnitude < SPITTER_ATTACK_RANGE;
  }

  targetInVision(): boolean {
    return !!this.target && testLineOfSight(this.zombie, this.target);
  }

  inVision(human: Human): boolean {
    return testLineOfSight(this.zombie, human);
  }

  atMoveTarget() {
    return (
      !!this.moveTarget &&
      this.zombie.getPosition().sub(this.moveTarget).magnitude <
        1.2 * ZOMBIE_RADIUS
    );
  }

  shamble() {
    const shamblingDirection: V2d = choose(...CARDINAL_DIRECTIONS_VALUES);

    const ray = new Ray({
      mode: Ray.CLOSEST,
      from: this.zombie.getPosition(),
      to: this.zombie.getPosition().add(shamblingDirection.mul(100)),
      skipBackfaces: true,
      collisionMask: CollisionGroups.World,
    });
    const result = new RaycastResult();
    (this.game!.world as CustomWorld).raycast(result, ray, true);
    const out = vec2.create();
    result.getHitPoint(out, ray);

    this.moveTarget = V(out[0], out[1]);
    this.objective = "SHAMBLE";
  }

  moveTowardsTarget(speed: number = 1) {
    if (!this.moveTarget) {
      return;
    }
    const direction = this.moveTarget.sub(this.zombie.body.position);
    direction.magnitude = speed;
    this.zombie.setDirection(direction.angle);
    this.zombie.walk(direction);
  }

  // Searches the map for the nearest human in range that is visible
  // This is slow, so be careful
  anyoneInVision(maxDistance: number = 15): Human | undefined {
    const humans = [...this.game!.entities.getByFilter(isHuman)];

    let nearestVisibleHuman: Human | undefined;
    let nearestDistance: number = maxDistance;

    for (const human of humans) {
      const distance = vec2.dist(
        human.body.position,
        this.zombie.body.position
      );
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
