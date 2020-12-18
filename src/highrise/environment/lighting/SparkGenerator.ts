import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import { Spark } from "./Spark";

/**
 * Emits waves of sparks ever {period} seconds
 */
export class SparkGenerator extends BaseEntity implements Entity {
  remainder: number;

  constructor(
    public position: V2d,
    public radius: number = 5,
    public baseSparkFrequency: number = 50,
    public period: number = 3
  ) {
    super();

    this.remainder = 0;
  }

  onTick(dt: number) {
    const sparkFrequency =
      Math.max(
        0,
        Math.sin((this.game!.elapsedTime * Math.PI * 2) / this.period)
      ) * this.baseSparkFrequency;

    // integer part will tell us how many sparks to create, decimal remainder gets stored for next time.
    const sparkAccumulator = dt * sparkFrequency + this.remainder;
    const nSparks = Math.floor(sparkAccumulator);
    this.remainder = sparkAccumulator - nSparks;
    for (let i = 0; i < nSparks; i++) {
      this.addChild(new Spark(this.position, this.radius));
    }
  }
}
