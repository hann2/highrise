import ReactEntity from "../../core/ReactEntity";
import type BossFight from "../boss-levels/BossFight";
import "./boss-bar.css";

/** Seconds the bar says the way up is open, once the fight's won */
const WON_MESSAGE_TIME = 4;

/**
 * Across the top of the screen while a boss level's fight is on: what it is,
 * and how it's going (the boss's health, a timer...), as its goal says. Once
 * it's won it says the stairwell is open, and fades away.
 */
export default class BossBar extends ReactEntity {
  constructor(fight: BossFight) {
    super(() => {
      if (!fight.started) {
        return null;
      }
      if (fight.won) {
        if (fight.timeSinceWon > WON_MESSAGE_TIME) {
          return null;
        }
        return (
          <div className="boss-bar boss-bar--won">
            <div className="boss-bar__title">{fight.title}</div>
            <div className="boss-bar__text">The stairwell is open</div>
          </div>
        );
      }
      const { fraction, text } = fight.goal.readout();
      const percent = `${Math.min(1, Math.max(0, fraction)) * 100}%`;
      return (
        <div className="boss-bar">
          <div className="boss-bar__title">{fight.title}</div>
          <div className="boss-bar__bar">
            <div className="boss-bar__trail" style={{ width: percent }} />
            <div className="boss-bar__fill" style={{ width: percent }} />
          </div>
          {text && <div className="boss-bar__text">{text}</div>}
        </div>
      );
    });
  }
}
