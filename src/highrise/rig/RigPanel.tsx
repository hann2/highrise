import Entity from "../../core/entity/Entity";
import ReactEntity from "../../core/ReactEntity";
import Gun from "../weapons/guns/Gun";
import { POINT_COLORS } from "./RigOverlay";
import "./rig.css";
import type RigTestScene from "./RigTestScene";
import { RIG_SPEEDS } from "./RigTestScene";

const hex = (color: number) => `#${color.toString(16).padStart(6, "0")}`;

/** What the rig scene is doing and which keys do what, in the corner */
export default class RigPanel extends ReactEntity implements Entity {
  pausable = false;

  constructor(private scene: RigTestScene) {
    super(() => this.renderPanel());
  }

  private renderPanel() {
    const { scene } = this;
    return (
      <div className="rig-panel">
        <div className="rig-panel__title">Rig</div>
        <div>
          {scene.mode === "demo" ? "Shooting and reloading" : scene.mode} ·{" "}
          {scene.paused ? "paused" : `×${scene.speed}`} · {scene.cycles}
        </div>
        <table className="rig-panel__guns">
          <tbody>
            {scene.humans.map((human, i) => {
              const gun = human.weapon as Gun;
              const { animation, time } = gun.animator;
              return (
                <tr key={i}>
                  <td>{gun.stats.name}</td>
                  <td>{animation?.name ?? ""}</td>
                  <td className="rig-panel__time">
                    {animation
                      ? `${time.toFixed(2)} / ${animation.duration.toFixed(2)}`
                      : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {scene.showingPoints && (
          <div className="rig-panel__legend">
            {Object.entries(POINT_COLORS).map(([name, color]) => (
              <span key={name}>
                <span
                  className="rig-panel__dot"
                  style={{ background: hex(color) }}
                />
                {name}
              </span>
            ))}
            <span>◯ hands</span>
          </div>
        )}
        <div className="rig-panel__keys">
          {RIG_SPEEDS.map((speed, i) => `${i + 1} ×${speed}`).join(" · ")} ·
          Space pause · . one frame · ← → scrub (paused) · M mode · G points ·
          Enter start over
        </div>
      </div>
    );
  }
}
