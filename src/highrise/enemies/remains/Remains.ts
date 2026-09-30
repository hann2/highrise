import { Container, Sprite } from "pixi.js";
import { Layer } from "../../../config/layers";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { GameSprite } from "../../../core/entity/GameSprite";

/**
 * A piece of a body that has stopped moving. It lies there for the rest of
 * the floor, and costs nothing per frame.
 */
export default class Remains extends BaseEntity implements Entity {
  sprite: Container & GameSprite;

  constructor(display: Container) {
    super();
    this.sprite = copyDisplay(display);
    this.sprite.layerName = Layer.FLOOR_STUFF;
  }
}

/**
 * A copy of a container of sprites (one level deep), since an entity's
 * sprites are destroyed with it
 */
export function copyDisplay(display: Container): Container {
  const copy = new Container();
  copy.position.copyFrom(display.position);
  copy.rotation = display.rotation;
  copy.scale.copyFrom(display.scale);
  copy.tint = display.tint;
  copy.alpha = display.alpha;
  for (const child of display.children) {
    if (child instanceof Sprite) {
      const sprite = new Sprite(child.texture);
      sprite.anchor.copyFrom(child.anchor);
      sprite.position.copyFrom(child.position);
      sprite.rotation = child.rotation;
      sprite.scale.copyFrom(child.scale);
      sprite.tint = child.tint;
      sprite.alpha = child.alpha;
      copy.addChild(sprite);
    }
  }
  return copy;
}
