import ChapelLevel from "../levels/level-templates/ChapelLevel";
import GeneratorLevel from "../levels/level-templates/GeneratorLevel";
import LevelTemplate from "../levels/level-templates/LevelTemplate";
import MaintenanceLevel from "../levels/level-templates/MaintenanceLevel";
import ShopLevel from "../levels/level-templates/ShopLevel";

/** A level template class, with the name and notes it shows on the directory */
export interface LevelTemplateClass {
  new (levelIndex: number, difficulty: number): LevelTemplate;
  readonly floorName: string;
  readonly floorNotes: readonly string[];
}

/** One floor of the run, as planned before it starts */
export interface FloorPlan {
  /** The floor number, which is also the level number (1 is the first floor of the run) */
  readonly number: number;
  /** Made fresh for the floor when it's reached, after reseeding */
  readonly template: LevelTemplateClass;
  /**
   * How hard the floor is, as the level number it's tuned like (see
   * `LevelTemplate.difficulty`). The lobby used to be level 1, so the floors
   * above it are one harder than their number.
   */
  readonly difficulty: number;
  /** What the lobby's directory board calls it */
  readonly name: string;
  /** Short notes for the directory board, like "Boss" */
  readonly notes: readonly string[];
}

/** The floors of a run, bottom to top. The run is over when the last one is done. */
export type RunPlan = readonly FloorPlan[];

/** The themes of the run's floors, in order */
const FLOOR_TEMPLATES: readonly LevelTemplateClass[] = [
  ShopLevel,
  MaintenanceLevel,
  GeneratorLevel,
  ChapelLevel,
];

/**
 * Plans the building for a run. Made when the player arrives in the lobby, so
 * that the directory board can show it. Any randomness here goes through
 * `core/util/Random` (the lobby reseeds right before calling this).
 */
export function generateRunPlan(): RunPlan {
  return FLOOR_TEMPLATES.map((template, i) => ({
    number: i + 1,
    difficulty: i + 2,
    template,
    name: template.floorName,
    notes: [...template.floorNotes],
  }));
}
