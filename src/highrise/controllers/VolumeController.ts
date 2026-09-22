import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { KeyCode } from "../../core/io/Keys";
import { clamp } from "../../core/util/MathUtil";
import { Persistence } from "../constants/constants";

export default class VolumeController extends BaseEntity implements Entity {
  pausable = false;
  persistenceLevel = Persistence.Permanent;

  private _muted!: boolean;
  private _volume!: number;

  constructor() {
    super();

    this.muted = localStorage.getItem("muted") === "true";
    const loadedVolume = parseFloat(localStorage.getItem("volume") ?? "");
    if (!isNaN(loadedVolume) && loadedVolume >= 0) {
      this.volume = clamp(loadedVolume);
    } else {
      this.volume = 1;
    }
  }

  get muted(): boolean {
    return this._muted;
  }

  set muted(muted: boolean) {
    this._muted = muted;
    if (this.game) {
      this.game.masterGain.gain.value = muted ? 0 : this.volume;
      localStorage.setItem("muted", muted ? "true" : "false");
      this.game.dispatch("muteChanged", {
        muted: this._muted,
        volume: this._volume,
      });
    }
  }

  get volume() {
    return this._volume;
  }

  set volume(value: number) {
    if (!isNaN(value)) {
      this._volume = clamp(value);
      localStorage.setItem("volume", String(value));
      this.game?.dispatch("volumeChanged", {
        muted: this._muted,
        volume: this._volume,
      });
    }
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    const gain = this._muted ? 0 : this._volume;
    game.masterGain.gain.value = gain;
  }

  @on("toggleMute")
  onToggleMute() {
    this.muted = !this._muted;
  }
  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    if (key === "KeyM") {
      this.muted = !this._muted;
    }
  }
}

export function getVolumeController(game: Game): VolumeController {
  return game.entities.getSingleton(VolumeController);
}
