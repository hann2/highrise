import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { on } from "../../../core/entity/handler";
import { objectEntries, objectKeys } from "../../../core/util/ObjectUtils";
import { rBool, rInteger } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { ZOMBIE_RADIUS } from "../../constants/constants";
import Human, { isHuman } from "../../human/Human";
import { Direction, DirectionName, opposite } from "../../utils/directions";
import Necromancer from "./Necromancer";

interface Zone {
  upperRightCorner: V2d;
  dimensions: V2d;
}

type ZoneId = DirectionName | "CENTER";

export default class NecromancerController
  extends BaseEntity
  implements Entity
{
  moveTarget?: V2d;
  objective?: "FLEE" | "DEFEND" | "SURROUND" | "ATTACK";
  zones: Record<ZoneId, Zone>;

  constructor(public necromancer: Necromancer) {
    super();

    const c = this.necromancer.arenaUpperLeftCorner;
    const [w, h] = this.necromancer.arenaDimensions;
    this.moveTarget = c.add(this.necromancer.arenaDimensions.mul(0.5));
    const zoneSize = V(w / 3, h / 3);
    const zones: Partial<Record<ZoneId, Zone>> = {
      CENTER: { upperRightCorner: c.add(zoneSize), dimensions: zoneSize },
    };
    for (const [dId, d] of objectEntries(Direction)) {
      zones[dId] = {
        upperRightCorner: c
          .add(zoneSize)
          .add(V(d.x * zoneSize.x, d.y * zoneSize.y)),
        dimensions: zoneSize,
      };
    }
    this.zones = zones as Record<ZoneId, Zone>;
  }

  positionToZone(p: V2d): ZoneId | undefined {
    for (const [zoneId, z] of objectEntries(this.zones)) {
      const c1 = z.upperRightCorner;
      const c2 = z.upperRightCorner.add(z.dimensions);
      if (p.x > c1.x && p.y > c1.y && p.x < c2.x && p.y < c2.y) {
        return zoneId;
      }
    }
  }

  @on("tick")
  onTick() {
    if (this.objective === "FLEE") {
      if (this.atMoveTarget()) {
        this.objective = "DEFEND";
      } else {
        this.moveTowardsTarget();
      }
      return;
    }

    const enemies = this.getEnemiesInArena();
    const occupiedZones = enemies
      .map((e) => this.positionToZone(e.getPosition()))
      .filter((zone) => zone != undefined);
    const currentZone = this.positionToZone(this.necromancer.getPosition());

    if (!enemies.length) {
      return;
    }
    if (!currentZone || occupiedZones.includes(currentZone)) {
      this.flee(occupiedZones);
      return;
    }

    this.necromancer.setTargetDirection(
      enemies[0].getPosition().isub(this.necromancer.getPosition()).angle,
    );

    if (this.necromancer.getAttackPhase() !== "ready") {
      return;
    }

    switch (this.objective) {
      case "DEFEND":
        const direction =
          currentZone === "CENTER"
            ? undefined
            : Direction[opposite(currentZone)];
        this.necromancer.summonShield(direction);
        this.objective = "ATTACK";
        break;
      case "ATTACK":
        if (rBool(0.5)) {
          this.necromancer.firePhlegm();
        } else {
          this.necromancer.fireDeathOrb();
        }
        this.objective = "SURROUND";
        break;
      case "SURROUND":
        this.necromancer.surround(enemies[0].getPosition());
        this.flee(occupiedZones);
        break;
      default:
        this.objective = "DEFEND";
    }
  }

  flee(occupiedZones: ZoneId[]) {
    const unoccupiedZones = objectKeys(this.zones).filter(
      (z) => !occupiedZones.includes(z),
    );
    const targetZoneId = unoccupiedZones[rInteger(0, unoccupiedZones.length)];
    const targetZone = this.zones[targetZoneId];
    this.moveTarget = targetZone.upperRightCorner.add(
      targetZone.dimensions.mul(0.5),
    );
    this.objective = "FLEE";
  }

  atMoveTarget() {
    return (
      !!this.moveTarget &&
      this.necromancer.getPosition().distanceTo(this.moveTarget) <
        1.2 * ZOMBIE_RADIUS
    );
  }

  moveTowardsTarget(speed: number = 1) {
    if (!this.moveTarget) {
      return;
    }
    const direction = this.moveTarget.sub(this.necromancer.body.position);
    this.necromancer.setTargetDirection(direction.angle);
    this.necromancer.walkSpring.walkTowards(direction.angle, speed);
  }

  getEnemiesInArena(): Human[] {
    const result: Human[] = [];

    for (const human of this.game.entities.getByFilter(isHuman)) {
      const p = human.getPosition();
      const c1 = this.necromancer.arenaUpperLeftCorner;
      const c2 = c1.add(this.necromancer.arenaDimensions);
      if (p.x > c1.x && p.y > c1.y && p.x < c2.x && p.y < c2.y) {
        result.push(human);
      }
    }

    return result;
  }
}
