import { Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { darken } from "../../core/util/ColorUtils";
import { choose, rUniform } from "../../core/util/Random";
import { Layer } from "../config/layers";
import { SPLAT_TEXTURES } from "./Splat";

const SCALE = 1.0 / 64;

export default class BloodSplat extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  constructor([x, y]: [number, number], size: number = 1) {
    super();

    this.sprite = Sprite.from(choose(...SPLAT_TEXTURES));
    this.sprite.alpha = 0.9;
    this.sprite.scale.set(size * SCALE);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.layerName = Layer.FLOOR_DECALS;
    this.sprite.position.set(x, y);
    this.sprite.rotation = rUniform(0, Math.PI / 2);
    this.sprite.tint = darken(0xff0000, rUniform(0.1, 0.4));
  }

  async onAdd() {
    // TODO: Destroy only the oldest ones
    await this.wait(10);
    await this.wait(3, (_, t) => (this.sprite.alpha = 1.0 - t));
    this.destroy();
  }
}
