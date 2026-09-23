import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { reseedIfSeeded } from "../../core/util/Random";
import { Persistence } from "../constants/constants";
import FadeEffect from "../effects/FadeEffect";
import { getPartyLeader } from "../environment/PartyManager";
import { Level } from "../levels/Level";
import UpgradeSelect from "../menu/UpgradeSelect";
import { getRunStats } from "../run/RunStats";
import { drawUpgrades, takeUpgrade } from "../upgrades/upgrades";
import {
  chooseTemplate,
  generateLevel,
} from "../levels/level-generation/levelGeneration";

const LEVEL_FADE_TIME = process.env.NODE_ENV === "development" ? 0.1 : 1.0;
const MAX_LEVEL = 5;

const FORCE_TUTORIAL = process.env.NODE_ENV === "development" && false;

// High level control flow for levels and the party
export default class LevelController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  currentLevel: number = 0;
  /** What was generated for the current level */
  level?: Level;
  /** Between reaching an exit and starting the next level */
  private changingLevel = false;

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

    if (this.currentLevel <= MAX_LEVEL) {
      const level = this.generateLevel();
      // Not after the tutorial, which isn't part of the run
      if (this.currentLevel > 1) {
        // Drawn after generating, so the level doesn't depend on the draw
        // and seeded runs get the same offers
        await this.offerUpgrades();
        if (this.isDestroyed) {
          return;
        }
      }
      this.game.dispatch("startLevel", { level });
    } else {
      this.game.dispatch("gameOver", { victory: true });
    }
    this.changingLevel = false;
  }

  /** Lets the leader pick one of a few upgrades, with the game paused */
  private async offerUpgrades() {
    const leader = getPartyLeader(this.game);
    if (!leader) {
      return;
    }
    const choices = drawUpgrades(leader, 3);
    if (choices.length === 0) {
      return;
    }
    const screen = this.game.addEntity(new UpgradeSelect(choices));
    const upgrade = await screen.picked;
    if (!leader.isDestroyed) {
      takeUpgrade(leader, upgrade);
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
    this.level = generateLevel(chooseTemplate(this.currentLevel));
    return this.level;
  }
}

export function getCurrentLevelNumber(game: Game): number {
  return game.entities.getSingleton(LevelController).currentLevel;
}
