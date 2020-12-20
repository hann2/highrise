import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { SoundName } from "../../../core/resources/sounds";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { V2d } from "../../../core/Vector";
import { ShuffleRing } from "../../utils/ShuffleRing";

type EnemySoundRings = {
  [k in keyof EnemySounds]: ShuffleRing<SoundName>;
};

export interface EnemySounds {
  hit: SoundName[];
  targetAquired: SoundName[];
  attack: SoundName[];
  death: SoundName[];
  idle: SoundName[];
}

export default class EnemyVoice extends BaseEntity implements Entity {
  currentSound?: PositionalSound;
  sounds: EnemySoundRings;

  constructor(public getPosition: () => V2d, sounds: EnemySounds) {
    super();

    this.sounds = makeSoundRings(sounds);
  }

  onTick(dt: number) {
    this.currentSound?.setPosition(this.getPosition());

    if (this.currentSound?.isDestroyed) {
      this.currentSound = undefined;
    }
  }

  speak(soundClass: keyof EnemySounds, interrupt: boolean = false) {
    if (interrupt && this.currentSound) {
      this.currentSound.gain = 0;
      this.currentSound = undefined;
    }
    if (!this.currentSound) {
      const sound = this.sounds[soundClass].getNext();
      if (sound) {
        this.currentSound = this.game?.addEntity(
          new PositionalSound(sound, this.getPosition())
        );
      }
    }
  }
}

function makeSoundRings(character: EnemySounds): EnemySoundRings {
  const result = {} as EnemySoundRings;
  for (const [soundName, sounds] of Object.entries(character)) {
    result[soundName as keyof EnemySounds] = new ShuffleRing(sounds);
  }
  return result;
}