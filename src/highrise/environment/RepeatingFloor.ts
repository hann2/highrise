import { TilingSprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { Layer } from "../config/layers";
import {
  DecorationInfo,
  getDecorationTexture,
} from "./decorations/DecorationInfo";

export default class RepeatingFloor extends BaseEntity implements Entity {
  sprite: TilingSprite & GameSprite;
  constructor(
    decorationInfo: DecorationInfo,
    [x, y]: [number, number],
    [width, height]: [number, number] // This is in pixels?!
  ) {
    super();

    const texture = getDecorationTexture(decorationInfo);

    this.sprite = new TilingSprite(texture, width, height);

    const scale = decorationInfo.heightMeters / texture.height;
    this.sprite.tileScale.set(scale);
    this.sprite.tileTransform.rotation = decorationInfo.rotation ?? 0;
    this.sprite.position.set(x, y);
    this.sprite.layerName = Layer.FLOOR;
  }
}
