import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { clamp } from "../../core/util/MathUtil";
import Human from "../human/Human";
import { Layer } from "../config/layers";
import { V2d } from "../../core/Vector";

const RESOLUTION = 8; // To draw the circle with more triangles
const START_PHASE = (3 / 2) * Math.PI; // radians
const FADE_SPEED = 3;
const OSCILLATION_F = 2.5; // full cylces / second
const RADIUS = 0.65; // meters
const CONTRACT_AMOUNT = 0.05; // meters

export default class SpeakingCircle extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  active: boolean = false;

  phase = 0;

  constructor(public getPosition: () => V2d, public color: number = 0xffff00) {
    super();

    this.sprite = new Graphics();
    this.sprite.scale.set(1 / RESOLUTION); // For higher resolution cicles
    this.sprite.layerName = Layer.WORLD_OVERLAY;
    this.sprite.alpha = 0;
  }

  onRender(dt: number) {
    this.sprite.clear();
    this.sprite.position.set(...this.getPosition());

    if (this.active) {
      this.sprite.alpha = clamp(this.sprite.alpha + dt * FADE_SPEED);
    } else {
      this.sprite.alpha = clamp(this.sprite.alpha - dt * FADE_SPEED);
    }

    if (this.sprite.alpha > 0) {
      this.phase += dt * Math.PI * OSCILLATION_F;
      const r = RADIUS + Math.sin(this.phase) * CONTRACT_AMOUNT;

      this.sprite
        .lineStyle(0.1 * RESOLUTION, this.color, 0.5)
        .drawCircle(0, 0, r * RESOLUTION);
    } else {
      this.phase = START_PHASE; // So we always start at the same place
    }
  }
}
