import { TilingSprite } from "pixi.js";
import img_industrialCarpet001 from "../../../resources/images/environment/floor/IndustrialCarpet-001.jpg";
import img_industrialCarpet002 from "../../../resources/images/environment/floor/IndustrialCarpet-002.jpg";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { hsvToRgb, rgbToHex } from "../../core/util/ColorUtils";
import { choose, rUniform } from "../../core/util/Random";
import {
  CELL_WIDTH,
  LEVEL_SIZE,
} from "../levels/level-generation/levelGeneration";
import { Layer } from "../config/layers";

export const SUBFLOOR_TEXTURES = [
  img_industrialCarpet001,
  img_industrialCarpet002,
];

export default class SubFloor extends BaseEntity implements Entity {
  sprite: TilingSprite & GameSprite;

  constructor([width, height]: [number, number]) {
    super();

    this.sprite = TilingSprite.from(
      choose(...SUBFLOOR_TEXTURES),
      {}
    ) as TilingSprite;

    const color = rgbToHex(hsvToRgb({ h: rUniform(0, 1), s: 0.4, v: 0.8 }));
    this.sprite.tint = color;

    this.sprite.width = width;
    this.sprite.height = height;
    this.sprite.tileScale.set(1 / 192);
    this.sprite.layerName = Layer.SUBFLOOR;
  }
}
