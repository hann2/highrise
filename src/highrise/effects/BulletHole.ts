import { Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { choose, rUniform } from "../../core/util/Random";
import { Layer } from "../config/layers";
import { BLOB_TEXTURES } from "./Splat";

export default class BulletHole extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  constructor([x, y]: [number, number], size: number = 1) {
    super();

    this.sprite = Sprite.from(choose(...BLOB_TEXTURES));
    this.sprite.alpha = 0.5;
    this.sprite.scale.set(0.1 / this.sprite.width);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.layerName = Layer.WALLS;
    this.sprite.position.set(x, y);
    this.sprite.rotation = rUniform(0, Math.PI / 2);
    this.sprite.tint = 0x333333;
  }

  async onAdd() {
    // TODO: Destroy only the oldest ones
    await this.wait(10);
    await this.wait(3, (_, t) => (this.sprite.alpha = 1.0 - t));
    this.destroy();
  }
}
