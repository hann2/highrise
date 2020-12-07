import zombieHit1 from "../../../../resources/audio/zombie/zombie-hit-1.flac";
import zombieHit2 from "../../../../resources/audio/zombie/zombie-hit-2.flac";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { choose } from "../../../core/util/Random";
import Zombie from "./Zombie";

const SOUNDS = {
  hit: [zombieHit1, zombieHit2],
};

export default class ZombieVoice extends BaseEntity implements Entity {
  currentSound?: PositionalSound;
  constructor(public zombie: Zombie) {
    super();
  }

  // TODO: Handle the events that make us speak -- Do we actually want to do that here?

  onTick() {
    this.currentSound?.setPosition(this.zombie.getPosition());

    if (this.currentSound?.isDestroyed) {
      this.currentSound = undefined;
    }
  }

  speak(soundClass: keyof typeof SOUNDS) {
    // TODO: Interrupt sound
    if (!this.currentSound) {
      const sounds = SOUNDS[soundClass];
      if (sounds.length > 0) {
        const sound = choose(...sounds);
        this.currentSound = this.game?.addEntity(
          new PositionalSound(sound, this.zombie.getPosition())
        );
      }
    }
  }
}
