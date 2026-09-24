import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { smoothStep } from "../../core/util/MathUtil";
import { Persistence } from "../constants/constants";
import CreditsScreen, { isCreditsOpen } from "./CreditsScreen";
import Encyclopedia, { isEncyclopediaOpen } from "./Encyclopedia";
import "./menu.css";
import { FeedbackButton, MenuButton, MenuButtons } from "./MenuButtons";

const FADE_IN_TIME = 1;
const FADE_OUT_TIME = process.env.NODE_ENV === "development" ? 0.1 : 1.0;

/**
 * The title, shown on black when the game boots, before there's any world.
 * Starting fades it away, leaving the black, and then calls `onStart`, which
 * builds the lobby with the player riding up to it in the elevator.
 */
export default class TitleScreen extends ReactEntity implements Entity {
  persistenceLevel = Persistence.Game;
  pausable = false;

  // The title only shows at boot, where the loading screen leaves the title up
  // in the same place, so it starts out visible and only the rest fades in
  titleOpacity = 1;
  startOpacity = 0;
  buttonsOpacity = 0;
  inTransition: boolean = false;

  constructor(private onStart: () => void) {
    super(() => this.renderContent());
  }

  /** Whether another screen is over this one and has the input */
  private get covered(): boolean {
    return isEncyclopediaOpen(this.game) || isCreditsOpen(this.game);
  }

  renderContent() {
    const startButton = this.game.io.usingGamepad ? "START" : "Enter";
    // The encyclopedia and credits cover the title and give it back when they close
    if (this.covered) {
      return null;
    }
    return (
      <div
        className={`menu-screen ${this.inTransition ? "menu-screen--inactive" : ""}`}
      >
        <div className="title-screen__blackout" />
        <div className="menu-title" style={{ opacity: this.titleOpacity }}>
          HIGHRISE
        </div>
        <div
          className="menu-subtitle menu-subtitle--clickable"
          style={{ opacity: this.startOpacity }}
          onClick={() => this.start()}
        >
          Press {startButton} to start
        </div>
        <MenuButtons corner="bottom-right" opacity={this.buttonsOpacity}>
          <MenuButton onClick={() => this.openEncyclopedia()}>
            Encyclopedia
          </MenuButton>
          <MenuButton onClick={() => this.rollCredits()}>Credits</MenuButton>
          <FeedbackButton />
        </MenuButtons>
      </div>
    );
  }

  @on("add")
  async onAdd(data: { game: Game }) {
    super.onAdd(data);
    await this.wait(FADE_IN_TIME, (_, t) => {
      if (!this.inTransition) {
        this.startOpacity = smoothStep(t);
        this.buttonsOpacity = smoothStep(t);
      }
    });
  }

  rollCredits() {
    if (!this.inTransition && !this.covered) {
      this.game.addEntity(new CreditsScreen(this.persistenceLevel));
    }
  }

  openEncyclopedia() {
    if (!this.inTransition && !this.covered) {
      this.game.addEntity(new Encyclopedia(this.persistenceLevel));
    }
  }

  async start() {
    if (!this.inTransition && !this.covered) {
      this.inTransition = true;
      const from = {
        title: this.titleOpacity,
        start: this.startOpacity,
        buttons: this.buttonsOpacity,
      };
      await this.wait(FADE_OUT_TIME, (_, t) => {
        this.titleOpacity = from.title * smoothStep(1 - t);
        this.startOpacity = from.start * smoothStep(1 - 2 * t);
        this.buttonsOpacity = from.buttons * smoothStep(1 - 2 * t);
      });
      // The world fades up from black from here
      this.onStart();
      this.destroy();
    }
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    if (this.covered) {
      return;
    }
    if (key === "Enter") {
      this.start();
    } else if (key === "KeyC") {
      this.rollCredits();
    } else if (key === "KeyE") {
      this.openEncyclopedia();
    }
  }

  @on("buttonDown")
  onButtonDown({ button }: { button: ControllerButton }) {
    if (this.covered) {
      return;
    }
    if (button === ControllerButton.START) {
      this.start();
    } else if (button === ControllerButton.BACK) {
      this.rollCredits();
    } else if (button === ControllerButton.Y) {
      this.openEncyclopedia();
    }
  }
}
