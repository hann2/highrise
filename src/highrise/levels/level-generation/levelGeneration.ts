import { rInteger } from "../../../core/util/Random";
import { CELL_SIZE } from "../../constants/constants";
import { Level } from "../Level";
import LevelTemplate from "../level-templates/LevelTemplate";
import CellGrid from "./CellGrid";
import { generateLevelEntities } from "./entityPlacement";

export const generateLevel = (
  levelTemplate: LevelTemplate,
  seed: number = rInteger(0, 2 ** 32),
): Level => {
  console.log("Generating level with seed " + seed);
  const cellGrid = new CellGrid(...levelTemplate.getSize());
  return {
    entities: generateLevelEntities(cellGrid, levelTemplate, seed),
    width: cellGrid.width * CELL_SIZE,
    height: cellGrid.height * CELL_SIZE,
  };
};
