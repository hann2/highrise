import { Graphics } from "pixi.js";
import BaseEntity from "../core/entity/BaseEntity";
import Entity, { GameSprite } from "../core/entity/Entity";
import { rgbToHex } from "../core/util/ColorUtils";
import { rInteger } from "../core/util/Random";
import { Layers } from "./layers";

export default class SubFloor extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;

  constructor([width, height]: [number, number]) {
    super();

    const color = rgbToHex(
      rInteger(0, 256),
      rInteger(0, 256),
      rInteger(0, 256)
    );

    this.sprite = new Graphics();
    this.sprite.layerName = Layers.SUBFLOOR;
    this.sprite.beginFill(color);
    this.sprite.drawRect(0, 0, width, height);
    this.sprite.endFill();
  }
}
