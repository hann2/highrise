import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { polarToVec } from "../../../core/util/MathUtil";
import { rNormal, rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { Spark } from "./Spark";

/**
 * Emits waves of sparks ever {period} seconds
 */
export class SparkGenerator extends BaseEntity implements Entity {
  remainder: number;
  sparkAngle: number;
  sparkArc: number;

  constructor(
    public position: V2d,
    public radius: number = 8,
    public baseSparkFrequency: number = 100,
    public period: number = 3
  ) {
    super();

    this.remainder = 0;
    this.sparkAngle = rUniform(0, 2 * Math.PI);
    this.sparkArc = rNormal(Math.PI / 2, 0.5);
  }

  onTick(dt: number) {
    const sparkMaxLifetime = 0.8;
    const sparkFrequency =
      Math.max(
        0,
        Math.sin((this.game!.elapsedTime * Math.PI * 2) / this.period)
      ) * this.baseSparkFrequency;

    if (sparkFrequency !== 0) {
      // integer part will tell us how many sparks to create, decimal remainder gets stored for next time.
      const sparkAccumulator = dt * sparkFrequency + this.remainder;
      const nSparks = Math.floor(sparkAccumulator);
      this.remainder = sparkAccumulator - nSparks;
      for (let i = 0; i < nSparks; i++) {
        const angle = rNormal(this.sparkAngle, this.sparkArc);
        const speed = rNormal(
          this.radius / (2 * sparkMaxLifetime),
          this.radius / (6 * sparkMaxLifetime)
        );
        const velocity = polarToVec(angle, speed);
        this.addChild(new Spark(this.position, velocity, sparkMaxLifetime));
      }
    }
  }
}
