import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { KeyCode } from "../../../core/io/Keys";

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
    }
  }
}
