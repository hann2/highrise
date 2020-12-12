import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { KeyCode } from "../../../core/io/Keys";
import FPSMeter from "../../../core/util/FPSMeter";

// Put stuff in here that we want to disable on actual release
export default class CheatController extends BaseEntity implements Entity {
  persistent = true;

  constructor() {
    super();
  }

  onKeyDown(key: KeyCode) {
    switch (key) {
      case "KeyL":
        console.log("dispatching newGame");
        this.game!.dispatch({ type: "newGame" });
        break;
      case "Backslash":
        const fpsMeter = this.game?.entities.getByFilter(
          (e): e is FPSMeter => e instanceof FPSMeter
        )[0];
        fpsMeter!.sprite.visible = !fpsMeter?.sprite.visible;
    }
  }
}
