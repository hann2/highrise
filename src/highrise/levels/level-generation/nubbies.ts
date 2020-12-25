import Entity from "../../../core/entity/Entity";
import { choose, rBool } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { LEVEL_SIZE } from "../../constants/constants";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import { CARDINAL_DIRECTIONS_VALUES } from "../../utils/directions";
import LevelTemplate from "../level-templates/LevelTemplate";
import CellGrid from "./CellGrid";

export function fillNubbies(
  cellGrid: CellGrid,
  levelTemplate: LevelTemplate
): Entity[] {
  const entities: Entity[] = [];

  for (let i = 0; i < LEVEL_SIZE; i++) {
    for (let j = 0; j < LEVEL_SIZE; j++) {
      if (cellGrid.cells[i][j].content) {
        continue;
      }
      const cell = V(i, j);

      let openDirection: V2d;
      let found = 0;
      for (const direction of CARDINAL_DIRECTIONS_VALUES) {
        let wall = CellGrid.getWallInDirection(cell, direction);
        if (!cellGrid.isExisting(wall)) {
          found += 1;
          openDirection = direction;
        }
      }
      const isANubby = found === 1;
      if (!isANubby) {
        continue;
      }

      if (isANubby) {
        const content = choose("vending", "water-cooler");
        cellGrid.cells[i][j].content = content;
        const wallDirection = openDirection!;

        entities.push(
          ...levelTemplate.getNubbyDecorations(cell, wallDirection)
        );
      }
    }
  }
  return entities;
}
