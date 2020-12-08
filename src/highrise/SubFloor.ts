import { TilingSprite } from "pixi.js";
import industrialCarpet001 from "../../resources/images/environment/floor/IndustrialCarpet-001.jpg";
import industrialCarpet002 from "../../resources/images/environment/floor/IndustrialCarpet-002.jpg";
import BaseEntity from "../core/entity/BaseEntity";
import Entity, { GameSprite } from "../core/entity/Entity";
import { hsvToRgb, rgbToHex } from "../core/util/ColorUtils";
import { choose, rUniform } from "../core/util/Random";
import { Layers } from "./layers";

export default class SubFloor extends BaseEntity implements Entity {
  sprite: TilingSprite & GameSprite;

  constructor([width, height]: [number, number]) {
    super();

    this.sprite = TilingSprite.from(
      choose(industrialCarpet001, industrialCarpet002),
      {}
    ) as TilingSprite;

    const color = rgbToHex(hsvToRgb({ h: rUniform(0, 1), s: 0.4, v: 0.8 }));
    this.sprite.tint = color;

    this.sprite.width = 100;
    this.sprite.height = 100;
    this.sprite.tileScale.set(1 / 192);
    this.sprite.layerName = Layers.SUBFLOOR;
  }
}
