import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { SoundName } from "../../../core/resources/sounds";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { choose } from "../../../core/util/Random";
import {
  CharacterSoundClass,
  CharacterSounds,
} from "../../characters/Character";
import { ShuffleRing } from "../../utils/ShuffleRing";
import Human from "./Human";

export default class HumanVoice extends BaseEntity implements Entity {
  currentSound?: PositionalSound;
  sounds: CharacterSoundRings;

  constructor(public human: Human) {
    super();

    this.sounds = makeSoundRings(human.character.sounds);
  }

  // TODO: Handle the events that make us speak -- Do we actually want to do that here?

  onTick() {
    this.currentSound?.setPosition(this.human.getPosition());

    if (this.currentSound?.isDestroyed) {
      this.currentSound = undefined;
    }
  }

  speak(soundClass: CharacterSoundClass, interrupt: boolean = false) {
    // TODO: Interrupt sound
    if (interrupt && this.currentSound) {
      this.currentSound.gain = 0;
      this.currentSound = undefined;
    }
    if (interrupt || !this.currentSound) {
      const sound = this.sounds[soundClass].getNext();
      if (sound) {
        this.currentSound = this.game?.addEntity(
          new PositionalSound(sound, this.human.getPosition())
        );
      }
    }
  }
}

function makeSoundRings(character: CharacterSounds): CharacterSoundRings {
  const result = {} as CharacterSoundRings;
  for (const [soundName, sounds] of Object.entries(character)) {
    result[soundName as CharacterSoundClass] = new ShuffleRing(sounds);
  }
  return result;
}

type CharacterSoundRings = {
  [k in keyof CharacterSounds]: ShuffleRing<SoundName>;
};
