import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { rBool } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { getNearestVisibleEnemy, testLineOfSight } from "../utils/visionUtils";
import Gun from "../weapons/guns/Gun";
import Human from "./Human";

const FOLLOW_DISTANCE = 2; // meters
const MAX_SHOOT_DISTANCE = 10; // meters
// Controller for a human that is in the party
export default class AllyHumanController extends BaseEntity implements Entity {
  tags = ["ally_controller"];

  lastSeenPositionOfLeader?: V2d;

  constructor(
    public human: Human,
    public getLeader: () => Human,
    public enabled: boolean = true
  ) {
    super();
  }

  onTick() {
    // If our human dies/gets removed, we shouldn't be here anymore
    if (!this.human.game) {
      this.destroy();
      return;
    }

    if (!this.enabled) {
      return;
    }

    const nearestVisibleZombie = getNearestVisibleEnemy(
      this.game!,
      this.human,
      MAX_SHOOT_DISTANCE
    );

    const weapon = this.human.weapon;
    if (weapon instanceof Gun && weapon.ammo === 0 && !weapon.isReloading) {
      this.human.reload();
    }

    if (nearestVisibleZombie) {
      const direction = nearestVisibleZombie
        .getPosition()
        .isub(this.human.getPosition()).angle;

      this.human.setDirection(direction);

      if (weapon instanceof Gun) {
        if (weapon.canShoot() && rBool(0.1)) {
          this.human.useWeapon();
        }
      } else {
        this.human.useWeapon();
      }
    } else if (this.leader) {
      if (testLineOfSight(this.human, this.leader)) {
        this.lastSeenPositionOfLeader = this.leader.getPosition();
        const direction = this.lastSeenPositionOfLeader.sub(
          this.human.getPosition()
        );
        this.human.setDirection(direction.angle);
        const distance = direction.magnitude;
        if (distance > FOLLOW_DISTANCE) {
          this.human.walk(direction.inormalize());
        }
      } else if (this.lastSeenPositionOfLeader) {
        const direction = this.lastSeenPositionOfLeader.sub(
          this.human.getPosition()
        );
        this.human.walk(direction.inormalize());
      }
    }
  }

  get leader() {
    return this.getLeader();
  }
}

export function isAllyController(e: Entity): e is AllyHumanController {
  return e instanceof AllyHumanController;
}
