import { Graphics, Sprite, Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import { Layer } from "../config/layers";
import ClickableText from "./ClickableText";
import FeedbackButton from "./FeedbackButton";
import MuteButton from "./MuteButton";

export default class PauseMenu extends BaseEntity implements Entity {
  persistent = true;
  pausable = false;
  sprite: Sprite & GameSprite;
  feedbackButton: FeedbackButton;
  pausedText: Text;
  mainMenuButton: ClickableText;
  resumeText: Text;
  muteButton: ClickableText;

  constructor() {
    super();

    this.sprite = new Sprite();
    this.sprite.layerName = Layer.MENU;
    this.sprite.visible = false;

    const background = new Graphics();
    background.beginFill(0x111111, 0.5);
    background.drawRect(0, 0, 10000, 10000);
    background.endFill();
    this.sprite.addChild(background);

    this.pausedText = new Text("PAUSED", {
      fontSize: 96,
      fontFamily: "Capture It",
      fill: "red",
      align: "center",
    });
    this.pausedText.anchor.set(0.5, 1);
    this.sprite.addChild(this.pausedText);

    this.resumeText = new Text("", {
      fontSize: 48,

      fontFamily: "Capture It",
      fill: "white",
      align: "center",
    });
    this.resumeText.anchor.set(0.5, 0);
    this.sprite.addChild(this.resumeText);

    this.mainMenuButton = this.addChild(
      new ClickableText("Main Menu", () => {
        this.game?.unpause();
        this.game?.dispatch({ type: "gameOver" });
        this.destroy();
      })
    );

    this.feedbackButton = this.addChild(new FeedbackButton());

    this.muteButton = this.addChild(new MuteButton());
  }

  handlers = {
    resize: () => this.positionText(),
    gameOver: () => this.destroy(),
  };

  onAdd(game: Game) {
    this.setVisibility(game.paused);
    this.positionText();
    this.onInputDeviceChange(game.io.usingGamepad);
  }

  onInputDeviceChange(usingGamepad: boolean) {
    const buttonName = usingGamepad ? "START" : "ESC";
    this.resumeText.text = `Press ${buttonName} to resume`;
  }

  positionText() {
    const [width, height] = this.game!.renderer.getSize();
    this.pausedText.position.set(width / 2, height / 2);
    this.resumeText.position.set(width / 2, height / 2);

    this.mainMenuButton.sprite.position.set(10, 10);
    this.feedbackButton.sprite.position.set(10, 50);
    this.muteButton.sprite.position.set(10, 90);
  }

  setVisibility(visible: boolean) {
    this.sprite.visible = visible;

    this.mainMenuButton.sprite.visible = visible;
    this.feedbackButton.sprite.visible = visible;
    this.muteButton.sprite.visible = visible;

    this.mainMenuButton.sprite.interactive = visible;
    this.feedbackButton.sprite.interactive = visible;
    this.muteButton.sprite.interactive = visible;
  }

  onPause() {
    this.setVisibility(true);
  }

  onUnpause() {
    this.setVisibility(false);
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
