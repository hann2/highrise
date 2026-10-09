import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { on } from "../../../core/entity/handler";
import { KeyCode } from "../../../core/io/Keys";
import { makeDummy } from "../../arena/ArenaScene";
import { equipLoadout, refillLoadout } from "../../arena/loadout";
import { Persistence } from "../../constants/constants";
import LevelController from "../../controllers/LevelController";
import { BaseEnemy } from "../../enemies/base/Enemy";
import { getPartyManager } from "../../environment/PartyManager";
import Human from "../../human/Human";
import PlayerHumanController from "../../human/PlayerHumanController";
import { ActOverride } from "../../run/acts";
import { generateRunPlan, RunPlan } from "../../run/RunPlan";
import { BossDebugAction } from "../BossLevel";
import BossLevel from "../BossLevel";
import { getBossFight } from "../BossFight";
import BossTestPanel from "./BossTestPanel";
import {
  BossTestConfig,
  bossTestConfigToQuery,
  parseBossTestConfig,
  tierOf,
} from "./bossTestConfig";

/** Seconds from the player dying to the fight starting over */
const RESTART_DELAY = 1.5;

/** How the fight is going, or how the last one went */
export interface Attempt {
  /** Seconds of fighting (since the leader left the arrival room) */
  time: number;
  /** Damage the player took */
  damageTaken: number;
  outcome?: "won" | "died";
}

/**
 * A dev-only scene for working on one boss level (`?scene=boss&boss=necromancer`):
 * a practice run that's only that floor, played as one of the run's boss
 * floors, starting in its arrival room like a run does. The setup (which
 * boss level and floor, the act, the player's loadout, and options) is in the
 * URL (see `parseBossTestConfig`), and the panel (Tab) changes it and keeps
 * the URL up to date, so a reload, or a hot reload after changing the code,
 * comes back to the same fight.
 *
 * Backspace starts the fight over: the floor made afresh and a fresh player
 * with the loadout. Dying starts it over too, and so does taking the stairs
 * once it's won.
 */
export default class BossTestScene
  extends BaseEntity
  implements Entity, ActOverride
{
  id = "bossTestScene";
  tags = ["act_override"];
  persistenceLevel = Persistence.Permanent;
  config: BossTestConfig;
  /** The fight going on */
  attempt: Attempt = { time: 0, damageTaken: 0 };
  /** How the one before it went */
  lastAttempt?: Attempt;
  /** Each boss's health when the fight started over, for setting it by fraction */
  private startingHp = new Map<BaseEnemy, number>();
  private firstLevelStarted = false;
  /** Set to start over on the next tick (not in the middle of another event) */
  private restartPending = false;
  /** Goes up with every restart, so a restart that was waiting can tell it's late */
  private restarts = 0;

  constructor() {
    super();
    this.config = parseBossTestConfig(
      new URLSearchParams(window.location.search),
    );
  }

  /** For `getCurrentAct`: enemies are as tough as in this act */
  get act(): number {
    return this.config.act;
  }

  @on("add")
  onAdd() {
    window.history.replaceState(null, "", bossTestConfigToQuery(this.config));
    this.addChild(new BossTestPanel(this));
    this.game.dispatch("newGame", {
      character: this.config.character,
      plan: this.makePlan(),
      startFloor: this.config.floor,
      practice: true,
    });
  }

  /** A run's plan, with the config's boss level on its floor */
  private makePlan(): RunPlan {
    const { level, floor } = this.config;
    return generateRunPlan().map((plan) =>
      plan.number === floor
        ? {
            ...plan,
            template: level,
            name: level.floorName,
            notes: [...level.floorNotes, ...(plan.bigStore ? ["Store"] : [])],
            boss: tierOf(floor),
          }
        : plan,
    );
  }

  /**
   * Switches to `config` and starts the fight over with it, keeping the URL
   * up to date
   */
  apply(config: BossTestConfig) {
    const previous = this.config;
    this.config = config;
    window.history.replaceState(null, "", bossTestConfigToQuery(config));
    const newPlan =
      config.level !== previous.level || config.floor !== previous.floor;
    this.restart(newPlan);
  }

  /** The fight from the start: the floor made afresh, and a fresh player with the loadout */
  restart(newPlan = false) {
    const levelController = this.levelController;
    const party = getPartyManager(this.game);
    if (!levelController || !party) {
      return;
    }
    this.restarts += 1;
    this.restartPending = false;
    if (!this.attempt.outcome && this.attempt.time > 0) {
      this.lastAttempt = this.attempt;
    }
    this.attempt = { time: 0, damageTaken: 0 };
    this.startingHp.clear();

    // Added before the floor's cleared away, which takes the old leader with it
    const leader = this.game.addEntity(
      new Human(undefined, this.config.character),
    );
    equipLoadout(leader, this.config);
    party.replaceLeader(leader);
    // The player's controls go when the leader they control dies
    if (
      this.game.entities.getByConstructor(PlayerHumanController).length === 0
    ) {
      this.game.addEntity(new PlayerHumanController(() => party.leader));
    }
    party.quarters = this.config.quarters;

    if (newPlan) {
      levelController.restartFloor(this.makePlan(), this.config.floor);
    } else {
      levelController.restartFloor();
    }
    if (this.config.frozen) {
      for (const boss of this.bosses) {
        makeDummy(boss);
      }
    }
  }

  get levelController(): LevelController | undefined {
    return this.game.entities.getByConstructor(LevelController)[0];
  }

  /** The current floor's bosses that are still alive */
  get bosses(): BaseEnemy[] {
    return this.game.entities
      .getTagged("boss")
      .filter((e): e is BaseEnemy => e instanceof BaseEnemy && !e.isDestroyed);
  }

  /** The boss level being played */
  get level(): BossLevel | undefined {
    const template = this.levelController?.template;
    return template instanceof BossLevel ? template : undefined;
  }

  /** The level's own buttons for the panel */
  debugActions(): BossDebugAction[] {
    return this.level?.debugActions() ?? [];
  }

  /** Every boss down to `fraction` of the health it started with */
  setBossHealth(fraction: number) {
    for (const boss of this.bosses) {
      const start = this.startingHp.get(boss) ?? boss.hp;
      boss.hp = Math.max(1, start * fraction);
    }
  }

  @on("tick")
  onTick(dt: number) {
    if (this.restartPending) {
      this.restart();
      return;
    }

    for (const boss of this.bosses) {
      if (!this.startingHp.has(boss)) {
        this.startingHp.set(boss, boss.hp);
      }
    }

    const leader = getPartyManager(this.game)?.leader;
    if (leader && !leader.isDestroyed) {
      if (this.config.god) {
        leader.hp = leader.maxHp;
      }
      if (this.config.infiniteAmmo) {
        refillLoadout(leader, this.config);
      }
    }

    const fight = getBossFight(this.game);
    if (fight && !this.attempt.outcome) {
      this.attempt.time = fight.time;
    }
  }

  @on("humanInjured")
  onHumanInjured({ human, amount }: { human: Human; amount: number }) {
    if (human === getPartyManager(this.game)?.leader && !this.attempt.outcome) {
      this.attempt.damageTaken += amount;
    }
  }

  @on("bossLevelWon")
  onBossLevelWon() {
    this.attempt.outcome = "won";
    this.lastAttempt = this.attempt;
  }

  @on("partyDead")
  async onPartyDead() {
    if (!this.attempt.outcome) {
      this.attempt.outcome = "died";
      this.lastAttempt = this.attempt;
    }
    const restarts = this.restarts;
    await this.wait(RESTART_DELAY);
    if (this.restarts === restarts) {
      this.restartPending = true;
    }
  }

  /**
   * The run's first floor was made for a leader without the loadout: once
   * it's up, it's made again for one with it
   */
  @on("startLevel")
  onStartLevel() {
    if (!this.firstLevelStarted) {
      this.firstLevelStarted = true;
      this.restartPending = true;
    }
  }

  /** Up the stairs once it's won: the fight again */
  @on("levelComplete")
  onLevelComplete() {
    this.restartPending = true;
  }

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    if (key === "Backspace") {
      this.restartPending = true;
    }
  }
}
