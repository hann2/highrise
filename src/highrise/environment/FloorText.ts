import { Text } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { fontName } from "../../core/resources/resourceUtils";
import { V2d } from "../../core/Vector";

const FONT_SIZE = 64;

/** Text painted on the floor, like the level number in the spawn room */
export default class FloorText extends BaseEntity implements Entity {
  sprite: Text & GameSprite;

  constructor(
    position: V2d,
    text: string,
    {
      heightMeters = 1,
      color = "red",
      rotation = 0,
    }: { heightMeters?: number; color?: string; rotation?: number } = {},
  ) {
    super();

    this.sprite = new Text({
      text,
      style: {
        fontSize: FONT_SIZE,
        fontFamily: fontName("captureIt"),
        fill: color,
        align: "center",
      },
    });
    this.sprite.blendMode = "multiply";
    this.sprite.position.copyFrom(position);
    this.sprite.rotation = rotation;
    this.sprite.scale.set(heightMeters / FONT_SIZE);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.layerName = Layer.FLOOR_DECALS;
  }
}
