import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import ReactEntity from "../../core/ReactEntity";
import { Persistence } from "../constants/constants";
import "./menu.css";
import {
  FeedbackButton,
  GraphicsButton,
  MenuButton,
  MenuButtons,
  MuteButton,
} from "./MenuButtons";
import { isUpgradeSelectOpen } from "./UpgradeSelect";

// Shows the menu when paused, invisible otherwise
export default class PauseMenu extends ReactEntity implements Entity {
  persistenceLevel = Persistence.Game;
  pausable = false;
  visible = false;

  constructor() {
    super(() => this.renderContent());
  }

  renderContent() {
    // The upgrade screen pauses the game too, but isn't a pause
    if (!this.visible || isUpgradeSelectOpen(this.game)) {
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
          <MenuButton onClick={() => this.goToMainMenu()}>Main Menu</MenuButton>
          <FeedbackButton />
          <MuteButton game={game} />
          <GraphicsButton game={game} />
        </MenuButtons>
      </div>
    );
  }

  goToMainMenu() {
    this.game.unpause();
    this.game.dispatch("gameOver", { victory: false });
    this.destroy();
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
    if (key === "Escape" && !isUpgradeSelectOpen(this.game)) {
      this.game.togglePause();
    }
  }

  @on("buttonDown")
  onButtonDown({ button }: { button: ControllerButton }) {
    if (button === ControllerButton.START && !isUpgradeSelectOpen(this.game)) {
      this.game.togglePause();
    }
  }
}
