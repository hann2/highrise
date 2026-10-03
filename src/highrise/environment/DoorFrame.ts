import { Graphics } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import ContactShadow from "../lighting-and-vision/ContactShadow";

/** How far the frame's shadow on the floor reaches past its edges, in meters */
const FRAME_SHADOW_REACH = 0.2;

export class DoorFrame extends BaseEntity implements Entity {
  constructor(position: V2d, angle: number, length: number) {
    super();

    const w = 0.3;
    const h = 0.6;

    const frameSprite = new Graphics();
    frameSprite
      .rect(0, -h / 2, w, h)
      .rect(length - w, -h / 2, w, h)
      .fill(0xffaa55);

    frameSprite.position.copyFrom(position);
    frameSprite.rotation = angle;

    this.sprite = frameSprite;
    this.sprite.layerName = Layer.WALLS;

    for (const along of [w / 2, length - w / 2]) {
      this.addChild(
        new ContactShadow(w, h, FRAME_SHADOW_REACH, {
          position: position.add(V(along, 0).rotate(angle)),
          angle,
        }),
      );
    }
  }
}
