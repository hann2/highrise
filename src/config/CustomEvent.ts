import type { V2d } from "../core/Vector";
import type { Character } from "../highrise/characters/Character";
import type { BaseEnemy } from "../highrise/enemies/base/Enemy";
import type Human from "../highrise/human/Human";
import type SurvivorHumanController from "../highrise/human/SurvivorHumanController";
import type { Level } from "../highrise/levels/Level";
import type { RunPlan } from "../highrise/run/RunPlan";
import type { SettingId } from "../highrise/settings/settings";

/**
 * Global event types that can be dispatched by the Game and listened to by entities.
 *
 * Call game.dispatch("startLevel", { level }) to dispatch an event.
 * Add an onStartLevel({ level }) method to an entity to listen for it.
 */
export type CustomEvents = {
  // Game flow
  /**
   * To the lobby: at boot (with the title screen first, and the tutorial
   * before the lobby until it's been played), after the tutorial, or after a run
   */
  goToLobby: { from: "boot" | "tutorial" | "run" };
  /** Plays the tutorial, which goes on to the lobby */
  startTutorial: void;
  /** Starts a run of the planned floors as `character`, from `startFloor` if given (a dev shortcut) */
  newGame: { character: Character; plan: RunPlan; startFloor?: number };
  startLevel: { level: Level };
  levelComplete: void;
  partyDead: void;
  gameOver: { victory: boolean };

  // Humans
  addToParty: { human: Human; survivorController?: SurvivorHumanController };
  humanInjured: { human: Human; amount: number };
  humanHealed: { human: Human; amount: number };
  humanDied: { human: Human };

  // Enemies
  zombieDied: { zombie: BaseEnemy; killer?: Human };
  /** A boss is dead, at `position`: `controllers/BossRewards` drops the loot */
  bossDied: { boss: BaseEnemy; position: V2d };

  // Environment
  lightsOn: { position: V2d };

  // Economy
  quartersCollected: { amount: number };
  quartersSpent: { amount: number };

  // Settings
  /** The player changed a setting (see `highrise/settings/settings.ts`) */
  settingChanged: { id: SettingId };
};
