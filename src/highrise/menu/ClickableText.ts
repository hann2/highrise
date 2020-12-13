import { Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { Layers } from "../layers";

interface Options {
  inactiveColor?: string;
  activeColor?: string;
}

export default class ClickableText extends BaseEntity implements Entity {
  sprite: Text & GameSprite;

  constructor(
    text: string,
    onSpriteClick: () => void,
    { inactiveColor = "#dddddd", activeColor = "#ffffff" }: Options = {}
  ) {
    super();

    this.sprite = new Text(text, {
      align: "left",
      fill: inactiveColor,
      fontFamily: "Capture It",
      fontSize: 40,
    });
    this.sprite.layerName = Layers.MENU;
    this.sprite.interactive = true;
    this.sprite.addListener("mouseover", () => {
      this.sprite.style.fill = activeColor;
    });
    this.sprite.addListener("mouseout", () => {
      this.sprite.style.fill = inactiveColor;
    });
    this.sprite.addListener("click", onSpriteClick);
  }
}
