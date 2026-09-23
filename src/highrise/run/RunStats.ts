import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { Character } from "../characters/Character";
import { Persistence } from "../constants/constants";
import { getCurrentLevelNumber } from "../controllers/LevelController";
import { BaseEnemy } from "../enemies/base/Enemy";
import { getPartyLeader } from "../environment/PartyManager";
import Human from "../human/Human";
import { recordRun, RunSummary } from "../persistence/SaveData";
import { getLastDamageSource } from "./damageSources";
import { enemyTypeName } from "./enemyTypeName";

/** Keeps score over one run, for the run summary screen and the save data. */
export default class RunStats extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;

  floorReached = 0;
  /** Enemy type name → how many died */
  kills: Record<string, number> = {};
  quartersCollected = 0;
  quartersSpent = 0;
  /** Seconds of play, not counting time paused */
  timeSeconds = 0;
  partyDead = false;
  /** What killed the leader */
  lastDeathCause?: string;
  /** Names of upgrades taken, in order. Filled in by the upgrade system. */
  upgrades: string[] = [];
  /** Names of characters unlocked during this run */
  charactersUnlocked: string[] = [];

  private summary?: RunSummary;

  constructor(private character: Character) {
    super();
  }

  @on("tick")
  onTick(dt: number) {
    if (!this.summary) {
      this.timeSeconds += dt;
    }
  }

  @on("startLevel")
  onStartLevel() {
    this.floorReached = Math.max(
      this.floorReached,
      getCurrentLevelNumber(this.game),
    );
  }

  @on("zombieDied")
  onZombieDied({ zombie }: { zombie: BaseEnemy }) {
    const name = enemyTypeName(zombie);
    this.kills[name] = (this.kills[name] ?? 0) + 1;
  }

  // The run ends when the leader dies, so that's the cause of death; allies
  // dying before or after don't count
  @on("humanDied")
  onHumanDied({ human }: { human: Human }) {
    if (human !== getPartyLeader(this.game)) {
      return;
    }
    const source = getLastDamageSource(human);
    if (source === undefined) {
      this.lastDeathCause = undefined;
    } else if (typeof source === "string") {
      this.lastDeathCause = source;
    } else {
      this.lastDeathCause = enemyTypeName(source);
    }
  }

  @on("partyDead")
  onPartyDead() {
    this.partyDead = true;
  }

  @on("quartersCollected")
  onQuartersCollected({ amount }: { amount: number }) {
    this.quartersCollected += amount;
  }

  @on("quartersSpent")
  onQuartersSpent({ amount }: { amount: number }) {
    this.quartersSpent += amount;
  }

  recordUpgrade(name: string) {
    this.upgrades.push(name);
  }

  recordCharacterUnlocked(name: string) {
    if (!this.charactersUnlocked.includes(name)) {
      this.charactersUnlocked.push(name);
    }
  }

  /**
   * Ends the run: summarizes it and saves it to the run history. Calling it
   * again returns the same summary without saving twice.
   */
  finish(victory: boolean): RunSummary {
    if (!this.summary) {
      this.summary = {
        endedAt: Date.now(),
        outcome: victory ? "victory" : this.partyDead ? "died" : "quit",
        character: this.character.name,
        floorReached: this.floorReached,
        kills: { ...this.kills },
        quartersCollected: this.quartersCollected,
        quartersSpent: this.quartersSpent,
        timeSeconds: this.timeSeconds,
        causeOfDeath: this.partyDead
          ? (this.lastDeathCause ?? "Unknown")
          : undefined,
        upgrades: [...this.upgrades],
        charactersUnlocked: [...this.charactersUnlocked],
      };
      recordRun(this.summary);
    }
    return this.summary;
  }
}

export function getRunStats(game: Game): RunStats | undefined {
  return game.entities.getByConstructor(RunStats)[0];
}
