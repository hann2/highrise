import { Graphics, Sprite, Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import { Layers } from "../layers";

export default class PauseMenuController extends BaseEntity implements Entity {
  persistent = true;
  pausable = false;
  sprite: Sprite & GameSprite;
  constructor() {
    super();

    this.sprite = new Sprite();
    this.sprite.layerName = Layers.MENU;
    this.sprite.visible = false;

    const background = new Graphics();
    background.beginFill(0x331111, 0.3);
    background.drawRect(-5000, -5000, 10000, 10000);
    background.endFill();
    this.sprite.addChild(background);

    const text = new Text("PAUSED", {
      fontSize: 64,
      fontFamily: "Capture It",
      fill: "white",
      align: "center",
    });
    text.anchor.set(0.5, 0.5);
    this.sprite.addChild(text);
  }

  handlers = {
    resize: () => this.centerText(),
    gameOver: () => this.destroy(),
  };

  onAdd() {
    this.centerText();
  }

  centerText() {
    this.sprite.x = this.game!.renderer.getWidth() / 2;
    this.sprite.y = this.game!.renderer.getHeight() / 3;
  }

  onPause() {
    this.sprite.visible = true;
  }

  onUnpause() {
    this.sprite.visible = false;
  }

  onKeyDown(key: KeyCode) {
    if (key === "Escape") {
      this.game?.togglePause();
    }
  }

  onButtonDown(button: ControllerButton) {
    if (button === ControllerButton.START) {
      this.game?.togglePause();
    }
  }
}
