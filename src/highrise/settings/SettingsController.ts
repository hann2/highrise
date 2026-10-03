import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { Persistence } from "../constants/constants";
import {
  getDefinition,
  loadSettings,
  saveSetting,
  SETTING_IDS,
  SettingId,
  SettingValues,
  ValueOf,
} from "./settings";

/**
 * Keeps the player's settings (see `settings.ts`): changing one saves it,
 * applies it, and dispatches `settingChanged`, which the systems that read a
 * setting when they're made listen for. Added before anything else, so those
 * systems can read it. At startup `apply` only finds the game's own things
 * (resolution, frame rate); anything made later reads its settings when it's
 * made (the volumes, the auto-pauser, the stats overlay).
 */
export default class SettingsController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Permanent;
  pausable = false;

  private values: SettingValues = loadSettings();

  @on("add")
  onAdd({ game }: { game: Game }) {
    for (const id of SETTING_IDS) {
      const definition = getDefinition(id);
      if (!definition.read) {
        definition.apply?.(game, this.values[id]);
      }
    }
  }

  get<K extends SettingId>(id: K): ValueOf<K> {
    const definition = getDefinition(id);
    return definition.read ? definition.read() : this.values[id];
  }

  set<K extends SettingId>(id: K, value: ValueOf<K>) {
    const definition = getDefinition(id);
    (this.values as Record<SettingId, ValueOf<K>>)[id] = value;
    if (!definition.read) {
      saveSetting(id, value);
    }
    definition.apply?.(this.game, value);
    this.game.dispatch("settingChanged", { id });
  }

  /** Every setting back to its default */
  resetAll() {
    for (const id of SETTING_IDS) {
      const definition = getDefinition(id);
      if (this.get(id) !== definition.default) {
        this.set(id, definition.default);
      }
    }
  }
}

export function getSettings(game: Game): SettingsController {
  return game.entities.getSingleton(SettingsController);
}

/** One of the player's settings */
export function getSetting<K extends SettingId>(game: Game, id: K): ValueOf<K> {
  return getSettings(game).get(id);
}
