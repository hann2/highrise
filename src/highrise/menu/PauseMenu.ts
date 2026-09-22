import { Container, Graphics, Text } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import { fontName } from "../../core/resources/resourceUtils";
import { V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import ClickableText from "./ClickableText";
import FeedbackButton from "./FeedbackButton";
import GraphicsButton from "./GraphicsButton";
import MuteButton from "./MuteButton";

// Shows the menu when paused, invisible otherwise
export default class PauseMenu extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  pausable = false;
  sprite: Container & GameSprite;
  feedbackButton: FeedbackButton;
  pausedText: Text;
  mainMenuButton: ClickableText;
  resumeText: Text;
  muteButton: ClickableText;
  graphicsButton: GraphicsButton;

  constructor() {
    super();

    this.sprite = new Container();
    this.sprite.layerName = Layer.MENU;
    this.sprite.visible = false;

    const background = new Graphics();
    background.rect(0, 0, 10000, 10000).fill({ color: 0x111111, alpha: 0.5 });
    this.sprite.addChild(background);

    this.pausedText = new Text({
      text: "PAUSED",
      style: {
        fontSize: 96,
        fontFamily: fontName("captureIt"),
        fill: "red",
        align: "center",
      },
    });
    this.pausedText.anchor.set(0.5, 1);
    this.sprite.addChild(this.pausedText);

    this.resumeText = new Text({
      text: "",
      style: {
        fontSize: 48,
        fontFamily: fontName("captureIt"),
        fill: "white",
        align: "center",
      },
    });
    this.resumeText.anchor.set(0.5, 0);
    this.sprite.addChild(this.resumeText);

    this.mainMenuButton = this.addChild(
      new ClickableText("Main Menu", () => {
        this.game?.unpause();
        this.game?.dispatch("gameOver", { victory: false });
        this.destroy();
      }),
    );

    this.feedbackButton = this.addChild(new FeedbackButton());

    this.muteButton = this.addChild(new MuteButton());

    this.graphicsButton = this.addChild(new GraphicsButton());
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    this.setVisibility(game.paused);
  }

  @on("inputDeviceChange")
  onInputDeviceChange({ usingGamepad }: { usingGamepad: boolean }) {
    const buttonName = usingGamepad ? "START" : "P";
    this.resumeText.text = `Press ${buttonName} to resume`;
  }

  @on("resize")
  onResize({ size: [width, height] }: { size: V2d }) {
    this.pausedText.position.set(width / 2, height / 2);
    this.resumeText.position.set(width / 2, height / 2);

    this.mainMenuButton.sprite.position.set(10, 10);
    this.feedbackButton.sprite.position.set(10, 50);
    this.muteButton.sprite.position.set(10, 90);
    this.graphicsButton.sprite.position.set(10, 130);
  }

  setVisibility(visible: boolean) {
    this.sprite.visible = visible;

    for (const button of [
      this.mainMenuButton,
      this.feedbackButton,
      this.muteButton,
      this.graphicsButton,
    ]) {
      button.sprite.visible = visible;
      button.sprite.eventMode = visible ? "static" : "none";
    }
  }

  @on("pause")
  onPause() {
    this.setVisibility(true);
  }

  @on("unpause")
  onUnpause() {
    this.setVisibility(false);
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    if (key === "KeyP") {
      this.game?.togglePause();
    }
  }

  @on("buttonDown")
  onButtonDown({ button }: { button: ControllerButton }) {
    if (button === ControllerButton.START) {
      this.game?.togglePause();
    }
  }
}
