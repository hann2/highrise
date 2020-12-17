import snd_bassGrooveLoop1 from "../../../resources/audio/music/bass-groove-loop-1.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SoundInstance } from "../../core/sound/SoundInstance";

export const MUSIC_URLS = [snd_bassGrooveLoop1];
const MUSIC_VOLUME = 0.7;

export default class MusicController extends BaseEntity implements Entity {
  persistent = true;
  soundInstance: SoundInstance;

  constructor() {
    super();

    this.soundInstance = this.addChild(
      new SoundInstance(snd_bassGrooveLoop1, {
        continuous: true,
        gain: 0.0,
        reactToSlowMo: false,
      })
    );
    this.soundInstance.pausable = false;
    this.soundInstance.persistent = true;
  }

  async onAdd() {
    this.fadeIn(4);
  }

  async fadeIn(seconds = 2) {
    await this.wait(
      seconds,
      (_, t) => {
        this.soundInstance.gain = t ** 2 * MUSIC_VOLUME;
      },
      "fade"
    );
    this.soundInstance.gain = MUSIC_VOLUME;
  }
}
