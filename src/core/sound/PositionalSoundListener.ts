import BaseEntity from "../entity/BaseEntity";
import Entity from "../entity/Entity";
import { PositionalSound } from "./PositionalSound";
import { V2d } from "../Vector";
import Game from "../Game";

function isPositionalSound(e: Entity): e is PositionalSound {
  return e instanceof PositionalSound;
}
export default class PositionalSoundListener
  extends BaseEntity
  implements Entity {
  id = "positional_sound_listener";
  persistent = true;
  onTick() {}

  onAdd(game: Game) {
    // So we can get these all quickly
    game.entities.addFilter(isPositionalSound);
  }

  setPosition(position: V2d) {
    for (const sound of this.game!.entities.getByFilter(isPositionalSound)) {
      sound.setListenerPosition(position);
    }
  }
}
