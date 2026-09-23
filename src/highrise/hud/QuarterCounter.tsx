import Entity from "../../core/entity/Entity";
import ReactEntity from "../../core/ReactEntity";
import { Persistence } from "../constants/constants";
import { getPartyManager } from "../environment/PartyManager";
import "./hud.css";

/** How many quarters the party has, once it has found any. */
export class QuarterCounter extends ReactEntity implements Entity {
  persistenceLevel = Persistence.Game;
  private shown = false;

  constructor() {
    super(() => this.renderContent());
  }

  renderContent() {
    const quarters = getPartyManager(this.game)?.quarters ?? 0;
    this.shown ||= quarters > 0;
    if (!this.shown) {
      return null;
    }
    return (
      <div className="hud-quarters">
        <div className="hud-quarters__coin" />
        {quarters}
      </div>
    );
  }
}
