import { Graphics } from "pixi.js";
import { FootLanding } from "../../core/animation/Gait";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { Layer } from "../../config/layers";
import { FOOT_FORWARD, FOOT_LENGTH, FOOT_WIDTH } from "../creature-stuff/Legs";

/** Seconds a marker takes to fade away */
const FADE_TIME = 2;
const COLORS = [0x4fc3f7, 0xffb74d];

/**
 * Where a foot came down (`Gait.onLand`), drawn on the floor and fading
 * away, for the walk scene: a foot that stays put sits exactly on its
 * marker until it lifts. Blue the left foot, orange the right; settling
 * steps are hollow.
 */
export default class FootprintMarker extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  private age = 0;

  constructor(landing: FootLanding, scale: number) {
    super();
    const length = FOOT_LENGTH * scale;
    const width = FOOT_WIDTH * scale;
    const color = COLORS[landing.side];
    const shape = new Graphics().ellipse(
      FOOT_FORWARD * scale,
      0,
      length / 2,
      width / 2,
    );
    this.sprite = (
      landing.settling
        ? shape.stroke({ color, width: 0.015 })
        : shape.fill({ color, alpha: 0.7 })
    ) as Graphics & GameSprite;
    this.sprite.position.copyFrom(landing.position);
    this.sprite.rotation = landing.angle;
    this.sprite.layerName = Layer.FLOOR_DECALS;
  }

  @on("tick")
  onTick(dt: number) {
    this.age += dt;
    this.sprite.alpha = 1 - this.age / FADE_TIME;
    if (this.age >= FADE_TIME) {
      this.destroy();
    }
  }
}
