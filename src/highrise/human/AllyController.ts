import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { rBool, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import { getNearestVisibleEnemy, testLineOfSight } from "../utils/visionUtils";
import Gun from "../weapons/guns/Gun";
import { FireMode } from "../weapons/guns/GunStats";
import Human, { PUSH_RANGE } from "./Human";

const FOLLOW_DISTANCE = 2; // meters
const MAX_SHOOT_DISTANCE = 10; // meters

// Controller for a human that is in the party
export default class AllyHumanController extends BaseEntity implements Entity {
  tags = ["ally_controller"];
  persistenceLevel = Persistence.Game;

  triggerOnCooldown: boolean = false;
  lastSeenPositionOfLeader?: V2d;

  constructor(public human: Human, public getLeader: () => Human) {
    super();
  }

  onTick() {
    // If our human dies/gets removed, we shouldn't be here anymore
    if (!this.human.game) {
      this.destroy();
      return;
    }

    if (this.human === this.leader) {
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
      const displacement = nearestVisibleZombie
        .getPosition()
        .isub(this.human.getPosition());
      const direction = displacement.angle;
      const distance = displacement.magnitude;

      this.human.setDirection(direction);

      if (distance < PUSH_RANGE && this.human.canPush()) {
        this.human.push();
      }

      if (weapon instanceof Gun) {
        if (weapon.canShoot() && !this.triggerOnCooldown) {
          this.human.useWeapon();
          if (weapon.stats.fireMode != FireMode.FULL_AUTO || rBool(1 / 6)) {
            this.triggerOnCooldown = true;
            this.wait(rUniform(0.25, 0.5)).then(() => {
              this.triggerOnCooldown = false;
            });
          }
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
