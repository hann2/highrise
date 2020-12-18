import { angleDelta, smoothStep } from "../../core/util/MathUtil";
import { choose } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { ZOMBIE_RADIUS, ZOMBIE_TEXTURES } from "../constants";
import { BodySprite } from "../creature-stuff/BodySprite";
import Zombie from "./Zombie";

// Renders a zombie
export default class ZombieSprite extends BodySprite {
  constructor(private zombie: Zombie) {
    super(choose(...ZOMBIE_TEXTURES), ZOMBIE_RADIUS);
  }

  getPosition() {
    return this.zombie.getPosition();
  }

  getAngle() {
    return this.zombie.body.angle;
  }

  getStanceAngle(): number {
    return angleDelta(this.zombie.targetDirection, this.zombie.body.angle);
  }

  getHandPositions(): [V2d, V2d] {
    const shoulders = this.getShoulderPositions();

    const t = smoothStep(this.zombie.attackPhasePercent);

    switch (this.zombie.attackPhase) {
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

function lerpOffsets(
  [leftBase, rightBase]: [V2d, V2d],
  [leftStart, rightStart]: [V2d, V2d],
  [leftEnd, rightEnd]: [V2d, V2d],
  t: number
): [V2d, V2d] {
  const leftOffset = leftStart.lerp(leftEnd, t);
  const rightOffset = rightStart.lerp(rightEnd, t);
  return [leftBase.iadd(leftOffset), rightBase.iadd(rightOffset)];
}

const idlePositions: [V2d, V2d] = [V(0.3, 0), V(0.3, 0)];
const attackStartPositions: [V2d, V2d] = [V(0.4, -0.2), V(0.4, 0.2)];
const attackEndPositions: [V2d, V2d] = [V(0.4, 0.12), V(0.4, -0.12)];
const cooldownPositions: [V2d, V2d] = [V(0.25, 0.1), V(0.25, -0.1)];
