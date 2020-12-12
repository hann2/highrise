import { Sprite, Text } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import { clamp, smoothStep } from "../../core/util/MathUtil";
import { Layers } from "../layers";
import CreditsScreen from "./Credits";

let firstTime = true;
export default class MainMenu extends BaseEntity implements Entity {
  persistent = true;
  pausable = false;
  sprite: Sprite & GameSprite;

  titleText: Text;
  startText: Text;
  creditsButton: Text;

  constructor() {
    super();

    this.sprite = new Sprite();
    this.sprite.layerName = Layers.MENU;

    this.titleText = new Text("HIGHRISE", {
      fontSize: 128,
      fontFamily: "Capture It",
      fill: "red",
      align: "center",
    });
    this.titleText.anchor.set(0.5, 1.0);
    this.sprite.addChild(this.titleText);

    this.startText = new Text("Press Enter To Start", {
      fontSize: 64,
      fontFamily: "Capture It",
      fill: "white",
      align: "center",
    });
    this.startText.anchor.set(0.5, 0.0);
    this.sprite.addChild(this.startText);
    this.startText.interactive = true;
    this.startText.addListener("click", () => {
      this.startGame();
    });

    this.creditsButton = new Text("Credits", {
      fontSize: 48,
      fontFamily: "Capture It",
      fill: "white",
      align: "right",
    });
    this.creditsButton.anchor.set(1, 1);
    this.creditsButton.interactive = true;
    this.creditsButton.addListener("click", () => {
      this.rollCredits();
    });
    this.creditsButton.cursor = "pointer";
    this.creditsButton.addListener("mouseover", () => {
      this.creditsButton.scale.set(1.05);
    });
    this.creditsButton.addListener("mouseout", () => {
      this.creditsButton.scale.set(1.0);
    });
    this.sprite.addChild(this.creditsButton);
  }

  handlers = {
    resize: () => this.centerText(),
    newGame: () => {
      console.log("should destroy mainmenu");
      this.destroy();
    },
  };

  async onAdd(game: Game) {
    this.centerText();

    this.titleText.alpha = 0;
    this.startText.alpha = 0;
    this.creditsButton.alpha = 0;

    await this.wait(firstTime ? 7 : 4.0, (dt, t) => {
      this.titleText.alpha = smoothStep(clamp(t * 1.5));
      this.startText.alpha = smoothStep(clamp(3 * t - 2.0));
      this.creditsButton.alpha = smoothStep(clamp(3 * t - 2.0));
    });
    firstTime = false;
  }

  centerText() {
    const [width, height] = this.game?.renderer.getSize()!;
    this.titleText.x = width / 2;
    this.titleText.y = height / 2;
    this.startText.x = width / 2;
    this.startText.y = height / 2;
    this.creditsButton.x = width - 10;
    this.creditsButton.y = height - 10;
  }

  async rollCredits() {
    await this.wait();
    this.game?.addEntity(new CreditsScreen());
    this.creditsButton.interactive = false;
    this.startText.interactive = false;
    await this.wait(4.0, (dt, t) => {
      this.titleText.alpha = smoothStep(clamp(2.0 - 2 * t));
      this.startText.alpha = smoothStep(clamp(1.0 - 4 * t));
      this.creditsButton.alpha = smoothStep(clamp(1.0 - 4 * t));
    });
    console.log("roll credits");
    this.destroy();
  }

  async startGame() {
    this.creditsButton.interactive = false;
    this.startText.interactive = false;
    await this.wait(3.0, (dt, t) => {
      this.titleText.alpha = smoothStep(clamp(2.0 - 2 * t));
      this.startText.alpha = smoothStep(clamp(1.0 - 4 * t));
      this.creditsButton.alpha = smoothStep(clamp(1.0 - 4 * t));
    });
    this.game?.dispatch({ type: "newGame" });
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
