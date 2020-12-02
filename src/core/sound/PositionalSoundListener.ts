import BaseEntity from "../entity/BaseEntity";
import Entity from "../entity/Entity";
import { PositionalSound } from "./PositionalSound";
import { V2d } from "../Vector";

export default class PositionalSoundListener
  extends BaseEntity
  implements Entity {
  id = "positional_sound_listener";
  persistent = true;
  onTick() {}

  setPosition(position: V2d) {
    for (const sound of this.getPositionalSounds()) {
      sound.setListenerPosition(position);
    }
  }

  private getPositionalSounds(): PositionalSound[] {
    return this.game!.entities.getTagged(
      "positional_sound"
    ) as PositionalSound[];
  }
}
