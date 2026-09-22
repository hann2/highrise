import { Sprite } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite, loadGameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { darken } from "../../core/util/ColorUtils";
import { smoothStep } from "../../core/util/MathUtil";
import { rUniform } from "../../core/util/Random";
import { getSplatPair } from "./Splat";

const SCALE = 1.0 / 64;

const COLOR = 0x00ff00;
const GLOW_ALPHA = 0.1;

export default class GooSplat extends BaseEntity implements Entity {
  sprites: (Sprite & GameSprite)[];
  glowSprite: Sprite;
  mainSprite: Sprite;

  constructor([x, y]: [number, number], size: number = 1) {
    super();

    const [texture, glowTexture] = getSplatPair();

    this.mainSprite = loadGameSprite(texture, Layer.FLOOR_DECALS);
    this.mainSprite.alpha = 0.9;
    this.mainSprite.scale.set(size * SCALE);
    this.mainSprite.anchor.set(0.5, 0.5);
    this.mainSprite.position.set(x, y);
    this.mainSprite.rotation = rUniform(0, Math.PI / 2);
    this.mainSprite.tint = darken(COLOR, rUniform(0, 0.2));

    this.glowSprite = loadGameSprite(glowTexture, Layer.EMISSIVES);
    this.glowSprite.blendMode = "add";
    this.glowSprite.alpha = GLOW_ALPHA;
    this.glowSprite.scale.set(size * SCALE);
    this.glowSprite.anchor.set(0.5, 0.5);
    this.glowSprite.position.set(x, y);
    this.glowSprite.rotation = this.mainSprite.rotation;
    this.glowSprite.tint = this.mainSprite.tint;

    this.sprites = [this.mainSprite, this.glowSprite];
  }

  @on("add")
  async onAdd() {
    await this.wait(10, (_, t) => {
      const alpha = smoothStep(1.0 - t);
      this.mainSprite.alpha = alpha;
      this.glowSprite.alpha = alpha * GLOW_ALPHA;
    });
    this.destroy();
  }
}
