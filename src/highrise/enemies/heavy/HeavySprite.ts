import { vec2 } from "p2";
import {
  angleDelta,
  clamp,
  degToRad,
  smoothStep,
} from "../../../core/util/MathUtil";
import { choose, rNormal, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { ZOMBIE_TEXTURES } from "../../constants/constants";
import { BodySprite } from "../../creature-stuff/BodySprite";
import { lerpOffsets } from "../base/enemyUtils";
import Heavy, { HEAVY_RADIUS } from "./Heavy";

const WIGGLE_SPEED = 0.5;
const WIGGLE_AMOUNT = degToRad(7);

// hand positions
const idlePositions: [V2d, V2d] = [V(0.4, 0), V(0.4, 0)];
const attackStartPositions: [V2d, V2d] = [V(0.75, -0.4), V(0.75, 0.4)];
const attackEndPositions: [V2d, V2d] = [V(0.8, 0.25), V(0.8, -0.25)];
const cooldownPositions: [V2d, V2d] = [V(0.5, 0.2), V(0.5, -0.2)];

// Renders a zombie
export default class HeavySprite extends BodySprite {
  wigglePhase: number = rUniform(0, Math.PI * 2);
  wiggleSpeed: number = rNormal(WIGGLE_SPEED, WIGGLE_SPEED / 5);

  constructor(private heavy: Heavy) {
    super(choose(...ZOMBIE_TEXTURES), HEAVY_RADIUS);
  }

  getPosition() {
    return this.heavy.getPosition();
  }

  getAngle() {
    return this.heavy.body.angle;
  }

  getStanceAngle(): number {
    return (
      angleDelta(this.heavy.getTargetDirection(), this.heavy.body.angle) +
      this.getWiggleAmount()
    );
  }

  getHandPositions(): [V2d, V2d] {
    const shoulders = this.getShoulderPositions();

    const t = smoothStep(this.heavy.getAttackPhasePercent());

    switch (this.heavy.getAttackPhase()) {
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
    if (!this.heavy.isStunned) {
      const moveSpeed = clamp(vec2.length(this.heavy.body.velocity));
      this.wigglePhase += moveSpeed * this.wiggleSpeed * dt;
    }
  }
}
