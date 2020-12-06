import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { SoundInstance } from "../../../core/sound/SoundInstance";
import { choose } from "../../../core/util/Random";
import { CharacterSoundClass } from "../../characters/Character";
import Human from "./Human";

export default class HumanVoice extends BaseEntity implements Entity {
  currentSound?: PositionalSound;
  constructor(public human: Human) {
    super();
  }

  // TODO: Handle the events that make us speak

  onTick() {
    this.currentSound?.setPosition(this.human.getPosition());

    if (this.currentSound?.isDestroyed) {
      this.currentSound = undefined;
    }
  }

  speak(soundClass: CharacterSoundClass) {
    // TODO: Interrupt sound
    if (!this.currentSound) {
      const sounds = this.human.character.sounds[soundClass];
      if (sounds.length > 0) {
        const sound = choose(...sounds);
        this.currentSound = this.game?.addEntity(
          new PositionalSound(sound, this.human.getPosition())
        );
      }
    }
  }
}
