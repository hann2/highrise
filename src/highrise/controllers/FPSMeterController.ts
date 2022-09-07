import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { KeyCode } from "../../core/io/Keys";
import FPSMeter from "../../core/util/FPSMeter";
import { Persistence } from "../constants/constants";

export class FPSMeterController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Permanent;

  constructor() {
    super();
  }

  onAdd(game: Game) {
    for (const fpsMeter of game.entities.getByFilter(
      (e): e is FPSMeter => e instanceof FPSMeter
    )) {
      fpsMeter.sprite.visible = false;
    }
  }

  onKeyDown(key: KeyCode) {
    if (key === "Backslash") {
      for (const fpsMeter of this.game!.entities.getByFilter(
        (e): e is FPSMeter => e instanceof FPSMeter
      )) {
        fpsMeter.sprite.visible = !fpsMeter.sprite.visible;
      }
    }
  }
}
