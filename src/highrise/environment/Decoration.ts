import { Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import {
  DecorationInfo,
  getDecorationTexture,
} from "./decorations/DecorationInfo";

export default class Decoration extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  constructor(
    position: V2d,
    decorationInfo: DecorationInfo,
    rotation: number = 0,
    layerName: Layer = Layer.DECORATIONS
  ) {
    super();

    const texture = getDecorationTexture(decorationInfo);
    this.sprite = new Sprite(texture);
    this.sprite.layerName = layerName;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.rotation = rotation;
    this.sprite.position.set(...position);
    this.sprite.scale.set(decorationInfo.heightMeters / texture.height);
  }
}
