import ReactEntity from "../../core/ReactEntity";
import { Persistence } from "../constants/constants";
import Human from "../human/Human";
import "./hud.css";

/** Below this fraction of max health the bar pulses (and the human limps) */
const LOW_HEALTH = 0.3;

/**
 * Bottom left of the screen. A second bar trails behind the health after a
 * hit, so you can see how much it took.
 */
export class HealthBar extends ReactEntity {
  persistenceLevel = Persistence.Game;

  constructor(getHuman: () => Human) {
    super(() => {
      const human = getHuman();
      if (human.isDestroyed) {
        return null;
      }
      const fraction = Math.max(0, human.hp / human.maxHp);
      const low = fraction < LOW_HEALTH;
      return (
        <div className={"hud-health" + (low ? " hud-health--low" : "")}>
          <div className="hud-health__bar">
            <div
              className="hud-health__trail"
              style={{ width: `${fraction * 100}%` }}
            />
            <div
              className="hud-health__fill"
              style={{ width: `${fraction * 100}%` }}
            />
          </div>
          <div className="hud-health__text">
            {Math.max(0, Math.ceil(human.hp))}
            <span className="hud-health__max"> / {human.maxHp}</span>
          </div>
        </div>
      );
    });
  }
}
