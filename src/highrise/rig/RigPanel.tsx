import Entity from "../../core/entity/Entity";
import ReactEntity from "../../core/ReactEntity";
import "./rig.css";
import type RigTestScene from "./RigTestScene";
import { RIG_SPEEDS } from "./RigTestScene";

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
          {scene.paused ? "Paused" : `Speed ×${scene.speed}`} · demonstration{" "}
          {scene.cycles}
        </div>
        <div className="rig-panel__keys">
          {RIG_SPEEDS.map((speed, i) => `${i + 1} ×${speed}`).join(" · ")} ·
          Space pause · . one frame · Enter again
        </div>
      </div>
    );
  }
}
