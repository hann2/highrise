import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { Persistence } from "../constants/constants";
import CreditsScreen, { isCreditsOpen } from "./CreditsScreen";
import Encyclopedia, { isEncyclopediaOpen } from "./Encyclopedia";
import "./menu.css";
import {
  FeedbackButton,
  GraphicsButton,
  MenuButton,
  MenuButtons,
  MuteButton,
} from "./MenuButtons";
import { isUpgradeSelectOpen } from "./UpgradeSelect";

/**
 * Shows the menu when paused, invisible otherwise. In a run it can end the
 * run; in the lobby it can roll the credits instead.
 */
export default class PauseMenu extends ReactEntity implements Entity {
  persistenceLevel = Persistence.Game;
  pausable = false;
  visible = false;

  constructor(private place: "run" | "lobby" = "run") {
    super(() => this.renderContent());
  }

  renderContent() {
    // The upgrade screen pauses the game too, but isn't a pause. The
    // encyclopedia and credits cover the menu and give it back when they close.
    if (!this.visible || !this.takingInput) {
      return null;
    }
    const game = this.game;
    const resumeButton = game.io.usingGamepad ? "START" : "ESC";
    return (
      <div className="menu-screen">
        <div className="pause-menu__background" />
        <div className="menu-title menu-title--medium">PAUSED</div>
        <div className="menu-subtitle menu-subtitle--small">
          Press {resumeButton} to resume
        </div>
        <MenuButtons corner="top-left">
          {this.place === "run" && (
            <MenuButton onClick={() => this.quitRun()}>Quit Run</MenuButton>
          )}
          <MenuButton onClick={() => this.openEncyclopedia()}>
            Encyclopedia
          </MenuButton>
          {this.place === "lobby" && (
            <MenuButton onClick={() => this.rollCredits()}>Credits</MenuButton>
          )}
          <FeedbackButton />
          <MuteButton game={game} />
          <GraphicsButton game={game} />
        </MenuButtons>
      </div>
    );
  }

  /** Ends the run, which goes to the run summary and then the lobby */
  quitRun() {
    this.game.unpause();
    this.game.dispatch("gameOver", { victory: false });
    this.destroy();
  }

  /** Over the pause menu, with the game still paused */
  openEncyclopedia() {
    if (this.visible && !isEncyclopediaOpen(this.game)) {
      this.game.addEntity(new Encyclopedia(Persistence.Game));
    }
  }

  /** Over the pause menu, with the game still paused */
  rollCredits() {
    if (this.visible && !isCreditsOpen(this.game)) {
      this.game.addEntity(new CreditsScreen(Persistence.Game));
    }
  }

  /** Whether this menu is showing and in charge of the keys */
  private get takingInput(): boolean {
    return (
      !isUpgradeSelectOpen(this.game) &&
      !isEncyclopediaOpen(this.game) &&
      !isCreditsOpen(this.game)
    );
  }

  @on("add")
  onAdd(data: { game: Game }) {
    this.visible = data.game.paused;
    super.onAdd(data);
    document.addEventListener("fullscreenchange", this.onFullscreenChange);
  }

  @on("destroy")
  onDestroy(data: { game: Game }) {
    document.removeEventListener("fullscreenchange", this.onFullscreenChange);
    super.onDestroy(data);
  }

  // Browsers reserve Escape in fullscreen for leaving it and don't deliver the
  // key press, so leaving fullscreen pauses too.
  private onFullscreenChange = () => {
    if (!document.fullscreenElement) {
      this.game.pause();
    }
  };

  @on("pause")
  onPause() {
    this.visible = true;
  }

  @on("unpause")
  onUnpause() {
    this.visible = false;
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    if (!this.takingInput) {
      return;
    }
    if (key === "Escape") {
      this.game.togglePause();
    } else if (key === "KeyE") {
      this.openEncyclopedia();
    }
  }

  @on("buttonDown")
  onButtonDown({ button }: { button: ControllerButton }) {
    if (!this.takingInput) {
      return;
    }
    if (button === ControllerButton.START) {
      this.game.togglePause();
    } else if (button === ControllerButton.Y) {
      this.openEncyclopedia();
    }
  }
}
