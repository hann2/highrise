import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import ReactEntity from "../../core/ReactEntity";
import { Persistence } from "../constants/constants";
import "./menu.css";

const FADE_IN_TIME = 3.0;
const HOLD_TIME = 1.0;
const FADE_OUT_TIME = 1.5;

export default class GameOverScreen extends ReactEntity implements Entity {
  persistenceLevel = Persistence.Menu;
  pausable = false;
  opacity = 0;

  constructor(private victory: boolean) {
    super(() => this.renderContent());
  }

  renderContent() {
    return (
      <div
        className="game-over"
        style={{
          opacity: this.opacity,
          background: this.victory ? "#ffffff" : "#660000",
        }}
      >
        <div className="menu-title menu-title--dark">
          {this.victory ? "You Win" : "You Lose"}
        </div>
      </div>
    );
  }

  @on("add")
  async onAdd(data: { game: Game }) {
    super.onAdd(data);
    await this.wait(FADE_IN_TIME, (_, t) => {
      this.opacity = t;
    });
    this.opacity = 1;
    await this.wait(HOLD_TIME);
    await this.wait(FADE_OUT_TIME, (_, t) => {
      this.opacity = 1.0 - t;
    });
    this.opacity = 0;
    this.destroy();
  }
}
