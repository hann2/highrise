import { vec2 } from "p2";
import {
  angleDelta,
  clamp,
  degToRad,
  smoothStep,
} from "../../../core/util/MathUtil";
import { rNormal, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { BodySprite } from "../../creature-stuff/BodySprite";
import { lerpOffsets } from "../base/enemyUtils";
import Sprinter, { RUNNER_RADIUS } from "./Sprinter";

const WIGGLE_SPEED = 4.0;
const WIGGLE_AMOUNT = degToRad(12);

// hand positions
const idlePositions: [V2d, V2d] = [V(0.18, 0), V(0.18, 0)];
const attackStartPositions: [V2d, V2d] = [V(0.36, -0.1), V(0.36, 0.1)];
const attackEndPositions: [V2d, V2d] = [V(0.36, 0.08), V(0.36, -0.08)];
const cooldownPositions: [V2d, V2d] = [V(0.23, 0.07), V(0.23, -0.07)];

// Renders a runner
export default class SprinterSprite extends BodySprite {
  wigglePhase: number = rUniform(0, Math.PI * 2);
  wiggleSpeed: number = rNormal(WIGGLE_SPEED, WIGGLE_SPEED / 5);

  constructor(private sprinter: Sprinter) {
    super(sprinter.zombieVariant.textures, RUNNER_RADIUS);

    this.sprite.tint = 0xdddddd; // Make it a bit darker
  }

  getPosition() {
    return this.sprinter.getPosition();
  }

  getAngle() {
    return this.sprinter.body.angle;
  }

  getStanceAngle(): number {
    return (
      angleDelta(this.sprinter.getTargetDirection(), this.sprinter.body.angle) +
      this.getWiggleAmount()
    );
  }

  getHandPositions(): [V2d, V2d] {
    const shoulders = this.getShoulderPositions();

    const t = smoothStep(this.sprinter.getAttackPhasePercent());

    switch (this.sprinter.getAttackPhase()) {
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
    if (!this.sprinter.isStunned) {
      const moveSpeed = clamp(vec2.length(this.sprinter.body.velocity), -1, 4);
      this.wigglePhase += moveSpeed * this.wiggleSpeed * dt;
    }
  }
}
