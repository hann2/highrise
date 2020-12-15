import snd_rachelZombie5 from "../../../../resources/audio/zombie/ rachel-zombie-5.flac";
import snd_rachelZombie1 from "../../../../resources/audio/zombie/rachel-zombie-1.flac";
import snd_rachelZombie10 from "../../../../resources/audio/zombie/rachel-zombie-10.flac";
import snd_rachelZombie11 from "../../../../resources/audio/zombie/rachel-zombie-11.flac";
import snd_rachelZombie12 from "../../../../resources/audio/zombie/rachel-zombie-12.flac";
import snd_rachelZombie13 from "../../../../resources/audio/zombie/rachel-zombie-13.flac";
import snd_rachelZombie2 from "../../../../resources/audio/zombie/rachel-zombie-2.flac";
import snd_rachelZombie3 from "../../../../resources/audio/zombie/rachel-zombie-3.flac";
import snd_rachelZombie4 from "../../../../resources/audio/zombie/rachel-zombie-4.flac";
import snd_rachelZombie6 from "../../../../resources/audio/zombie/rachel-zombie-6.flac";
import snd_rachelZombie7 from "../../../../resources/audio/zombie/rachel-zombie-7.flac";
import snd_rachelZombie8 from "../../../../resources/audio/zombie/rachel-zombie-8.flac";
import snd_rachelZombie9 from "../../../../resources/audio/zombie/rachel-zombie-9.flac";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { SoundName } from "../../../core/resources/sounds";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { choose, rBool } from "../../../core/util/Random";
import { ShuffleRing } from "../../utils/ShuffleRing";

export default class ZombieVoice extends BaseEntity implements Entity {
  currentSound?: PositionalSound;
  sounds: ZombieSoundRings;

  constructor(public zombie: BaseEntity) {
    super();

    this.sounds = makeSoundRings(choose(...ZOMBIE_SOUNDS));
  }

  // TODO: Handle the events that make us speak -- Do we actually want to do that here?

  onTick(dt: number) {
    this.currentSound?.setPosition(this.zombie.getPosition());

    if (this.currentSound?.isDestroyed) {
      this.currentSound = undefined;
    }

    if (this.currentSound === undefined && rBool(0.005 * dt)) {
      this.speak("idle");
    }
  }

  speak(soundClass: keyof ZombieSounds, interrupt: boolean = false) {
    if (interrupt && this.currentSound) {
      this.currentSound.gain = 0;
      this.currentSound = undefined;
    }
    if (!this.currentSound) {
      const sound = this.sounds[soundClass].getNext();
      if (sound) {
        this.currentSound = this.game?.addEntity(
          new PositionalSound(sound, this.zombie.getPosition())
        );
      }
    }
  }
}

function makeSoundRings(character: ZombieSounds): ZombieSoundRings {
  const result = {} as ZombieSoundRings;
  for (const [soundName, sounds] of Object.entries(character)) {
    result[soundName as keyof ZombieSounds] = new ShuffleRing(sounds);
  }
  return result;
}

type ZombieSoundRings = {
  [k in keyof ZombieSounds]: ShuffleRing<SoundName>;
};

interface ZombieSounds {
  hit: SoundName[];
  targetAquired: SoundName[];
  attack: SoundName[];
  death: SoundName[];
  idle: SoundName[];
}

const rachelZombieSounds: ZombieSounds = {
  hit: [snd_rachelZombie5, snd_rachelZombie6, snd_rachelZombie13],
  targetAquired: [snd_rachelZombie1, snd_rachelZombie8],
  attack: [snd_rachelZombie4, snd_rachelZombie7, snd_rachelZombie10],
  death: [snd_rachelZombie3, snd_rachelZombie9, snd_rachelZombie12],
  idle: [snd_rachelZombie2, snd_rachelZombie11],
};

export const ZOMBIE_SOUNDS: ZombieSounds[] = [rachelZombieSounds];