import { V2d } from "../../core/Vector";
import { CELL_SIZE } from "../constants/constants";
import { Level } from "../levels/Level";
import LevelTemplate from "../levels/level-templates/LevelTemplate";
import SpawnRoom from "../levels/rooms/SpawnRoom";
import BossLevelBuilder from "./BossLevelBuilder";

/**
 * A boss level: a whole floor with code of its own that doesn't follow the
 * rules of the others. No maze, closets or enemies scattered about; it lays
 * itself out by hand (`layOut`), with the arrival room (and its store) to
 * start in, a fight of its own (a `BossFight`, with whatever goal it likes:
 * kill the boss, survive a horde for so long...), and the exit stairwell,
 * barred until the fight's won. Nothing outside it matters while you're in
 * it, and nothing in it depends on which floor it's on but the act's enemy
 * scaling.
 *
 * Boss levels are dealt from pools by tier (`bossLevels.ts`).
 */
export default abstract class BossLevel extends LevelTemplate {
  static floorNotes: readonly string[] = ["Boss"];

  /** Names it in URLs, like `?scene=boss&boss=necromancer` */
  static id: string;

  /** The level's size in cells (`CELL_SIZE` meters each) */
  abstract getSize(): [number, number];

  /**
   * Puts everything in the level: the arrival room (`arrivalRoom()`), the
   * exit stairwell, the rooms and open areas, the lights, the boss and the
   * `BossFight`. The subfloor and the ambient light are already in.
   */
  abstract layOut(builder: BossLevelBuilder): void;

  /** The floor's arrival room, with the store dealt for it, to put in `layOut` */
  protected arrivalRoom(): SpawnRoom {
    return new SpawnRoom(this.levelIndex, this.difficulty, () => this.shelf);
  }

  generateLevel(): Level {
    const [width, height] = this.getSize();
    const builder = new BossLevelBuilder(width, height);
    builder.add(
      this.makeSubfloor([width * CELL_SIZE, height * CELL_SIZE]),
      this.getAmbientLight(),
    );
    this.layOut(builder);
    return builder.build();
  }

  /**
   * Buttons for the boss test scene's panel that do something to this
   * level's fight as it is (skip to a phase, start a wave...). Every boss
   * level gets setting the bosses' health without asking.
   */
  debugActions(): BossDebugAction[] {
    return [];
  }

  // None of the floor generator's: everything's placed by `layOut`
  generateEnemies(_locations: V2d[], _seed: number) {
    return [];
  }
}

/** A button in the boss test scene's panel (see `BossLevel.debugActions`) */
export interface BossDebugAction {
  label: string;
  run(): void;
}

/** A boss level class, which `RunPlan` and the boss test scene make them from */
export interface BossLevelClass {
  new (levelIndex: number, difficulty: number): BossLevel;
  readonly id: string;
  readonly floorName: string;
  readonly floorNotes: readonly string[];
}
