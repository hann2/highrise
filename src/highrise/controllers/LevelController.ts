import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { reseedIfSeeded } from "../../core/util/Random";
import { Persistence } from "../constants/constants";
import FadeEffect from "../effects/FadeEffect";
import { getPartyLeader } from "../environment/PartyManager";
import type Human from "../human/Human";
import { Level } from "../levels/Level";
import UpgradeSelect from "../menu/UpgradeSelect";
import { getRunStats } from "../run/RunStats";
import type { Upgrade } from "../upgrades/Upgrade";
import { drawUpgrades, takeUpgrade } from "../upgrades/upgrades";
import { generateLevel } from "../levels/level-generation/levelGeneration";
import LevelTemplate from "../levels/level-templates/LevelTemplate";
import TutorialLevel from "../levels/level-templates/TutorialLevel";
import { FloorPlan, RunPlan } from "../run/RunPlan";

const LEVEL_FADE_TIME = process.env.NODE_ENV === "development" ? 0.1 : 1.0;

const FORCE_TUTORIAL = process.env.NODE_ENV === "development" && false;

/**
 * High level control flow for levels and the party. Plays the tutorial as
 * level 0 the first time, then the floors of the run's plan (made in the
 * lobby) in order, numbered from 1.
 */
export default class LevelController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  currentLevel: number = 0;
  /** What was generated for the current level */
  level?: Level;
  /** What the current level was generated from */
  template?: LevelTemplate;
  /** Between reaching an exit and starting the next level */
  private changingLevel = false;

  constructor(readonly plan: RunPlan) {
    super();
  }

  /** The top floor of the run */
  get maxLevel(): number {
    return this.plan.length;
  }

  /** The plan for the current floor; undefined in the tutorial */
  get floor(): FloorPlan | undefined {
    return this.plan[this.currentLevel - 1];
  }

  @on("add")
  async onAdd() {
    this.currentLevel =
      localStorage.getItem("tutorialComplete") != "true" || FORCE_TUTORIAL
        ? 0
        : 1;
    const level = this.generateLevel();

    await this.wait(0.0); // so that this happens async (why does that matter?)

    this.game.dispatch("startLevel", { level });
    this.game.addEntity(new FadeEffect(0, 0, 1.5 * LEVEL_FADE_TIME));
  }

  // We just got to the exit
  @on("levelComplete")
  async onLevelComplete() {
    if (this.changingLevel) {
      return;
    }
    this.changingLevel = true;
    if (this.currentLevel === 0) {
      localStorage.setItem("tutorialComplete", "true");
    }
    this.currentLevel += 1;

    const fadeOutTime = LEVEL_FADE_TIME;
    const fadeHoldTime = LEVEL_FADE_TIME / 2;
    const fadeInTime = LEVEL_FADE_TIME;
    this.game.addEntity(new FadeEffect(fadeOutTime, fadeHoldTime, fadeInTime));

    await this.wait(fadeOutTime);
    this.game.clearScene(Persistence.Floor);

    if (this.currentLevel <= this.maxLevel) {
      const level = this.generateLevel();
      // Not after the tutorial, which isn't part of the run. Drawn after
      // generating, so the level doesn't depend on the draw and seeded runs
      // get the same offers.
      const pick =
        this.currentLevel > 1 ? await this.offerUpgrades() : undefined;
      if (this.isDestroyed) {
        return;
      }
      this.game.dispatch("startLevel", { level });
      // Taken once the party is in the new level, so anything it drops (the
      // weapon a new gun replaces, a different type of grenade) lands there
      if (pick) {
        this.giveUpgrade(pick.leader, pick.upgrade);
      }
    } else {
      this.game.dispatch("gameOver", { victory: true });
    }
    this.changingLevel = false;
  }

  /**
   * Lets the leader pick one of a few upgrades for the coming floor, with the
   * game paused. Resolves with what they picked, for the caller to hand over.
   */
  private async offerUpgrades(): Promise<
    { leader: Human; upgrade: Upgrade } | undefined
  > {
    const leader = getPartyLeader(this.game);
    if (!leader) {
      return undefined;
    }
    const choices = this.drawOffer(leader);
    if (choices.length === 0) {
      return undefined;
    }
    const screen = this.game.addEntity(new UpgradeSelect(choices, leader));
    const upgrade = await screen.picked;
    return { leader, upgrade };
  }

  /** Draws an offer for `human` suited to the current floor */
  drawOffer(human: Human, count: number = 3): Upgrade[] {
    return drawUpgrades(human, count, {
      bestGunTier: this.template?.getBestGunTier(),
    });
  }

  /** Hands a picked upgrade over to `human` and keeps score of it */
  giveUpgrade(human: Human, upgrade: Upgrade) {
    if (!human.isDestroyed) {
      takeUpgrade(human, upgrade);
      getRunStats(this.game)?.recordUpgrade(upgrade.name);
    }
  }

  // We just started a new level
  @on("startLevel")
  onStartLevel({ level }: { level: Level }) {
    this.game.addEntities(...level.entities);
  }

  // The whole party is dead
  @on("partyDead")
  onPartyDead() {
    this.game.dispatch("gameOver", { victory: false });
  }

  generateLevel(): Level {
    // So that seeded runs get the same levels no matter what happened before
    reseedIfSeeded(this.currentLevel);
    this.template = this.makeTemplate();
    this.level = generateLevel(this.template);
    return this.level;
  }

  private makeTemplate(): LevelTemplate {
    const floor = this.floor;
    return floor
      ? new floor.template(floor.number, floor.difficulty)
      : new TutorialLevel(this.currentLevel);
  }
}

export function getCurrentLevelNumber(game: Game): number {
  return game.entities.getSingleton(LevelController).currentLevel;
}
