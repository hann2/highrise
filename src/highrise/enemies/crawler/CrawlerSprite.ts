import { vec2 } from "p2";
import { clamp, smoothStep } from "../../../core/util/MathUtil";
import { choose, rNormal, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { Layer } from "../../config/layers";
import { CRAWLER_TEXTURES, ZOMBIE_RADIUS } from "../../constants/constants";
import { BodySprite } from "../../creature-stuff/BodySprite";
import { lerpOffsets } from "../base/enemyUtils";
import Crawler from "./Crawler";

const WIGGLE_SPEED = 12.0;
const WIGGLE_AMOUNT = 0.3;

const idlePositions: [V2d, V2d] = [V(0.3, 0), V(0.3, 0)];
const attackStartPositions: [V2d, V2d] = [V(0.4, -0.2), V(0.4, 0.2)];
const attackEndPositions: [V2d, V2d] = [V(0.4, 0.12), V(0.4, -0.12)];
const cooldownPositions: [V2d, V2d] = [V(0.25, 0.1), V(0.25, -0.1)];

export default class CrawlereSprite extends BodySprite {
  wigglePhase: number = rUniform(0, Math.PI * 2);
  wiggleSpeed: number = rNormal(WIGGLE_SPEED, WIGGLE_SPEED / 5);

  constructor(
    private crawler: Crawler,
    textures = choose(...CRAWLER_TEXTURES)
  ) {
    super(textures, ZOMBIE_RADIUS * 0.9);

    this.torsoSprite.anchor.set(0.9, 0.5);
    this.sprite.layerName = Layer.CRAWLERS;
  }

  getPosition() {
    return this.crawler.getPosition();
  }

  getAngle() {
    return this.crawler.body.angle;
  }

  getStanceAngle(): number {
    return super.getStanceAngle() + this.getWiggleAmount();
  }

  getHandPositions(): [V2d, V2d] {
    const shoulders = this.getShoulderPositions();

    const t = smoothStep(this.crawler.getAttackPhasePercent());

    switch (this.crawler.getAttackPhase()) {
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
    if (!this.crawler.isStunned) {
      const moveSpeed = clamp(vec2.length(this.crawler.body.velocity));
      this.wigglePhase += moveSpeed * this.wiggleSpeed * dt;
    }
  }
}
