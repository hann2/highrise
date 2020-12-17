import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import FPSMeter from "../../core/util/FPSMeter";
import { lerp } from "../../core/util/MathUtil";
import VisionController from "../lighting-and-vision/vision";

// Put stuff in here that we want to disable on actual release
export default class CheatController extends BaseEntity implements Entity {
  persistent = true;

  constructor() {
    super();
  }

  onKeyDown(key: KeyCode) {
    switch (key) {
      case "KeyL":
        console.log("dispatching levelComplete");
        this.game!.dispatch({ type: "levelComplete" });
        break;
      case "KeyV":
        console.log("Toggling vision");
        for (const visionController of this.game!.entities.getByFilter(
          (e): e is VisionController => e instanceof VisionController
        )) {
          visionController.sprite.visible = !visionController.sprite.visible;
        }
        break;
      case "Backslash":
        for (const fpsMeter of this.game!.entities.getByFilter(
          (e): e is FPSMeter => e instanceof FPSMeter
        )) {
          fpsMeter.sprite.visible = !fpsMeter.sprite.visible;
        }
    }
  }

  onTick() {
    const io = this.game!.io;
    if (io.usingGamepad) {
      const t = io.getButton(ControllerButton.LT);
      this.game!.slowMo = lerp(1.0, 0.5, t);
    } else {
      this.game!.slowMo = io.keyIsDown("ShiftLeft") ? 0.2 : 1.0;
    }
  }
}
