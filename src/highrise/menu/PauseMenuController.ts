import { Graphics, Sprite, Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import { Layers } from "../layers";
import ClickableText from "./ClickableText";
import FeedbackButton from "./FeedbackButton";
import MainMenu from "./MainMenu";

export default class PauseMenuController extends BaseEntity implements Entity {
  persistent = true;
  pausable = false;
  sprite: Sprite & GameSprite;
  feedbackButton: FeedbackButton;
  pausedText: Text;
  mainMenuButton: ClickableText;
  resumeText: Text;

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

    this.pausedText = new Text("PAUSED", {
      fontSize: 64,
      fontFamily: "Capture It",
      fill: "white",
      align: "center",
    });
    this.pausedText.anchor.set(0.5, 1);
    this.sprite.addChild(this.pausedText);
    this.resumeText = new Text("Press ESC to resume", {
      fontSize: 48,
      fontFamily: "Capture It",
      fill: "red",
      align: "center",
    });
    this.resumeText.anchor.set(0.5, 0);
    this.sprite.addChild(this.resumeText);

    this.mainMenuButton = this.addChild(
      new ClickableText("Main Menu", () => {
        this.game!.addEntity(new MainMenu());
        this.destroy();
      })
    );

    this.feedbackButton = this.addChild(new FeedbackButton());
  }

  handlers = {
    resize: () => this.positionText(),
    gameOver: () => this.destroy(),
  };

  onAdd() {
    this.positionText();
  }

  positionText() {
    const [width, height] = this.game!.renderer.getSize();
    this.pausedText.position.set(width / 2, height / 2);
    this.resumeText.position.set(width / 2, height / 2);

    this.mainMenuButton.sprite.position.set(10, 10);
    this.feedbackButton.sprite.position.set(10, 50);
  }

  onPause() {
    this.sprite.visible = true;
    this.mainMenuButton.sprite.visible = true;
    this.feedbackButton.sprite.visible = true;
    this.mainMenuButton.sprite.interactive = true;
    this.feedbackButton.sprite.interactive = true;
  }

  onUnpause() {
    this.sprite.visible = false;
    this.mainMenuButton.sprite.visible = false;
    this.feedbackButton.sprite.visible = false;
    this.mainMenuButton.sprite.interactive = false;
    this.feedbackButton.sprite.interactive = false;
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
