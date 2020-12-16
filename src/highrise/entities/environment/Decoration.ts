import { Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import { Layers } from "../../layers";
import {
  DecorationInfo,
  getDecorationTexture,
} from "./decorations/DecorationInfo";

export default class Decoration extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  constructor(
    position: V2d,
    decorationInfo: DecorationInfo,
    rotation: number = 0
  ) {
    super();

    const texture = getDecorationTexture(decorationInfo);
    const sprite = new Sprite(texture);
    sprite.rotation = rotation;
    sprite.anchor.set(0.5, 0.5);
    this.sprite = sprite;
    this.sprite.position.set(...position);
    this.sprite.layerName = Layers.WORLD_BACK;
    this.sprite.scale.set(decorationInfo.heightMeters / texture.height);
  }
}
