import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { reseedIfSeeded } from "../../core/util/Random";
import { Persistence } from "../constants/constants";
import FadeEffect from "../effects/FadeEffect";
import { getPartyLeader } from "../environment/PartyManager";
import type Human from "../human/Human";
import { dealShelf, Shelf } from "../items/shelf";
import { Level } from "../levels/Level";
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
      this.game.dispatch("startLevel", { level });
    } else {
      this.game.dispatch("gameOver", { victory: true });
    }
    this.changingLevel = false;
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
    // The store in the arrival room, from the second floor on. Dealt after
    // the level, whose layout mustn't depend on what the leader holds, but
    // still before the floor starts, so it's a function of the seed and of
    // what the leader carried out of the last floor.
    const leader = getPartyLeader(this.game);
    if (this.currentLevel > 1 && leader) {
      this.template.shelf = this.dealShelf(leader);
    }
    return this.level;
  }

  /** Deals a store shelf for `human` suited to the current floor */
  dealShelf(human: Human): Shelf {
    return dealShelf(human, this.template?.getBestGunTier() ?? 0);
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
