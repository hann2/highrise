import { Container, Graphics, Text } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { fontName } from "../../core/resources/resourceUtils";
import { V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";

const FADE_IN_TIME = 3.0;
const HOLD_TIME = 1.0;
const FADE_OUT_TIME = 1.5;

export default class GameOverScreen extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Menu;
  pausable = false;
  sprite: Container & GameSprite;
  titleText: Text;
  background: Graphics;

  constructor(victory: boolean) {
    super();

    const text = victory ? "You Win" : "You Lose";
    const backgroundColor = victory ? 0xffffff : 0x660000;
    const textColor = victory ? 0x000000 : 0x000000;

    this.sprite = new Container();
    this.sprite.layerName = Layer.MENU;

    this.background = new Graphics();
    this.background.rect(0, 0, 1, 1).fill(backgroundColor);
    this.sprite.addChild(this.background);

    this.titleText = new Text({
      text,
      style: {
        align: "center",
        fill: textColor,
        fontFamily: fontName("captureIt"),
        fontSize: 128,
      },
    });
    this.titleText.anchor.set(0.5, 1.0);
    this.sprite.addChild(this.titleText);
  }

  async onAdd() {
    this.sprite.alpha = 0;
    await this.wait(FADE_IN_TIME, (_, t) => {
      this.sprite.alpha = t;
    });
    this.sprite.alpha = 1;
    await this.wait(HOLD_TIME);
    await this.wait(FADE_OUT_TIME, (_, t) => {
      this.sprite.alpha = 1.0 - t;
    });
    this.sprite.alpha = 0;
    this.destroy();
  }

  onResize({ size: [width, height] }: { size: V2d }) {
    this.titleText.position.set(width / 2, height / 2);
    this.background.width = width;
    this.background.height = height;
  }
}
