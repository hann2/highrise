import snd_bassGrooveLoop1 from "../../../resources/audio/music/bass-groove-loop-1.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { Persistence } from "../constants/constants";

export const MUSIC_URLS = [snd_bassGrooveLoop1];
const MUSIC_VOLUME = 0.7;

export default class MusicController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Permanent;
  soundInstance: SoundInstance;

  constructor() {
    super();

    this.soundInstance = this.addChild(
      new SoundInstance(snd_bassGrooveLoop1, {
        continuous: true,
        gain: 0.0,
        reactToSlowMo: false,
        persistenceLevel: Persistence.Permanent,
        pauseable: false,
      })
    );
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
