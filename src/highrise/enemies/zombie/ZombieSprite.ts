import { angleDelta, smoothStep } from "../../../core/util/MathUtil";
import { choose } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { ZOMBIE_RADIUS, ZOMBIE_TEXTURES } from "../../constants";
import { BodySprite } from "../../creature-stuff/BodySprite";
import { ShuffleRing } from "../../utils/ShuffleRing";
import { lerpOffsets } from "../base/enemyUtils";
import Zombie from "./Zombie";

// hand positions
const idlePositions: [V2d, V2d] = [V(0.3, 0), V(0.3, 0)];
const attackStartPositions: [V2d, V2d] = [V(0.4, -0.2), V(0.4, 0.2)];
const attackEndPositions: [V2d, V2d] = [V(0.4, 0.12), V(0.4, -0.12)];
const cooldownPositions: [V2d, V2d] = [V(0.25, 0.1), V(0.25, -0.1)];

const textureRing = new ShuffleRing(ZOMBIE_TEXTURES);

// Renders a zombie
export default class ZombieSprite extends BodySprite {
  constructor(private zombie: Zombie) {
    super(zombie.zombieVariant.textures, ZOMBIE_RADIUS);
  }

  getPosition() {
    return this.zombie.getPosition();
  }

  getAngle() {
    return this.zombie.body.angle;
  }

  getStanceAngle(): number {
    return angleDelta(this.zombie.getTargetDirection(), this.zombie.body.angle);
  }

  getHandPositions(): [V2d, V2d] {
    const shoulders = this.getShoulderPositions();

    const t = smoothStep(this.zombie.getAttackPhasePercent());

    switch (this.zombie.getAttackPhase()) {
      case "ready": {
        const [leftOffset, rightOffset] = idlePositions;
        return [shoulders[0].iadd(leftOffset), shoulders[1].iadd(rightOffset)];
      }
      case "windup": {
        return lerpOffsets(shoulders, idlePositions, attackStartPositions, t);
      }
      case "attack": {
        return lerpOffsets(
          shoulders,
          attackStartPositions,
          attackEndPositions,
          t
        );
      }
      case "winddown": {
        return lerpOffsets(shoulders, attackEndPositions, cooldownPositions, t);
      }
      case "cooldown": {
        return lerpOffsets(shoulders, cooldownPositions, idlePositions, t);
      }
    }
  }
}
