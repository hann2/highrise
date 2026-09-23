import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import ReactEntity from "../../core/ReactEntity";
import { smoothStep } from "../../core/util/MathUtil";
import { Persistence } from "../constants/constants";
import "./survivor-toast.css";

const FADE_TIME = 0.3;
const SHOW_TIME = 3;

/** "Cindy made it out!", shown for a few seconds when survivors escape. */
export default class SurvivorToast extends ReactEntity implements Entity {
  persistenceLevel = Persistence.Game;
  private opacity = 0;

  constructor(private names: string[]) {
    super(() => this.renderContent());
  }

  renderContent() {
    return (
      <div className="survivor-toast" style={{ opacity: this.opacity }}>
        {this.names.map((name) => (
          <div key={name}>
            <div className="survivor-toast__title">{name} made it out!</div>
            <div className="survivor-toast__subtitle">Now playable</div>
          </div>
        ))}
      </div>
    );
  }

  @on("add")
  async onAdd(data: { game: Game }) {
    super.onAdd(data);
    await this.wait(FADE_TIME, (_, t) => (this.opacity = smoothStep(t)));
    await this.wait(SHOW_TIME);
    await this.wait(FADE_TIME, (_, t) => (this.opacity = smoothStep(1 - t)));
    this.destroy();
  }
}
