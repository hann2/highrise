import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Human from "../entities/human/Human";
import { Layers } from "../layers";

export default class SpeakingCircle extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  active: boolean = false;

  constructor(private speaker: Human) {
    super();

    this.sprite = new Graphics();
    this.sprite.scale.set(1 / 4); // For higher resolution cicles
    this.sprite.layerName = Layers.WORLD_OVERLAY;
  }

  onRender() {
    this.sprite.clear();
    this.sprite.position.set(...this.speaker.body.position);

    if (this.active) {
      const r = 2.6 + Math.sin(this.game!.elapsedTime * Math.PI * 2.5) * 0.2;
      this.sprite.lineStyle(0.35, 0xffff00, 0.5).drawCircle(0, 0, r);
    }
  }
}
