import { Text } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { fontName } from "../../core/resources/resourceUtils";

interface Options {
  inactiveColor?: string;
  activeColor?: string;
}

export default class ClickableText extends BaseEntity implements Entity {
  sprite: Text & GameSprite;

  constructor(
    text: string,
    onSpriteClick: () => void,
    { inactiveColor = "#dddddd", activeColor = "#ffffff" }: Options = {},
  ) {
    super();

    this.sprite = new Text({
      text,
      style: {
        align: "left",
        fill: inactiveColor,
        fontFamily: fontName("captureIt"),
        fontSize: 40,
      },
    });
    this.sprite.layerName = Layer.MENU;
    this.sprite.eventMode = "static";
    this.sprite.addListener("mouseover", () => {
      this.sprite.style.fill = activeColor;
    });
    this.sprite.addListener("mouseout", () => {
      this.sprite.style.fill = inactiveColor;
    });
    this.sprite.addListener("click", onSpriteClick);
  }
}
