import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { KeyCode } from "../../core/io/Keys";
import { Persistence } from "../constants/constants";
import { SettingId } from "../settings/settings";
import { getSetting, getSettings } from "../settings/SettingsController";

/**
 * The volume settings. Sounds go to `game.masterGain` unless told otherwise,
 * so that's made the sound effects' bus: it's moved off the speakers onto
 * `output`, the overall volume, and the music has its own bus, `musicGain`,
 * into `output` too (`MusicController` plays into it). M toggles mute.
 */
export default class VolumeController extends BaseEntity implements Entity {
  pausable = false;
  persistenceLevel = Persistence.Permanent;

  /** Everything, on its way to the speakers */
  private output!: GainNode;
  /** The music, on its way to `output` */
  musicGain!: GainNode;
  /** Quiet whatever the settings say, without changing them (the editor's preview) */
  private silenced = false;

  @on("add")
  onAdd({ game }: { game: Game }) {
    this.output = game.audio.createGain();
    this.output.connect(game.audio.destination);
    this.musicGain = game.audio.createGain();
    this.musicGain.connect(this.output);
    game.masterGain.disconnect();
    game.masterGain.connect(this.output);
    this.updateGains();
  }

  @on("settingChanged")
  onSettingChanged({ id }: { id: SettingId }) {
    if (
      id === "masterVolume" ||
      id === "musicVolume" ||
      id === "effectsVolume" ||
      id === "muted"
    ) {
      this.updateGains();
    }
  }

  private updateGains() {
    const game = this.game;
    const muted = getSetting(game, "muted");
    this.output.gain.value =
      muted || this.silenced ? 0 : getSetting(game, "masterVolume");
    this.musicGain.gain.value = getSetting(game, "musicVolume");
    game.masterGain.gain.value = getSetting(game, "effectsVolume");
  }

  /** Quiets everything (or lets it be heard again) without touching the saved settings */
  silence(silenced: boolean) {
    this.silenced = silenced;
    this.updateGains();
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    if (key === "KeyM") {
      const settings = getSettings(this.game);
      settings.set("muted", !settings.get("muted"));
    }
  }
}

export function getVolumeController(game: Game): VolumeController {
  return game.entities.getSingleton(VolumeController);
}
