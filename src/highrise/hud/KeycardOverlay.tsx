import ReactEntity from "../../core/ReactEntity";
import { Persistence } from "../constants/constants";
import Human from "../human/Human";
import "./hud.css";

/** Shows how many keycards the player is carrying, when they have any */
export class KeycardOverlay extends ReactEntity {
  persistenceLevel = Persistence.Game;

  constructor(getHuman: () => Human) {
    super(() => {
      const keycards = getHuman().keycards;
      if (keycards <= 0) {
        return null;
      }
      return (
        <div className="hud-keycards">
          <span className="hud-keycard-icon" />
          {keycards > 1 ? `Keycard ×${keycards}` : "Keycard"}
        </div>
      );
    });
  }
}
