import { Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";

export default class Credits extends BaseEntity implements Entity {
  constructor() {
    super();

    this.sprite = new Sprite();
  }
}
