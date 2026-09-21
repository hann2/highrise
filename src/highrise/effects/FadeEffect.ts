import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { Layer } from "../../config/layers";
import { Persistence } from "../constants/constants";

export default class FadeEffect extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Permanent;

  sprite: Graphics & GameSprite;

  constructor(
    private outDuration = 1,
    private holdDuration = 0.5,
    private inDuration = 1,
    color = 0x000000,
  ) {
    super();

    const graphics = (this.sprite = new Graphics());
    graphics.rect(-5000, -5000, 10000, 10000).fill(color);
    graphics.alpha = 0;

    this.sprite.layerName = Layer.HUD;
  }

  async onAdd() {
    await this.wait(this.outDuration, (_, t) => {
      this.sprite.alpha = t;
    });
    this.sprite.alpha = 1;
    await this.wait(this.holdDuration, undefined);
    await this.wait(this.inDuration, (_, t) => {
      this.sprite.alpha = 1 - t;
    });
    this.sprite.alpha = 0;
    this.destroy();
  }
}
