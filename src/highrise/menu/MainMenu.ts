import { Sprite, Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import { clamp, smoothStep } from "../../core/util/MathUtil";
import { Layer } from "../config/layers";
import ClickableText from "./ClickableText";
import CreditsScreen from "./Credits";
import FeedbackButton from "./FeedbackButton";

const FADE_OUT_TIME = process.env.NODE_ENV === "development" ? 0.1 : 2.2;

let firstTime = true;
export default class MainMenu extends BaseEntity implements Entity {
  persistent = true;
  pausable = false;
  sprite: Sprite & GameSprite;

  titleText: Text;
  startText: Text;
  inTransition: boolean = false;
  feedbackButton: FeedbackButton;
  creditsButton: ClickableText;

  constructor() {
    super();

    this.sprite = new Sprite();
    this.sprite.layerName = Layer.MENU;

    this.titleText = new Text("HIGHRISE", {
      align: "center",
      fill: "red",
      fontFamily: "Capture It",
      fontSize: 128,
    });
    this.titleText.anchor.set(0.5, 1.0);
    this.sprite.addChild(this.titleText);

    this.startText = new Text("Press Enter To Start", {
      align: "center",
      fill: "#fff",
      fontFamily: "Capture It",
      fontSize: 64,
    });
    this.startText.anchor.set(0.5, 0.0);
    this.sprite.addChild(this.startText);
    this.startText.interactive = true;
    this.startText.addListener("click", () => {
      this.startGame();
    });

    this.creditsButton = this.addChild(
      new ClickableText("Credits", () => this.rollCredits())
    );
    this.creditsButton.sprite.anchor.set(1, 1);
    (this.creditsButton.sprite as Text).style.align = "right";

    this.feedbackButton = this.addChild(new FeedbackButton());
    this.feedbackButton.sprite.anchor.set(1, 1);
    (this.feedbackButton.sprite as Text).style.align = "right";
  }

  handlers = {
    resize: () => this.positionText(),
    newGame: () => {
      console.log("should destroy mainmenu");
      this.destroy();
    },
  };

  async onAdd(game: Game) {
    this.positionText();
    this.onInputDeviceChange(game.io.usingGamepad);

    this.titleText.alpha = 0;
    this.startText.alpha = 0;
    this.creditsButton.sprite.alpha = 0;
    this.feedbackButton.sprite.alpha = 0;

    await this.wait(firstTime ? 5 : 3.0, (dt, t) => {
      this.titleText.alpha = smoothStep(clamp(t * 1.5));
      this.startText.alpha = smoothStep(clamp(2.8 * t - 1.8));
      this.creditsButton.sprite.alpha = smoothStep(clamp(2.8 * t - 1.8));
      this.feedbackButton.sprite.alpha = smoothStep(clamp(2.8 * t - 1.8));
    });
    firstTime = false;
  }

  positionText() {
    const [width, height] = this.game?.renderer.getSize()!;
    this.titleText.position.set(width / 2, height / 2);
    this.startText.position.set(width / 2, height / 2);
    this.creditsButton.sprite.position.set(width - 10, height - 50);
    this.feedbackButton.sprite.position.set(width - 10, height - 10);
  }

  async rollCredits() {
    if (!this.inTransition) {
      this.inTransition = true;
      await this.wait();
      this.game?.addEntity(new CreditsScreen());
      this.startText.interactive = false;
      this.creditsButton.sprite.interactive = false;
      this.feedbackButton.sprite.interactive = false;
      await this.wait(4.0, (dt, t) => {
        this.titleText.alpha = smoothStep(clamp(2.0 - 2 * t));
        this.startText.alpha = smoothStep(clamp(1.0 - 4 * t));
        this.creditsButton.sprite.alpha = smoothStep(clamp(1.0 - 4 * t));
        this.feedbackButton.sprite.alpha = smoothStep(clamp(1.0 - 4 * t));
      });
      console.log("roll credits");
      this.destroy();
    }
  }

  onInputDeviceChange(usingGamepad: boolean) {
    this.startText.text = usingGamepad
      ? "Press START to start"
      : "Press Enter to start";
  }

  async startGame() {
    if (!this.inTransition) {
      this.inTransition = true;
      this.startText.interactive = false;
      this.creditsButton.sprite.interactive = false;
      this.feedbackButton.sprite.interactive = false;
      await this.wait(FADE_OUT_TIME, (dt, t) => {
        this.titleText.alpha = smoothStep(clamp(1.5 - 1.5 * t));
        this.startText.alpha = smoothStep(clamp(1.0 - 4 * t));
        this.creditsButton.sprite.alpha = smoothStep(clamp(1.0 - 4 * t));
        this.feedbackButton.sprite.alpha = smoothStep(clamp(1.0 - 4 * t));
      });
      this.game?.dispatch({ type: "newGame" });
    }
  }

  onKeyDown(key: KeyCode) {
    if (key === "Enter") {
      this.startGame();
    } else if (key === "KeyC") {
      this.rollCredits();
    }
  }

  onButtonDown(button: ControllerButton) {
    if (button === ControllerButton.START) {
      this.startGame();
    } else if (button === ControllerButton.BACK) {
      this.rollCredits();
    }
  }
}
