import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { smoothStep } from "../../core/util/MathUtil";
import { Persistence } from "../constants/constants";
import CharacterSelect from "./CharacterSelect";
import CreditsScreen from "./CreditsScreen";
import "./menu.css";
import { FeedbackButton, MenuButton, MenuButtons } from "./MenuButtons";

const FADE_OUT_TIME = process.env.NODE_ENV === "development" ? 0.1 : 2.2;

let firstTime = true;
export default class MainMenu extends ReactEntity implements Entity {
  persistenceLevel = Persistence.Floor;
  pausable = false;

  titleOpacity = 0;
  startOpacity = 0;
  buttonsOpacity = 0;
  inTransition: boolean = false;

  constructor() {
    super(() => this.renderContent());
  }

  renderContent() {
    const startButton = this.game.io.usingGamepad ? "START" : "Enter";
    return (
      <div
        className={`menu-screen ${this.inTransition ? "menu-screen--inactive" : ""}`}
      >
        <div className="menu-title" style={{ opacity: this.titleOpacity }}>
          HIGHRISE
        </div>
        <div
          className="menu-subtitle menu-subtitle--clickable"
          style={{ opacity: this.startOpacity }}
          onClick={() => this.startGame()}
        >
          Press {startButton} to start
        </div>
        <MenuButtons corner="bottom-right" opacity={this.buttonsOpacity}>
          <MenuButton onClick={() => this.rollCredits()}>Credits</MenuButton>
          <FeedbackButton />
        </MenuButtons>
      </div>
    );
  }

  @on("add")
  async onAdd(data: { game: Game }) {
    super.onAdd(data);
    await this.wait(firstTime ? 5 : 3.0, (_, t) => {
      this.titleOpacity = smoothStep(t * 1.5);
      this.startOpacity = smoothStep(2.8 * t - 1.8);
      this.buttonsOpacity = smoothStep(2.8 * t - 1.8);
    });
    firstTime = false;
  }

  async rollCredits() {
    if (!this.inTransition) {
      this.inTransition = true;
      await this.wait();
      this.game.addEntity(new CreditsScreen());
      await this.wait(4.0, (_, t) => {
        this.titleOpacity = smoothStep(2.0 - 2 * t);
        this.startOpacity = smoothStep(1.0 - 4 * t);
        this.buttonsOpacity = smoothStep(1.0 - 4 * t);
      });
      this.destroy();
    }
  }

  async startGame() {
    if (!this.inTransition) {
      this.inTransition = true;
      await this.wait(FADE_OUT_TIME, (_, t) => {
        this.titleOpacity = smoothStep(1.5 - 1.5 * t);
        this.startOpacity = smoothStep(1.0 - 4 * t);
        this.buttonsOpacity = smoothStep(1.0 - 4 * t);
      });
      this.game.addEntity(new CharacterSelect());
      this.destroy();
    }
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    if (key === "Enter") {
      this.startGame();
    } else if (key === "KeyC") {
      this.rollCredits();
    }
  }

  @on("buttonDown")
  onButtonDown({ button }: { button: ControllerButton }) {
    if (button === ControllerButton.START) {
      this.startGame();
    } else if (button === ControllerButton.BACK) {
      this.rollCredits();
    }
  }
}
