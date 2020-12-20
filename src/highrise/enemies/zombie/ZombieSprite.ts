import { vec2 } from "p2";
import {
  angleDelta,
  clamp,
  degToRad,
  smoothStep,
} from "../../../core/util/MathUtil";
import { rNormal, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { ZOMBIE_RADIUS } from "../../constants";
import { BodySprite } from "../../creature-stuff/BodySprite";
import { lerpOffsets } from "../base/enemyUtils";
import Zombie from "./Zombie";

const WIGGLE_SPEED = 4.0;
const WIGGLE_AMOUNT = degToRad(12);

// hand positions
const idlePositions: [V2d, V2d] = [V(0.3, 0), V(0.3, 0)];
const attackStartPositions: [V2d, V2d] = [V(0.4, -0.2), V(0.4, 0.2)];
const attackEndPositions: [V2d, V2d] = [V(0.4, 0.12), V(0.4, -0.12)];
const cooldownPositions: [V2d, V2d] = [V(0.25, 0.1), V(0.25, -0.1)];

// Renders a zombie
export default class ZombieSprite extends BodySprite {
  wigglePhase: number = rUniform(0, Math.PI * 2);
  wiggleSpeed: number = rNormal(WIGGLE_SPEED, WIGGLE_SPEED / 5);

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
    return (
      angleDelta(this.zombie.getTargetDirection(), this.zombie.body.angle) +
      this.getWiggleAmount()
    );
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

  getWiggleAmount() {
    const t = this.wigglePhase;
    const sign = Math.sign(Math.sin(t));
    const p = sign * Math.abs(Math.sin(t));
    return p * WIGGLE_AMOUNT;
  }

  onTick(dt: number) {
    if (!this.zombie.isStunned) {
      const moveSpeed = clamp(vec2.length(this.zombie.body.velocity), -1, 4);
      this.wigglePhase += moveSpeed * this.wiggleSpeed * dt;
    }
  }
}
