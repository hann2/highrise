import { BaseTexture, Rectangle, Texture, TilingSprite } from "pixi.js";
import BaseEntity from "../core/entity/BaseEntity";
import Entity, { GameSprite } from "../core/entity/Entity";
import { V2d } from "../core/Vector";
import { Layers } from "./layers";
import { DecorationSprite } from "./view/DecorationSprite";

export default class TilingFloor extends BaseEntity implements Entity {
  sprite: TilingSprite & GameSprite;
  constructor(
    { imageName, offset, dimensions, heightMeters }: DecorationSprite,
    [x, y]: [number, number],
    [width, height]: V2d
  ) {
    super();

    const sheetTexture = Texture.from(imageName);
    const texture = new Texture(
      (sheetTexture as any) as BaseTexture,
      new Rectangle(...offset, ...dimensions)
    );

    this.sprite = new TilingSprite(texture, width, height);

    const scale = heightMeters / dimensions[1];
    this.sprite.tileScale.set(scale);
    this.sprite.position.set(x, y);
    this.sprite.layerName = Layers.FLOOR;
  }
}
