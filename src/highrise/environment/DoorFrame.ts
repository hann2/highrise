import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";

export class DoorFrame extends BaseEntity implements Entity {
  constructor(position: V2d, angle: number, length: number) {
    super();

    const w = 0.3;
    const h = 0.4;

    const frameSprite = new Graphics();
    frameSprite
      .beginFill(0x999999)
      .drawRect(0, -h / 2, w, h)
      .drawRect(length - w, -h / 2, w, h)
      .endFill();

    frameSprite.position.set(...position);
    frameSprite.rotation = angle;

    this.sprite = frameSprite;
  }
}
