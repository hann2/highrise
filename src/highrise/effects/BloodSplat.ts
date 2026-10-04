import { Sprite } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { darken } from "../../core/util/ColorUtils";
import { choose, rUniform } from "../../core/util/Random";
import { BLOOD_COLOR, getFloorStains } from "./FloorStains";
import { SPLAT_TEXTURES } from "./Splat";

const SCALE = 1.0 / 64;
/** Seconds it stays, then fades away over */
const LIFETIME = 10;
const FADE_TIME = 3;
/** How much of the splat's width, from its middle, shoes pick it up in: the middle's solid, the edges ragged */
export const WET_RADIUS = 0.42;

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

  @on("add")
  async onAdd() {
    // Wet enough to step in until it's mostly faded
    getFloorStains(this.game).spill(
      [this.sprite.x, this.sprite.y],
      this.sprite.width * WET_RADIUS,
      BLOOD_COLOR,
      1,
      LIFETIME + FADE_TIME / 2,
    );
    // TODO: Destroy only the oldest ones
    await this.wait(LIFETIME);
    await this.wait(FADE_TIME, (_, t) => (this.sprite.alpha = 1.0 - t));
    this.destroy();
  }
}
