import { vec2 } from "p2";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { SoundName } from "../../../core/resources/sounds";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { rBool } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import BloodSplat from "../../effects/BloodSplat";
import { testLineOfSight } from "../../utils/visionUtils";
import Human, { HUMAN_RADIUS } from "../human/Human";
import Zombie, { ZOMBIE_RADIUS } from "./Zombie";

export default class ZombieController extends BaseEntity implements Entity {
  target?: Human;
  moveTarget?: V2d;

  constructor(public zombie: Zombie) {
    super();
  }

  onTick(dt: number) {
    // TODO: Zombie AI
    if (this.target?.isDestroyed) {
      this.target = undefined;
      this.moveTarget = undefined;
    }

    if (!this.target && rBool(2 * dt)) {
      this.target = this.getNearestVisibleHuman(5)[0];
    }

    // TODO: Don't target humans around corners
    this.moveTarget = this.target?.getPosition();

    if (this.moveTarget) {
      const direction = this.moveTarget.sub(this.zombie.body.position);
      if (direction.magnitude > ZOMBIE_RADIUS + HUMAN_RADIUS) {
        this.zombie.setDirection(direction.angle);
        this.zombie.walk(direction.normalize());
      } else {
        this.zombie.attack();
      }
    }
    // this.zombie.setDirection(Math.random() * Math.PI * 2);
  }

  // Searches the map for the nearest human in range that is visible
  // TODO: This is slow, so be careful
  getNearestVisibleHuman(
    maxDistance: number = 15
  ): [Human | undefined, number] {
    const humans = (this.game?.entities.getTagged("human") as Human[]) ?? [];

    let nearestVisibleHuman: Human | undefined;
    let nearestDistance: number = maxDistance;

    for (const human of humans) {
      // should you be able to sneak up on zombie???
      const distance = vec2.dist(
        human.body.position,
        this.zombie.body.position
      );
      if (distance < nearestDistance) {
        const isVisible = testLineOfSight(this.zombie, human);
        if (isVisible) {
          nearestDistance = distance;
          nearestVisibleHuman = human;
        }
      }
    }

    return [nearestVisibleHuman, nearestDistance];
  }
}
