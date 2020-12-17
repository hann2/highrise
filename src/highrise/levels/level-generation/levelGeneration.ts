import { choose, rInteger } from "../../../core/util/Random";
import { Level } from "../Level";
import BathroomLevel from "../level-templates/BathroomLevel";
import ChapelLevel from "../level-templates/ChapelLevel";
import GeneratorLevel from "../level-templates/GeneratorLevel";
import LevelTemplate from "../level-templates/LevelTemplate";
import LobbyLevel from "../level-templates/LobbyLevel";
import MaintenanceLevel from "../level-templates/MaintenanceLevel";
import ShopLevel from "../level-templates/ShopLevel";
import { generateLevelEntities } from "./entityPlacement";

export const LEVEL_SIZE = 14;
export const CELL_WIDTH = 2;

export function chooseTemplate(level: number): LevelTemplate {
  switch (level) {
    case 1:
      return new LobbyLevel(level);
    case 2:
      return new ShopLevel(level);
    case 3:
      return new MaintenanceLevel(level);
    case 4:
      return new GeneratorLevel(level);
    case 5:
      return new ChapelLevel(level);
    default:
      return choose(new BathroomLevel(level));
  }
}

export const generateLevel = (
  levelTemplate: LevelTemplate,
  seed: number = rInteger(0, 2 ** 32)
): Level => {
  console.log("Generating level with seed " + seed);
  return { entities: generateLevelEntities(levelTemplate, seed) };
};
