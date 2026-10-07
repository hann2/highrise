import { Container, MeshSimple, Sprite } from "pixi.js";
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
 * A copy of a container of sprites, meshes (a limb bent as a strip of
 * triangles) and containers of them, since an entity's sprites are
 * destroyed with it
 */
export function copyDisplay(display: Container): Container {
  const copy = new Container();
  copyPlacing(display, copy);
  for (const child of display.children) {
    if (child instanceof Sprite) {
      const sprite = new Sprite(child.texture);
      sprite.anchor.copyFrom(child.anchor);
      copyPlacing(child, sprite);
      copy.addChild(sprite);
    } else if (child instanceof MeshSimple) {
      const { geometry } = child;
      const mesh = new MeshSimple({
        texture: child.texture,
        vertices: new Float32Array(geometry.positions),
        uvs: new Float32Array(geometry.uvs),
        indices: new Uint32Array(geometry.indices),
      });
      // Posed once and left
      mesh.autoUpdate = false;
      mesh.onRender = null;
      copyPlacing(child, mesh);
      copy.addChild(mesh);
    } else {
      copy.addChild(copyDisplay(child));
    }
  }
  return copy;
}

/** Puts `to` where `from` is, as big, turned and tinted the same */
function copyPlacing(from: Container, to: Container) {
  to.position.copyFrom(from.position);
  to.rotation = from.rotation;
  to.scale.copyFrom(from.scale);
  to.tint = from.tint;
  to.alpha = from.alpha;
}
