import { BLEND_MODES, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { darken } from "../../core/util/ColorUtils";
import { smoothStep } from "../../core/util/MathUtil";
import { rUniform } from "../../core/util/Random";
import { Layers } from "../config/layers";
import { getSplatPair } from "./Splat";

const SCALE = 1.0 / 64;

const COLOR = 0x00ff00;

export default class GooSplat extends BaseEntity implements Entity {
  sprites: (Sprite & GameSprite)[];
  glowSprite: Sprite;
  mainSprite: Sprite;

  constructor([x, y]: [number, number], size: number = 1) {
    super();

    const [texture, glowTexture] = getSplatPair();

    this.mainSprite = Sprite.from(texture);
    (this.mainSprite as GameSprite).layerName = Layers.FLOOR2;
    this.mainSprite.alpha = 0.9;
    this.mainSprite.scale.set(size * SCALE);
    this.mainSprite.anchor.set(0.5, 0.5);
    this.mainSprite.position.set(x, y);
    this.mainSprite.rotation = rUniform(0, Math.PI / 2);
    this.mainSprite.tint = darken(COLOR, rUniform(0, 0.2));

    this.glowSprite = Sprite.from(glowTexture);
    (this.glowSprite as GameSprite).layerName = Layers.EMISSIVES;
    this.glowSprite.blendMode - BLEND_MODES.ADD;
    this.glowSprite.alpha = 0.2;
    this.glowSprite.scale.set(size * SCALE);
    this.glowSprite.anchor.set(0.5, 0.5);
    this.glowSprite.position.set(x, y);
    this.glowSprite.rotation = this.mainSprite.rotation;
    this.glowSprite.tint = this.mainSprite.tint;

    this.sprites = [this.mainSprite, this.glowSprite];
  }

  async onAdd() {
    await this.wait(10, (_, t) => {
      const alpha = smoothStep(1.0 - t);
      this.mainSprite.alpha = alpha;
      this.glowSprite.alpha = alpha * 0.2;
    });
    this.destroy();
  }
}
