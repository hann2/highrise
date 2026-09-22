import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { reseedIfSeeded } from "../../core/util/Random";
import { Persistence } from "../constants/constants";
import FadeEffect from "../effects/FadeEffect";
import { Level } from "../levels/Level";
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
      this.game.dispatch("startLevel", { level });
    } else {
      this.game.dispatch("gameOver", { victory: true });
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
