import { Graphics, Sprite, Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import { Layers } from "../layers";

export default class MainMenu extends BaseEntity implements Entity {
  persistent = true;
  pausable = false;
  sprite: Sprite & GameSprite;

  constructor() {
    super();

    this.sprite = new Sprite();
    this.sprite.layerName = Layers.MENU;

    const text = new Text("Press Enter To Start", {
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
    newGame: () => {
      console.log("should destroy mainmenu");
      this.destroy();
    },
  };

  onAdd(game: Game) {
    this.centerText();
  }

  centerText() {
    this.sprite.x = this.game!.renderer.getWidth() / 2;
    this.sprite.y = this.game!.renderer.getHeight() / 3;
  }

  onKeyDown(key: KeyCode) {
    if (key === "Enter") {
      this.game?.dispatch({ type: "newGame" });
      console.log("should start new game", this.game != null);
    }
  }

  onButtonDown(button: ControllerButton) {
    if (button === ControllerButton.START) {
      this.game?.dispatch({ type: "newGame" });
    }
  }
}
