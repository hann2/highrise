import { vec2 } from "p2";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { SoundName } from "../../../core/resources/sounds";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import BloodSplat from "../../effects/BloodSplat";
import { testLineOfSight } from "../../utils/visionUtils";
import Human from "../human/Human";
import Zombie from "./Zombie";

export default class ZombieController extends BaseEntity implements Entity {
  constructor(public zombie: Zombie) {
    super();
  }

  onTick(dt: number) {
    // TODO: Zombie AI
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
        const isVisible = testLineOfSight(this, human);
        if (isVisible) {
          nearestDistance = distance;
          nearestVisibleHuman = human;
        }
      }
    }

    return [nearestVisibleHuman, nearestDistance];
  }

  die() {
    this.game?.dispatch({ type: "zombieDied", zombie: this });
    this.game?.addEntity(new BloodSplat(this.getPosition()));
    this.destroy();
  }

  speak(soundName: SoundName) {
    this.game?.addEntity(new PositionalSound(soundName, this.getPosition()));
  }
}
