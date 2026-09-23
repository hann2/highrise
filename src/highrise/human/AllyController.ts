import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { clamp } from "../../core/util/MathUtil";
import { rBool, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import Stairwell from "../environment/Stairwell";
import { getNearestVisibleEnemy, testLineOfSight } from "../utils/visionUtils";
import Gun from "../weapons/guns/Gun";
import { FireMode, ReloadingStyle } from "../weapons/guns/GunStats";
import Human, { PUSH_RANGE } from "./Human";

const FOLLOW_DISTANCE = 1.5; // meters
const MAX_SHOOT_DISTANCE = 6; // meters

const MIN_TRIGGER_COOLDOWN = 0.0;
const MAX_TRIGGER_COOLDOWN = 0.4;
const AVG_BURST_AMOUNT = 6;

// Getting into the exit stairwell after the leader: from this close to its
// doorway, line up in front of it (within this far of its middle), then walk
// this far through it
const STAIRWELL_APPROACH_DISTANCE = 5; // meters
const STAIRWELL_DOORWAY_ALIGNMENT = 0.3; // meters
const STAIRWELL_ENTRY_DEPTH = 0.9; // meters

/**
 * Controller for a survivor who has joined the party. They follow the leader
 * and fight, but never pick anything up: once their gun is empty and won't
 * reload they just tag along and push away whatever gets close. They're only
 * with the party for the rest of the floor (see `PartyManager`).
 */
export default class AllyHumanController extends BaseEntity implements Entity {
  triggerOnCooldown: boolean = false;
  lastSeenPositionOfLeader?: V2d;
  /** Where they're headed once they've made it out, if they have */
  private exitPosition?: V2d;

  constructor(
    public human: Human,
    public getLeader: () => Human,
  ) {
    super();
  }

  /** Stops fighting and following, and heads for `position` (the stairs) */
  leaveVia(position: V2d) {
    this.exitPosition = position.clone();
  }

  @on("tick")
  onTick(dt: number) {
    const human = this.human;
    // If our human dies/gets removed, we shouldn't be here anymore
    if (!human.isAdded) {
      this.destroy();
      return;
    }

    if (this.exitPosition) {
      const direction = this.exitPosition.sub(human.getPosition());
      human.setDirection(direction.angle, dt);
      human.walkSpring.walkTowards(
        direction.angle,
        clamp(direction.magnitude, 0, 1),
      );
      return;
    }

    const leader = this.getLeader();
    if (human === leader) {
      return;
    }

    const weapon = human.weapon;
    const nearestVisibleZombie = getNearestVisibleEnemy(
      this.game,
      human,
      MAX_SHOOT_DISTANCE,
    );

    if (
      weapon instanceof Gun &&
      !weapon.isReloading &&
      (weapon.ammo === 0 ||
        (weapon.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL &&
          weapon.ammo < weapon.getCapacity(human) &&
          !nearestVisibleZombie))
    ) {
      human.reload();
    }
    // A gun that's empty and didn't start reloading is out of ammo for good
    const outOfAmmo =
      weapon instanceof Gun && weapon.ammo === 0 && !weapon.isReloading;
    const canAttack = weapon !== undefined && !outOfAmmo;

    let target: V2d | undefined;
    if (nearestVisibleZombie) {
      const displacement = nearestVisibleZombie
        .getPosition()
        .isub(human.getPosition());
      const distance = displacement.magnitude;
      // Without anything to attack with, only turn to face what's close enough to push
      if (canAttack || distance < PUSH_RANGE * 1.5) {
        target = displacement;
      }
    }

    if (target) {
      const direction = target.angle;
      const distance = target.magnitude;

      human.setDirection(direction, dt);

      if (distance < PUSH_RANGE && human.canPush()) {
        human.push();
      }

      if (weapon instanceof Gun) {
        if (weapon.canShoot() && !this.triggerOnCooldown) {
          human.useWeapon();
          if (
            weapon.stats.fireMode != FireMode.FULL_AUTO ||
            rBool(1 / AVG_BURST_AMOUNT)
          ) {
            this.triggerOnCooldown = true;
            this.wait(
              rUniform(MIN_TRIGGER_COOLDOWN, MAX_TRIGGER_COOLDOWN),
            ).then(() => {
              this.triggerOnCooldown = false;
            });
          }
        }
      } else if (weapon) {
        human.useWeapon();
      }
    }

    // Someone with a working weapon holds their ground to fight; someone
    // without one keeps up with the leader
    if (target && canAttack) {
      human.walkSpring.stop();
      return;
    }
    this.follow(leader, dt, !target);
  }

  private follow(leader: Human, dt: number, faceLeader: boolean) {
    const human = this.human;
    if (leader.isDestroyed) {
      human.walkSpring.stop();
      return;
    }
    const doorwayWaypoint = this.getStairwellWaypoint(leader);
    if (doorwayWaypoint) {
      const direction = doorwayWaypoint.sub(human.getPosition());
      if (faceLeader) {
        human.setDirection(direction.angle, dt);
      }
      human.walkSpring.walkTowards(direction.angle, 1.0);
    } else if (testLineOfSight(human, leader)) {
      this.lastSeenPositionOfLeader = leader.getPosition();
      const direction = this.lastSeenPositionOfLeader.sub(human.getPosition());
      if (faceLeader) {
        human.setDirection(direction.angle, dt);
      }
      const distance = direction.magnitude;
      human.walkSpring.walkTowards(
        direction.angle,
        clamp(distance - FOLLOW_DISTANCE, 0.0, 1.0),
      );
    } else if (this.lastSeenPositionOfLeader) {
      const direction = this.lastSeenPositionOfLeader.sub(human.getPosition());
      human.walkSpring.walkTowards(direction.angle, 1.0);
    }
  }

  /**
   * When the leader has gone into the exit stairwell ahead of us, where to
   * go to get in before it seals: in line with the doorway, then through it.
   * The door closes behind the leader, so following them by sight won't do.
   */
  private getStairwellWaypoint(leader: Human): V2d | undefined {
    const position = this.human.getPosition();
    const stairwell = this.game.entities
      .getByConstructor(Stairwell)
      .find((s) => !s.sealed && s.contains(leader.getPosition()));
    const doorway = stairwell?.door?.getDoorwayCenter();
    const inside = stairwell?.getInsideOfDoorway(STAIRWELL_ENTRY_DEPTH);
    if (!doorway || !inside) {
      return undefined;
    }
    const offset = position.sub(doorway);
    const inward = inside.sub(doorway).inormalize();
    const along = offset.dot(inward);
    const across = Math.abs(offset.crossLength(inward));
    if (offset.magnitude > STAIRWELL_APPROACH_DISTANCE) {
      return undefined;
    }
    // Far enough in to see the leader and follow them normally
    if (
      stairwell!.contains(position) &&
      (along > STAIRWELL_ENTRY_DEPTH * 0.7 ||
        across > STAIRWELL_DOORWAY_ALIGNMENT)
    ) {
      return undefined;
    }
    if (across < STAIRWELL_DOORWAY_ALIGNMENT) {
      return inside;
    }
    return doorway.sub(inward.mul(STAIRWELL_ENTRY_DEPTH));
  }
}

export function isAllyController(e: Entity): e is AllyHumanController {
  return e instanceof AllyHumanController;
}
