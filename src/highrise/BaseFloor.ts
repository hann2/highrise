import { Graphics } from "pixi.js";
import BaseEntity from "../core/entity/BaseEntity";
import Entity, { GameSprite } from "../core/entity/Entity";
import { Layers } from "./layers";

export default class BaseFloor extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;

  constructor([width, height]: [number, number]) {
    super();

    this.sprite = new Graphics();
    this.sprite.layerName = Layers.FLOOR;
    this.sprite.beginFill(0xeeeeee);
    this.sprite.drawRect(0, 0, width, height);
    this.sprite.endFill();
  }
}
