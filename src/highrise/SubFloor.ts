import { Graphics } from "pixi.js";
import BaseEntity from "../core/entity/BaseEntity";
import Entity, { GameSprite } from "../core/entity/Entity";
import { hsvToRgb, rgbToHex } from "../core/util/ColorUtils";
import { rUniform } from "../core/util/Random";
import { Layers } from "./layers";

export default class SubFloor extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;

  constructor([width, height]: [number, number]) {
    super();

    const hue = rUniform(0, 1);
    const color = rgbToHex(hsvToRgb({ h: rUniform(0, 1), s: 0.4, v: 0.8 }));

    this.sprite = new Graphics();
    this.sprite.layerName = Layers.SUBFLOOR;
    this.sprite.beginFill(color);
    this.sprite.drawRect(0, 0, width, height);
    this.sprite.endFill();
  }
}
