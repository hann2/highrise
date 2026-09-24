import { Graphics } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { createGraphics, GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
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

    this.sprite = createGraphics(Layer.HUD);
    this.sprite.rect(-5000, -5000, 10000, 10000).fill(color);
    // Starting black already, if there's no fading out to do
    this.sprite.alpha = outDuration > 0 ? 0 : 1;
  }

  @on("add")
  async onAdd() {
    await this.wait(this.outDuration, (_, t) => {
      this.sprite.alpha = t;
    });
    this.sprite.alpha = 1;
    await this.wait(this.holdDuration);
    await this.wait(this.inDuration, (_, t) => {
      this.sprite.alpha = 1 - t;
    });
    this.sprite.alpha = 0;
    this.destroy();
  }
}
