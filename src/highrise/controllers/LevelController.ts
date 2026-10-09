import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { reseedIfSeeded } from "../../core/util/Random";
import { Persistence } from "../constants/constants";
import FadeEffect from "../effects/FadeEffect";
import { getPartyLeader } from "../environment/PartyManager";
import type Human from "../human/Human";
import { BIG_SHELF_SLOTS, dealShelf, Shelf, SHELF_SLOTS } from "../items/shelf";
import type { GunStats } from "../weapons/guns/GunStats";
import BossLevel from "../boss-levels/BossLevel";
import { Level } from "../levels/Level";
import { generateLevel } from "../levels/level-generation/levelGeneration";
import LevelTemplate from "../levels/level-templates/LevelTemplate";
import TutorialLevel from "../levels/level-templates/TutorialLevel";
import { FloorPlan, RunPlan } from "../run/RunPlan";

const LEVEL_FADE_TIME = process.env.NODE_ENV === "development" ? 0.1 : 1.0;

const FORCE_TUTORIAL = process.env.NODE_ENV === "development" && false;

/** Whether the tutorial has been played, so the title goes straight to the lobby */
export function isTutorialComplete(): boolean {
  return localStorage.getItem("tutorialComplete") == "true" && !FORCE_TUTORIAL;
}

/**
 * High level control flow for levels and the party. Plays the floors of the
 * run's plan (made in the lobby) in order, numbered from 1. The tutorial is a
 * run of its own that starts (and ends) at level 0 and then goes to the lobby.
 */
export default class LevelController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  // Found by tag where importing this class would make an import cycle
  tags = ["level_controller"];
  currentLevel: number = 0;
  /** What was generated for the current level */
  level?: Level;
  /** What the current level was generated from */
  template?: LevelTemplate;
  /** Every gun a store has had this run, so none turns up twice */
  gunsDealt: GunStats[] = [];
  /** Between reaching an exit and starting the next level */
  private changingLevel = false;

  /**
   * `startFloor` 0 is the tutorial; later ones skip ahead, for development.
   * In `practice` (the boss test scene) the floor never ends: finishing it or
   * dying is left to the scene, which starts it over with `restartFloor`.
   */
  constructor(
    public plan: RunPlan,
    private readonly startFloor = 1,
    readonly practice = false,
  ) {
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
    this.currentLevel = this.startFloor;
    const level = this.generateLevel();

    await this.wait(0.0); // so that this happens async (why does that matter?)

    this.game.dispatch("startLevel", { level });
    this.game.addEntity(new FadeEffect(0, 0, 1.5 * LEVEL_FADE_TIME));
  }

  // We just got to the exit
  @on("levelComplete")
  async onLevelComplete() {
    if (this.changingLevel || this.practice) {
      return;
    }
    this.changingLevel = true;
    if (this.currentLevel === 0) {
      await this.finishTutorial();
      return;
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

  /** Out of the tutorial and up to the lobby, which fades up from black itself */
  private async finishTutorial() {
    localStorage.setItem("tutorialComplete", "true");
    this.game.addEntity(new FadeEffect(LEVEL_FADE_TIME, LEVEL_FADE_TIME, 0));
    await this.wait(LEVEL_FADE_TIME);
    this.game.dispatch("goToLobby", { from: "tutorial" });
  }

  // The whole party is dead
  @on("partyDead")
  async onPartyDead() {
    if (this.practice) {
      return;
    }
    if (this.currentLevel !== 0) {
      this.game.dispatch("gameOver", { victory: false });
      return;
    }
    // Dying in the tutorial starts it over rather than ending a run
    if (this.changingLevel) {
      return;
    }
    this.changingLevel = true;
    const game = this.game;
    game.addEntity(new FadeEffect(LEVEL_FADE_TIME, LEVEL_FADE_TIME, 0));
    await this.wait(LEVEL_FADE_TIME);
    game.clearScene(Persistence.Game);
    game.dispatch("startTutorial", undefined);
  }

  /**
   * The current floor again from the start (or `floor` of `plan`, if given),
   * freshly generated, with the party where it arrives. For the boss test
   * scene; no fade.
   */
  restartFloor(plan?: RunPlan, floor?: number) {
    if (plan) {
      this.plan = plan;
    }
    if (floor !== undefined) {
      this.currentLevel = floor;
    }
    this.game.clearScene(Persistence.Floor);
    const level = this.generateLevel();
    this.game.dispatch("startLevel", { level });
  }

  generateLevel(): Level {
    // So that seeded runs get the same levels no matter what happened before
    reseedIfSeeded(this.currentLevel);
    const template = this.makeTemplate();
    this.template = template;
    // Boss levels lay themselves out; the rest come from the generator
    this.level =
      template instanceof BossLevel
        ? template.generateLevel()
        : generateLevel(template);
    // The store in the arrival room, from the second floor on. Dealt after
    // the level, whose layout mustn't depend on what the leader holds, but
    // still before the floor starts, so it's a function of the seed and of
    // what the leader carried out of the last floor.
    const leader = getPartyLeader(this.game);
    if (this.currentLevel > 1 && leader) {
      const shelf = this.dealShelf(leader);
      if (shelf.gun?.weapon) {
        this.gunsDealt.push(shelf.gun.weapon);
      }
      template.shelf = shelf;
    }
    return this.level;
  }

  /**
   * Deals a store shelf for `human` suited to the current floor, with none of
   * the guns earlier stores had
   */
  dealShelf(human: Human): Shelf {
    return dealShelf(
      human,
      this.template?.getBestGunTier() ?? 0,
      this.gunsDealt,
      this.floor?.bigStore ? BIG_SHELF_SLOTS : SHELF_SLOTS,
    );
  }

  private makeTemplate(): LevelTemplate {
    const floor = this.floor;
    if (!floor) {
      return new TutorialLevel(this.currentLevel);
    }
    const template = new floor.template(floor.number, floor.difficulty);
    template.floor = floor;
    return template;
  }
}

export function getCurrentLevelNumber(game: Game): number {
  return game.entities.getSingleton(LevelController).currentLevel;
}
