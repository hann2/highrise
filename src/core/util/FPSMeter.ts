import { Container, DisplayObject, Text } from "pixi.js";
import BaseEntity from "../entity/BaseEntity";
import Entity, { GameSprite } from "../entity/Entity";
import Game from "../Game";

const SMOOTHING = 0.95;
export default class FPSMeter extends BaseEntity implements Entity {
  persistenceLevel = 100;
  lastUpdate: number;
  averageDuration: number = 0;
  slowFrameCount: number = 0;
  sprite: Text & GameSprite;

  constructor(layerName?: string) {
    super();
    this.lastUpdate = performance.now();
    this.sprite = new Text("", {
      fontSize: 12,
      fill: "white",
      align: "left",
    });
    this.sprite.layerName = layerName;
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

    this.sprite.text = this.getText();
  }

  getStats() {
    return {
      fps: Math.ceil(1000 / this.averageDuration),
      bodyCount: this.game?.world.bodies.length ?? 0,
      entityCount: this.game?.entities.all.size ?? 0,
      spriteCount: getSpriteCount(this.game!.renderer.stage),
    };
  }

  getText() {
    const { fps, bodyCount, entityCount, spriteCount } = this.getStats();
    return `fps: ${fps} | bodies: ${bodyCount} | entities: ${entityCount} | sprites ${spriteCount}`;
  }
}

function getSpriteCount(root: DisplayObject): number {
  let total = 1;

  for (const child of (root as Container).children ?? []) {
    total += getSpriteCount(child);
  }

  return total;
}
