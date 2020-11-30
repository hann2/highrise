import BaseEntity from "../entity/BaseEntity";
import Entity from "../entity/Entity";
import Game from "../Game";

const SMOOTHING = 0.95;
export default class FPSMeter extends BaseEntity implements Entity {
  persistent = true;
  lastUpdate: number;
  averageDuration: number = 0;
  slowFrameCount: number = 0;

  constructor() {
    super();
    this.lastUpdate = performance.now();
  }

  onAdd(game: Game) {
    this.averageDuration = game.trueRenderTimestep;
  }

  onRender() {
    const now = performance.now();
    const duration = now - this.lastUpdate;
    this.averageDuration =
      SMOOTHING * this.averageDuration + (1.0 - SMOOTHING) * duration;
    this.lastUpdate = now;
  }

  getStats() {
    const renderer = this.game?.renderer;
    return {
      fps: Math.ceil(1000 / this.averageDuration),
      bodyCount: this.game?.world.bodies.length ?? 0,
      entityCount: this.game?.entities.all.size ?? 0,
    };
  }

  getText() {
    const { fps, bodyCount, entityCount } = this.getStats();
    return `fps: ${fps} | bodies: ${bodyCount} | entities: ${entityCount}`;
  }
}
