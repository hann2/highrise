import { Graphics, Sprite, Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { Layer } from "../config/layers";
import { Persistence } from "../constants/constants";

const FADE_IN_TIME = 3.0;
const HOLD_TIME = 1.0;
const FADE_OUT_TIME = 1.5;

export default class GameOverScreen extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Menu;
  pausable = false;
  sprite: Sprite & GameSprite;
  titleText: Text;
  background: Graphics;

  constructor(victory: boolean) {
    super();

    const text = victory ? "You Win" : "You Lose";
    const backgroundColor = victory ? 0xffffff : 0x660000;
    const textColor = victory ? 0x000000 : 0x000000;

    this.sprite = new Sprite();
    this.sprite.layerName = Layer.MENU;

    this.background = new Graphics();
    this.background.beginFill(backgroundColor).drawRect(0, 0, 1, 1).endFill();
    this.sprite.addChild(this.background);

    this.titleText = new Text(text, {
      align: "center",
      fill: textColor,
      fontFamily: "Capture It",
      fontSize: 128,
    });
    this.titleText.anchor.set(0.5, 1.0);
    this.sprite.addChild(this.titleText);
  }

  async onAdd() {
    this.sprite.alpha = 0;
    await this.wait(FADE_IN_TIME, (dt, t) => {
      this.sprite.alpha = t;
    });
    this.sprite.alpha = 1;
    await this.wait(HOLD_TIME);
    await this.wait(FADE_OUT_TIME, (dt, t) => {
      this.sprite.alpha = 1.0 - t;
    });
    this.sprite.alpha = 0;
    this.destroy();
  }

  onResize([width, height]: [number, number]) {
    this.titleText.position.set(width / 2, height / 2);
    this.background.width = width;
    this.background.height = height;
  }
}
