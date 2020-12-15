import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import { HUMAN_RADIUS, ZOMBIE_RADIUS } from "../../constants";
import { Direction, opposite } from "../../utils/directions";
import { testLineOfSight } from "../../utils/visionUtils";
import Human from "../human/Human";
import Necromancer from "./Necromancer";

export default class NecromancerController
  extends BaseEntity
  implements Entity {
  target?: Human;
  moveTarget?: V2d;
  objective?: "FLEE" | "DEFEND" | "SURROUND" | "ATTACK";

  constructor(public necromancer: Necromancer) {
    super();

    this.moveTarget = this.necromancer.arenaUpperLeftCorner.add(
      this.necromancer.arenaDimensions.mul(0.5)
    );
  }

  async onTick(dt: number) {
    const enemies = this.getEnemiesInArena();
    const occupiedZones = ["RIGHTDOWN"];
    const currentZone = "RIGHTUP";

    if (!enemies.length) {
      return;
    }

    if (currentZone in occupiedZones) {
      this.objective = "FLEE";
      return;
    }

    if (this.necromancer.attackPhase !== "ready") {
      return;
    }

    switch (this.objective) {
      case "FLEE":
        if (this.atMoveTarget()) {
          this.objective = "DEFEND";
        } else {
          this.moveTowardsTarget();
        }
        break;
      case "DEFEND":
        await this.necromancer.summonShield(Direction[opposite(currentZone)]);
        this.objective = "ATTACK";
        break;
      case "ATTACK":
        await this.necromancer.attack(enemies[0]);
        this.objective = "SURROUND";
        break;
      case "SURROUND":
        await this.necromancer.surround(enemies[0]);
        this.objective = "FLEE";
        break;
      default:
        this.objective = "DEFEND";
    }
  }

  anyoneInAttackRange(): Human | undefined {
    const humans = (this.game?.entities.getTagged("human") as Human[]) ?? [];
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
    const direction = human.getPosition().sub(this.necromancer.body.position);
    return direction.magnitude < ZOMBIE_RADIUS + HUMAN_RADIUS;
  }

  targetInVision(): boolean {
    return !!this.target && testLineOfSight(this.necromancer, this.target);
  }

  inVision(human: Human): boolean {
    return testLineOfSight(this.necromancer, human);
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
    this.necromancer.setDirection(direction.angle);
    this.necromancer.walk(direction);
  }

  getEnemiesInArena(): Human[] {
    const humans = (this.game?.entities.getTagged("human") as Human[]) ?? [];

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
