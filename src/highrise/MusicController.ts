import bassGrooveLoop1 from "../../resources/audio/music/bass-groove-loop-1.flac";
import BaseEntity from "../core/entity/BaseEntity";
import Entity from "../core/entity/Entity";
import { KeyCode } from "../core/io/Keys";
import { SoundInstance } from "../core/sound/SoundInstance";

export const MUSIC_URLS = [bassGrooveLoop1];

export default class MusicController extends BaseEntity implements Entity {
  persistent = true;
  soundInstance: SoundInstance;

  constructor() {
    super();

    this.soundInstance = this.addChild(
      new SoundInstance(bassGrooveLoop1, {
        continuous: true,
        gain: 0.0,
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
        this.soundInstance.gain = t ** 2 * 0.6;
      },
      "fade"
    );
    this.soundInstance.gain = 0.6;
  }

  onKeyDown(key: KeyCode) {
    if (key === "KeyM") {
      if (this.soundInstance.gain > 0) {
        this.soundInstance.gain = 0;
        this.clearTimers("fade");
      } else {
        this.fadeIn(0.5);
      }
    }
  }
}
