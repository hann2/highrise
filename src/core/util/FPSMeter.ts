import { Text } from "pixi.js";
import { LayerName } from "../../config/layers";
import BaseEntity from "../entity/BaseEntity";
import Entity from "../entity/Entity";
import { GameSprite } from "../entity/GameSprite";

const SMOOTHING = 0.95;

/** Shows some performance stats in the corner of the screen. */
export default class FPSMeter extends BaseEntity implements Entity {
  persistenceLevel = 100;
  lastUpdate: number;
  averageDuration: number = 0;
  sprite: Text & GameSprite;

  constructor(layerName?: LayerName) {
    super();
    this.lastUpdate = performance.now();
    this.sprite = new Text({
      text: "",
      style: { fontSize: 12, fill: "white", align: "left" },
    });
    this.sprite.layerName = layerName;
  }

  onAdd() {
    this.averageDuration = 1 / 60;
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
      bodyCount: this.game?.world.bodies.all.size ?? 0,
      entityCount: this.game?.entities.all.size ?? 0,
      spriteCount: this.game?.renderer.spriteCount ?? 0,
    };
  }

  getText() {
    const { fps, bodyCount, entityCount, spriteCount } = this.getStats();
    return `fps: ${fps} | bodies: ${bodyCount} | entities: ${entityCount} | sprites ${spriteCount}`;
  }
}
