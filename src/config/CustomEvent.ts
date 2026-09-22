import type { V2d } from "../core/Vector";
import type { Character } from "../highrise/characters/Character";
import type { GraphicsQuality } from "../highrise/controllers/GraphicsQualityController";
import type { BaseEnemy } from "../highrise/enemies/base/Enemy";
import type Human from "../highrise/human/Human";
import type SurvivorHumanController from "../highrise/human/SurvivorHumanController";
import type { Level } from "../highrise/levels/Level";

/**
 * Global event types that can be dispatched by the Game and listened to by entities.
 *
 * Call game.dispatch("startLevel", { level }) to dispatch an event.
 * Add an onStartLevel({ level }) method to an entity to listen for it.
 */
export type CustomEvents = {
  // Game flow
  goToMainMenu: void;
  newGame: { character: Character };
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

  // Environment
  lightsOn: { position: V2d };

  // Settings
  toggleGraphicsQuality: void;
  graphicsQualityChanged: { quality: GraphicsQuality };
  toggleMute: void;
  muteChanged: { muted: boolean; volume: number };
  volumeChanged: { muted: boolean; volume: number };
};
