import BaseEntity from "../core/entity/BaseEntity";
import Entity from "../core/entity/Entity";
import { V, V2d } from "../core/Vector";
import Decoration from "./entities/Decoration";
import { DecorationSprite } from "./view/DecorationSprite";

export default class Floor extends BaseEntity implements Entity {
  constructor(
    decorationSprite: DecorationSprite,
    [x, y]: V2d,
    [width, height]: V2d
  ) {
    super();

    const off = decorationSprite.heightMeters / 2;

    for (let i = x + off; i <= width + x; i += decorationSprite.heightMeters) {
      for (
        let j = y + off;
        j <= height + y;
        j += decorationSprite.heightMeters
      ) {
        this.addChild(new Decoration(V(i, j), decorationSprite));
      }
    }
  }
}
