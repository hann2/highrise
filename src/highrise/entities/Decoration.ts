import { BaseTexture, Rectangle, Sprite, Texture } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import { Layers } from "../layers";
import { DecorationSprite } from "../view/DecorationSprite";

export default class Decoration extends BaseEntity implements Entity {
  sprite: GameSprite;

  constructor(position: V2d, decorationSprite: DecorationSprite) {
    super();

    const renderTexture = (Texture.from(
      decorationSprite.imageName,
      {}
    ) as any) as BaseTexture;
    const subTexture = new Texture(
      renderTexture,
      new Rectangle(...decorationSprite.offset, ...decorationSprite.dimensions)
    );

    const sprite = new Sprite(subTexture);
    sprite.anchor.set(0.5, 0.5);
    this.sprite = sprite;
    this.sprite.position.set(...position);
    this.sprite.layerName = Layers.WORLD_BACK;
    this.sprite.scale.set(
      decorationSprite.heightMeters / decorationSprite.dimensions[1]
    );
  }
}
