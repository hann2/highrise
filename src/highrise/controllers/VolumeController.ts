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

  private _muted = localStorage.getItem("muted") === "true";
  private _volume = loadSavedVolume();

  get muted(): boolean {
    return this._muted;
  }

  set muted(muted: boolean) {
    this._muted = muted;
    this.game.masterGain.gain.value = muted ? 0 : this.volume;
    localStorage.setItem("muted", muted ? "true" : "false");
    this.game.dispatch("muteChanged", {
      muted: this._muted,
      volume: this._volume,
    });
  }

  get volume() {
    return this._volume;
  }

  set volume(value: number) {
    if (!isNaN(value)) {
      this._volume = clamp(value);
      localStorage.setItem("volume", String(this._volume));
      this.game.dispatch("volumeChanged", {
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

function loadSavedVolume(): number {
  const saved = parseFloat(localStorage.getItem("volume") ?? "");
  return isNaN(saved) ? 1 : clamp(saved);
}

export function getVolumeController(game: Game): VolumeController {
  return game.entities.getSingleton(VolumeController);
}
