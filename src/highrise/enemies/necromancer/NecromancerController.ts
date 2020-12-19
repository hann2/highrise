import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { rInteger } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { ZOMBIE_RADIUS } from "../../constants";
import { Direction, opposite } from "../../utils/directions";
import Human, { isHuman } from "../../human/Human";
import Necromancer from "./Necromancer";

interface Zone {
  upperRightCorner: V2d;
  dimensions: V2d;
}

export default class NecromancerController
  extends BaseEntity
  implements Entity {
  moveTarget?: V2d;
  objective?: "FLEE" | "DEFEND" | "SURROUND" | "ATTACK";
  zones: Record<string, Zone>;

  constructor(public necromancer: Necromancer) {
    super();

    const c = this.necromancer.arenaUpperLeftCorner;
    const [w, h] = this.necromancer.arenaDimensions;
    this.moveTarget = c.add(this.necromancer.arenaDimensions.mul(0.5));
    this.zones = {
      CENTER: {
        upperRightCorner: c.add(V(w / 3, h / 3)),
        dimensions: V(w / 3, w / 3),
      },
    };

    for (const dId of Object.keys(Direction)) {
      const d = Direction[dId];
      const scaledDir = V((d.x * w) / 3, (d.y * h) / 3);
      this.zones[dId] = {
        upperRightCorner: c.add(V(w / 3, h / 3)).add(scaledDir),
        dimensions: V(w / 3, w / 3),
      };
    }
  }

  positionToZone(p: V2d): string | undefined {
    for (const zoneId of Object.keys(this.zones)) {
      const z = this.zones[zoneId];
      const c1 = z.upperRightCorner;
      const c2 = z.upperRightCorner.add(z.dimensions);
      if (p.x > c1.x && p.y > c1.y && p.x < c2.x && p.y < c2.y) {
        return zoneId;
      }
    }
  }

  async onTick() {
    if (this.objective === "FLEE") {
      if (this.atMoveTarget()) {
        this.objective = "DEFEND";
      } else {
        this.moveTowardsTarget();
      }
      return;
    }

    const enemies = this.getEnemiesInArena();
    const occupiedZones: string[] = enemies
      .map((e) => this.positionToZone(e.getPosition()))
      .filter((a) => !!a) as string[];
    const currentZone = this.positionToZone(this.necromancer.getPosition());

    if (!enemies.length) {
      return;
    }
    if (!currentZone || currentZone in occupiedZones) {
      this.flee(occupiedZones);
      return;
    }

    if (this.necromancer.getAttackPhase() !== "ready") {
      return;
    }

    this.necromancer.setTargetDirection(
      enemies[0].getPosition().isub(this.necromancer.getPosition()).angle
    );

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
        this.necromancer.attack();
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

  flee(occupiedZones: string[]) {
    const unoccupiedZones = Object.keys(this.zones).filter(
      (z) => !(z in occupiedZones)
    );
    const targetZoneId: string =
      unoccupiedZones[rInteger(0, unoccupiedZones.length)];
    const targetZone = this.zones[targetZoneId];
    this.moveTarget = targetZone.upperRightCorner.add(
      targetZone.dimensions.mul(0.5)
    );
    this.objective = "FLEE";
  }

  atMoveTarget() {
    return (
      !!this.moveTarget &&
      this.necromancer.getPosition().sub(this.moveTarget).magnitude <
        1.2 * ZOMBIE_RADIUS
    );
  }

  moveTowardsTarget(speed: number = 1) {
    if (!this.moveTarget) {
      return;
    }
    const direction = this.moveTarget.sub(this.necromancer.body.position);
    direction.magnitude = speed;
    this.necromancer.setTargetDirection(direction.angle);
    this.necromancer.walk(direction);
  }

  getEnemiesInArena(): Human[] {
    const humans = [...this.game!.entities.getByFilter(isHuman)];

    const result: Human[] = [];

    for (const human of humans) {
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
